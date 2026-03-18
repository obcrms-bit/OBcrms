const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/visa.controller');
const { protect } = require('../middleware/AuthMiddleware');

router.use(protect);

// ─── Visa Rules ───────────────────────────────────────────────────────────────
router.get('/rules', ctrl.getVisaRules);
router.post('/rules', ctrl.createVisaRule);
router.get('/rules/country/:countryCode', ctrl.getVisaRuleByCountry);
router.get('/rules/:id', ctrl.getVisaRuleById);
router.put('/rules/:id', ctrl.updateVisaRule);
router.delete('/rules/:id', ctrl.deleteVisaRule);

// ─── Dashboard ────────────────────────────────────────────────────────────────
router.get('/dashboard', ctrl.getVisaDashboard);

// ─── Visa Applications (CRUD) ─────────────────────────────────────────────────
router.get('/', ctrl.getVisaApplications);
router.post('/', ctrl.createVisaApplication);
router.get('/:id', ctrl.getVisaApplicationById);
router.put('/:id', ctrl.updateVisaApplication);
router.delete('/:id', ctrl.deleteVisaApplication);

// ─── Workflow Actions ─────────────────────────────────────────────────────────
router.post('/:id/generate-workflow', ctrl.generateWorkflow);
router.post('/:id/update-stage', ctrl.updateStage);
router.post('/:id/submit', ctrl.submitApplication);
router.post('/:id/request-additional-docs', ctrl.requestAdditionalDocs);
router.post('/:id/approve', ctrl.approveVisa);
router.post('/:id/reject', ctrl.rejectVisa);
router.post('/:id/appeal', ctrl.appealVisa);
router.post('/:id/predeparture-complete', ctrl.completePredeparture);

// ─── Checklist ────────────────────────────────────────────────────────────────
router.get('/:id/checklist', ctrl.getChecklist);
router.post('/:id/checklist/item', ctrl.addChecklistItem);
router.put('/:id/checklist/item/:itemId', ctrl.updateChecklistItem);
router.post('/:id/checklist/verify/:itemId', ctrl.verifyChecklistItem);
router.post('/:id/checklist/reject/:itemId', ctrl.rejectChecklistItem);

// ─── Financial Assessment ─────────────────────────────────────────────────────
router.get('/:id/financial-assessment', ctrl.getFinancialAssessment);
router.post('/:id/financial-assessment', ctrl.saveFinancialAssessment);
router.post('/:id/financial-assessment/recalculate', ctrl.recalculateFinancial);

// ─── Interview / Biometrics ───────────────────────────────────────────────────
router.post('/:id/interview/schedule', ctrl.scheduleInterview);
router.post('/:id/interview/complete', ctrl.completeInterview);
router.post('/:id/biometrics/schedule', ctrl.scheduleBiometrics);
router.post('/:id/biometrics/complete', ctrl.completeBiometrics);

// ─── Risk Assessment ──────────────────────────────────────────────────────────
router.post('/:id/risk-assessment', ctrl.runRiskAssessment);

module.exports = router;
