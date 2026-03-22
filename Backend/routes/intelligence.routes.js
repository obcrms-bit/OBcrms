const express = require('express');
const multer = require('multer');
const controller = require('../controllers/intelligence.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.INTELLIGENCE_MAX_UPLOAD_MB || 12) * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls', '.ods', '.json', '.pdf'];
    const lowerName = String(file.originalname || '').toLowerCase();
    const isAllowed = allowedExtensions.some((extension) => lowerName.endsWith(extension));
    if (!isAllowed) {
      callback(new Error('Unsupported file type. Allowed: csv, xlsx, ods, json, pdf.'));
      return;
    }
    callback(null, true);
  },
});

router.get('/share/:token', controller.getSharedReport);

router.use(protect);
router.use(requireFeature('reports'));

router.get('/overview', requirePermission('reports', 'view'), controller.getOverview);
router.get('/datasets', requirePermission('reports', 'view'), controller.listDatasets);
router.post(
  '/datasets/upload',
  requirePermission('reports', 'view'),
  requirePermission('documents', 'upload'),
  upload.single('file'),
  controller.uploadDataset
);
router.get('/datasets/:id', requirePermission('reports', 'view'), controller.getDatasetById);
router.post('/datasets/:id/reanalyze', requirePermission('reports', 'view'), controller.reanalyzeDataset);
router.post('/datasets/:id/report', requirePermission('reports', 'export'), controller.createDatasetReport);
router.get('/reports', requirePermission('reports', 'view'), controller.listReports);
router.get('/reports/:id', requirePermission('reports', 'view'), controller.getReportById);
router.post('/reports/:id/share', requirePermission('reports', 'export'), controller.shareReport);
router.get('/reports/:id/pdf', requirePermission('reports', 'export'), controller.downloadReportPdf);

module.exports = router;
