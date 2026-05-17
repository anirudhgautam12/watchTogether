import { Server, Socket } from 'socket.io';
import { Room } from './models/Room';

interface JoinRoomData {
  roomId: string;
  username: string;
}

interface SyncVideoData {
  roomId: string;
  type: 'play' | 'pause' | 'seek' | 'buffering' | 'playing';
  time?: number;
  senderId: string;
}

interface ChatMessageData {
  roomId: string;
  message: string;
  username: string;
}

interface ReactionData {
  roomId: string;
  reaction: string;
  username: string;
}

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('join-room', async ({ roomId, username }: JoinRoomData) => {
      socket.join(roomId);
      socket.to(roomId).emit('user-joined', { username, id: socket.id });
      console.log(`${username} joined room ${roomId}`);
    });

    socket.on('sync-video', (data: SyncVideoData) => {
      // Broadcast to everyone in the room except the sender
      socket.to(data.roomId).emit('sync-video', data);
    });

    socket.on('chat-message', (data: ChatMessageData) => {
      io.to(data.roomId).emit('chat-message', {
        ...data,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      });
    });

    socket.on('reaction', (data: ReactionData) => {
      io.to(data.roomId).emit('reaction', {
        ...data,
        id: Date.now().toString()
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      // In a more complex setup, we'd find which room they were in and notify others.
    });
  });
};
