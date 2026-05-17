import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSocket } from '../lib/socket';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import ChatPanel from '../components/ChatPanel';
import VideoPlayer from '../components/VideoPlayer';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const WatchRoom = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    setRoomId, 
    setPartnerJoined, 
    clearRoom, 
  } = useRoomStore();

  const [socket, setSocket] = useState<any>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !user) {
      navigate('/');
      return;
    }

    const s = getSocket();
    setSocket(s);
    setRoomId(roomId);

    s.emit('join-room', { roomId, username: user.username });

    s.on('user-joined', (data) => {
      setPartnerJoined(true);
      toast.success(`${data.username} joined the room!`, { icon: '🍿' });
    });

    return () => {
      clearRoom();
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [roomId, user, navigate, setRoomId, clearRoom]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex h-[calc(100vh-72px)] overflow-hidden relative bg-[#050505]"
    >
      {/* Ambient Cinematic Lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vh] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[40vw] h-[40vh] bg-rose-600/5 blur-[150px] rounded-full" />
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative z-10 flex border-r border-white/5 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <VideoPlayer 
          socket={socket} 
          roomId={roomId || ''} 
          videoSrc={videoSrc}
          setVideoSrc={setVideoSrc}
        />
      </div>

      {/* Chat Sidebar */}
      <div className="z-20">
        <ChatPanel socket={socket} roomId={roomId || ''} />
      </div>
    </motion.div>
  );
};

export default WatchRoom;
