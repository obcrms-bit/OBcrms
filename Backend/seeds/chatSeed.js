require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Company = require('../models/Company');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

const createCompanyId = () => `COMP_${Math.random().toString(36).slice(2, 14).toUpperCase()}`;

const seed = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is required to run chat seed');
  }

  await mongoose.connect(MONGO_URI);

  let company = await Company.findOne({ email: 'chat-demo@trusteducation.test' });
  if (!company) {
    company = await Company.create({
      companyId: createCompanyId(),
      name: 'Trust Education Chat Demo',
      email: 'chat-demo@trusteducation.test',
      country: 'NP',
      isActive: true,
      subscription: {
        plan: 'professional',
        status: 'active',
        features: ['students_crm', 'leads_management'],
      },
    });
  }

  const demoUsers = [
    {
      name: 'Anita Sharma',
      email: 'anita@trusteducation.test',
      role: 'admin',
      password: 'SecurePass123!',
      jobTitle: 'Operations Admin',
      department: 'Operations',
    },
    {
      name: 'Rohan Mehta',
      email: 'rohan@trusteducation.test',
      role: 'manager',
      password: 'SecurePass123!',
      jobTitle: 'Team Manager',
      department: 'Admissions',
    },
    {
      name: 'Sara Khan',
      email: 'sara@trusteducation.test',
      role: 'counselor',
      password: 'SecurePass123!',
      jobTitle: 'Student Counselor',
      department: 'Counseling',
    },
  ];

  for (const userData of demoUsers) {
    const existingUser = await User.findOne({
      companyId: company._id,
      email: userData.email,
    });

    if (!existingUser) {
      await User.create({
        companyId: company._id,
        ...userData,
        isActive: true,
      });
    }
  }

  console.log('Chat seed completed successfully.');
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Chat seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
