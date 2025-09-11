const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User model (simplified for seeding)
const userSchema = new mongoose.Schema({
    role: {
        type: String,
        required: true,
        enum: ['admin', 'presidium', 'delegate']
    },
    username: {
        type: String,
        required: function () { return this.role === 'admin' || this.role === 'presidium'; }
    },
    password: {
        type: String,
        required: function () { return this.role === 'admin' || this.role === 'presidium'; }
    },
    email: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const User = mongoose.model('User', userSchema);

// Default admin configuration
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123', // Change this in production!
    role: 'admin'
};

async function seedDatabase() {
    try {
        // Connect to MongoDB
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mun-platform', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB successfully');

        // Check if admin user exists
        console.log('🔍 Checking for existing admin user...');
        const existingAdmin = await User.findOne({ role: 'admin' });

        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists:');
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Created: ${existingAdmin.createdAt.toISOString()}`);
            console.log('✅ No action needed - admin user found');
        } else {
            // Create admin user
            console.log('➕ No admin user found, creating default admin...');

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

            // Create admin user
            const adminUser = new User({
                username: DEFAULT_ADMIN.username,
                password: hashedPassword,
                role: DEFAULT_ADMIN.role,
                email: null // Admin doesn't need email initially
            });

            await adminUser.save();

            console.log('✅ Admin user created successfully:');
            console.log(`   Username: ${DEFAULT_ADMIN.username}`);
            console.log(`   Password: ${DEFAULT_ADMIN.password}`);
            console.log('⚠️  IMPORTANT: Change the default password after first login!');
        }

    } catch (error) {
        console.error('❌ Error during database seeding:', error.message);

        // Log specific error types
        if (error.name === 'MongooseError') {
            console.error('   MongoDB connection issue - check your connection string');
        } else if (error.name === 'ValidationError') {
            console.error('   Data validation failed:', error.message);
        } else if (error.code === 11000) {
            console.error('   Duplicate key error - admin user might already exist');
        }

        process.exit(1);
    } finally {
        // Always disconnect from MongoDB
        console.log('🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
    }
}

// Handle script interruption
process.on('SIGINT', async () => {
    console.log('\n⚠️  Script interrupted, cleaning up...');
    await mongoose.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⚠️  Script terminated, cleaning up...');
    await mongoose.disconnect();
    process.exit(0);
});

// Run the seeding function
if (require.main === module) {
    console.log('🌱 Starting database seeding...\n');
    seedDatabase()
        .then(() => {
            console.log('\n🎉 Database seeding completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 Database seeding failed:', error.message);
            process.exit(1);
        });
}

module.exports = seedDatabase;