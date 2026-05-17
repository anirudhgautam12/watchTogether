import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, LogIn, Film } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreateRoom = () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${roomId}`);
    toast.success('Room created!', { icon: '🍿' });
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomId.trim()) return;
    navigate(`/room/${joinRoomId.toUpperCase()}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 relative overflow-hidden bg-[#050505]">
      {/* Cinematic Ambient Background with Continuous Breathing Motion */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-primary/10 blur-[150px] rounded-full mix-blend-screen"
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.15, 1],
            rotate: [0, -5, 0],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-[60vw] h-[60vh] bg-rose-600/10 blur-[150px] rounded-full mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>
      
      <div className="relative z-10 w-full max-w-5xl text-center mb-16 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(225,29,72,0.2)]"
        >
          <Film className="w-10 h-10 text-primary" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.1)]"
        >
          Watch <span className="text-primary drop-shadow-[0_0_20px_rgba(225,29,72,0.4)]">Together</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="text-xl md:text-2xl text-white/50 font-medium tracking-wide"
        >
          Movie nights, synced perfectly.
        </motion.p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        {/* Create Room Card */}
        <motion.div
          initial={{ opacity: 0, x: -20, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 rounded-3xl flex flex-col items-center text-center shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_50px_rgba(225,29,72,0.15)] transition-all duration-500 group"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-8 group-hover:bg-primary/20 transition-colors duration-500 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
            <Plus className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Create Room</h2>
          <p className="text-white/40 mb-10 text-sm leading-relaxed font-medium px-4">
            Start a new private watch session and invite your partner instantly.
          </p>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateRoom}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] border border-white/10"
          >
            Create Room
          </motion.button>
        </motion.div>

        {/* Join Room Card */}
        <motion.div
          initial={{ opacity: 0, x: 20, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 rounded-3xl flex flex-col items-center text-center shadow-[0_0_40px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)] hover:shadow-[0_0_50px_rgba(59,130,246,0.15)] transition-all duration-500 group"
        >
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 group-hover:bg-blue-500/20 transition-colors duration-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <LogIn className="w-10 h-10 text-blue-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Join Room</h2>
          <p className="text-white/40 mb-10 text-sm leading-relaxed font-medium px-4">
            Have an invite code? Enter it below to join your partner's room.
          </p>
          <form onSubmit={handleJoinRoom} className="w-full space-y-5">
            <div className="relative group/input">
              <input
                type="text"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="ENTER CODE"
                className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-4 text-white placeholder-white/20 text-center uppercase tracking-[0.3em] font-mono font-bold focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/50 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300"
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={!joinRoomId.trim()}
              className={`w-full font-bold py-4 rounded-xl transition-all border border-white/10 ${
                joinRoomId.trim() 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]' 
                  : 'bg-white/5 text-white/30 cursor-not-allowed'
              }`}
            >
              Join Room
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
