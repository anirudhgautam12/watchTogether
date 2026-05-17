import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, Clock, Heart, Laugh, Zap, Coffee, Sparkles } from 'lucide-react';
import { useRoomStore } from '../store/useRoomStore';
import { useAuthStore } from '../store/useAuthStore';
import { Socket } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  socket: Socket | null;
  roomId: string;
}

const REACTION_CATEGORIES = [
  { id: 'recent', icon: <Clock className="w-4 h-4" />, name: 'Recent', emojis: [] as string[] },
  { id: 'love', icon: <Heart className="w-4 h-4" />, name: 'Love & Cute', emojis: ['❤️', '💖', '💕', '💘', '💝', '😘', '😍', '🥰', '🥹', '💞', '💓', '💗'] },
  { id: 'funny', icon: <Laugh className="w-4 h-4" />, name: 'Funny', emojis: ['😂', '🤣', '😭', '💀', '😹', '🤡'] },
  { id: 'shock', icon: <Zap className="w-4 h-4" />, name: 'Shock & Drama', emojis: ['😮', '😳', '😱', '👀', '🫢', '🤯'] },
  { id: 'hype', icon: <Sparkles className="w-4 h-4" />, name: 'Hype', emojis: ['🔥', '🎉', '🚀', '🙌', '⚡', '💯', '🎶', '🍿'] },
  { id: 'cozy', icon: <Coffee className="w-4 h-4" />, name: 'Mood & Cozy', emojis: ['😴', '☕', '🌙', '🛋️', '✨', '🎬', '🍫'] },
];

const ChatPanel: React.FC<ChatPanelProps> = ({ socket, roomId }) => {
  const [msgInput, setMsgInput] = useState('');
  const [showReactions, setShowReactions] = useState(false);
  const [recentReactions, setRecentReactions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const { messages, addMessage, addReaction, partnerJoined } = useRoomStore();

  useEffect(() => {
    // Load recent reactions from local storage
    try {
      const saved = localStorage.getItem('watchtogether_recent_reactions');
      if (saved) {
        setRecentReactions(JSON.parse(saved));
      } else {
        setRecentReactions(['❤️', '😂', '🔥', '🍿', '👀']);
      }
    } catch (e) {
      setRecentReactions(['❤️', '😂', '🔥', '🍿', '👀']);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: any) => {
      addMessage(data);
    };

    const handleReaction = (data: any) => {
      addReaction(data);
    };

    socket.on('chat-message', handleMessage);
    socket.on('reaction', handleReaction);

    return () => {
      socket.off('chat-message', handleMessage);
      socket.off('reaction', handleReaction);
    };
  }, [socket, addMessage, addReaction]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !socket || !user) return;

    socket.emit('chat-message', {
      roomId,
      message: msgInput.trim(),
      username: user.username,
    });
    setMsgInput('');
  };

  const sendReaction = (reaction: string) => {
    if (!socket || !user) return;
    
    // Optimistic rapid-fire send
    socket.emit('reaction', {
      roomId,
      reaction,
      username: user.username,
      id: Date.now().toString() + Math.random().toString(36).substring(7) // Local ID for immediate stable hashing
    });

    // Update recents
    const newRecents = [reaction, ...recentReactions.filter(r => r !== reaction)].slice(0, 8);
    setRecentReactions(newRecents);
    localStorage.setItem('watchtogether_recent_reactions', JSON.stringify(newRecents));
    
    // NOT closing the picker to allow rapid spamming!
  };

  // Inject recent reactions into the first category dynamically
  const displayCategories = REACTION_CATEGORIES.map(cat => 
    cat.id === 'recent' ? { ...cat, emojis: recentReactions } : cat
  );

  return (
    <div className="flex flex-col h-full w-[340px] relative z-20 bg-[#0A0A0E] border-l border-white/5 shadow-2xl overflow-hidden">
      {/* Subtle Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      
      <div className="p-5 border-b border-white/5 font-semibold flex flex-col gap-1 z-10 bg-black/40 backdrop-blur-md">
        <div className="flex justify-between items-center">
          <span className="text-white/90 tracking-wide text-sm uppercase font-bold">Room Chat</span>
          <div className="flex items-center gap-2">
            {partnerJoined && (
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] uppercase text-emerald-500 font-bold tracking-wider">Live</span>
              </div>
            )}
            <span className="text-xs px-2 py-0.5 bg-white/5 rounded text-white/40 font-mono border border-white/10">
              {roomId}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 z-10 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
            <Smile className="w-10 h-10 text-white/30" />
            <p className="text-sm text-white/60">No messages yet.<br/>Say hi to start the watch party!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.username === user?.username;
              return (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-white/40 mb-1.5 px-1 font-medium tracking-wide uppercase">
                    {msg.username}
                  </span>
                  <div 
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-lg ${
                      isMe 
                        ? 'bg-primary text-white rounded-tr-sm shadow-[0_0_15px_rgba(225,29,72,0.2)]' 
                        : 'bg-white/10 text-white/90 rounded-tl-sm border border-white/5'
                    }`}
                  >
                    {msg.message}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-white/5 z-10 bg-black/40 backdrop-blur-md relative">
        <form onSubmit={sendMessage} className="relative">
          <AnimatePresence>
            {showReactions && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute bottom-[calc(100%+16px)] right-0 w-[300px] bg-[#111118]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.02)] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Reactions</span>
                </div>
                
                {/* Scrollable Categories List */}
                <div className="overflow-y-auto max-h-[280px] p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
                  {displayCategories.map(cat => (
                    cat.emojis.length > 0 && (
                      <div key={cat.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 px-1 opacity-60">
                          {cat.icon}
                          <span className="text-[10px] uppercase font-bold tracking-wider">{cat.name}</span>
                        </div>
                        <div className="grid grid-cols-6 gap-1">
                          {cat.emojis.map((emoji, idx) => (
                            <motion.button
                              key={`${cat.id}-${emoji}-${idx}`}
                              whileHover={{ scale: 1.3, zIndex: 10 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => sendReaction(emoji)}
                              type="button"
                              className="text-2xl p-1.5 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors relative group"
                            >
                              <span className="drop-shadow-lg group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">
                                {emoji}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => setShowReactions(!showReactions)}
              className={`p-2.5 rounded-full transition-all duration-300 ${showReactions ? 'bg-primary text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
            >
              <Smile className="w-5 h-5" />
            </motion.button>
            <input
              type="text"
              value={msgInput}
              onChange={(e) => setMsgInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-black/50 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white/90 placeholder:text-white/30"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!msgInput.trim()}
              className="p-3 bg-primary rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] hover:shadow-[0_0_25px_rgba(225,29,72,0.5)]"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;
