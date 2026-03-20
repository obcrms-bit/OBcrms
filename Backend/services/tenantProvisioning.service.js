const Branch = require('../models/Branch');
const Role = require('../models/Role');
const SLAConfig = require('../models/SLAConfig');
const { DEFAULT_ROLE_TEMPLATES, normalizeRoleKey } = require('../constants/rbac');
const { ensureDefaultCountryWorkflows } = require('./countryWorkflow.service');
const { ensureTenantSubscription } = require('./subscription.service');

const initializedTenants = new Set();

const ensureHeadOfficeBranch = async (companyId) => {
  let headOffice = await Branch.findOne({ companyId, isHeadOffice: true });
  if (!headOffice) {
    headOffice = await Branch.create({
      companyId,
      name: 'Head Office',
      code: 'HO',
      location: 'Head Office',
      isHeadOffice: true,
      visibility: 'tenant',
      isActive: true,
    });
  }
  return headOffice;
};

const ensureRoles = async (companyId) => {
  await Promise.all(
    DEFAULT_ROLE_TEMPLATES.map((template) =>
      Role.findOneAndUpdate(
        { companyId, key: template.key },
        {
          $setOnInsert: {
            companyId,
            key: template.key,
            name: template.name,
            description: template.description,
            category: template.category,
            isSystem: true,
            isHeadOffice: template.isHeadOffice || false,
            managerEnabled: template.managerEnabled || false,
            permissions: template.permissions || [],
            fieldAccess: template.fieldAccess || {},
            isActive: true,
          },
        },
        { upsert: true, new: true }
      )
    )
  );
};

const ensureSlaConfig = async (companyId) => {
  await SLAConfig.findOneAndUpdate(
    { companyId },
    {
      $setOnInsert: {
        companyId,
        firstResponseHours: 4,
        firstFollowUpHours: 8,
        maxHoursBetweenFollowUps: 48,
        overdueReminderHours: 24,
        transferApprovalHours: 24,
        transferApprovalRequired: false,
        isActive: true,
      },
    },
    { upsert: true, new: true }
  );
};

const ensureCompanySaaSSetup = async (companyId) => {
  const key = String(companyId);
  if (initializedTenants.has(key)) {
    return;
  }

  await Promise.all([ensureRoles(companyId), ensureHeadOfficeBranch(companyId), ensureSlaConfig(companyId)]);
  await Promise.all([ensureDefaultCountryWorkflows(companyId), ensureTenantSubscription(companyId)]);
  initializedTenants.add(key);
};

const getDefaultRoleKey = (role) => normalizeRoleKey(role || 'frontdesk') || 'frontdesk';

module.exports = {
  ensureCompanySaaSSetup,
  getDefaultRoleKey,
};
