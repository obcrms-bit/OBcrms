const rateLimit = require('express-rate-limit');
const chatService = require('../services/ChatService');
const { toConversationSummary } = require('../utils/chat');
const { sendError, sendSuccess } = require('../utils/responseHandler');
const {
  emitConversationUpdated,
  emitMessageCreated,
  emitMessageDelivered,
  emitMessagesSeen,
  isUserOnline,
} = require('../sockets/chatSocket');

const chatWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many chat actions. Please slow down for a minute.',
  },
});

const handleChatError = (res, error, fallbackMessage) =>
  sendError(res, error.statusCode || 500, fallbackMessage, error.message);

const getUsers = async (req, res) => {
  try {
    const users = await chatService.listChatUsers({
      companyId: req.companyId,
      currentUserId: req.user._id,
      search: req.query.search || '',
      limit: req.query.limit,
    });

    sendSuccess(res, 200, 'Chat users retrieved', { users });
  } catch (error) {
    handleChatError(res, error, 'Failed to retrieve chat users');
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await chatService.listConversations({
      companyId: req.companyId,
      currentUserId: req.user._id,
      search: req.query.search || '',
    });

    sendSuccess(res, 200, 'Conversations retrieved', { conversations });
  } catch (error) {
    handleChatError(res, error, 'Failed to retrieve conversations');
  }
};

const createOrFindConversation = async (req, res) => {
  try {
    const result = await chatService.createOrFindDirectConversation({
      companyId: req.companyId,
      currentUserId: req.user._id,
      participantId: req.body.participantId,
    });

    sendSuccess(res, 200, 'Conversation ready', {
      conversation: toConversationSummary(result.conversation, req.user._id),
    });
  } catch (error) {
    handleChatError(res, error, 'Failed to create conversation');
  }
};

const getMessages = async (req, res) => {
  try {
    const payload = await chatService.getConversationMessages({
      companyId: req.companyId,
      currentUserId: req.user._id,
      conversationId: req.params.conversationId,
      before: req.query.before,
      limit: req.query.limit,
    });

    sendSuccess(res, 200, 'Conversation messages retrieved', payload);
  } catch (error) {
    handleChatError(res, error, 'Failed to retrieve conversation messages');
  }
};

const sendMessage = async (req, res) => {
  try {
    const payload = await chatService.sendMessage({
      companyId: req.companyId,
      senderId: req.user._id,
      conversationId: req.body.conversationId,
      participantId: req.body.participantId,
      text: req.body.text,
      messageType: req.body.messageType,
      attachment: req.body.attachment,
      resolveDeliveredAt: (receiverId) => (isUserOnline(receiverId) ? new Date() : null),
    });

    emitMessageCreated(payload);
    emitConversationUpdated(payload.conversation, payload.participantIds);

    sendSuccess(res, 201, 'Message sent', {
      message: payload.message,
    });
  } catch (error) {
    handleChatError(res, error, 'Failed to send message');
  }
};

const markSeen = async (req, res) => {
  try {
    const payload = await chatService.markConversationSeen({
      companyId: req.companyId,
      currentUserId: req.user._id,
      conversationId: req.params.conversationId,
      viewer: req.user,
    });

    if (payload.messageIds.length > 0) {
      emitMessagesSeen(payload);
    }
    emitConversationUpdated(payload.conversation, payload.participantIds);

    sendSuccess(res, 200, 'Conversation marked as seen', {
      conversationId: req.params.conversationId,
      messageIds: payload.messageIds,
      seenAt: payload.seenAt,
    });
  } catch (error) {
    handleChatError(res, error, 'Failed to mark messages as seen');
  }
};

const search = async (req, res) => {
  try {
    const result = await chatService.searchChat({
      companyId: req.companyId,
      currentUserId: req.user._id,
      query: req.query.q || '',
    });

    sendSuccess(res, 200, 'Chat search results retrieved', result);
  } catch (error) {
    handleChatError(res, error, 'Failed to search chat');
  }
};

const markDelivered = async (req, res) => {
  try {
    const payload = await chatService.markConversationDelivered({
      companyId: req.companyId,
      currentUserId: req.user._id,
      conversationId: req.params.conversationId,
    });

    if (payload?.messageIds?.length) {
      emitMessageDelivered(payload);
    }

    sendSuccess(res, 200, 'Conversation delivery status updated', payload || {});
  } catch (error) {
    handleChatError(res, error, 'Failed to update delivery status');
  }
};

module.exports = {
  chatWriteLimiter,
  createOrFindConversation,
  getConversations,
  getMessages,
  getUsers,
  markDelivered,
  markSeen,
  search,
  sendMessage,
};
