const express = require('express');
const router = express.Router();
const controller = require('../controllers/commission.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);
router.use(requireFeature('commissions'));

router.get('/', requirePermission('commissions', 'view'), controller.getCommissions);
router.post('/', requirePermission('commissions', 'create'), controller.createCommission);
router.patch('/:id/status', requirePermission('commissions', 'approve'), controller.updateCommissionStatus);

module.exports = router;
