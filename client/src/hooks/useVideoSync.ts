import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useRoomStore } from '../store/useRoomStore';

export const useVideoSync = (socket: Socket | null, roomId: string | null) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isUpdatingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const ignoreRemoteEventsUntil = useRef(0);
  const lastSyncTime = useRef(0);
  const setPartnerBuffering = useRoomStore((state) => state.setPartnerBuffering);
  
  const emitSeek = (time: number) => {
    if (!socket || !roomId) return;
    socket.emit('video-seek', { roomId, type: 'seek', time });
    lastSyncTime.current = Date.now();
  };

  useEffect(() => {
    if (!socket || !roomId || !videoRef.current) return;

    const video = videoRef.current;

    const handleRemoteEvent = (data: any) => {
      if (!video) return;
      if (isDraggingRef.current) return;

      if (Date.now() < ignoreRemoteEventsUntil.current) {
        console.log(`[Socket] Ignored ${data.type} due to local action lock`);
        return;
      }

      isUpdatingRef.current = true;

      switch (data.type) {
        case 'play':
          console.log('[Socket] REMOTE PLAY received. Current state paused:', video.paused);
          if (video.paused) {
            video.play().catch(e => console.error('[Video] Play error:', e));
          }
          break;
        case 'pause':
          console.log('[Socket] REMOTE PAUSE received. Current state paused:', video.paused);
          if (!video.paused) {
            video.pause();
          }
          break;
        case 'seek':
          if (data.time !== undefined && Math.abs(video.currentTime - data.time) > 2) {
            video.currentTime = data.time;
          }
          break;
        case 'buffering':
          setPartnerBuffering(true);
          if (!video.paused) video.pause();
          break;
        case 'playing':
          setPartnerBuffering(false);
          break;
      }

      const lockDuration = data.type === 'seek' ? 500 : 200;
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, lockDuration);
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
      if (isUpdatingRef.current) return;
      console.log('[Local] LOCAL PLAY event fired. Current state paused:', video.paused);
      ignoreRemoteEventsUntil.current = Date.now() + 1000;
      socket.emit('video-play', { roomId, type: 'play', time: video.currentTime });
    };

    const handlePause = () => {
      if (isUpdatingRef.current) return;
      console.log('[Local] LOCAL PAUSE event fired. Current state paused:', video.paused);
      ignoreRemoteEventsUntil.current = Date.now() + 1000;
      socket.emit('video-pause', { roomId, type: 'pause', time: video.currentTime });
    };

    const handleSeek = () => {
      if (isUpdatingRef.current || isDraggingRef.current) return;
      
      const now = Date.now();
      if (now - lastSyncTime.current > 500) {
        socket.emit('video-seek', { roomId, type: 'seek', time: video.currentTime });
        lastSyncTime.current = now;
      }
    };

    const handleWaiting = () => {
      if (isUpdatingRef.current || isDraggingRef.current) return;
      socket.emit('video-buffering', { roomId, type: 'buffering' });
    };

    const handlePlaying = () => {
      if (isUpdatingRef.current) return;
      socket.emit('video-playing', { roomId, type: 'playing' });
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
