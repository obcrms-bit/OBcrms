const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/visaExport.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/pdf', ctrl.exportPDF);
router.get('/excel', ctrl.exportExcel);

module.exports = router;
