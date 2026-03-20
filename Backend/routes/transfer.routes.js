const express = require('express');
const router = express.Router();
const controller = require('../controllers/transfer.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);
router.use(requireFeature('transfers'));

router.get('/', requirePermission('transfers', 'view'), controller.getTransferRequests);
router.post('/', requirePermission('transfers', 'create'), controller.createTransferRequest);
router.post('/:id/approve', requirePermission('transfers', 'approve'), controller.approveTransferRequest);
router.post('/:id/reject', requirePermission('transfers', 'reject'), controller.rejectTransferRequest);
router.post('/:id/cancel', requirePermission('transfers', 'create'), controller.cancelTransferRequest);

module.exports = router;
