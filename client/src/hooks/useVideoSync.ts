import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

export const useVideoSync = (socket: Socket | null, roomId: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Expose explicit emit functions
  const emitPlay = () => {
    if (!socket || !roomId || !videoRef.current) return;
    const payload = { roomId, type: 'play', time: videoRef.current.currentTime, senderId: socket.id };
    socket.emit('video-play', payload);
  };

  const emitPause = () => {
    if (!socket || !roomId || !videoRef.current) return;
    const payload = { roomId, type: 'pause', time: videoRef.current.currentTime, senderId: socket.id };
    socket.emit('video-pause', payload);
  };

  const emitSeek = (time: number) => {
    if (!socket || !roomId) return;
    const payload = { roomId, type: 'seek', time, senderId: socket.id };
    socket.emit('video-seek', payload);
  };

  useEffect(() => {
    if (!socket || !roomId) return;

    const handleRemotePlay = async () => {
      const video = videoRef.current;
      if (!video) return;
      
      if (video.paused) {
        video.play().catch(err => {
          console.error('Remote play blocked by browser:', err);
          
          // Test muted autoplay fallback if requested by user
          video.muted = true;
          video.play().catch(e => console.error('Muted fallback play failed:', e));
        });
      }
    };

    const handleRemotePause = () => {
      const video = videoRef.current;
      if (!video) return;

      if (!video.paused) {
        video.pause();
      }
    };

    const handleRemoteSeek = (data: any) => {
      const video = videoRef.current;
      if (!video) return;
      if (data.time !== undefined) {
        video.currentTime = data.time;
      }
    };

    socket.on('video-play', handleRemotePlay);
    socket.on('video-pause', handleRemotePause);
    socket.on('video-seek', handleRemoteSeek);

    return () => {
      socket.off('video-play', handleRemotePlay);
      socket.off('video-pause', handleRemotePause);
      socket.off('video-seek', handleRemoteSeek);
    };
  }, [socket, roomId]);

  return { videoRef, emitPlay, emitPause, emitSeek };
};
