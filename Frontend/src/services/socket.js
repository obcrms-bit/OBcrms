'use client';

import { io } from 'socket.io-client';
import { getSocketBaseUrl } from './runtimeConfig';

let chatSocket = null;

export const getChatSocket = (token) => {
  if (!token) {
    return null;
  }

  if (chatSocket) {
    if (chatSocket.auth?.token !== token) {
      chatSocket.disconnect();
      chatSocket = null;
    } else {
      return chatSocket;
    }
  }

  chatSocket = io(getSocketBaseUrl(), {
    autoConnect: true,
    auth: { token },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
  });

  return chatSocket;
};

export const closeChatSocket = () => {
  if (!chatSocket) {
    return;
  }

  chatSocket.disconnect();
  chatSocket = null;
};
