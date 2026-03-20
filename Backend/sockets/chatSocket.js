const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const chatService = require('../services/ChatService');
const { toConversationSummary } = require('../utils/chat');
const { buildOriginList, isOriginAllowed } = require('../utils/origins');

const JWT_SECRET = process.env.JWT_SECRET;
const allowedOrigins = buildOriginList();

let ioInstance = null;
const activeSocketsByUser = new Map();

const getUserRoom = (userId) => `user:${userId}`;
const getCompanyRoom = (companyId) => `company:${companyId}`;
const getConversationRoom = (conversationId) => `conversation:${conversationId}`;

const getIO = () => ioInstance;

const isUserOnline = (userId) => (activeSocketsByUser.get(String(userId)) || new Set()).size > 0;

const emitConversationUpdated = (conversation, participantIds) => {
  if (!ioInstance || !conversation) {
    return;
  }

  participantIds.forEach((participantId) => {
    ioInstance.to(getUserRoom(participantId)).emit('conversation-updated', {
      conversation: toConversationSummary(conversation, participantId),
    });
  });
};

const emitMessageCreated = (payload) => {
  if (!ioInstance) {
    return;
  }

  payload.participantIds.forEach((participantId) => {
    ioInstance.to(getUserRoom(participantId)).emit('receive-message', {
      message: payload.message,
      conversationId: payload.message.conversationId,
    });
  });
};

const emitMessageDelivered = (payload) => {
  if (!ioInstance || !payload?.messageIds?.length) {
    return;
  }

  payload.participantIds.forEach((participantId) => {
    ioInstance.to(getUserRoom(participantId)).emit('message-delivered', payload);
  });
};

const emitMessagesSeen = (payload) => {
  if (!ioInstance || !payload?.messageIds?.length) {
    return;
  }

  payload.participantIds.forEach((participantId) => {
    ioInstance.to(getUserRoom(participantId)).emit('message-seen', {
      conversationId: String(payload.conversation._id),
      messageIds: payload.messageIds,
      seenAt: payload.seenAt,
      seenBy: payload.seenBy,
    });
  });
};

const markPresence = async (userId, isOnline) => {
  await User.findByIdAndUpdate(userId, {
    isOnline,
    ...(isOnline ? {} : { lastSeen: new Date() }),
  });
};

const authenticateSocket = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select(
      'name email role avatar companyId isOnline lastSeen isActive'
    );

    if (!user || !user.isActive || String(user.companyId) !== String(decoded.companyId)) {
      return next(new Error('Unauthorized socket connection'));
    }

    socket.data.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      companyId: String(user.companyId),
    };

    return next();
  } catch (error) {
    return next(new Error('Socket authentication failed'));
  }
};

const initSocket = (httpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin, allowedOrigins) || process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }

        return callback(new Error(`Socket CORS: Origin ${origin} not allowed`), false);
      },
      credentials: true,
    },
  });

  ioInstance.use(authenticateSocket);

  ioInstance.on('connection', async (socket) => {
    const user = socket.data.user;
    const userId = String(user.id);
    const companyRoom = getCompanyRoom(user.companyId);
    const userRoom = getUserRoom(userId);

    socket.join(userRoom);
    socket.join(companyRoom);

    const existingSockets = activeSocketsByUser.get(userId) || new Set();
    existingSockets.add(socket.id);
    activeSocketsByUser.set(userId, existingSockets);

    if (existingSockets.size === 1) {
      await markPresence(userId, true);
      ioInstance.to(companyRoom).emit('user-online', {
        userId,
      });
    }

    socket.on('join-chat', async ({ conversationId }, callback = () => {}) => {
      try {
        const conversation = await chatService.getConversationOrThrow({
          conversationId,
          companyId: user.companyId,
          userId,
        });

        socket.join(getConversationRoom(conversationId));
        const deliveredPayload = await chatService.markConversationDelivered({
          companyId: user.companyId,
          currentUserId: userId,
          conversationId,
        });

        if (deliveredPayload?.messageIds?.length) {
          emitMessageDelivered(deliveredPayload);
        }

        callback({
          ok: true,
          conversation: toConversationSummary(conversation, userId),
        });
      } catch (error) {
        callback({
          ok: false,
          message: error.message,
        });
      }
    });

    socket.on('leave-chat', ({ conversationId }) => {
      socket.leave(getConversationRoom(conversationId));
    });

    socket.on('typing', async ({ conversationId }) => {
      try {
        await chatService.getConversationOrThrow({
          conversationId,
          companyId: user.companyId,
          userId,
        });

        socket.to(getConversationRoom(conversationId)).emit('typing', {
          conversationId,
          user: {
            id: userId,
            name: user.name,
          },
        });
      } catch (error) {
        socket.emit('chat-error', { message: error.message });
      }
    });

    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(getConversationRoom(conversationId)).emit('stop-typing', {
        conversationId,
        userId,
      });
    });

    socket.on('send-message', async (payload, callback = () => {}) => {
      try {
        const messagePayload = await chatService.sendMessage({
          companyId: user.companyId,
          senderId: userId,
          conversationId: payload.conversationId,
          participantId: payload.participantId,
          text: payload.text,
          messageType: payload.messageType,
          attachment: payload.attachment,
          resolveDeliveredAt: (receiverId) => (isUserOnline(receiverId) ? new Date() : null),
        });

        emitMessageCreated(messagePayload);
        emitConversationUpdated(messagePayload.conversation, messagePayload.participantIds);

        callback({
          ok: true,
          message: messagePayload.message,
        });
      } catch (error) {
        callback({
          ok: false,
          message: error.message,
        });
      }
    });

    socket.on('mark-seen', async ({ conversationId }, callback = () => {}) => {
      try {
        const seenPayload = await chatService.markConversationSeen({
          companyId: user.companyId,
          currentUserId: userId,
          conversationId,
          viewer: {
            _id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isOnline: true,
          },
        });

        if (seenPayload.messageIds.length) {
          emitMessagesSeen(seenPayload);
        }
        emitConversationUpdated(seenPayload.conversation, seenPayload.participantIds);

        callback({
          ok: true,
          messageIds: seenPayload.messageIds,
          seenAt: seenPayload.seenAt,
        });
      } catch (error) {
        callback({
          ok: false,
          message: error.message,
        });
      }
    });

    socket.on('disconnect', async () => {
      const sockets = activeSocketsByUser.get(userId);
      if (!sockets) {
        return;
      }

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        activeSocketsByUser.delete(userId);
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });
        ioInstance.to(companyRoom).emit('user-offline', {
          userId,
          lastSeen: lastSeen.toISOString(),
        });
      } else {
        activeSocketsByUser.set(userId, sockets);
      }
    });
  });

  return ioInstance;
};

module.exports = {
  emitConversationUpdated,
  emitMessageCreated,
  emitMessageDelivered,
  emitMessagesSeen,
  getCompanyRoom,
  getConversationRoom,
  getIO,
  getUserRoom,
  initSocket,
  isUserOnline,
};
