const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visaRule.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', ctrl.getVisaRules);
router.get('/country/:countryCode', ctrl.getVisaRulesByCountry);
router.get('/:id', ctrl.getVisaRuleById);
router.post('/', ctrl.createVisaRule);
router.put('/:id', ctrl.updateVisaRule);
router.delete('/:id', ctrl.deleteVisaRule);

module.exports = router;
