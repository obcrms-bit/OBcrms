const express = require('express');
const chatController = require('../controllers/chat.controller');
const { protect } = require('../middleware/AuthMiddleware');

const router = express.Router();

router.use(protect);

router.get('/users', chatController.getUsers);
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getMessages);
router.get('/search', chatController.search);

router.post(
  '/conversations',
  chatController.chatWriteLimiter,
  chatController.createOrFindConversation
);
router.post('/messages', chatController.chatWriteLimiter, chatController.sendMessage);
router.post('/conversations/:conversationId/seen', chatController.markSeen);
router.post('/conversations/:conversationId/delivered', chatController.markDelivered);

module.exports = router;
