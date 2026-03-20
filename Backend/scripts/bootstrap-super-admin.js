#!/usr/bin/env node
/* eslint-disable no-console */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mongoose = require('mongoose');

const Company = require('../models/Company');
const User = require('../models/User');
const Branch = require('../models/Branch');
const { ensureCompanySaaSSetup } = require('../services/tenantProvisioning.service');

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required.`);
  }
  return value;
};

const readBoolean = (value, fallback = false) => {
  if (typeof value === 'undefined') {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const generateCompanyCode = () =>
  `COMP_${Math.random().toString(36).slice(2, 12).toUpperCase()}`;

const resolveCompany = async ({
  email,
  companyName,
  companyEmail,
  country,
  timezone,
}) => {
  let company = null;

  if (process.env.SUPERADMIN_TARGET_COMPANY_ID) {
    company = await Company.findById(process.env.SUPERADMIN_TARGET_COMPANY_ID);
  }

  if (!company && companyEmail) {
    company = await Company.findOne({ email: normalizeEmail(companyEmail) });
  }

  if (!company && companyName) {
    company = await Company.findOne({ name: companyName.trim() });
  }

  if (company) {
    return company;
  }

  const companyDocument = await Company.create({
    companyId: generateCompanyCode(),
    name: companyName,
    email: normalizeEmail(companyEmail || email),
    country,
    timezone,
    industry: 'Education',
    subscription: {
      plan: 'enterprise',
      status: 'active',
      features: [
        'students_crm',
        'leads_management',
        'commission_tracking',
        'advanced_analytics',
        'custom_branding',
      ],
    },
    limits: {
      maxUsers: 100,
      maxStudents: 10000,
      maxCounselors: 200,
      storageGB: 100,
    },
    settings: {
      currency: 'USD',
      theme: 'light',
      primaryColor: '#0f766e',
      secondaryColor: '#0f172a',
      accentColor: '#2dd4bf',
      fontFamily: 'DM Sans',
      supportEmail: normalizeEmail(companyEmail || email),
    },
    billing: {
      billingEmail: normalizeEmail(companyEmail || email),
      companyName,
    },
    isActive: true,
  });

  return companyDocument;
};

async function run() {
  const mongoUri = requiredEnv('MONGO_URI');
  const email = normalizeEmail(requiredEnv('SUPERADMIN_EMAIL'));
  const password = process.env.SUPERADMIN_PASSWORD || '';
  const name = process.env.SUPERADMIN_NAME || 'Super Admin';
  const companyName =
    process.env.SUPERADMIN_COMPANY_NAME || 'Trust Education Foundation';
  const companyEmail =
    process.env.SUPERADMIN_COMPANY_EMAIL || process.env.SUPERADMIN_EMAIL;
  const country = process.env.SUPERADMIN_COUNTRY || 'Nepal';
  const timezone = process.env.SUPERADMIN_TIMEZONE || 'Asia/Kathmandu';
  const resetPassword = readBoolean(process.env.SUPERADMIN_RESET_PASSWORD, false);
  const allowRoleUpgrade = readBoolean(
    process.env.SUPERADMIN_ALLOW_ROLE_UPGRADE,
    false
  );

  await mongoose.connect(mongoUri);

  try {
    const matchedUsers = await User.find({ email }).select('+password');

    if (matchedUsers.length > 1) {
      throw new Error(
        `Multiple users exist with email ${email}. Resolve duplicates manually before bootstrapping.`
      );
    }

    let company = null;
    let user = matchedUsers[0] || null;

    if (user) {
      company = await Company.findById(user.companyId);
      if (!company) {
        throw new Error(
          `Existing user ${email} is linked to a missing company. Repair the tenant before continuing.`
        );
      }
    } else {
      company = await resolveCompany({
        email,
        companyName,
        companyEmail,
        country,
        timezone,
      });
    }

    await ensureCompanySaaSSetup(company._id);
    const headOfficeBranch = await Branch.findOne({
      companyId: company._id,
      isHeadOffice: true,
    });

    if (!headOfficeBranch) {
      throw new Error('Head Office branch could not be created for the tenant.');
    }

    if (!user) {
      if (!password) {
        throw new Error(
          'SUPERADMIN_PASSWORD is required when creating a new super admin.'
        );
      }

      user = new User({
        companyId: company._id,
        branchId: headOfficeBranch._id,
        name,
        email,
        password,
        role: 'super_admin',
        primaryRoleKey: 'head_office_admin',
        isHeadOffice: true,
        managerEnabled: true,
        isActive: true,
        loginAttempts: 0,
        lockUntil: null,
      });

      await user.save();
      await Company.findByIdAndUpdate(company._id, {
        owner: user._id,
        headOfficeBranchId: headOfficeBranch._id,
      });

      console.log(`Created super admin ${email} for tenant ${company.name}.`);
    } else {
      if (user.role !== 'super_admin' && !allowRoleUpgrade) {
        throw new Error(
          `User ${email} already exists with role ${user.role}. Set SUPERADMIN_ALLOW_ROLE_UPGRADE=true to elevate this user safely.`
        );
      }

      user.name = name;
      user.companyId = company._id;
      user.branchId = headOfficeBranch._id;
      user.role = 'super_admin';
      user.primaryRoleKey = 'head_office_admin';
      user.isHeadOffice = true;
      user.managerEnabled = true;
      user.isActive = true;
      user.loginAttempts = 0;
      user.lockUntil = null;

      if (resetPassword) {
        if (!password) {
          throw new Error(
            'SUPERADMIN_PASSWORD is required when SUPERADMIN_RESET_PASSWORD=true.'
          );
        }
        user.password = password;
      }

      await user.save();
      await Company.findByIdAndUpdate(company._id, {
        owner: user._id,
        headOfficeBranchId: headOfficeBranch._id,
      });

      console.log(
        resetPassword
          ? `Updated super admin ${email} and reset the password.`
          : `Verified existing super admin ${email}.`
      );
    }

    console.log('Super admin bootstrap complete.');
    console.log(`Tenant: ${company.name}`);
    console.log(`Email: ${email}`);
    console.log(
      resetPassword || matchedUsers.length === 0
        ? 'Password: set from SUPERADMIN_PASSWORD'
        : 'Password: unchanged'
    );
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(`Super admin bootstrap failed: ${error.message}`);
  process.exit(1);
});
