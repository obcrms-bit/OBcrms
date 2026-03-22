const express = require('express');
const multer = require('multer');
const controller = require('../controllers/platformImport.controller');
const { protect } = require('../middleware/AuthMiddleware');
const { checkSuperAdmin } = require('../middleware/authorize');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.use(protect);
router.use(checkSuperAdmin);

router.get('/template', controller.downloadTemplate);
router.get('/logs', controller.listImports);
router.post('/preview', upload.single('file'), controller.previewImport);
router.post('/:batchId/commit', controller.commitImport);

module.exports = router;
