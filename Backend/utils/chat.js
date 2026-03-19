const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeChatText = (value = '') =>
  String(value)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();

const sanitizeAttachment = (attachment) => {
  if (!attachment || typeof attachment !== 'object') {
    return undefined;
  }

  const sanitized = {
    url: attachment.url ? String(attachment.url).trim().slice(0, 500) : '',
    fileName: attachment.fileName
      ? String(attachment.fileName).replace(/[<>]/g, '').trim().slice(0, 150)
      : '',
    mimeType: attachment.mimeType ? String(attachment.mimeType).trim().slice(0, 120) : '',
    size: Number.isFinite(Number(attachment.size)) ? Math.max(0, Number(attachment.size)) : 0,
  };

  if (!sanitized.url && !sanitized.fileName) {
    return undefined;
  }

  return sanitized;
};

const getConversationKey = (userIds = []) => userIds.map(String).sort().join(':');

const toChatUser = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar || '',
    isOnline: Boolean(user.isOnline),
    lastSeen: user.lastSeen || null,
    jobTitle: user.jobTitle || '',
    department: user.department || '',
  };
};

const getUnreadCount = (conversation, userId) => {
  if (!conversation?.unreadCounts) {
    return 0;
  }

  if (typeof conversation.unreadCounts.get === 'function') {
    return conversation.unreadCounts.get(String(userId)) || 0;
  }

  return conversation.unreadCounts[String(userId)] || 0;
};

const getConversationTitle = (conversation, counterpart, participants) => {
  if (conversation.isGroup) {
    if (conversation.title) {
      return conversation.title;
    }

    return participants.map((participant) => participant.name).join(', ');
  }

  return counterpart?.name || 'Direct conversation';
};

const toConversationSummary = (conversation, currentUserId) => {
  const participants = (conversation.participants || []).map(toChatUser).filter(Boolean);
  const counterpart =
    participants.find((participant) => participant.id !== String(currentUserId)) || participants[0] || null;

  return {
    id: String(conversation._id),
    isGroup: Boolean(conversation.isGroup),
    title: getConversationTitle(conversation, counterpart, participants),
    participants,
    counterpart,
    lastMessageText: conversation.lastMessageText || '',
    lastMessageType: conversation.lastMessageType || 'text',
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt || conversation.createdAt,
    lastMessageSenderId: conversation.lastMessageSender
      ? String(conversation.lastMessageSender._id || conversation.lastMessageSender)
      : null,
    unreadCount: getUnreadCount(conversation, currentUserId),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
};

const toMessageDTO = (message) => ({
  id: String(message._id),
  conversationId: String(message.conversation?._id || message.conversation),
  sender: toChatUser(message.sender),
  receiver: toChatUser(message.receiver),
  text: message.text || '',
  messageType: message.messageType || 'text',
  attachment: message.attachment || null,
  isSeen: Boolean(message.isSeen),
  deliveredAt: message.deliveredAt || null,
  seenAt: message.seenAt || null,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

module.exports = {
  escapeRegex,
  sanitizeAttachment,
  sanitizeChatText,
  getConversationKey,
  toChatUser,
  toConversationSummary,
  toMessageDTO,
};
