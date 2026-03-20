'use client';
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import AppShell from '@/components/app/app-shell';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusPill,
  formatDateTime,
  getInitials,
  upsertById,
} from '@/components/app/shared';
import { chatAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { getChatSocket } from '@/src/services/socket';

const sortConversations = (items = []) =>
  [...items].sort(
    (left, right) =>
      new Date(right.lastMessageAt || 0).getTime() -
      new Date(left.lastMessageAt || 0).getTime()
  );

const upsertMessage = (items = [], nextMessage) => {
  const existingIndex = items.findIndex((item) => item.id === nextMessage.id);
  if (existingIndex >= 0) {
    const nextItems = [...items];
    nextItems[existingIndex] = { ...nextItems[existingIndex], ...nextMessage };
    return nextItems;
  }

  return [...items, nextMessage];
};

const updatePresence = (collection = [], userId, updates) =>
  collection.map((item) => {
    if (item.id === userId) {
      return { ...item, ...updates };
    }

    if (item.counterpart?.id === userId) {
      return {
        ...item,
        counterpart: { ...item.counterpart, ...updates },
        participants: (item.participants || []).map((participant) =>
          participant.id === userId ? { ...participant, ...updates } : participant
        ),
      };
    }

    return item;
  });

export default function ChatPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState('');
  const [directory, setDirectory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState('');
  const [sending, setSending] = useState(false);

  const socketRef = useRef(null);
  const activeConversationRef = useRef('');

  const activeConversation = conversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return conversations;
    }

    return conversations.filter((conversation) =>
      [conversation.title, conversation.lastMessageText, conversation.counterpart?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [conversations, search]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return directory;
    }

    return directory.filter((person) =>
      [person.name, person.email, person.role]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [directory, search]);

  const markConversationSeen = async (conversationId) => {
    if (!conversationId) {
      return;
    }

    if (socketRef.current?.connected) {
      socketRef.current.emit('mark-seen', { conversationId });
      return;
    }

    await chatAPI.markSeen(conversationId);
  };

  const openConversation = async (conversationId) => {
    setActiveConversationId(conversationId);
    activeConversationRef.current = conversationId;
    setMessagesLoading(true);
    setError('');

    try {
      const response = await chatAPI.getMessages(conversationId);
      setMessages(response.data?.data?.messages || []);

      if (socketRef.current) {
        socketRef.current.emit('join-chat', { conversationId });
      }

      await markConversationSeen(conversationId);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load conversation messages.'
      );
    } finally {
      setMessagesLoading(false);
    }
  };

  const loadWorkspace = async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [usersResponse, conversationsResponse] = await Promise.all([
        chatAPI.getUsers(),
        chatAPI.getConversations(),
      ]);

      const nextUsers = usersResponse.data?.data?.users || [];
      const nextConversations = sortConversations(
        conversationsResponse.data?.data?.conversations || []
      );

      setDirectory(nextUsers);
      setConversations(nextConversations);

      if (!activeConversationRef.current && nextConversations[0]?.id) {
        await openConversation(nextConversations[0].id);
      }
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to load chat workspace.'
      );
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!token) {
      return;
    }

    loadWorkspace();
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = getChatSocket(token);
    if (!socket) {
      return;
    }

    socketRef.current = socket;

    const handleConversationUpdated = ({ conversation }) => {
      setConversations((current) => sortConversations(upsertById(current, conversation)));
    };

    const handleReceiveMessage = ({ message, conversationId }) => {
      if (activeConversationRef.current === conversationId) {
        setMessages((current) => upsertMessage(current, message));

        if (message.sender?.id !== user?.id) {
          markConversationSeen(conversationId).catch(() => {});
        }
      }
    };

    const handleDelivered = ({ messageIds = [], deliveredAt }) => {
      setMessages((current) =>
        current.map((message) =>
          messageIds.includes(message.id) ? { ...message, deliveredAt } : message
        )
      );
    };

    const handleSeen = ({ messageIds = [], seenAt }) => {
      setMessages((current) =>
        current.map((message) =>
          messageIds.includes(message.id)
            ? { ...message, isSeen: true, seenAt }
            : message
        )
      );
    };

    const handleOnline = ({ userId }) => {
      setDirectory((current) => updatePresence(current, userId, { isOnline: true }));
      setConversations((current) =>
        updatePresence(current, userId, {
          isOnline: true,
          lastSeen: null,
        })
      );
    };

    const handleOffline = ({ userId, lastSeen }) => {
      setDirectory((current) =>
        updatePresence(current, userId, {
          isOnline: false,
          lastSeen,
        })
      );
      setConversations((current) =>
        updatePresence(current, userId, {
          isOnline: false,
          lastSeen,
        })
      );
    };

    socket.on('conversation-updated', handleConversationUpdated);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-delivered', handleDelivered);
    socket.on('message-seen', handleSeen);
    socket.on('user-online', handleOnline);
    socket.on('user-offline', handleOffline);

    return () => {
      socket.off('conversation-updated', handleConversationUpdated);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-delivered', handleDelivered);
      socket.off('message-seen', handleSeen);
      socket.off('user-online', handleOnline);
      socket.off('user-offline', handleOffline);
    };
  }, [token, user?.id]);

  const startConversation = async (participantId) => {
    try {
      const response = await chatAPI.createConversation(participantId);
      const conversation = response.data?.data?.conversation;

      if (!conversation?.id) {
        return;
      }

      setConversations((current) => sortConversations(upsertById(current, conversation)));
      await openConversation(conversation.id);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to start conversation.'
      );
    }
  };

  const sendMessage = async () => {
    const text = composer.trim();

    if (!text || !activeConversation) {
      return;
    }

    setSending(true);
    setComposer('');
    setError('');

    try {
      if (socketRef.current?.connected) {
        await new Promise((resolve, reject) => {
          socketRef.current.emit(
            'send-message',
            {
              conversationId: activeConversation.id,
              participantId: activeConversation.counterpart?.id,
              text,
            },
            (response) => {
              if (response?.ok) {
                resolve(response);
                return;
              }

              reject(new Error(response?.message || 'Failed to send message.'));
            }
          );
        });
      } else {
        const response = await chatAPI.sendMessage({
          conversationId: activeConversation.id,
          participantId: activeConversation.counterpart?.id,
          text,
        });
        setMessages((current) =>
          upsertMessage(current, response.data?.data?.message)
        );
      }
    } catch (requestError) {
      setComposer(text);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Failed to send message.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell
      title="Team Chat"
      description="Live chat is connected to the deployed backend via Socket.IO, with online presence, persistent message history, and real-time updates."
      actions={
        <button
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          onClick={loadWorkspace}
          type="button"
        >
          Refresh chat
        </button>
      }
    >
      {loading ? <LoadingState label="Loading chat workspace..." /> : null}
      {!loading && error ? <ErrorState message={error} onRetry={loadWorkspace} /> : null}

      {!loading && !error ? (
        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search people or conversations"
                  value={search}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Conversations
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-900">
                    Active threads
                  </h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {filteredConversations.length === 0 ? (
                  <p className="text-sm text-slate-500">No conversations found yet.</p>
                ) : (
                  filteredConversations.map((conversation) => (
                    <button
                      className={`w-full rounded-3xl border p-4 text-left transition ${
                        activeConversationId === conversation.id
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-900 hover:border-slate-300'
                      }`}
                      key={conversation.id}
                      onClick={() => openConversation(conversation.id)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{conversation.title}</p>
                          <p
                            className={`mt-1 text-sm ${
                              activeConversationId === conversation.id
                                ? 'text-slate-300'
                                : 'text-slate-500'
                            }`}
                          >
                            {conversation.lastMessageText || 'No messages yet'}
                          </p>
                        </div>
                        {conversation.unreadCount ? (
                          <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-teal-500 px-2 text-xs font-semibold text-white">
                            {conversation.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Start a chat
              </p>
              <div className="mt-5 space-y-3">
                {filteredUsers.map((person) => (
                  <button
                    className="flex w-full items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-slate-300"
                    key={person.id}
                    onClick={() => startConversation(person.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                        {getInitials(person.name)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{person.name}</p>
                        <p className="text-sm text-slate-500">{person.email}</p>
                      </div>
                    </div>
                    <StatusPill tone={person.isOnline ? 'completed' : 'draft'}>
                      {person.isOnline ? 'Online' : 'Offline'}
                    </StatusPill>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            {!activeConversation ? (
              <EmptyState
                description="Select an existing conversation or start a new one from the teammate list."
                icon={MessageSquare}
                title="No conversation selected"
              />
            ) : (
              <div className="flex h-full min-h-[720px] flex-col">
                <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Active conversation
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">
                      {activeConversation.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {activeConversation.counterpart?.isOnline
                        ? 'Online now'
                        : activeConversation.counterpart?.lastSeen
                          ? `Last seen ${formatDateTime(activeConversation.counterpart.lastSeen)}`
                          : 'Offline'}
                    </p>
                  </div>
                  <StatusPill
                    tone={
                      activeConversation.counterpart?.isOnline ? 'completed' : 'draft'
                    }
                  >
                    {activeConversation.counterpart?.isOnline ? 'Online' : 'Offline'}
                  </StatusPill>
                </header>

                <div className="mt-6 flex-1 overflow-y-auto">
                  {messagesLoading ? (
                    <LoadingState label="Loading message history..." />
                  ) : messages.length === 0 ? (
                    <EmptyState
                      description="Send the first message to create the conversation history in the database."
                      icon={MessageSquare}
                      title="No messages yet"
                    />
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => {
                        const isMine = message.sender?.id === user?.id;

                        return (
                          <div
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                            key={message.id}
                          >
                            <div
                              className={`max-w-[75%] rounded-[1.75rem] px-4 py-3 ${
                                isMine
                                  ? 'bg-slate-900 text-white'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              <p className="text-sm leading-6">{message.text}</p>
                              <div
                                className={`mt-2 text-xs ${
                                  isMine ? 'text-slate-300' : 'text-slate-500'
                                }`}
                              >
                                {formatDateTime(message.createdAt)}
                                {isMine && message.isSeen
                                  ? ' / Seen'
                                  : isMine && message.deliveredAt
                                    ? ' / Delivered'
                                    : ''}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <footer className="mt-6 border-t border-slate-200 pt-5">
                  <div className="flex gap-3">
                    <textarea
                      className="min-h-[92px] flex-1 rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:bg-white"
                      onChange={(event) => setComposer(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Type a message and press Enter to send"
                      value={composer}
                    />
                    <button
                      className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-5 py-4 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={sending || !composer.trim()}
                      onClick={sendMessage}
                      type="button"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </footer>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </AppShell>
  );
}
