const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

const {
    getAllCountries,
    getUNMembers,
    getObservers,
    getP5Countries,
    getCountryByName,
    getCountryByCode
} = require('./countries');
const logger = require('../utils/logger');

// Flag storage configuration
const FLAG_DIR = path.join(__dirname, '../../../uploads/flags');
const FALLBACK_SVG_URL = 'https://flagcdn.com'; // Primary fallback
const FALLBACK_SVG_URL_ALT = 'https://restcountries.com/data'; // Alternative fallback

// In-memory cache for flags
const flagCache = new Map();
let allFlagsCache = null;
let allFlagsCacheCompressed = null;
let cacheInitialized = false;

// Initialize flag cache on startup
async function initializeFlagCache() {
    if (cacheInitialized) return;

    logger.info('Initializing flag cache...');

    try {
        // Check if flag directory exists
        if (!fs.existsSync(FLAG_DIR)) {
            logger.warn(`Flag directory not found: ${FLAG_DIR}`);
            return;
        }

        const files = fs.readdirSync(FLAG_DIR);
        const svgFiles = files.filter(file => file.endsWith('.svg'));

        const flagData = {};
        let loadedCount = 0;
        let errorCount = 0;

        // Load all SVG flags into memory
        for (const file of svgFiles) {
            try {
                const countryCode = path.basename(file, '.svg').toLowerCase();
                const flagPath = path.join(FLAG_DIR, file);
                const svgContent = fs.readFileSync(flagPath, 'utf8');

                flagCache.set(countryCode, svgContent);
                flagData[countryCode] = svgContent;
                loadedCount++;
            } catch (error) {
                logger.warn(`Failed to load flag ${file}: ${error.message}`);
                errorCount++;
            }
        }

        // Create batch response and compress it
        allFlagsCache = flagData;

        // Pre-compress the batch response for efficiency
        const jsonResponse = JSON.stringify(flagData);
        allFlagsCacheCompressed = await new Promise((resolve, reject) => {
            zlib.gzip(jsonResponse, (err, compressed) => {
                if (err) reject(err);
                else resolve(compressed);
            });
        });

        cacheInitialized = true;
        logger.info(`Flag cache initialized: ${loadedCount} flags loaded, ${errorCount} errors`);
        logger.info(`Batch response size: ${jsonResponse.length} bytes (${allFlagsCacheCompressed.length} bytes compressed)`);

    } catch (error) {
        logger.error('Flag cache initialization failed:', error);
    }
}

// Fetch flag from external API as fallback
async function fetchExternalFlag(countryCode) {
    return new Promise((resolve, reject) => {
        const fallbackUrl = `${FALLBACK_SVG_URL}/${countryCode}.svg`;

        https.get(fallbackUrl, (response) => {
            if (response.statusCode === 200) {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    // Cache the fetched flag for future use
                    flagCache.set(countryCode, data);
                    logger.info(`Fetched external flag for ${countryCode}`);
                    resolve(data);
                });
            } else {
                reject(new Error(`External API returned ${response.statusCode}`));
            }
        }).on('error', reject);
    });
}

// Get all countries with optional language support
const getCountries = async (req, res) => {
    try {
        const { lang = 'en', type = 'all' } = req.query;

        // Validate language parameter
        const validLanguages = ['en', 'ru', 'uz_lat', 'uz_cyr', 'all'];
        const language = validLanguages.includes(lang) ? lang : 'en';

        let countries;
        switch (type) {
            case 'members':
                countries = getUNMembers(language);
                break;
            case 'observers':
                countries = getObservers(language);
                break;
            case 'p5':
                countries = getP5Countries(language);
                break;
            default:
                countries = getAllCountries(language);
        }

        res.set({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'X-Country-Count': countries.length.toString(),
            'X-Language': language
        });

        res.json({
            success: true,
            language,
            type,
            count: countries.length,
            countries
        });

    } catch (error) {
        logger.error('Get countries error:', error);
        res.status(500).json({ error: 'Failed to retrieve countries' });
    }
};

// Get single country by code
const getCountry = async (req, res) => {
    try {
        const { code } = req.params;
        const { lang = 'en' } = req.query;

        // Validate country code format
        if (!/^[a-z]{2}$/.test(code.toLowerCase())) {
            return res.status(400).json({
                error: 'Invalid country code format. Expected 2-letter ISO code.'
            });
        }

        // Validate language parameter
        const validLanguages = ['en', 'ru', 'uz_lat', 'uz_cyr', 'all'];
        const language = validLanguages.includes(lang) ? lang : 'en';

        const country = getCountryByCode(code, language);

        if (!country) {
            return res.status(404).json({
                error: `Country not found for code: ${code}`
            });
        }

        res.set({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600',
            'X-Language': language
        });

        res.json({
            success: true,
            language,
            country
        });

    } catch (error) {
        logger.error('Get country error:', error);
        res.status(500).json({ error: 'Failed to retrieve country' });
    }
};

// Get single flag by country code
const getSingleFlag = async (req, res) => {
    try {
        const { code } = req.params;
        const countryCode = code.toLowerCase();

        // Validate country code format
        if (!/^[a-z]{2}$/.test(countryCode)) {
            return res.status(400).json({
                error: 'Invalid country code format. Expected 2-letter ISO code.'
            });
        }

        // Initialize cache if not done
        if (!cacheInitialized) {
            await initializeFlagCache();
        }

        let flagSvg = flagCache.get(countryCode);

        // If flag not in cache, try to fetch from external API
        if (!flagSvg) {
            try {
                flagSvg = await fetchExternalFlag(countryCode);
            } catch (error) {
                logger.warn(`Failed to fetch external flag for ${countryCode}: ${error.message}`);
                return res.status(404).json({
                    error: `Flag not found for country code: ${countryCode}`,
                    fallbackUrl: `${FALLBACK_SVG_URL}/${countryCode}.svg`
                });
            }
        }

        // Set appropriate headers for SVG content
        res.set({
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
            'ETag': `"${countryCode}-flag"`
        });

        res.send(flagSvg);

    } catch (error) {
        logger.error('Get single flag error:', error);
        res.status(500).json({ error: 'Failed to retrieve flag' });
    }
};

// Get all flags in batch (authentication required)
const getAllFlags = async (req, res) => {
    try {
        // Initialize cache if not done
        if (!cacheInitialized) {
            await initializeFlagCache();
        }

        if (!allFlagsCache || Object.keys(allFlagsCache).length === 0) {
            return res.status(503).json({
                error: 'Flag cache not available. Please ensure flags are properly installed.',
                hint: 'Upload SVG flags to the /uploads/flags/ directory'
            });
        }

        // CONSISTENT RESPONSE FORMAT
        const responseData = {
            success: true,
            flagCount: Object.keys(allFlagsCache).length,
            flags: allFlagsCache
        };

        // Check if client accepts gzip compression
        const acceptsGzip = req.headers['accept-encoding'] &&
            req.headers['accept-encoding'].includes('gzip');

        // Set headers for caching and compression
        const headers = {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            'ETag': `"all-flags-${Object.keys(allFlagsCache).length}"`,
            'X-Flag-Count': Object.keys(allFlagsCache).length.toString(),
            'X-User-Role': req.user.role
        };

        // Send compressed response if client supports it
        if (acceptsGzip) {
            const jsonString = JSON.stringify(responseData);

            zlib.gzip(jsonString, (err, compressed) => {
                if (err) {
                    logger.error('Compression error:', err);
                    res.set(headers);
                    res.json(responseData);
                } else {
                    headers['Content-Encoding'] = 'gzip';
                    res.set(headers);
                    res.send(compressed); // Now sends compressed WRAPPED response
                }
            });
        } else {
            res.set(headers);
            res.json(responseData);
        }

        logger.info(`Served batch flags to ${req.user.role}: ${Object.keys(allFlagsCache).length} flags`);

    } catch (error) {
        logger.error('Get all flags error:', error);
        res.status(500).json({ error: 'Failed to retrieve flags batch' });
    }
};

// Get flag metadata (country codes and availability)
const getFlagMetadata = async (req, res) => {
    try {
        if (!cacheInitialized) {
            await initializeFlagCache();
        }

        const availableFlags = Array.from(flagCache.keys()).sort();

        res.set({
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600'
        });

        res.json({
            success: true,
            totalFlags: availableFlags.length,
            availableFlags,
            cacheStatus: cacheInitialized ? 'initialized' : 'pending',
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Get flag metadata error:', error);
        res.status(500).json({ error: 'Failed to retrieve flag metadata' });
    }
};

// Refresh flag cache (admin only)
const refreshFlagCache = async (req, res) => {
    try {
        logger.info('Refreshing flag cache...');

        // Clear existing cache
        flagCache.clear();
        allFlagsCache = null;
        allFlagsCacheCompressed = null;
        cacheInitialized = false;

        // Reinitialize cache
        await initializeFlagCache();

        res.json({
            success: true,
            message: 'Flag cache refreshed successfully',
            flagCount: flagCache.size,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Refresh flag cache error:', error);
        res.status(500).json({ error: 'Failed to refresh flag cache' });
    }
};

// Health check for countries service
const getServiceHealth = async (req, res) => {
    try {
        const health = {
            service: 'countries-service',
            status: 'healthy',
            cacheInitialized,
            flagCount: flagCache.size,
            batchCacheSize: allFlagsCacheCompressed ? allFlagsCacheCompressed.length : 0,
            flagDirectory: FLAG_DIR,
            directoryExists: fs.existsSync(FLAG_DIR),
            supportedLanguages: ['en', 'ru', 'uz_lat', 'uz_cyr'],
            totalCountries: 258,
            timestamp: new Date().toISOString()
        };

        // Check if flag directory exists and has files
        if (fs.existsSync(FLAG_DIR)) {
            const files = fs.readdirSync(FLAG_DIR);
            health.filesInDirectory = files.filter(f => f.endsWith('.svg')).length;
        }

        res.json(health);

    } catch (error) {
        logger.error('Countries service health check error:', error);
        res.status(500).json({
            service: 'countries-service',
            status: 'unhealthy',
            error: error.message
        });
    }
};

module.exports = {
    getCountries,
    getCountry,
    getSingleFlag,
    getAllFlags,
    getFlagMetadata,
    refreshFlagCache,
    getServiceHealth,
    initializeFlagCache
};