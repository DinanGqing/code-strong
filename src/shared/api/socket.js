import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

let socket = null;

/**
 * 建立 WebSocket 连接
 * @param {string} token JWT token
 * @returns {import('socket.io-client').Socket}
 */
export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => console.log('[WS] 已连接'));
  socket.on('disconnect', () => console.log('[WS] 已断开'));
  socket.on('connect_error', (err) => console.error('[WS] 连接错误:', err.message));

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export default { connectSocket, getSocket, disconnectSocket };
