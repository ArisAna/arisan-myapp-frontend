import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_RAILWAY_API_URL || 'https://api.arisan.gr/api';
// Strip /api to get the base server URL for Socket.IO
const SOCKET_URL = API_URL.replace(/\/api$/, '');

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
