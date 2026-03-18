const express = require('express');
const router = express.Router({ mergeParams: true });
const ctrl = require('../controllers/visaFinancial.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', ctrl.getFinancial);
router.post('/', ctrl.createFinancial);
router.put('/', ctrl.updateFinancial);
router.post('/recalculate', ctrl.recalculateFinancial);

module.exports = router;
