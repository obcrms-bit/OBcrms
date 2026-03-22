const Papa = require('papaparse');
const XLSX = require('xlsx');
const Company = require('../models/Company');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Role = require('../models/Role');
const Agent = require('../models/Agent');
const Partner = require('../models/Partner');
const AutomationRule = require('../models/AutomationRule');
const BillingPlanConfig = require('../models/BillingPlanConfig');
const BillingProfile = require('../models/BillingProfile');
const OnboardingBatch = require('../models/OnboardingBatch');
const OnboardingImportRow = require('../models/OnboardingImportRow');
const AuditLog = require('../models/AuditLog');
const { ensureCompanySaaSSetup } = require('./tenantProvisioning.service');
const { normalizeKey, getBillingPlanFallback } = require('./superAdminConfig.service');
const { resolveCanonicalRole } = require('../utils/workspaceRoles');

const SECTION_DEFINITIONS = [
  {
    key: 'tenant_profile',
    sheetName: 'Tenant Profile',
    sampleRows: [
      {
        name: 'Trust Education Foundation',
        code: 'TEN-TRUST',
        email: 'ops@trusteducation.org',
        plan: 'growth',
        status: 'active',
        onboardingStatus: 'in_progress',
        country: 'Nepal',
        timezone: 'Asia/Kathmandu',
        currency: 'USD',
        website: 'https://trusteducation.org',
      },
    ],
  },
  {
    key: 'branches',
    sheetName: 'Branches',
    sampleRows: [
      {
        name: 'Kathmandu Head Office',
        code: 'KTM-HO',
        city: 'Kathmandu',
        country: 'Nepal',
        email: 'ktm@trusteducation.org',
        contactNumber: '+977-9800000000',
        isHeadOffice: 'yes',
      },
    ],
  },
  {
    key: 'users',
    sheetName: 'Users',
    sampleRows: [
      {
        name: 'Aarav Admin',
        email: 'aarav.admin@trusteducation.org',
        password: 'ChangeMe123!',
        role: 'TENANT_ADMIN',
        branchCode: 'KTM-HO',
        status: 'active',
      },
      {
        name: 'Sita Counsellor',
        email: 'sita@trusteducation.org',
        password: 'ChangeMe123!',
        role: 'COUNSELLOR',
        branchCode: 'KTM-HO',
        status: 'active',
      },
    ],
  },
  {
    key: 'roles',
    sheetName: 'Roles',
    sampleRows: [
      {
        key: 'senior_ops',
        name: 'Senior Operations',
        category: 'operations',
        permissions: 'leads:view|edit:own_branch; reports:view:own_branch',
      },
    ],
  },
  {
    key: 'partners',
    sheetName: 'Partners',
    sampleRows: [
      {
        name: 'Global Study Link',
        code: 'GSL',
        email: 'partners@globalstudy.example',
        category: 'referral',
      },
    ],
  },
  {
    key: 'agents',
    sheetName: 'Agents',
    sampleRows: [
      {
        name: 'Nabin Agent',
        email: 'nabin.agent@trusteducation.org',
        branchCode: 'KTM-HO',
        commissionRate: 15,
      },
    ],
  },
  {
    key: 'automations',
    sheetName: 'Automations',
    sampleRows: [
      {
        name: 'Overdue Follow-up Escalation',
        module: 'leads',
        triggerEvent: 'followup_overdue',
        actionType: 'notify_branch_manager',
        isActive: 'yes',
      },
    ],
  },
  {
    key: 'setup_status',
    sheetName: 'Setup Status',
    sampleRows: [
      {
        item: 'branding',
        status: 'completed',
        owner: 'Tenant Ops',
        notes: 'Primary brand colors approved',
      },
    ],
  },
];

const SECTION_KEYS = SECTION_DEFINITIONS.map((section) => section.key);

const SECTION_NAME_MAP = SECTION_DEFINITIONS.reduce((map, section) => {
  map[section.sheetName.toLowerCase()] = section.key;
  map[section.key] = section.key;
  return map;
}, {});

const USER_ROLE_MAP = {
  SUPER_ADMIN: 'super_admin',
  TENANT_ADMIN: 'head_office_admin',
  BRANCH_MANAGER: 'branch_manager',
  COUNSELLOR: 'follow_up_team',
  COUNSELOR: 'follow_up_team',
  FINANCE: 'accountant',
  OPERATIONS: 'application_officer',
  frontdesk: 'frontdesk',
  follow_up_team: 'follow_up_team',
  accountant: 'accountant',
  application_officer: 'application_officer',
  branch_manager: 'branch_manager',
  head_office_admin: 'head_office_admin',
};

const trimString = (value) => String(value || '').trim();
const normalizeBoolean = (value) =>
  ['yes', 'true', '1', 'active'].includes(trimString(value).toLowerCase());
const normalizeSectionKey = (value) =>
  SECTION_NAME_MAP[trimString(value).toLowerCase()] ||
  trimString(value).toLowerCase().replace(/\s+/g, '_');

const slugifyKey = (value, fallback = 'generated') =>
  trimString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || fallback;

const normalizeCsvRows = (rows = []) => {
  const groupedRows = {};
  rows.forEach((row) => {
    const sectionKey = normalizeSectionKey(row.section || row.Section || row.sheet);
    if (!SECTION_KEYS.includes(sectionKey)) {
      return;
    }
    groupedRows[sectionKey] = groupedRows[sectionKey] || [];
    const nextRow = { ...row };
    delete nextRow.section;
    delete nextRow.Section;
    delete nextRow.sheet;
    groupedRows[sectionKey].push(nextRow);
  });
  return groupedRows;
};

const parseImportFile = (file) => {
  const extension = trimString(file.originalname).split('.').pop().toLowerCase();

  if (extension === 'csv') {
    const csvText = file.buffer.toString('utf8');
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => trimString(header),
    });
    return normalizeCsvRows(parsed.data || []);
  }

  if (['xlsx', 'xls', 'ods'].includes(extension)) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    return workbook.SheetNames.reduce((accumulator, sheetName) => {
      const sectionKey = normalizeSectionKey(sheetName);
      if (!SECTION_KEYS.includes(sectionKey)) {
        return accumulator;
      }

      accumulator[sectionKey] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
        defval: '',
      });
      return accumulator;
    }, {});
  }

  throw new Error('Unsupported file type. Allowed: csv, xlsx, xls, ods.');
};

const parsePermissionString = (value) =>
  trimString(value)
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [moduleKey, actionList = '', scopeList = 'tenant'] = chunk.split(':');
      return {
        module: trimString(moduleKey).toLowerCase(),
        actions: actionList
          .split('|')
          .map((item) => trimString(item).toLowerCase())
          .filter(Boolean),
        scopes: scopeList
          .split('|')
          .map((item) => trimString(item).toLowerCase())
          .filter(Boolean),
      };
    })
    .filter((permission) => permission.module && permission.actions.length);

const normalizeTenantProfile = (row = {}) => ({
  name: trimString(row.name),
  code: trimString(row.code || row.tenantCode).toUpperCase(),
  email: trimString(row.email).toLowerCase(),
  plan: normalizeKey(row.plan || 'starter', 'starter'),
  status: trimString(row.status || 'active').toLowerCase(),
  onboardingStatus: trimString(row.onboardingStatus || 'in_progress').toLowerCase(),
  country: trimString(row.country || 'Nepal'),
  timezone: trimString(row.timezone || 'Asia/Kathmandu'),
  currency: trimString(row.currency || 'USD').toUpperCase(),
  website: trimString(row.website),
  description: trimString(row.description),
});

const normalizeBranchRow = (row = {}) => ({
  name: trimString(row.name),
  code: trimString(row.code).toUpperCase(),
  city: trimString(row.city),
  state: trimString(row.state),
  country: trimString(row.country),
  email: trimString(row.email).toLowerCase(),
  contactNumber: trimString(row.contactNumber || row.phone),
  visibility: trimString(row.visibility || 'branch').toLowerCase(),
  isHeadOffice: normalizeBoolean(row.isHeadOffice),
});

const normalizeUserRow = (row = {}) => {
  const rawRole = trimString(row.role || 'OPERATIONS');
  const normalizedRole =
    USER_ROLE_MAP[rawRole.toUpperCase()] || USER_ROLE_MAP[rawRole] || 'application_officer';
  return {
    name: trimString(row.name),
    email: trimString(row.email).toLowerCase(),
    password: trimString(row.password || 'ChangeMe123!'),
    role: normalizedRole,
    canonicalRole: resolveCanonicalRole(normalizedRole),
    branchCode: trimString(row.branchCode).toUpperCase(),
    status: trimString(row.status || 'active').toLowerCase(),
    phone: trimString(row.phone),
  };
};

const normalizeRoleRow = (row = {}) => ({
  key: slugifyKey(row.key || row.name, 'custom_role'),
  name: trimString(row.name),
  category: trimString(row.category || 'custom').toLowerCase(),
  description: trimString(row.description),
  permissions: parsePermissionString(row.permissions),
});

const normalizePartnerRow = (row = {}) => ({
  name: trimString(row.name),
  code: trimString(row.code).toUpperCase(),
  category: trimString(row.category || 'partner').toLowerCase(),
  email: trimString(row.email).toLowerCase(),
  phone: trimString(row.phone),
});

const normalizeAgentRow = (row = {}) => ({
  name: trimString(row.name),
  email: trimString(row.email).toLowerCase(),
  branchCode: trimString(row.branchCode).toUpperCase(),
  commissionRate: Number(row.commissionRate || 0),
  phone: trimString(row.phone),
});

const normalizeAutomationRow = (row = {}) => ({
  name: trimString(row.name),
  module: trimString(row.module).toLowerCase(),
  triggerEvent: trimString(row.triggerEvent).toLowerCase(),
  actionType: trimString(row.actionType).toLowerCase(),
  isActive: row.isActive === '' ? true : normalizeBoolean(row.isActive),
});

const normalizeSetupStatusRow = (row = {}) => ({
  item: trimString(row.item || row.key).toLowerCase(),
  status: trimString(row.status || 'pending').toLowerCase(),
  owner: trimString(row.owner),
  notes: trimString(row.notes),
});

const validateImportData = (normalizedSections) => {
  const rows = [];
  const summary = {
    totalRows: 0,
    validRows: 0,
    warningRows: 0,
    errorRows: 0,
    bySection: {},
  };

  const branchCodes = new Set();
  const seenUserEmails = new Set();

  SECTION_KEYS.forEach((sectionKey) => {
    const sectionRows = normalizedSections[sectionKey] || [];
    summary.bySection[sectionKey] = {
      total: sectionRows.length,
      valid: 0,
      warnings: 0,
      errors: 0,
    };

    sectionRows.forEach((row, index) => {
      const errors = [];
      const warnings = [];

      if (sectionKey === 'tenant_profile') {
        if (!row.name) errors.push('Tenant name is required.');
        if (!row.code) errors.push('Tenant code is required.');
        if (!row.email) errors.push('Tenant email is required.');
      }

      if (sectionKey === 'branches') {
        if (!row.name) errors.push('Branch name is required.');
        if (!row.code) errors.push('Branch code is required.');
        if (row.code && branchCodes.has(row.code)) {
          errors.push(`Duplicate branch code "${row.code}".`);
        }
        if (row.code) {
          branchCodes.add(row.code);
        }
      }

      if (sectionKey === 'users') {
        if (!row.name) errors.push('User name is required.');
        if (!row.email) errors.push('User email is required.');
        if (!row.password) errors.push('User password is required.');
        if (!row.role) errors.push('User role is required.');
        if (row.email && seenUserEmails.has(row.email)) {
          errors.push(`Duplicate user email "${row.email}".`);
        }
        if (row.email) {
          seenUserEmails.add(row.email);
        }
        if (row.canonicalRole !== 'TENANT_ADMIN' && !row.branchCode) {
          errors.push('Branch-linked users must include a branchCode.');
        }
        if (row.branchCode && !branchCodes.has(row.branchCode)) {
          errors.push(`Unknown branchCode "${row.branchCode}" for user "${row.email || row.name}".`);
        }
      }

      if (sectionKey === 'roles') {
        if (!row.name) errors.push('Role name is required.');
        if (!row.key) errors.push('Role key is required.');
        if (!row.permissions.length) warnings.push('Role has no explicit permissions.');
      }

      if (sectionKey === 'agents') {
        if (!row.name) errors.push('Agent name is required.');
        if (!row.branchCode) errors.push('Agent branchCode is required.');
        if (row.branchCode && !branchCodes.has(row.branchCode)) {
          errors.push(`Unknown branchCode "${row.branchCode}" for agent "${row.name}".`);
        }
      }

      if (sectionKey === 'automations') {
        if (!row.name) errors.push('Automation name is required.');
        if (!row.module) errors.push('Automation module is required.');
        if (!row.triggerEvent) errors.push('Automation triggerEvent is required.');
        if (!row.actionType) errors.push('Automation actionType is required.');
      }

      if (sectionKey === 'setup_status' && !row.item) {
        warnings.push('Setup item key is missing.');
      }

      const status = errors.length ? 'error' : warnings.length ? 'warning' : 'valid';

      summary.totalRows += 1;
      if (status === 'error') {
        summary.errorRows += 1;
        summary.bySection[sectionKey].errors += 1;
      } else if (status === 'warning') {
        summary.warningRows += 1;
        summary.bySection[sectionKey].warnings += 1;
      } else {
        summary.validRows += 1;
        summary.bySection[sectionKey].valid += 1;
      }

      rows.push({
        section: sectionKey,
        rowNumber: index + 2,
        rawData: row,
        normalizedData: row,
        errors,
        warnings,
        status,
      });
    });
  });

  return {
    rows,
    summary,
  };
};

const buildPreviewSnapshot = (sections, validationSummary) => {
  const validSectionCount = SECTION_KEYS.filter((sectionKey) => {
    const sectionSummary = validationSummary.bySection[sectionKey];
    return sectionSummary && sectionSummary.errors === 0 && sectionSummary.total > 0;
  }).length;

  const completionPercentage = Math.round((validSectionCount / SECTION_KEYS.length) * 100);

  return {
    preview: {
      tenantProfile: sections.tenant_profile?.[0] || null,
      branches: sections.branches || [],
      users: sections.users || [],
      roles: sections.roles || [],
      partners: sections.partners || [],
      agents: sections.agents || [],
      automations: sections.automations || [],
      setupStatus: sections.setup_status || [],
    },
    summary: {
      completionPercentage,
      branchesToCreate: sections.branches?.length || 0,
      usersToCreate: sections.users?.length || 0,
      rolesToCreate: sections.roles?.length || 0,
      partnersToCreate: sections.partners?.length || 0,
      agentsToCreate: sections.agents?.length || 0,
      automationsToCreate: sections.automations?.length || 0,
      validationErrors: validationSummary.errorRows,
      validationWarnings: validationSummary.warningRows,
    },
  };
};

const generateTemplateBuffer = () => {
  const workbook = XLSX.utils.book_new();

  SECTION_DEFINITIONS.forEach((section) => {
    const worksheet = XLSX.utils.json_to_sheet(section.sampleRows);
    XLSX.utils.book_append_sheet(workbook, worksheet, section.sheetName);
  });

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

const createOnboardingBatchPreview = async ({ file, actorUserId }) => {
  const rawSections = parseImportFile(file);
  const normalizedSections = {
    tenant_profile: (rawSections.tenant_profile || []).map(normalizeTenantProfile),
    branches: (rawSections.branches || []).map(normalizeBranchRow),
    users: (rawSections.users || []).map(normalizeUserRow),
    roles: (rawSections.roles || []).map(normalizeRoleRow),
    partners: (rawSections.partners || []).map(normalizePartnerRow),
    agents: (rawSections.agents || []).map(normalizeAgentRow),
    automations: (rawSections.automations || []).map(normalizeAutomationRow),
    setup_status: (rawSections.setup_status || []).map(normalizeSetupStatusRow),
  };

  const { rows, summary } = validateImportData(normalizedSections);
  const previewSnapshot = buildPreviewSnapshot(normalizedSections, summary);

  const batch = await OnboardingBatch.create({
    fileName: file.originalname,
    fileType: trimString(file.originalname).split('.').pop().toLowerCase(),
    status: summary.errorRows ? 'uploaded' : 'validated',
    completionPercentage: previewSnapshot.summary.completionPercentage,
    summary: previewSnapshot.summary,
    validation: summary,
    previewSnapshot: previewSnapshot.preview,
    createdBy: actorUserId,
  });

  if (rows.length) {
    await OnboardingImportRow.insertMany(
      rows.map((row) => ({
        batchId: batch._id,
        ...row,
      }))
    );
  }

  return {
    batch,
    ...previewSnapshot,
    validation: summary,
  };
};

const getResolvedBillingPlan = async (planKey) => {
  const normalizedPlan = normalizeKey(planKey || 'starter', 'starter');
  return (
    (await BillingPlanConfig.findOne({ key: normalizedPlan, isActive: true }).lean()) ||
    getBillingPlanFallback(normalizedPlan)
  );
};

const commitOnboardingBatch = async ({ batchId, actor, requestContext = {} }) => {
  const batch = await OnboardingBatch.findById(batchId);
  if (!batch) {
    throw new Error('Onboarding batch not found.');
  }

  if (batch.importedTenantId) {
    throw new Error('This onboarding batch has already been imported.');
  }

  const validation = batch.validation || {};
  if (validation.errorRows) {
    throw new Error('Resolve validation errors before final import.');
  }

  const preview = batch.previewSnapshot || {};
  const tenantProfile = preview.tenantProfile;
  if (!tenantProfile?.name || !tenantProfile?.code || !tenantProfile?.email) {
    throw new Error('Tenant Profile is incomplete.');
  }

  const existingCompany = await Company.findOne({
    $or: [{ companyId: tenantProfile.code }, { email: tenantProfile.email }],
  })
    .select('_id')
    .lean();
  if (existingCompany) {
    throw new Error('A tenant with the same code or email already exists.');
  }

  const billingPlan = await getResolvedBillingPlan(tenantProfile.plan);

  const company = await Company.create({
    companyId: tenantProfile.code,
    name: tenantProfile.name,
    email: tenantProfile.email,
    country: tenantProfile.country || 'Nepal',
    timezone: tenantProfile.timezone || 'Asia/Kathmandu',
    website: tenantProfile.website || undefined,
    description: tenantProfile.description || '',
    settings: {
      currency: tenantProfile.currency || 'USD',
    },
    subscription: {
      plan:
        billingPlan.key === 'enterprise'
          ? 'enterprise'
          : billingPlan.key === 'growth'
            ? 'professional'
            : 'free',
      status: ['trial', 'active', 'past_due'].includes(tenantProfile.status)
        ? tenantProfile.status
        : 'trial',
    },
    limits: {
      maxUsers: Number(billingPlan.userLimit || 10),
      maxStudents: 1000,
      maxCounselors: Math.max(5, Math.min(Number(billingPlan.userLimit || 10), 25)),
    },
    metadata: {
      onboardingStatus: tenantProfile.onboardingStatus || 'in_progress',
      onboardingImportedAt: new Date(),
      onboardingImportBatchId: batch._id,
    },
  });

  await ensureCompanySaaSSetup(company._id);

  const branchRows = Array.isArray(preview.branches) ? preview.branches : [];
  const headOfficeRow = branchRows.find((branch) => branch.isHeadOffice) || branchRows[0] || null;

  const branchMap = new Map();
  const createdBranches = [];
  for (const branchRow of branchRows) {
    if (!branchRow.name || !branchRow.code) {
      continue;
    }
    const branch = await Branch.create({
      companyId: company._id,
      name: branchRow.name,
      code: branchRow.code,
      city: branchRow.city,
      state: branchRow.state,
      country: branchRow.country || company.country,
      email: branchRow.email,
      contactNumber: branchRow.contactNumber,
      location: [branchRow.city, branchRow.country || company.country].filter(Boolean).join(', '),
      visibility: branchRow.visibility === 'tenant' ? 'tenant' : 'branch',
      isHeadOffice: branchRow.code === headOfficeRow?.code,
      isActive: true,
    });
    branchMap.set(branchRow.code, branch);
    createdBranches.push(branch);
  }

  let headOfficeBranch = createdBranches.find((branch) => branch.isHeadOffice);
  if (!headOfficeBranch) {
    headOfficeBranch =
      (await Branch.findOne({ companyId: company._id, isHeadOffice: true })) ||
      createdBranches[0];
  }

  for (const roleRow of Array.isArray(preview.roles) ? preview.roles : []) {
    if (!roleRow.name || !roleRow.key) {
      continue;
    }
    await Role.findOneAndUpdate(
      { companyId: company._id, key: roleRow.key },
      {
        $set: {
          name: roleRow.name,
          description: roleRow.description,
          category: roleRow.category,
          permissions: roleRow.permissions,
          isActive: true,
        },
      },
      { upsert: true, new: true }
    );
  }

  const createdUsers = [];
  for (const userRow of Array.isArray(preview.users) ? preview.users : []) {
    if (!userRow.name || !userRow.email || !userRow.password) {
      continue;
    }

    const branch = branchMap.get(userRow.branchCode) || headOfficeBranch || null;
    const createdUser = new User({
      companyId: company._id,
      branchId: branch?._id || null,
      name: userRow.name,
      email: userRow.email,
      password: userRow.password,
      phone: userRow.phone || '',
      role: userRow.role,
      primaryRoleKey: userRow.role,
      isHeadOffice: userRow.role === 'head_office_admin',
      managerEnabled: ['head_office_admin', 'branch_manager'].includes(userRow.role),
      isActive: userRow.status !== 'inactive',
      invitedBy: actor._id,
    });
    await createdUser.save();
    createdUsers.push(createdUser);
  }

  const tenantAdmin =
    createdUsers.find((user) => user.role === 'head_office_admin') || createdUsers[0] || null;

  for (const partnerRow of Array.isArray(preview.partners) ? preview.partners : []) {
    if (!partnerRow.name) {
      continue;
    }
    await Partner.create({
      companyId: company._id,
      name: partnerRow.name,
      code: partnerRow.code || undefined,
      email: partnerRow.email,
      phone: partnerRow.phone,
      category: partnerRow.category,
      status: 'active',
    });
  }

  for (const agentRow of Array.isArray(preview.agents) ? preview.agents : []) {
    if (!agentRow.name) {
      continue;
    }
    await Agent.create({
      companyId: company._id,
      name: agentRow.name,
      email: agentRow.email,
      phone: agentRow.phone,
      branchId: branchMap.get(agentRow.branchCode)?._id || headOfficeBranch?._id || null,
      commissionRate: Number(agentRow.commissionRate || 0),
      isActive: true,
    });
  }

  for (const automationRow of Array.isArray(preview.automations) ? preview.automations : []) {
    if (
      !automationRow.name ||
      !automationRow.module ||
      !automationRow.triggerEvent ||
      !automationRow.actionType
    ) {
      continue;
    }
    await AutomationRule.create({
      companyId: company._id,
      branchId: null,
      name: automationRow.name,
      key: slugifyKey(automationRow.name),
      module: automationRow.module,
      triggerEvent: automationRow.triggerEvent,
      actions: [
        {
          type: automationRow.actionType,
          config: {},
        },
      ],
      createdBy: tenantAdmin?._id || actor._id,
      updatedBy: tenantAdmin?._id || actor._id,
      isActive: automationRow.isActive !== false,
    });
  }

  await BillingProfile.findOneAndUpdate(
    { companyId: company._id },
    {
      $set: {
        billingEmail: tenantProfile.email,
        currency: tenantProfile.currency || 'USD',
        billingCycle: 'monthly',
        status: 'active',
      },
    },
    { upsert: true, new: true }
  );

  const companyUpdate = {
    owner: tenantAdmin?._id || null,
    headOfficeBranchId: headOfficeBranch?._id || null,
  };

  if (tenantAdmin) {
    companyUpdate.adminContact = {
      name: tenantAdmin.name,
      email: tenantAdmin.email,
      phone: tenantAdmin.phone || '',
    };
  }

  await Company.findByIdAndUpdate(company._id, companyUpdate);

  batch.status = 'imported';
  batch.importedTenantId = company._id;
  batch.completionPercentage = 100;
  await batch.save();

  await AuditLog.logAction(
    {
      companyId: company._id,
      branchId: null,
      userId: actor._id,
      userName: actor.name,
      userEmail: actor.email,
      userRole: actor.role,
      action: 'tenant_onboarding_import_committed',
      actionType: 'super_admin',
      module: 'imports',
      resource: 'tenant',
      resourceId: company._id,
      targetId: company._id,
      resourceName: company.name,
      changes: {
        after: {
          batchId: batch._id,
          completionPercentage: 100,
        },
      },
      status: 'success',
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    },
    {
      bypassType: 'platform_to_tenant_provisioning',
      onboardingBatchId: batch._id,
    }
  );

  return {
    tenant: company,
    summary: {
      tenantId: company._id,
      branchCount: createdBranches.length,
      userCount: createdUsers.length,
    },
  };
};

const listOnboardingBatches = async (limit = 25) =>
  OnboardingBatch.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit || 25), 100))
    .populate('createdBy', 'name email')
    .populate('importedTenantId', 'name companyId')
    .lean();

module.exports = {
  SECTION_DEFINITIONS,
  createOnboardingBatchPreview,
  commitOnboardingBatch,
  generateTemplateBuffer,
  listOnboardingBatches,
};
