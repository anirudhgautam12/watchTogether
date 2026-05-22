import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';

(window as any).testSync = true;
console.log("SYNC FILE LOADED - BUILD: " + Date.now());

export const useVideoSync = (socket: Socket | null, roomId: string | null) => {
  console.log("[SYNC-MOUNT] useVideoSync hook function is executing! socket:", socket?.id, "roomId:", roomId);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Expose explicit emit functions
  const emitPlay = () => {
    if (!socket || !roomId || !videoRef.current) return;
    const payload = { roomId, type: 'play', time: videoRef.current.currentTime, senderId: socket.id };
    console.log('[SYNC-STEP-1] LOCAL PLAY CLICK');
    console.log('[SYNC-STEP-2] EMITTING PLAY EVENT', payload);
    socket.emit('video-play', payload);
  };

  const emitPause = () => {
    if (!socket || !roomId || !videoRef.current) return;
    const payload = { roomId, type: 'pause', time: videoRef.current.currentTime, senderId: socket.id };
    console.log('[SYNC-STEP-1] LOCAL PAUSE CLICK');
    console.log('[SYNC-STEP-2] EMITTING PAUSE EVENT', payload);
    socket.emit('video-pause', payload);
  };

  const emitSeek = (time: number) => {
    if (!socket || !roomId) return;
    const payload = { roomId, type: 'seek', time, senderId: socket.id };
    console.log('[SYNC-STEP-1] LOCAL SEEK');
    console.log('[SYNC-STEP-2] EMITTING SEEK EVENT', payload);
    socket.emit('video-seek', payload);
  };

  useEffect(() => {
    console.log("[SYNC-MOUNT] useEffect triggered. socket:", !!socket, "roomId:", !!roomId, "videoRef:", !!videoRef.current);
    if (!socket || !roomId || !videoRef.current) return;
    
    console.log("[SYNC-MOUNT] socket connected. ID:", socket.id);
    const video = videoRef.current;

    const handleRemotePlay = async (data: any) => {
      console.log('[SYNC-STEP-5] RECEIVED REMOTE PLAY', data);
      console.log('Video paused state BEFORE play():', video.paused);
      
      if (video.paused) {
        console.log('[SYNC-STEP-6] CALLING video.play()');
        video.play().then(() => {
          console.log('[SYNC-STEP-7] PLAY SUCCESS');
          console.log('Video paused state AFTER play():', video.paused);
        }).catch(err => {
          console.error('[SYNC-STEP-ERROR] PLAY FAILED', err);
          
          // Test muted autoplay fallback if requested by user
          console.log('[SYNC-DEBUG] Attempting muted fallback play...');
          video.muted = true;
          video.play().then(() => {
            console.log('[SYNC-DEBUG] MUTED PLAY SUCCESS');
          }).catch(e => console.error('[SYNC-DEBUG] MUTED PLAY ALSO FAILED', e));
        });
      }
    };

    const handleRemotePause = (data: any) => {
      console.log('[SYNC-STEP-5] RECEIVED REMOTE PAUSE', data);
      console.log('Video paused state BEFORE pause():', video.paused);

      if (!video.paused) {
        console.log('[SYNC-STEP-6] CALLING video.pause()');
        video.pause();
        console.log('[SYNC-STEP-7] PAUSE SUCCESS');
        console.log('Video paused state AFTER pause():', video.paused);
      }
    };

    const handleRemoteSeek = (data: any) => {
      console.log('[SYNC-STEP-5] RECEIVED REMOTE SEEK', data);
      if (data.time !== undefined) {
        video.currentTime = data.time;
      }
    };

    console.log("[SYNC-MOUNT] registering socket listeners for play, pause, seek");
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
