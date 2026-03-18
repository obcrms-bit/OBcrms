const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visaWorkflow.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

router.post('/:id/generate-workflow', ctrl.generateWorkflow);
router.post('/:id/update-stage', ctrl.updateStage);
router.post('/:id/submit', ctrl.submitApplication);
router.post('/:id/approve', ctrl.approveApplication);
router.post('/:id/reject', ctrl.rejectApplication);
router.post('/:id/appeal', ctrl.appealApplication);
router.post('/:id/predeparture-complete', ctrl.predepartureComplete);

module.exports = router;
