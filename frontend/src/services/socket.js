import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  // Connect to the current host or port 5000 in dev
  const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;

  socket = io(serverUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('[Realtime] WebSocket connected with ID:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Realtime] WebSocket connection notice:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
