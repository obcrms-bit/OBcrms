const { sendSuccess, sendError } = require('../utils/responseHandler');
const {
  commitOnboardingBatch,
  createOnboardingBatchPreview,
  generateTemplateBuffer,
  listOnboardingBatches,
} = require('../services/platformOnboardingImport.service');

exports.downloadTemplate = async (req, res) => {
  try {
    const buffer = generateTemplateBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="tenant-onboarding-template.xlsx"'
    );
    return res.send(buffer);
  } catch (error) {
    return sendError(res, 500, 'Failed to generate import template', error.message);
  }
};

exports.previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Please upload a csv or xlsx file.');
    }

    const preview = await createOnboardingBatchPreview({
      file: req.file,
      actorUserId: req.user._id,
    });

    return sendSuccess(res, 200, 'Onboarding import preview generated successfully', preview);
  } catch (error) {
    return sendError(res, 400, 'Failed to preview onboarding import', error.message);
  }
};

exports.commitImport = async (req, res) => {
  try {
    const result = await commitOnboardingBatch({
      batchId: req.params.batchId,
      actor: req.user,
      requestContext: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      },
    });

    return sendSuccess(res, 201, 'Onboarding import committed successfully', result);
  } catch (error) {
    return sendError(res, 400, 'Failed to commit onboarding import', error.message);
  }
};

exports.listImports = async (req, res) => {
  try {
    const batches = await listOnboardingBatches(req.query.limit);
    return sendSuccess(res, 200, 'Onboarding import batches fetched successfully', {
      batches,
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch onboarding imports', error.message);
  }
};
