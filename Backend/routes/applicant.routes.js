const express = require('express');
const router = express.Router();
const applicantController = require('../controllers/applicant.controller');
const { protect, requirePermission } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', requirePermission('applications', 'view'), applicantController.getApplications);
router.post('/', requirePermission('applications', 'create'), applicantController.createApplication);
router.patch(
  '/:id/status',
  requirePermission('applications', 'edit'),
  applicantController.updateApplicationStatus
);

module.exports = router;
