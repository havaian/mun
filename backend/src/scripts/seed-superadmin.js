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
const { User } = require('../auth/model');

const seed = async () => {
    try {
        const email = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASS;

        // Check if superadmin already exists
        const existing = await User.findOne({ email });
        if (existing) {
            if (existing.isSuperAdmin) {
                global.logger.info(`SuperAdmin already exists: ${email}`);
                global.logger.info('Skipping creation.');
                return;
            } else {
                // User exists but isn't superadmin — promote them
                existing.isSuperAdmin = true;
                await existing.save();
                global.logger.info(`Existing user promoted to SuperAdmin: ${email}`);
                return;
            }
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

        global.logger.info('');
        global.logger.info('===========================================');
        global.logger.info('  SuperAdmin account created successfully');
        global.logger.info('===========================================');
        global.logger.info(`  Email:    ${email}`);
        if (!process.env.SUPERADMIN_PASSWORD) {
            global.logger.info(`  Password: ${password}`);
            global.logger.info('');
            global.logger.info('  ⚠️  SAVE THIS PASSWORD — it will not be shown again!');
        } else {
            global.logger.info('  Password: (from SUPERADMIN_PASSWORD env var)');
        }
        global.logger.info('===========================================');
        global.logger.info('');
        return;
    } catch (error) {
        global.logger.error('Seed failed:', error);
    }
};

seed();