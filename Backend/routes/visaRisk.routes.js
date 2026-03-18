const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/visaRisk.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', ctrl.getRiskAssessment);

module.exports = router;
