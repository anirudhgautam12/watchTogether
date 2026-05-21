import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useRoomStore } from '../store/useRoomStore';

export const useVideoSync = (socket: Socket | null, roomId: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Strict locking to prevent infinite feedback loops
  const isRemoteActionRef = useRef(false);
  const isDraggingRef = useRef(false);
  
  const lastEmitTimeRef = useRef(0);
  const setPartnerBuffering = useRoomStore((state) => state.setPartnerBuffering);
  
  const emitSeek = (time: number) => {
    if (!socket || !roomId) return;
    console.log('[SYNC-DEBUG] EMIT SEEK', time);
    socket.emit('video-seek', { roomId, type: 'seek', time, senderId: socket.id });
    lastEmitTimeRef.current = Date.now();
  };

  useEffect(() => {
    if (!socket || !roomId || !videoRef.current) return;

    const video = videoRef.current;

    const handleRemoteEvent = (data: any) => {
      if (!video) return;
      if (isDraggingRef.current) return;
      
      // If we just emitted an action, ignore incoming ones for a tiny window to prevent echoes
      if (Date.now() - lastEmitTimeRef.current < 300) return;

      isRemoteActionRef.current = true;

      // Silently correct large time drifts (>1s) on ANY event if time is provided
      if (data.time !== undefined && Math.abs(video.currentTime - data.time) > 1) {
        console.log(`[SYNC-DEBUG] Desync > 1s detected. Correcting from ${video.currentTime} to ${data.time}`);
        video.currentTime = data.time;
      }

      switch (data.type) {
        case 'play':
          console.log('[SYNC-DEBUG] RECEIVE PLAY');
          if (video.paused) {
            console.log('[SYNC-DEBUG] APPLY PLAY');
            video.play().then(() => {
              console.log('[SYNC-DEBUG] PLAY SUCCESS');
              setTimeout(() => isRemoteActionRef.current = false, 100);
            }).catch(e => {
              console.error('[SYNC-DEBUG] PLAY FAILED (autoplay blocked)', e);
              isRemoteActionRef.current = false;
            });
          } else {
            isRemoteActionRef.current = false;
          }
          break;

        case 'pause':
          console.log('[SYNC-DEBUG] RECEIVE PAUSE');
          if (!video.paused) {
            console.log('[SYNC-DEBUG] APPLY PAUSE');
            video.pause();
            console.log('[SYNC-DEBUG] PAUSE SUCCESS');
            setTimeout(() => isRemoteActionRef.current = false, 100);
          } else {
            isRemoteActionRef.current = false;
          }
          break;

        case 'seek':
          console.log('[SYNC-DEBUG] RECEIVE SEEK to', data.time);
          if (data.time !== undefined) {
            video.currentTime = data.time;
          }
          setTimeout(() => isRemoteActionRef.current = false, 100);
          break;

        case 'buffering':
          setPartnerBuffering(true);
          if (!video.paused) {
             video.pause();
          }
          setTimeout(() => isRemoteActionRef.current = false, 100);
          break;

        case 'playing':
          setPartnerBuffering(false);
          isRemoteActionRef.current = false;
          break;
          
        default:
          isRemoteActionRef.current = false;
      }
    };

    socket.on('video-play', handleRemoteEvent);
    socket.on('video-pause', handleRemoteEvent);
    socket.on('video-seek', handleRemoteEvent);
    socket.on('video-buffering', handleRemoteEvent);
    socket.on('video-playing', handleRemoteEvent);

    return () => {
      socket.off('video-play', handleRemoteEvent);
      socket.off('video-pause', handleRemoteEvent);
      socket.off('video-seek', handleRemoteEvent);
      socket.off('video-buffering', handleRemoteEvent);
      socket.off('video-playing', handleRemoteEvent);
    };
  }, [socket, roomId, setPartnerBuffering]);

  // Local event listeners
  useEffect(() => {
    if (!socket || !roomId || !videoRef.current) return;

    const video = videoRef.current;

    const handlePlay = () => {
      if (isRemoteActionRef.current) return;
      console.log('[SYNC-DEBUG] EMIT PLAY');
      socket.emit('video-play', { roomId, type: 'play', time: video.currentTime, senderId: socket.id });
      lastEmitTimeRef.current = Date.now();
    };

    const handlePause = () => {
      if (isRemoteActionRef.current) return;
      console.log('[SYNC-DEBUG] EMIT PAUSE');
      socket.emit('video-pause', { roomId, type: 'pause', time: video.currentTime, senderId: socket.id });
      lastEmitTimeRef.current = Date.now();
    };

    const handleSeek = () => {
      if (isRemoteActionRef.current || isDraggingRef.current) return;
      
      const now = Date.now();
      // Throttle rapid seeks from scrubbing
      if (now - lastEmitTimeRef.current > 500) {
        console.log('[SYNC-DEBUG] EMIT SEEK', video.currentTime);
        socket.emit('video-seek', { roomId, type: 'seek', time: video.currentTime, senderId: socket.id });
        lastEmitTimeRef.current = now;
      }
    };

    const handleWaiting = () => {
      if (isRemoteActionRef.current || isDraggingRef.current) return;
      socket.emit('video-buffering', { roomId, type: 'buffering', senderId: socket.id });
    };

    const handlePlaying = () => {
      if (isRemoteActionRef.current) return;
      socket.emit('video-playing', { roomId, type: 'playing', senderId: socket.id });
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeek);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeek);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [socket, roomId]);

  return { videoRef, isDraggingRef, emitSeek };
};
