const User = require('../models/User');
const { normalizeRoleKey } = require('../constants/rbac');
const { normalizeCountry } = require('./countryWorkflow.service');

const AUTO_ASSIGNABLE_ROLE_KEYS = new Set([
  'follow_up_team',
  'branch_manager',
  'head_office_admin',
  'application_officer',
]);

const LEGACY_ROLE_KEYS = new Set([
  'counselor',
  'manager',
  'admin',
  'super_admin',
  'follow_up_team',
  'branch_manager',
  'head_office_admin',
]);

const normalizeCountryList = (countries = []) =>
  Array.from(
    new Set(
      (Array.isArray(countries) ? countries : [countries])
        .map(normalizeCountry)
        .filter(Boolean)
    )
  );

const isAssignableCounsellor = (user) =>
  AUTO_ASSIGNABLE_ROLE_KEYS.has(normalizeRoleKey(user?.primaryRoleKey || user?.role)) ||
  LEGACY_ROLE_KEYS.has(String(user?.role || '').toLowerCase());

const calculateMatchScore = (user, preferredCountries, branchId) => {
  if (!isAssignableCounsellor(user)) {
    return -1;
  }

  const userCountries = normalizeCountryList(user?.countries || []);
  const matchedCountries = preferredCountries.filter((country) => userCountries.includes(country));
  let score = matchedCountries.length * 100;

  if (branchId && String(user?.branchId || '') === String(branchId)) {
    score += 30;
  }

  if (user?.isHeadOffice) {
    score += 10;
  }

  return score;
};

const findBestCounsellorMatch = async ({ companyId, branchId, preferredCountries = [] }) => {
  const normalizedCountries = normalizeCountryList(preferredCountries);
  if (!companyId || !normalizedCountries.length) {
    return null;
  }

  const counsellors = await User.find({
    companyId,
    isActive: true,
    $or: [
      { primaryRoleKey: { $in: Array.from(AUTO_ASSIGNABLE_ROLE_KEYS) } },
      { role: { $in: Array.from(LEGACY_ROLE_KEYS) } },
    ],
  })
    .select('name email role primaryRoleKey branchId countries isHeadOffice')
    .lean();

  const ranked = counsellors
    .map((user) => {
      const matchedCountries = normalizedCountries.filter((country) =>
        normalizeCountryList(user.countries || []).includes(country)
      );

      return {
        user,
        matchedCountries,
        score: calculateMatchScore(user, normalizedCountries, branchId),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      return String(left.user?.name || '').localeCompare(String(right.user?.name || ''));
    });

  if (!ranked.length) {
    return null;
  }

  return {
    counsellor: ranked[0].user,
    matchedCountries: ranked[0].matchedCountries,
  };
};

module.exports = {
  AUTO_ASSIGNABLE_ROLE_KEYS,
  findBestCounsellorMatch,
  isAssignableCounsellor,
  normalizeCountryList,
};
