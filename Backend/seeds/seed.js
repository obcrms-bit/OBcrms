const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env in the backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Lead = require('../models/Lead');
const Company = require('../models/Company');

async function run() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    // Optional: Only clear if requested via flag, but for a fresh "Go Live" start, we might want to skip clearing
    // await User.deleteMany({});
    // await Student.deleteMany({});
    // await Company.deleteMany({});
    // await Lead.deleteMany({});

    // 1. Create Default Company
    let company = await Company.findOne({ email: 'contact@trustedu.com' });
    if (!company) {
      company = await Company.create({
        companyId: 'TRUST_HQ_001',
        name: 'Trust Education Group',
        email: 'contact@trustedu.com',
        country: 'Nepal',
        timezone: 'Asia/Kathmandu',
        subscription: { plan: 'professional', status: 'active' },
        limits: { maxUsers: 100, maxStudents: 5000, maxCounselors: 50 }
      });
      console.log('✅ Default Company created');
    }

    // 2. Create Admin User
    let admin = await User.findOne({ email: 'admin@trust.com' });
    if (!admin) {
      admin = await User.create({
        companyId: company._id,
        name: 'Trust Admin',
        email: 'admin@trust.com',
        password: 'AdminPassword123!', // Note: User model pre-save hashes this
        role: 'admin',
        isActive: true
      });
      console.log('✅ Admin User created (admin@trust.com / AdminPassword123!)');
    }

    // 3. Create a Sample Lead
    const sampleLead = await Lead.create({
      companyId: company._id,
      name: 'Sample Lead',
      email: 'lead@example.com',
      phone: '+9779800000000',
      source: 'Facebook',
      status: 'new',
      interestedCountry: 'Australia',
      interestedCourse: 'Nursing',
      priority: 'high'
    });
    console.log('✅ Sample Lead created');

    // 4. Create a Sample Student
    const sampleStudent = await Student.create({
      companyId: company._id,
      leadId: sampleLead._id,
      fullName: 'Sample Student',
      email: 'student@example.com',
      phone: '+9779811111111',
      status: 'prospect',
      countryInterested: 'Australia',
      source: 'Facebook'
    });
    console.log('✅ Sample Student created');

    console.log('\n--- SEEDING COMPLETE ---');
    console.log('Login URL: /login');
    console.log('Credentials: admin@trust.com / AdminPassword123!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

run();
