const VisaDocumentRequirement = require('../models/VisaDocumentRequirement');
const { sendSuccess, sendError } = require('../utils/responseHandler');

// GET /visa-applications/:id/checklist
exports.getChecklist = async (req, res) => {
  try {
    const checklist = await VisaDocumentRequirement.find({ application: req.params.id });
    return sendSuccess(res, 200, 'Checklist fetched', checklist);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch checklist', error.message);
  }
};

// POST /visa-applications/:id/checklist/item
exports.addChecklistItem = async (req, res) => {
  try {
    const item = await VisaDocumentRequirement.create({ ...req.body, application: req.params.id });
    return sendSuccess(res, 201, 'Checklist item added', item);
  } catch (error) {
    return sendError(res, 400, 'Failed to add checklist item', error.message);
  }
};

// PUT /visa-applications/:id/checklist/item/:itemId
exports.updateChecklistItem = async (req, res) => {
  try {
    const item = await VisaDocumentRequirement.findByIdAndUpdate(req.params.itemId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return sendError(res, 404, 'Checklist item not found');
    return sendSuccess(res, 200, 'Checklist item updated', item);
  } catch (error) {
    return sendError(res, 400, 'Failed to update checklist item', error.message);
  }
};

// POST /visa-applications/:id/checklist/verify/:itemId
exports.verifyChecklistItem = async (req, res) => {
  try {
    const item = await VisaDocumentRequirement.findById(req.params.itemId);
    if (!item) return sendError(res, 404, 'Checklist item not found');
    item.verified = true;
    item.rejected = false;
    await item.save();
    return sendSuccess(res, 200, 'Checklist item verified', item);
  } catch (error) {
    return sendError(res, 400, 'Failed to verify checklist item', error.message);
  }
};

// POST /visa-applications/:id/checklist/reject/:itemId
exports.rejectChecklistItem = async (req, res) => {
  try {
    const item = await VisaDocumentRequirement.findById(req.params.itemId);
    if (!item) return sendError(res, 404, 'Checklist item not found');
    item.verified = false;
    item.rejected = true;
    await item.save();
    return sendSuccess(res, 200, 'Checklist item rejected', item);
  } catch (error) {
    return sendError(res, 400, 'Failed to reject checklist item', error.message);
  }
};
