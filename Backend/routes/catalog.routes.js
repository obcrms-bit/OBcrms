const express = require('express');
const router = express.Router();
const controller = require('../controllers/catalog.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/universities', requirePermission('universities', 'view'), controller.getUniversities);
router.post('/universities', requirePermission('universities', 'create'), controller.createUniversity);
router.put('/universities/:id', requirePermission('universities', 'edit'), controller.updateUniversity);

router.get('/courses', requirePermission('courses', 'view'), controller.getCourses);
router.post('/courses', requirePermission('courses', 'create'), controller.createCourse);
router.put('/courses/:id', requirePermission('courses', 'edit'), controller.updateCourse);

router.post(
  '/imports/preview',
  requireFeature('bulkImports'),
  requirePermission('imports', 'preview'),
  controller.previewBulkImport
);
router.post(
  '/imports/execute',
  requireFeature('bulkImports'),
  requirePermission('imports', 'execute'),
  controller.executeBulkImport
);
router.get(
  '/imports/logs',
  requireFeature('bulkImports'),
  requirePermission('imports', 'view'),
  controller.getImportLogs
);

module.exports = router;
