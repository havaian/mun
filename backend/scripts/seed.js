const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const { User, ActiveSession } = require('../src/auth/model');
const { Event } = require('../src/event/model');
const { Committee } = require('../src/committee/model');

const logger = require('../src/utils/logger');

// Sample countries data
const sampleCountries = {
    GA: [
        { name: 'United States', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'United Kingdom', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Germany', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'France', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Japan', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Brazil', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'India', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'South Africa', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Australia', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Canada', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Observer State', flagUrl: null, isObserver: true, specialRole: 'observer' }
    ],

    SC: [
        { name: 'United States', flagUrl: null, isPermanentMember: true, hasVetoRight: true },
        { name: 'United Kingdom', flagUrl: null, isPermanentMember: true, hasVetoRight: true },
        { name: 'France', flagUrl: null, isPermanentMember: true, hasVetoRight: true },
        { name: 'Russia', flagUrl: null, isPermanentMember: true, hasVetoRight: true },
        { name: 'China', flagUrl: null, isPermanentMember: true, hasVetoRight: true },
        { name: 'Germany', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Japan', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'Brazil', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'India', flagUrl: null, isPermanentMember: false, hasVetoRight: false },
        { name: 'South Africa', flagUrl: null, isPermanentMember: false, hasVetoRight: false }
    ]
};

// Connect to database
async function connectToDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mun-uz';
        await mongoose.connect(mongoUri);
        logger.info('Connected to MongoDB for seeding');
    } catch (error) {
        logger.error('Database connection failed:', error);
        process.exit(1);
    }
}

// Clear existing data
async function clearDatabase() {
    try {
        await User.deleteMany({});
        await ActiveSession.deleteMany({});
        await Event.deleteMany({});
        await Committee.deleteMany({});

        logger.info('Database cleared');
    } catch (error) {
        logger.error('Error clearing database:', error);
        throw error;
    }
}

// Create admin user
async function createAdmin() {
    try {
        const adminPassword = process.env.ADMIN_PASS || '123456';

        const admin = new User({
            role: 'admin',
            username: process.env.ADMIN_USER || 'admin',
            password: adminPassword
        });

        await admin.save();

        logger.info(`Admin created: ${admin.username}`);
        return admin;
    } catch (error) {
        logger.error('Error creating admin:', error);
        throw error;
    }
}

// Create sample event
async function createSampleEvent(adminId) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Tomorrow

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 2); // Day after tomorrow

        const registrationDeadline = new Date();
        registrationDeadline.setHours(registrationDeadline.getHours() + 2); // 2 hours from now

        const event = new Event({
            name: 'Sample MUN Conference 2025',
            description: 'A sample Model UN conference for testing the mun.uz platform',
            startDate,
            endDate,
            settings: {
                registrationDeadline,
                qrExpirationPeriod: 168, // 7 days
                allowLateRegistration: true,
                maxCommittees: 5,
                timezone: 'UTC'
            },
            createdBy: adminId
        });

        await event.save();

        logger.info(`Sample event created: ${event.name}`);
        return event;
    } catch (error) {
        logger.error('Error creating sample event:', error);
        throw error;
    }
}

// Create presidium users
async function createPresidiumUsers(committeeId) {
    try {
        const presidiumRoles = ['chairman', 'co-chairman', 'expert', 'secretary'];
        const presidiumUsers = [];

        for (const role of presidiumRoles) {
            const user = new User({
                role: 'presidium',
                username: `${role}-demo`,
                password: 'presidium123',
                committeeId: committeeId,
                presidiumRole: role
            });

            await user.save();
            presidiumUsers.push(user);

            logger.info(`Presidium user created: ${role}-demo`);
        }

        return presidiumUsers;
    } catch (error) {
        logger.error('Error creating presidium users:', error);
        throw error;
    }
}

// Create sample committees
async function createSampleCommittees(eventId) {
    try {
        const committees = [
            {
                name: 'General Assembly',
                type: 'GA',
                description: 'The main deliberative body of the United Nations',
                language: 'english'
            },
            {
                name: 'Security Council',
                type: 'SC',
                description: 'The UN organ responsible for maintaining international peace and security',
                language: 'english'
            }
        ];

        const createdCommittees = [];

        for (const committeeData of committees) {
            const committee = new Committee({
                eventId,
                ...committeeData,
                settings: {
                    minCoalitionSize: 3,
                    documentDeadlines: {
                        positionPapers: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                        resolutions: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
                        amendments: new Date(Date.now() + 36 * 60 * 60 * 1000) // 36 hours from now
                    },
                    votingRules: {
                        defaultMajority: 'simple',
                        allowConsensus: true
                    },
                    speechSettings: {
                        defaultSpeechTime: 90,
                        allowExtensions: true,
                        extensionTime: 30
                    }
                }
            });

            // Add countries
            const countries = sampleCountries[committeeData.type];
            countries.forEach(countryData => {
                committee.addCountry(countryData);
            });

            await committee.save();

            // Create presidium users for this committee
            const presidiumUsers = await createPresidiumUsers(committee._id);

            // Update committee presidium
            presidiumUsers.forEach(user => {
                committee.presidium.push({
                    userId: user._id,
                    role: user.presidiumRole,
                    appointedBy: eventId, // Using event creator as appointer
                    appointedAt: new Date()
                });
            });

            await committee.save();

            // Create delegate users for each country
            for (const country of committee.countries) {
                const delegateUser = new User({
                    role: 'delegate',
                    countryName: country.name,
                    specialRole: country.specialRole || 'observer',
                    qrToken: country.qrToken,
                    isQrActive: true,
                    committeeId: committee._id
                });

                await delegateUser.save();
            }

            createdCommittees.push(committee);

            logger.info(`Committee created: ${committee.name} with ${committee.countries.length} countries`);
        }

        return createdCommittees;
    } catch (error) {
        logger.error('Error creating sample committees:', error);
        throw error;
    }
}

// Main seeding function
async function seedDatabase() {
    try {
        logger.info('Starting database seeding...');

        await connectToDatabase();

        // Clear existing data
        await clearDatabase();

        // Create admin
        const admin = await createAdmin();

        // Create sample event
        const event = await createSampleEvent(admin._id);

        // Create sample committees
        const committees = await createSampleCommittees(event._id);

        // Update event statistics
        await event.updateStatistics();

        logger.info('✅ Database seeding completed successfully!');
        logger.info('\n📋 Created:');
        logger.info(`   - 1 Admin user (username: ${admin.username})`);
        logger.info(`   - 1 Event: ${event.name}`);
        logger.info(`   - ${committees.length} Committees`);

        for (const committee of committees) {
            logger.info(`     * ${committee.name}: ${committee.countries.length} countries, ${committee.presidium.length} presidium members`);
        }

        logger.info('\n🔑 Login credentials:');
        logger.info(`   Admin: ${admin.username} / ${process.env.ADMIN_PASS || '123456'}`);
        logger.info(`   Presidium: chairman-demo / presidium123 (and similar for other roles)`);

        logger.info('\n📱 QR Codes:');
        logger.info('   QR codes have been generated for all countries.');
        logger.info('   Use the committee QR generation endpoint to get the actual QR codes.');

        logger.info('\n🚀 Server is ready to start!');

    } catch (error) {
        logger.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        logger.info('Database connection closed');
    }
}

// Run seeding if called directly
if (require.main === module) {
    seedDatabase();
}

module.exports = seedDatabase;