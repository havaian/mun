require('dotenv').config();

// Import the actual User model from auth module
const { User } = require('../src/auth/model');

// Default admin configuration
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
    role: 'admin'
};

/**
 * Seeds the database with default admin user if none exists
 * @returns {Promise<Object>} Result object with success status and details
 */
async function seedDatabase() {
    let connection = null;

    try {
        // Check for existing admin user
        console.log('Checking for existing admin user...');
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (existingAdmin) {
            console.log('Admin user already exists');
            console.log(`Username: ${existingAdmin.username}`);
            console.log(`Created: ${existingAdmin.createdAt.toISOString()}`);

            return {
                success: true,
                action: 'found',
                message: 'Admin user already exists',
                user: {
                    username: existingAdmin.username,
                    role: existingAdmin.role,
                    createdAt: existingAdmin.createdAt
                }
            };
        }

        // Create new admin user
        console.log('No admin user found, creating default admin user...');

        // Create admin user document (password will be hashed by pre-save middleware)
        const adminUser = new User({
            username: DEFAULT_ADMIN.username,
            password: DEFAULT_ADMIN.password, // Will be hashed by the model's pre-save hook
            role: DEFAULT_ADMIN.role,
            // Admin users don't need these fields based on your model's conditional requirements
            email: null,
            qrToken: null,
            isQrActive: false,
            committeeId: null,
            countryName: null,
            specialRole: null,
            presidiumRole: null,
            sessionId: null,
            isActive: true,
            lastActivity: new Date()
        });

        // Save to database (password hashing happens automatically)
        const savedUser = await adminUser.save();

        console.log('Admin user created successfully');
        console.log(`Username: ${DEFAULT_ADMIN.username}`);
        console.log(`Password: ${DEFAULT_ADMIN.password}`);
        console.log('IMPORTANT: Change the default password after first login');

        return {
            success: true,
            action: 'created',
            message: 'Admin user created successfully',
            user: {
                username: savedUser.username,
                role: savedUser.role,
                createdAt: savedUser.createdAt
            },
            credentials: {
                username: DEFAULT_ADMIN.username,
                password: DEFAULT_ADMIN.password
            }
        };

    } catch (error) {
        console.error('Database seeding failed:', error.message);

        // Provide specific error context
        let errorContext = 'Unknown error occurred';

        if (error.name === 'ValidationError') {
            errorContext = 'Data validation failed - check required fields';
            console.error('Validation details:', error.errors);
        } else if (error.code === 11000) {
            errorContext = 'Duplicate key error - admin user might already exist';
        } else if (error.name === 'TypeError') {
            errorContext = 'Type error - check data structure';
        } else if (error.name === 'CastError') {
            errorContext = 'Data casting error - invalid data type';
        }

        console.error(`Error context: ${errorContext}`);

        return {
            success: false,
            action: 'error',
            message: `Seeding failed: ${error.message}`,
            error: {
                name: error.name,
                message: error.message,
                context: errorContext
            }
        };

    }
}

// Run directly if this file is executed as main module
if (require.main === module) {
    console.log('Starting database seeding process...');

    seedDatabase()
        .then((result) => {
            console.log('\nSeeding process completed');
            console.log('Result:', JSON.stringify(result, null, 2));

            if (result.success) {
                console.log('Database seeding successful');
                process.exit(0);
            } else {
                console.error('Database seeding failed');
                process.exit(1);
            }
        })
        .catch((error) => {
            console.error('\nUnexpected error during seeding:');
            console.error(error);
            process.exit(1);
        });
}

module.exports = seedDatabase;