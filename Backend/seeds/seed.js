/**
 * Seed file for Trust Education CRM+ERP
 * Seeds: Company, branches, users, leads, visa rules, sample visa applications
 * Run: node seeds/seed.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const Company = require('../models/Company');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Lead = require('../models/Lead');
const Student = require('../models/Student');
const VisaRule = require('../models/VisaRule');
const VisaApplication = require('../models/VisaApplication');

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error('MONGO_URI is required to run the seed script.');
}

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // ─── Clean collections ─────────────────────────────────────────────────────
  await Promise.all([
    Company.deleteMany({}),
    User.deleteMany({}),
    Branch.deleteMany({}),
    Lead.deleteMany({}),
    VisaRule.deleteMany({}),
    VisaApplication.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ─── 1. Company ───────────────────────────────────────────────────────────
  const company = await Company.create({
    companyId: 'COMP_TRUST2026',
    name: 'Trust Education Foundation',
    email: 'info@trusteducation.com.np',
    phone: '+977-1-4567890',
    website: 'https://www.trusteducation.com.np',
    country: 'Nepal',
    timezone: 'Asia/Kathmandu',
    industry: 'Education',
    subscription: {
      plan: 'enterprise',
      status: 'active',
    },
    settings: {
      currency: 'USD',
      timezone: 'Asia/Kathmandu',
    },
    branding: {
      primaryColor: '#6366f1',
      secondaryColor: '#818cf8',
      name: 'Trust Education Foundation',
    },
  });
  console.log('✅ Company created:', company.name);

  // ─── 2. Branches ─────────────────────────────────────────────────────────
  const [mainBranch, lalitpurBranch, pokharaBranch] = await Branch.insertMany([
    {
      companyId: company._id,
      name: 'Kathmandu Head Office',
      city: 'Kathmandu',
      country: 'Nepal',
      isActive: true,
    },
    {
      companyId: company._id,
      name: 'Lalitpur Branch',
      city: 'Lalitpur',
      country: 'Nepal',
      isActive: true,
    },
    {
      companyId: company._id,
      name: 'Pokhara Branch',
      city: 'Pokhara',
      country: 'Nepal',
      isActive: true,
    },
  ]);
  console.log('✅ Branches created: 3');

  // ─── 3. Users (Admin + Counsellors) ──────────────────────────────────────
  const bcrypt = require('bcrypt');
  const hashedPwd = await bcrypt.hash('Trust@2025', 10);

  const [superAdmin, counsellor1, counsellor2, counsellor3] = await User.insertMany([
    {
      companyId: company._id,
      branchId: mainBranch._id,
      name: 'Super Admin',
      email: 'admin@trusteducation.com',
      password: hashedPwd,
      role: 'super_admin',
      isActive: true,
    },
    {
      companyId: company._id,
      branchId: mainBranch._id,
      name: 'Prakriti Tiwari',
      email: 'prakriti@trusteducation.com',
      password: hashedPwd,
      role: 'counselor',
      isActive: true,
    },
    {
      companyId: company._id,
      branchId: lalitpurBranch._id,
      name: 'Manoj Shrestha',
      email: 'manoj@trusteducation.com',
      password: hashedPwd,
      role: 'counselor',
      isActive: true,
    },
    {
      companyId: company._id,
      branchId: pokharaBranch._id,
      name: 'Sita Rana',
      email: 'sita@trusteducation.com',
      password: hashedPwd,
      role: 'counselor',
      isActive: true,
    },
  ]);
  console.log('✅ Users created: 4');

  // ─── 4. Sample Leads ──────────────────────────────────────────────────────
  await Lead.insertMany([
    {
      companyId: company._id,
      branchId: mainBranch._id,
      firstName: 'Ronika',
      lastName: 'Rai',
      email: 'ronika.rai@gmail.com',
      phone: '9841653526',
      source: 'facebook',
      status: 'new',
      preferredCountries: ['United Kingdom'],
      preferredStudyLevel: 'bachelor',
      preferredIntake: 'September 2025',
      budget: 2500000,
      assignedCounsellor: counsellor1._id,
      englishTest: { type: 'ielts', score: 6.5 },
      education: { lastDegree: 'Higher Secondary', percentage: 75, passingYear: 2023 },
      leadScore: 72,
      leadCategory: 'hot',
      tags: ['uk-bound', 'ielts-ready'],
    },
    {
      companyId: company._id,
      branchId: mainBranch._id,
      firstName: 'Robin',
      lastName: 'Tamang',
      email: 'robin.tamang@gmail.com',
      phone: '9841234567',
      source: 'walk-in',
      status: 'contacted',
      preferredCountries: ['Canada'],
      preferredStudyLevel: 'postgraduate',
      budget: 3000000,
      assignedCounsellor: counsellor2._id,
      englishTest: { type: 'pte', score: 65 },
      education: { lastDegree: 'Bachelor', percentage: 68, passingYear: 2022 },
      leadScore: 78,
      leadCategory: 'hot',
    },
    {
      companyId: company._id,
      branchId: lalitpurBranch._id,
      firstName: 'Sagar',
      lastName: 'Adhikari',
      email: 'sagar.adhikari@gmail.com',
      phone: '9845678901',
      source: 'instagram',
      status: 'qualified',
      preferredCountries: ['Australia'],
      preferredStudyLevel: 'bachelor',
      budget: 2000000,
      assignedCounsellor: counsellor1._id,
      englishTest: { type: 'ielts', score: 6.0 },
      education: { lastDegree: 'Higher Secondary', percentage: 70, passingYear: 2024 },
      leadScore: 65,
      leadCategory: 'warm',
      tags: ['australia-visa-started'],
    },
    {
      companyId: company._id,
      branchId: mainBranch._id,
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@gmail.com',
      phone: '9812345678',
      source: 'referral',
      status: 'counselling_done',
      preferredCountries: ['United States'],
      preferredStudyLevel: 'postgraduate',
      budget: 4000000,
      assignedCounsellor: counsellor3._id,
      englishTest: { type: 'toefl', score: 95 },
      education: { lastDegree: 'Bachelor', percentage: 80, passingYear: 2021, gpa: 3.5 },
      leadScore: 85,
      leadCategory: 'hot',
    },
    {
      companyId: company._id,
      branchId: pokharaBranch._id,
      firstName: 'Amit',
      lastName: 'Gurung',
      email: 'amit.gurung@gmail.com',
      phone: '9860123456',
      source: 'website',
      status: 'new',
      preferredCountries: ['Germany'],
      preferredStudyLevel: 'bachelor',
      budget: 1500000,
      assignedCounsellor: counsellor3._id,
      education: { lastDegree: 'Higher Secondary', percentage: 65, passingYear: 2024 },
      leadScore: 35,
      leadCategory: 'cold',
    },
  ]);
  console.log('✅ Sample leads created: 5');

  // ─── 5. Visa Rules ────────────────────────────────────────────────────────
  const visaRules = [
    // ── UNITED KINGDOM ──────────────────────────────────────────────────────
    {
      country: 'United Kingdom',
      countryCode: 'UK',
      visaType: 'tier4',
      studyLevel: ['bachelor', 'postgraduate', 'phd'],
      embassy: 'British Embassy / UKVI',
      processingCenter: 'VFS Global',
      flagEmoji: '🇬🇧',
      isActive: true,
      requiredDocuments: [
        { name: 'Valid Passport (6+ months validity)', category: 'identity', required: true },
        {
          name: 'Confirmation of Acceptance for Studies (CAS)',
          category: 'academic',
          required: true,
        },
        { name: 'Bank Statement (28 days original)', category: 'financial', required: true },
        { name: 'IELTS/English Test Certificate', category: 'language', required: true },
        { name: 'Academic Transcripts & Certificates', category: 'academic', required: true },
        {
          name: 'Proof of Tuition Fee Payment / Deposit Receipt',
          category: 'financial',
          required: true,
        },
        { name: 'Tuberculosis (TB) Test Certificate', category: 'medical', required: true },
        { name: 'Parental Consent (if under 18)', category: 'other', required: false },
        { name: 'Sponsor Letter & Bank Statements', category: 'financial', required: false },
        { name: 'Photo (UK Biometric standard)', category: 'identity', required: true },
      ],
      optionalDocuments: [
        { name: 'Previous UK Visa (if any)', category: 'travel', required: false },
        { name: 'Gap Year Explanation Letter', category: 'academic', required: false },
      ],
      financialRequirements: {
        currency: 'GBP',
        maintenanceFundsRequired: 9207,
        maintenanceFundsDescription: '£1,023 per month for 9 months for courses outside London',
        tuitionDepositRequired: true,
        livingCostPerMonth: 1023,
        durationMonths: 9,
        ihsRequired: true,
        ihsCostPerYear: 776,
        specialRequirements: [
          'IHS Surcharge mandatory',
          'Funds must be held for 28 consecutive days',
        ],
      },
      languageRequirements: {
        minIeltsOverall: 5.5,
        minIeltsBand: 5.5,
        minPteOverall: 42,
        minToeflOverall: 69,
        acceptedTests: ['ielts', 'pte', 'toefl', 'cambridge'],
        notes: 'UKVI approved IELTS required, not Academic IELTS',
      },
      biometricRequired: true,
      interviewRequired: false,
      medicalRequired: false,
      policeClearanceRequired: false,
      casRequired: true,
      tbTestRequired: true,
      visaFee: 490,
      visaFeeCurrency: 'GBP',
      surchargeFee: 776,
      surchargeCurrency: 'GBP',
      processingTimeWeeksMin: 3,
      processingTimeWeeksMax: 8,
      rejectionReasonsCatalog: [
        'Insufficient maintenance funds',
        'Funds not held for 28 consecutive days',
        'Invalid CAS',
        'English test score below threshold',
        'Credibility interview failed',
        'False information provided',
        'Immigration history concerns',
      ],
      preDepartureChecklist: [
        'Collect BRP within 10 days of arrival',
        'Register with GP',
        'Open UK student bank account',
        'Confirm university accommodation',
        'Attend university welcome/induction',
        'Register with local police (if required)',
        'Understand work rights: 20h/week during term',
      ],
      workflowMilestones: [
        { order: 1, key: 'cas_issued', label: 'CAS Issued by University', estimatedDays: 14 },
        { order: 2, key: 'tb_test_done', label: 'TB Test Completed', estimatedDays: 3 },
        {
          order: 3,
          key: 'funds_verified',
          label: 'Bank Funds Verified (28 days)',
          estimatedDays: 28,
        },
        { order: 4, key: 'ihs_paid', label: 'IHS Surcharge Paid', estimatedDays: 1 },
        {
          order: 5,
          key: 'visa_application_submitted',
          label: 'Visa Application Submitted Online',
          estimatedDays: 1,
        },
        {
          order: 6,
          key: 'biometrics_done',
          label: 'Biometrics Submitted at VFS',
          estimatedDays: 3,
        },
        { order: 7, key: 'decision_received', label: 'Visa Decision Received', estimatedDays: 21 },
      ],
      notes:
        'Student visa (Tier 4) for studies in the UK. Students from Nepal require a TB test certificate from an approved clinic.',
    },

    // ── UNITED STATES ────────────────────────────────────────────────────────
    {
      country: 'United States',
      countryCode: 'US',
      visaType: 'f1',
      studyLevel: ['bachelor', 'postgraduate', 'phd', 'english_course'],
      embassy: 'U.S. Embassy Kathmandu',
      processingCenter: 'U.S. Embassy',
      flagEmoji: '🇺🇸',
      isActive: true,
      requiredDocuments: [
        { name: 'Valid Passport', category: 'identity', required: true },
        {
          name: 'I-20 (Certificate of Eligibility from University)',
          category: 'academic',
          required: true,
        },
        { name: 'DS-160 Confirmation Page', category: 'other', required: true },
        { name: 'SEVIS Fee Receipt (Form I-901)', category: 'financial', required: true },
        { name: 'Visa Application Fee Receipt (MRV fee)', category: 'financial', required: true },
        { name: 'Bank Statements (past 6 months)', category: 'financial', required: true },
        { name: 'Sponsor Affidavit of Support (I-134)', category: 'financial', required: true },
        { name: 'Academic Transcripts & Degrees', category: 'academic', required: true },
        { name: 'English Test (TOEFL/IELTS/Duolingo) Score', category: 'language', required: true },
        { name: 'University Admission Letter', category: 'academic', required: true },
        { name: 'Photos (5x5 cm, white background)', category: 'identity', required: true },
      ],
      optionalDocuments: [
        { name: 'Employment Letter (for working sponsor)', category: 'other', required: false },
        { name: 'Property/Assets Documentation', category: 'financial', required: false },
        { name: 'Previous US Visa', category: 'travel', required: false },
      ],
      financialRequirements: {
        currency: 'USD',
        maintenanceFundsRequired: 25000,
        maintenanceFundsDescription:
          'Must demonstrate ability to cover tuition + living expenses for at least 1 year',
        tuitionDepositRequired: false,
        livingCostPerMonth: 1500,
        durationMonths: 12,
      },
      languageRequirements: {
        minIeltsOverall: 6.0,
        minToeflOverall: 80,
        minDuolingoScore: 110,
        acceptedTests: ['ielts', 'toefl', 'duolingo', 'pte'],
      },
      biometricRequired: false,
      interviewRequired: true,
      medicalRequired: false,
      policeClearanceRequired: false,
      i20Required: true,
      ds160Required: true,
      sevisFeeRequired: true,
      sevisFeeAmount: 350,
      visaFee: 185,
      visaFeeCurrency: 'USD',
      processingTimeWeeksMin: 1,
      processingTimeWeeksMax: 4,
      rejectionReasonsCatalog: [
        'Insufficient financial evidence',
        'Strong ties to home country not proven',
        'Intent to immigrate suspected',
        'I-20 not from SEVP-approved school',
        'Incomplete application',
        'Visa denial under section 214(b)',
      ],
      preDepartureChecklist: [
        'Complete SEVIS registration',
        'Arrange campus or off-campus housing',
        'Purchase US health insurance',
        'Notify bank of international travel',
        'Check in with DSO (Designated School Official) on arrival',
        'Get SSN if working on campus',
        'Understand OPT/CPT rules',
      ],
      workflowMilestones: [
        {
          order: 1,
          key: 'i20_received',
          label: 'I-20 Received from University',
          estimatedDays: 14,
        },
        { order: 2, key: 'sevis_paid', label: 'SEVIS Fee Paid', estimatedDays: 1 },
        { order: 3, key: 'ds160_completed', label: 'DS-160 Form Completed', estimatedDays: 2 },
        { order: 4, key: 'mrf_paid', label: 'MRV (Visa) Fee Paid', estimatedDays: 1 },
        {
          order: 5,
          key: 'appointment_booked',
          label: 'Embassy Interview Appointment Booked',
          estimatedDays: 5,
        },
        { order: 6, key: 'interview_done', label: 'Embassy Interview Completed', estimatedDays: 1 },
        { order: 7, key: 'visa_approved', label: 'Visa Stamped in Passport', estimatedDays: 3 },
      ],
    },

    // ── CANADA ────────────────────────────────────────────────────────────────
    {
      country: 'Canada',
      countryCode: 'CA',
      visaType: 'study_permit',
      studyLevel: ['diploma', 'bachelor', 'postgraduate', 'phd'],
      embassy: 'High Commission of Canada / IRCC',
      processingCenter: 'VFS Global / Online',
      flagEmoji: '🇨🇦',
      isActive: true,
      requiredDocuments: [
        { name: 'Valid Passport', category: 'identity', required: true },
        { name: 'Letter of Acceptance (LOA) from DLI', category: 'academic', required: true },
        {
          name: 'Proof of Financial Support (GIC or Bank Statement)',
          category: 'financial',
          required: true,
        },
        { name: 'English Test (IELTS/PTE/TOEFL) Score', category: 'language', required: true },
        { name: 'Academic Transcripts & Certificates', category: 'academic', required: true },
        { name: 'Biometric Fee Receipt', category: 'other', required: true },
        { name: 'Statement of Purpose (SOP)', category: 'other', required: true },
        { name: 'Photos (35mm x 45mm)', category: 'identity', required: true },
        {
          name: 'Provincial Attestation Letter (PAL) — if applicable',
          category: 'academic',
          required: false,
        },
        { name: 'Medical Exam (if requested)', category: 'medical', required: false },
      ],
      optionalDocuments: [
        { name: 'Sponsor / Co-signer Documents', category: 'financial', required: false },
        { name: 'Work Experience Letter', category: 'other', required: false },
      ],
      financialRequirements: {
        currency: 'CAD',
        maintenanceFundsRequired: 20635,
        maintenanceFundsDescription: 'Tuition + CAD 10,000 living expenses (first year)',
        tuitionDepositRequired: true,
        livingCostPerMonth: 833,
        durationMonths: 12,
        gicRequired: true,
        gicAmount: 10000,
        sdsAvailable: true,
        specialRequirements: [
          'GIC of CAD 10,000 from approved institution (for SDS applicants)',
          'Bank statement covering full tuition + living for 1 year for non-SDS',
        ],
      },
      languageRequirements: {
        minIeltsOverall: 6.0,
        minIeltsBand: 6.0,
        minPteOverall: 60,
        acceptedTests: ['ielts', 'pte', 'toefl', 'duolingo'],
      },
      biometricRequired: true,
      interviewRequired: false,
      medicalRequired: false,
      policeClearanceRequired: false,
      loaRequired: true,
      visaFee: 150,
      visaFeeCurrency: 'CAD',
      processingTimeWeeksMin: 4,
      processingTimeWeeksMax: 16,
      rejectionReasonsCatalog: [
        'Insufficient financial documents',
        'GIC not obtained',
        'Weak ties to home country',
        'Purpose of visit unclear',
        'Misrepresentation',
        'Application incomplete',
      ],
      preDepartureChecklist: [
        'Activate GIC upon arrival at Canadian bank',
        'Apply for SIN (Social Insurance Number)',
        'Enroll in provincial health insurance plan (OHIP, MSP etc.)',
        'Find accommodation (homestay / on-campus)',
        'Attend international student orientation',
        'Open Canadian bank account',
      ],
      workflowMilestones: [
        {
          order: 1,
          key: 'loa_received',
          label: 'Letter of Acceptance Received from DLI',
          estimatedDays: 14,
        },
        { order: 2, key: 'gic_opened', label: 'GIC Account Opened', estimatedDays: 7 },
        {
          order: 3,
          key: 'application_submitted_online',
          label: 'Study Permit Application Submitted (IRCC)',
          estimatedDays: 2,
        },
        {
          order: 4,
          key: 'biometrics_enrolled',
          label: 'Biometrics Enrolled at VFS',
          estimatedDays: 5,
        },
        {
          order: 5,
          key: 'medicals_done',
          label: 'Medical Examination (if requested)',
          estimatedDays: 7,
        },
        {
          order: 6,
          key: 'port_of_entry_letter',
          label: 'Port of Entry (POE) Letter Received',
          estimatedDays: 7,
        },
        {
          order: 7,
          key: 'arrival_study_permit',
          label: 'Study Permit Issued at Port of Entry',
          estimatedDays: 1,
        },
      ],
    },

    // ── AUSTRALIA ─────────────────────────────────────────────────────────────
    {
      country: 'Australia',
      countryCode: 'AU',
      visaType: 'student_visa',
      studyLevel: ['certificate', 'diploma', 'bachelor', 'postgraduate', 'phd'],
      embassy: 'Australian Embassy / Department of Home Affairs',
      processingCenter: 'ImmiAccount (online)',
      flagEmoji: '🇦🇺',
      isActive: true,
      requiredDocuments: [
        { name: 'Valid Passport', category: 'identity', required: true },
        {
          name: 'Confirmation of Enrolment (CoE) from University/College',
          category: 'academic',
          required: true,
        },
        { name: 'Genuine Temporary Entrant (GTE) Statement', category: 'other', required: true },
        { name: 'English Test (IELTS/PTE/TOEFL) Score', category: 'language', required: true },
        {
          name: 'Financial Capacity Evidence (Bank Statements)',
          category: 'financial',
          required: true,
        },
        {
          name: 'OSHC (Overseas Student Health Cover) Certificate',
          category: 'medical',
          required: true,
        },
        { name: 'Academic Transcripts & Certificates', category: 'academic', required: true },
        { name: 'Statement of Purpose (SOP)', category: 'other', required: true },
        { name: 'Police Clearance Certificate (if required)', category: 'other', required: false },
        { name: 'Photos', category: 'identity', required: true },
      ],
      optionalDocuments: [
        { name: 'Sponsor Bank Statement', category: 'financial', required: false },
        { name: 'Medical Examination', category: 'medical', required: false },
      ],
      financialRequirements: {
        currency: 'AUD',
        maintenanceFundsRequired: 29710,
        maintenanceFundsDescription: 'AUD 21,041 living + tuition fees for first year',
        tuitionDepositRequired: true,
        livingCostPerMonth: 1753,
        durationMonths: 12,
        oshcRequired: true,
        oshcCostPerYear: 700,
        specialRequirements: [
          'Proof of sufficient funds to cover tuition + living for full course duration',
          'OSHC must be purchased before visa application',
        ],
      },
      languageRequirements: {
        minIeltsOverall: 5.5,
        minIeltsBand: 5.0,
        minPteOverall: 42,
        minToeflOverall: 46,
        acceptedTests: ['ielts', 'pte', 'toefl', 'cambridge'],
      },
      biometricRequired: false,
      interviewRequired: false,
      medicalRequired: false,
      policeClearanceRequired: false,
      coeRequired: true,
      visaFee: 710,
      visaFeeCurrency: 'AUD',
      processingTimeWeeksMin: 2,
      processingTimeWeeksMax: 10,
      rejectionReasonsCatalog: [
        'Genuine Temporary Entrant (GTE) criteria not met',
        'Insufficient financial evidence',
        'Weak study plan',
        'English test score insufficient',
        'CoE not from registered provider',
        'OSHC not purchased',
        'Character/health requirements not met',
      ],
      preDepartureChecklist: [
        'Activate OSHC on arrival',
        'Arrange accommodation (campus or homestay)',
        'Register with university international office',
        'Open Australian bank account (Commonwealth, Westpac)',
        'Get Australian SIM card',
        'Understand 48-hour work limit per fortnight',
        'Complete student orientation',
      ],
      workflowMilestones: [
        { order: 1, key: 'coe_received', label: 'CoE Received from Institution', estimatedDays: 7 },
        { order: 2, key: 'oshc_purchased', label: 'OSHC Health Cover Purchased', estimatedDays: 1 },
        {
          order: 3,
          key: 'gte_statement_prepared',
          label: 'GTE Statement Prepared',
          estimatedDays: 3,
        },
        {
          order: 4,
          key: 'application_submitted',
          label: 'Student Visa Application Submitted via ImmiAccount',
          estimatedDays: 2,
        },
        {
          order: 5,
          key: 'biometrics_if_required',
          label: 'Biometrics (if requested)',
          estimatedDays: 3,
        },
        {
          order: 6,
          key: 'medicals_if_required',
          label: 'Medical Examination (if requested)',
          estimatedDays: 5,
        },
        { order: 7, key: 'visa_granted', label: 'Visa Grant Number Received', estimatedDays: 14 },
      ],
    },

    // ── GERMANY ────────────────────────────────────────────────────────────────
    {
      country: 'Germany',
      countryCode: 'DE',
      visaType: 'national_visa',
      studyLevel: ['bachelor', 'postgraduate', 'phd'],
      embassy: 'German Embassy Kathmandu',
      processingCenter: 'German Embassy / VFS Global',
      flagEmoji: '🇩🇪',
      isActive: true,
      requiredDocuments: [
        { name: 'Valid Passport (2+ years validity)', category: 'identity', required: true },
        { name: 'University Admission Letter (Zulassung)', category: 'academic', required: true },
        { name: 'Blocked Account Proof (Sperrkonto)', category: 'financial', required: true },
        { name: 'German Health Insurance Certificate', category: 'medical', required: true },
        { name: 'APS Certificate (Akademische Prüfstelle)', category: 'academic', required: true },
        {
          name: 'German Language Proficiency (DSH/TestDaF) or English Test',
          category: 'language',
          required: true,
        },
        {
          name: 'Academic Transcripts (Certified German Translation)',
          category: 'academic',
          required: true,
        },
        { name: 'CV / Lebenslauf', category: 'other', required: true },
        { name: 'Motivation Letter', category: 'other', required: true },
        { name: 'Photos (Biometric)', category: 'identity', required: true },
        { name: 'Visa Application Form', category: 'other', required: true },
      ],
      optionalDocuments: [
        {
          name: 'German Language Certificate (if required by university)',
          category: 'language',
          required: false,
        },
        {
          name: 'Employment Certificate (for part-time work context)',
          category: 'other',
          required: false,
        },
      ],
      financialRequirements: {
        currency: 'EUR',
        maintenanceFundsRequired: 11904,
        maintenanceFundsDescription: '€11,904 in a blocked account at Deutsche Bank or similar',
        tuitionDepositRequired: false,
        livingCostPerMonth: 992,
        durationMonths: 12,
        blockedAccountRequired: true,
        blockedAccountAmount: 11904,
        specialRequirements: [
          'Blocked account (Sperrkonto) of €11,904',
          'Monthly release of €992 after arrival',
          'German health insurance Techniker Krankenkasse (TK) or AOK',
        ],
      },
      languageRequirements: {
        minIeltsOverall: 6.0,
        minPteOverall: 55,
        acceptedTests: ['ielts', 'pte', 'toefl', 'goethe'],
        notes:
          'German-taught programs require B2/C1 German. English-taught programs may accept IELTS 6.0+',
      },
      biometricRequired: false,
      interviewRequired: true,
      medicalRequired: false,
      policeClearanceRequired: false,
      apsRequired: true,
      visaFee: 75,
      visaFeeCurrency: 'EUR',
      processingTimeWeeksMin: 4,
      processingTimeWeeksMax: 12,
      rejectionReasonsCatalog: [
        'Blocked account not opened',
        'APS not completed',
        'Health insurance not obtained',
        'Admission letter not from recognized university',
        'Insufficient German language proof',
        'Application incomplete',
        'Long visa appointment waiting time',
      ],
      preDepartureChecklist: [
        'Activate blocked account monthly release',
        'Register at Einwohnermeldeamt (city registration) within 14 days',
        'Enroll in German health insurance',
        'Open German bank account',
        'Register at university Studentenwerk',
        'Apply for student semester ticket (transport)',
        'Get Anmeldung (registration certificate)',
        'Apply for extension of residence permit (Aufenthaltstitel)',
      ],
      workflowMilestones: [
        { order: 1, key: 'aps_applied', label: 'APS Application Submitted', estimatedDays: 30 },
        {
          order: 2,
          key: 'aps_certificate_received',
          label: 'APS Certificate Received',
          estimatedDays: 60,
        },
        {
          order: 3,
          key: 'blocked_account_opened',
          label: 'Blocked Account (Sperrkonto) Opened',
          estimatedDays: 14,
        },
        {
          order: 4,
          key: 'health_insurance_obtained',
          label: 'German Health Insurance Obtained',
          estimatedDays: 7,
        },
        {
          order: 5,
          key: 'visa_appointment_booked',
          label: 'Embassy Appointment Booked',
          estimatedDays: 30,
        },
        { order: 6, key: 'interview_done', label: 'Embassy Interview Completed', estimatedDays: 1 },
        { order: 7, key: 'visa_granted', label: 'National D Visa Granted', estimatedDays: 14 },
      ],
      notes:
        'Long visa appointment waitlist — book well in advance. Teaching language determines language requirements.',
    },
  ];

  await VisaRule.insertMany(visaRules);
  console.log('✅ Visa rules created: 5 countries (UK, US, CA, AU, DE)');

  console.log('\n🎉 Seed completed successfully!');
  console.log('─────────────────────────────────────────────');
  console.log('  Login: admin@trusteducation.com');
  console.log('  Password: Trust@2025');
  console.log('─────────────────────────────────────────────');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
