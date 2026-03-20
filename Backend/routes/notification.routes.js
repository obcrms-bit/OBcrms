const express = require('express');
const router = express.Router();
const controller = require('../controllers/notification.controller');
const {
  protect,
  requireFeature,
  requirePermission,
} = require('../middleware/AuthMiddleware');

router.use(protect);
router.use(requireFeature('notifications'));

router.get('/', requirePermission('notifications', 'view'), controller.getNotifications);
router.post('/:id/read', requirePermission('notifications', 'view'), controller.markNotificationRead);
router.post('/read-all', requirePermission('notifications', 'view'), controller.markAllNotificationsRead);

module.exports = router;
