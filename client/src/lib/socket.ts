import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log(`[Socket] Connected successfully with ID: ${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.warn(`[Socket] Disconnected. Reason: ${reason}`);
    });

    socket.on('connect_error', (err) => {
      console.error(`[Socket] Connection error:`, err.message);
    });
  }
  return socket;
};
