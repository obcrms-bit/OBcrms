const Company = require('../models/Company');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * Get company profile/settings for the current tenant
 * Route: GET /api/company/profile
 */
exports.getCompanyProfile = async (req, res) => {
  try {
    const company = await Company.findById(req.companyId);
    if (!company) {
      return sendError(res, 404, 'Company not found');
    }

    return sendSuccess(res, 200, 'Company profile retrieved', {
      id: company._id,
      name: company.name,
      email: company.email,
      country: company.country,
      industry: company.industry,
      website: company.website,
      logo: company.settings?.logo,
      primaryColor: company.settings?.primaryColor || '#667eea',
      theme: company.settings?.theme || 'light',
      subscription: {
        plan: company.subscription?.plan,
        status: company.subscription?.status,
        features: company.subscription?.features,
      },
      limits: company.limits,
    });
  } catch (error) {
    return sendError(res, 500, 'Error fetching company profile', error.message);
  }
};

/**
 * Update company profile/settings (Admin only)
 * Route: PATCH /api/company/profile
 */
exports.updateCompanyProfile = async (req, res) => {
  try {
    const { name, logo, primaryColor, theme, website, industry } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (website !== undefined) updateData.website = website;
    if (industry) updateData.industry = industry;
    if (logo !== undefined) updateData['settings.logo'] = logo;
    if (primaryColor) updateData['settings.primaryColor'] = primaryColor;
    if (theme) updateData['settings.theme'] = theme;

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!company) {
      return sendError(res, 404, 'Company not found');
    }

    return sendSuccess(res, 200, 'Company profile updated', {
      id: company._id,
      name: company.name,
      logo: company.settings?.logo,
      primaryColor: company.settings?.primaryColor,
      theme: company.settings?.theme,
    });
  } catch (error) {
    return sendError(res, 500, 'Error updating company profile', error.message);
  }
};
