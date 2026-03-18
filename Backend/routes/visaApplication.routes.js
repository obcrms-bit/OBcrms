const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visaApplication.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.get('/', ctrl.getVisaApplications);
router.get('/:id', ctrl.getVisaApplicationById);
router.post('/', ctrl.createVisaApplication);
router.put('/:id', ctrl.updateVisaApplication);
router.delete('/:id', ctrl.deleteVisaApplication);

module.exports = router;
