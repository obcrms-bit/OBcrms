const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// load environment variables from .env in the backend directory
dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/user.model');
const Student = require('../models/student.model');
const Company = require('../models/Company');

// helper to generate random elements
function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected for seeding');

    // clear existing data (OPTIONAL)
    await User.deleteMany({});
    await Student.deleteMany({});
    await Company.deleteMany({});

    // create default company
    const defaultCompany = await Company.create({
      companyId: 'COMP_SEED_123',
      name: 'Seed Education Group',
      email: 'contact@seededu.com',
      country: 'Nepal',
      timezone: 'Asia/Kathmandu',
      subscription: {
        plan: 'professional',
        status: 'active',
      },
      limits: {
        maxUsers: 50,
        maxStudents: 1000,
        maxCounselors: 20
      }
    });
    console.log('✅ Default Company created');

    const companyId = defaultCompany._id;

    // create users
    // Model middleware handles hashing, so we pass plain text.
    const admin = await User.create({
      companyId,
      name: 'Seed Admin',
      email: 'admin@seed.com',
      password: 'admin123',
      role: 'admin',
    });

    const counselor1 = await User.create({
      companyId,
      name: 'Counselor One',
      email: 'counselor1@seed.com',
      password: 'counselor123',
      role: 'counselor',
    });
    const counselor2 = await User.create({
      companyId,
      name: 'Counselor Two',
      email: 'counselor2@seed.com',
      password: 'counselor123',
      role: 'counselor',
    });

    console.log('✅ Users created: admin + 2 counselors');

    // possible statuses
    const statuses = ['New', 'Processing', 'Applied', 'Visa Approved', 'Rejected'];
    const countries = ['Canada', 'USA', 'UK', 'Australia', 'Germany'];

    // generate 20 students
    const studentPromises = [];
    for (let i = 1; i <= 20; i++) {
      const fullName = `Student ${i}`;
      const email = `student${i}@seed.com`;
      const status = randomElement(statuses);
      const country = randomElement(countries);

      studentPromises.push(
        Student.create({
          companyId,
          fullName,
          email,
          phone: '+100000000' + i,
          countryInterested: country,
          status,
        })
      );
    }
    const students = await Promise.all(studentPromises);

    // assign half to counselors randomly
    for (const student of students) {
      if (Math.random() < 0.5) {
        const counselor = Math.random() < 0.5 ? counselor1 : counselor2;
        student.assignedCounselor = counselor._id;
        student.assignedCounselorName = counselor.name;
        await student.save();
      }
    }

    console.log('✅ Students created and some assigned to counselors');
    console.log('Seed finished. You can now login with the following credentials:');
    console.log(' - Admin: admin@seed.com / admin123');
    console.log(' - Counselor1: counselor1@seed.com / counselor123');
    console.log(' - Counselor2: counselor2@seed.com / counselor123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error', err);
    process.exit(1);
  }
}

run();
