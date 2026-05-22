import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useRoomStore } from '../store/useRoomStore';

export const useVideoSync = (socket: Socket | null, roomId: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const setPartnerBuffering = useRoomStore((state) => state.setPartnerBuffering);
  
  // Expose explicit emit functions to be called ONLY from UI user interactions.
  // This completely eliminates race conditions and the need for complex locking.
  const emitPlay = () => {
    if (!socket || !roomId || !videoRef.current) return;
    console.log('[SYNC-DEBUG] EMIT PLAY');
    socket.emit('video-play', { roomId, type: 'play', time: videoRef.current.currentTime, senderId: socket.id });
  };

  const emitPause = () => {
    if (!socket || !roomId || !videoRef.current) return;
    console.log('[SYNC-DEBUG] EMIT PAUSE');
    socket.emit('video-pause', { roomId, type: 'pause', time: videoRef.current.currentTime, senderId: socket.id });
  };

  const emitSeek = (time: number) => {
    if (!socket || !roomId) return;
    console.log('[SYNC-DEBUG] EMIT SEEK', time);
    socket.emit('video-seek', { roomId, type: 'seek', time, senderId: socket.id });
  };

  useEffect(() => {
    if (!socket || !roomId || !videoRef.current) return;
    const video = videoRef.current;

    const handleRemotePlay = async (data: any) => {
      console.log('[SYNC-DEBUG] RECEIVE PLAY', data);
      
      // Silent time correction if drifting heavily
      if (data.time !== undefined && Math.abs(video.currentTime - data.time) > 1) {
        console.log(`[SYNC-DEBUG] Correcting desync from ${video.currentTime} to ${data.time}`);
        video.currentTime = data.time;
      }

      if (video.paused) {
        console.log('[SYNC-DEBUG] APPLYING PLAY');
        try {
          await video.play();
          console.log('[SYNC-DEBUG] PLAY SUCCESS');
        } catch (e) {
          console.error('[SYNC-DEBUG] AUTOPLAY BLOCKED OR PLAY FAILED', e);
        }
      }
    };

    const handleRemotePause = (data: any) => {
      console.log('[SYNC-DEBUG] RECEIVE PAUSE', data);
      
      if (data.time !== undefined && Math.abs(video.currentTime - data.time) > 1) {
        video.currentTime = data.time;
      }

      if (!video.paused) {
        console.log('[SYNC-DEBUG] APPLYING PAUSE');
        video.pause();
        console.log('[SYNC-DEBUG] PAUSE SUCCESS');
      }
    };

    const handleRemoteSeek = (data: any) => {
      console.log('[SYNC-DEBUG] RECEIVE SEEK to', data.time);
      if (data.time !== undefined) {
        video.currentTime = data.time;
      }
    };

    const handleRemoteBuffering = () => {
      setPartnerBuffering(true);
      if (!video.paused) {
         video.pause();
      }
    };

    const handleRemotePlaying = () => {
      setPartnerBuffering(false);
    };

    socket.on('video-play', handleRemotePlay);
    socket.on('video-pause', handleRemotePause);
    socket.on('video-seek', handleRemoteSeek);
    socket.on('video-buffering', handleRemoteBuffering);
    socket.on('video-playing', handleRemotePlaying);

    return () => {
      socket.off('video-play', handleRemotePlay);
      socket.off('video-pause', handleRemotePause);
      socket.off('video-seek', handleRemoteSeek);
      socket.off('video-buffering', handleRemoteBuffering);
      socket.off('video-playing', handleRemotePlaying);
    };
  }, [socket, roomId, setPartnerBuffering]);

  // Network buffering listeners (not user interaction, so safe to listen and emit)
  useEffect(() => {
    if (!socket || !roomId || !videoRef.current) return;
    const video = videoRef.current;

    const handleWaiting = () => {
      socket.emit('video-buffering', { roomId, type: 'buffering', senderId: socket.id });
    };

    const handlePlaying = () => {
      socket.emit('video-playing', { roomId, type: 'playing', senderId: socket.id });
    };

    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [socket, roomId]);

  return { videoRef, emitPlay, emitPause, emitSeek };
};
