import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@goelectriq.com';
const ADMIN_PASSWORD = 'Admin@123';

async function seedAdmin() {
  try {
    await connectDB();

    const emailLower = ADMIN_EMAIL.toLowerCase().trim();

    // Delete existing admin and create fresh (ensures password is correctly hashed)
    await User.deleteOne({ email: emailLower });

    await User.create({
      name: 'Admin',
      email: emailLower,
      password: ADMIN_PASSWORD,
      phone: '9876543210', // valid 10-digit for schema
      role: 'admin',
      isActive: true,
    });
    console.log('✅ Admin user created successfully');

    console.log('\n========================================');
    console.log('   ADMIN LOGIN CREDENTIALS');
    console.log('========================================');
    console.log('   Email:    ' + ADMIN_EMAIL);
    console.log('   Password: ' + ADMIN_PASSWORD);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

seedAdmin();
