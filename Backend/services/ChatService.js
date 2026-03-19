const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models\Message');
const User = require('../models/User');
const {
  escapeRegex,
  getConversationKey,
  sanitizeAttachment,
  sanitizeChatText,
  toChatUser,
  toConversationSummary,
  toMessageDTO,
} = require('../utils/chat');

const CHAT_USER_SELECT = 'name email role avatar isOnline lastSeen jobTitle department';

const buildError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const populateConversation = (query) =>
  query
    .populate('participants', CHAT_USER_SELECT)
    .populate('lastMessageSender', CHAT_USER_SELECT);

const hydrateConversation = async (conversationId) =>
  populateConversation(Conversation.findById(conversationId));

const validateObjectId = (value, fieldName) => {
  if (!mongoose.isValidObjectId(value)) {
    throw buildError(400, `Invalid ${fieldName}`);
  }
};

const getConversationOrThrow = async ({ conversationId, companyId, userId }) => {
  validateObjectId(conversationId, 'conversation id');

  const conversation = await hydrateConversation(conversationId);
  if (!conversation || String(conversation.companyId) !== String(companyId)) {
    throw buildError(404, 'Conversation not found');
  }

  const isParticipant = conversation.participants.some(
    (participant) => String(participant._id) === String(userId)
  );

  if (!isParticipant) {
    throw buildError(403, 'You do not have access to this conversation');
  }

  return conversation;
};

const getParticipantIds = (conversation) =>
  conversation.participants.map((participant) => String(participant._id));

const listChatUsers = async ({ companyId, currentUserId, search = '', limit = 20 }) => {
  const query = {
    companyId,
    isActive: true,
    _id: { $ne: currentUserId },
  };

  const trimmedSearch = search.trim();
  if (trimmedSearch) {
    const regex = new RegExp(escapeRegex(trimmedSearch), 'i');
    query.$or = [{ name: regex }, { email: regex }, { role: regex }, { department: regex }];
  }

  const users = await User.find(query)
    .select(CHAT_USER_SELECT)
    .sort({ isOnline: -1, name: 1 })
    .limit(Math.min(Number(limit) || 20, 50));

  return users.map(toChatUser);
};

const createOrFindDirectConversation = async ({ companyId, currentUserId, participantId }) => {
  validateObjectId(participantId, 'participant id');

  if (String(currentUserId) === String(participantId)) {
    throw buildError(400, 'You cannot start a conversation with yourself');
  }

  const participant = await User.findOne({
    _id: participantId,
    companyId,
    isActive: true,
  }).select(CHAT_USER_SELECT);

  if (!participant) {
    throw buildError(404, 'Chat participant not found');
  }

  const participantKey = getConversationKey([currentUserId, participantId]);

  let conversation = await populateConversation(
    Conversation.findOne({
      companyId,
      participantKey,
      isGroup: false,
    })
  );

  if (!conversation) {
    conversation = await Conversation.create({
      companyId,
      participants: [currentUserId, participantId],
      participantKey,
      createdBy: currentUserId,
      unreadCounts: {
        [String(currentUserId)]: 0,
        [String(participantId)]: 0,
      },
      lastMessageAt: new Date(),
    });

    conversation = await hydrateConversation(conversation._id);
  }

  return {
    conversation,
    participantIds: getParticipantIds(conversation),
  };
};

const listConversations = async ({ companyId, currentUserId, search = '' }) => {
  const conversations = await populateConversation(
    Conversation.find({
      companyId,
      participants: currentUserId,
    }).sort({ lastMessageAt: -1, updatedAt: -1 })
  );

  const trimmedSearch = search.trim().toLowerCase();
  const filteredConversations = trimmedSearch
    ? conversations.filter((conversation) => {
        const summary = toConversationSummary(conversation, currentUserId);
        const searchableParts = [
          summary.title,
          summary.lastMessageText,
          ...(summary.participants || []).flatMap((participant) => [
            participant.name,
            participant.email,
            participant.role,
          ]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableParts.includes(trimmedSearch);
      })
    : conversations;

  return filteredConversations.map((conversation) =>
    toConversationSummary(conversation, currentUserId)
  );
};

const getConversationMessages = async ({
  companyId,
  currentUserId,
  conversationId,
  limit = 50,
  before,
}) => {
  const conversation = await getConversationOrThrow({
    conversationId,
    companyId,
    userId: currentUserId,
  });

  const query = {
    companyId,
    conversation: conversation._id,
  };

  if (before) {
    const beforeDate = new Date(before);
    if (!Number.isNaN(beforeDate.getTime())) {
      query.createdAt = { $lt: beforeDate };
    }
  }

  const messages = await Message.find(query)
    .populate('sender receiver', CHAT_USER_SELECT)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100));

  return {
    conversation: toConversationSummary(conversation, currentUserId),
    messages: messages.reverse().map(toMessageDTO),
  };
};

const sendMessage = async ({
  companyId,
  senderId,
  conversationId,
  participantId,
  text,
  messageType = 'text',
  attachment,
  resolveDeliveredAt,
}) => {
  let conversation;

  if (conversationId) {
    conversation = await getConversationOrThrow({
      conversationId,
      companyId,
      userId: senderId,
    });
  } else {
    const directConversation = await createOrFindDirectConversation({
      companyId,
      currentUserId: senderId,
      participantId,
    });
    conversation = directConversation.conversation;
  }

  const recipient = conversation.participants.find(
    (participant) => String(participant._id) !== String(senderId)
  );

  if (!recipient) {
    throw buildError(400, 'A recipient is required for direct chat');
  }

  const sanitizedText = sanitizeChatText(text);
  const sanitizedAttachment = sanitizeAttachment(attachment);

  if (!sanitizedText && !sanitizedAttachment) {
    throw buildError(400, 'A message must include text or an attachment');
  }

  const normalizedType = sanitizedAttachment
    ? messageType === 'image'
      ? 'image'
      : 'file'
    : messageType === 'emoji'
      ? 'emoji'
      : 'text';

  const deliveredAt =
    typeof resolveDeliveredAt === 'function' ? resolveDeliveredAt(String(recipient._id)) : null;

  const message = await Message.create({
    companyId,
    conversation: conversation._id,
    sender: senderId,
    receiver: recipient._id,
    text: sanitizedText,
    messageType: normalizedType,
    attachment: sanitizedAttachment,
    deliveredAt: deliveredAt || undefined,
    deliveredTo: deliveredAt ? [{ user: recipient._id, at: deliveredAt }] : [],
  });

  const previewText =
    sanitizedText ||
    sanitizedAttachment?.fileName ||
    (normalizedType === 'image' ? 'Image attachment' : 'File attachment');

  const unreadCounts = conversation.unreadCounts || new Map();
  const participantIds = getParticipantIds(conversation);

  participantIds.forEach((participant) => {
    if (participant === String(senderId)) {
      unreadCounts.set(participant, 0);
      return;
    }

    unreadCounts.set(participant, (unreadCounts.get(participant) || 0) + 1);
  });

  conversation.lastMessageText = previewText.slice(0, 500);
  conversation.lastMessageType = normalizedType;
  conversation.lastMessageSender = senderId;
  conversation.lastMessageAt = message.createdAt;
  conversation.unreadCounts = unreadCounts;
  await conversation.save();

  const [messageDocument, conversationDocument] = await Promise.all([
    Message.findById(message._id).populate('sender receiver', CHAT_USER_SELECT),
    hydrateConversation(conversation._id),
  ]);

  return {
    message: toMessageDTO(messageDocument),
    conversation: conversationDocument,
    participantIds,
    receiverId: String(recipient._id),
  };
};

const markConversationDelivered = async ({ companyId, currentUserId, conversationId }) => {
  const conversation = await getConversationOrThrow({
    conversationId,
    companyId,
    userId: currentUserId,
  });

  const pendingMessages = await Message.find({
    companyId,
    conversation: conversation._id,
    receiver: currentUserId,
    deliveredAt: { $exists: false },
  }).select('_id');

  if (!pendingMessages.length) {
    return null;
  }

  const deliveredAt = new Date();
  const messageIds = pendingMessages.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: messageIds } },
    {
      $set: { deliveredAt },
      $push: {
        deliveredTo: {
          user: currentUserId,
          at: deliveredAt,
        },
      },
    }
  );

  return {
    conversationId: String(conversation._id),
    participantIds: getParticipantIds(conversation),
    messageIds: messageIds.map(String),
    deliveredAt,
    deliveredTo: String(currentUserId),
  };
};

const markConversationSeen = async ({ companyId, currentUserId, conversationId, viewer }) => {
  const conversation = await getConversationOrThrow({
    conversationId,
    companyId,
    userId: currentUserId,
  });

  const pendingMessages = await Message.find({
    companyId,
    conversation: conversation._id,
    receiver: currentUserId,
    isSeen: false,
  }).select('_id');

  const unreadCounts = conversation.unreadCounts || new Map();
  unreadCounts.set(String(currentUserId), 0);
  conversation.unreadCounts = unreadCounts;
  await conversation.save();

  if (!pendingMessages.length) {
    return {
      conversation,
      participantIds: getParticipantIds(conversation),
      messageIds: [],
      seenAt: null,
      seenBy: viewer ? toChatUser(viewer) : null,
    };
  }

  const seenAt = new Date();
  const messageIds = pendingMessages.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: messageIds } },
    {
      $set: {
        isSeen: true,
        seenAt,
        deliveredAt: seenAt,
      },
      $push: {
        seenBy: {
          user: currentUserId,
          at: seenAt,
        },
      },
    }
  );

  const conversationDocument = await hydrateConversation(conversation._id);

  return {
    conversation: conversationDocument,
    participantIds: getParticipantIds(conversationDocument),
    messageIds: messageIds.map(String),
    seenAt,
    seenBy: viewer ? toChatUser(viewer) : null,
  };
};

const searchChat = async ({ companyId, currentUserId, query }) => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return {
      users: await listChatUsers({ companyId, currentUserId, search: '', limit: 12 }),
      conversations: await listConversations({ companyId, currentUserId }),
    };
  }

  const [users, conversations] = await Promise.all([
    listChatUsers({ companyId, currentUserId, search: trimmedQuery, limit: 12 }),
    listConversations({ companyId, currentUserId, search: trimmedQuery }),
  ]);

  return { users, conversations };
};

module.exports = {
  CHAT_USER_SELECT,
  createOrFindDirectConversation,
  getConversationMessages,
  getConversationOrThrow,
  listChatUsers,
  listConversations,
  markConversationDelivered,
  markConversationSeen,
  searchChat,
  sendMessage,
};
