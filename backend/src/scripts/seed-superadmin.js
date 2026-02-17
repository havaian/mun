/**
 * SuperAdmin Seed Script
 * 
 * Creates the platform-level superadmin account.
 * Run once during initial setup.
 * 
 * Usage:
 *   node scripts/seed-superadmin.js
 * 
 * Environment variables required:
 *   MONGODB_URI
 *   SUPERADMIN_EMAIL (defaults to admin@mun.uz)
 *   SUPERADMIN_PASSWORD (defaults to a generated one, printed to console)
 * 
 * If the superadmin already exists, the script will skip creation.
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Minimal logger for seed script
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args)
};
global.logger = logger;

const { User } = require('../src/auth/model');
const crypto = require('crypto');

const seed = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');

        const email = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASS;

        // Check if superadmin already exists
        const existing = await User.findOne({ email });
        if (existing) {
            if (existing.isSuperAdmin) {
                logger.info(`SuperAdmin already exists: ${email}`);
                logger.info('Skipping creation.');
            } else {
                // User exists but isn't superadmin — promote them
                existing.isSuperAdmin = true;
                await existing.save();
                logger.info(`Existing user promoted to SuperAdmin: ${email}`);
            }
            await mongoose.disconnect();
            process.exit(0);
        }

        // Create superadmin
        const superAdmin = new User({
            email,
            password,
            firstName: 'Super',
            lastName: 'Admin',
            isSuperAdmin: true,
            emailVerified: true,
            status: 'active'
        });

        await superAdmin.save();

        logger.info('');
        logger.info('===========================================');
        logger.info('  SuperAdmin account created successfully');
        logger.info('===========================================');
        logger.info(`  Email:    ${email}`);
        if (!process.env.SUPERADMIN_PASSWORD) {
            logger.info(`  Password: ${password}`);
            logger.info('');
            logger.info('  ⚠️  SAVE THIS PASSWORD — it will not be shown again!');
        } else {
            logger.info('  Password: (from SUPERADMIN_PASSWORD env var)');
        }
        logger.info('===========================================');
        logger.info('');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        logger.error('Seed failed:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

seed();