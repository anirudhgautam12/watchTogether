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
      console.log(`[SERVER] USER JOINED ROOM ${roomId} (socket: ${socket.id}, user: ${username})`);
    });

    socket.on('video-play', (data: SyncVideoData) => {
      console.log(`[SERVER] RECEIVED PLAY EVENT`, data);
      console.log(`[SERVER] BROADCASTING PLAY to room ${data.roomId}`);
      socket.to(data.roomId).emit('video-play', data);
    });

    socket.on('video-pause', (data: SyncVideoData) => {
      console.log(`[SERVER] RECEIVED PAUSE EVENT`, data);
      console.log(`[SERVER] BROADCASTING PAUSE to room ${data.roomId}`);
      socket.to(data.roomId).emit('video-pause', data);
    });

    socket.on('video-seek', (data: SyncVideoData) => {
      console.log(`[SERVER] RECEIVED SEEK EVENT`, data);
      console.log(`[SERVER] BROADCASTING SEEK to room ${data.roomId}`);
      socket.to(data.roomId).emit('video-seek', data);
    });

    socket.on('video-buffering', (data: SyncVideoData) => {
      socket.to(data.roomId).emit('video-buffering', data);
    });

    socket.on('video-playing', (data: SyncVideoData) => {
      socket.to(data.roomId).emit('video-playing', data);
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
