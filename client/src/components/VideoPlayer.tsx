import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Volume2, VolumeX, SkipBack, SkipForward, Upload } from 'lucide-react';
import { useVideoSync } from '../hooks/useVideoSync';
import { useRoomStore } from '../store/useRoomStore';
import toast from 'react-hot-toast';

interface VideoPlayerProps {
  socket: any;
  roomId: string;
  videoSrc: string | null;
  setVideoSrc: (src: string | null) => void;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return '0:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ socket, roomId, videoSrc, setVideoSrc }) => {
  const { videoRef, isDraggingRef, emitSeek } = useVideoSync(socket, roomId);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // React state is ONLY used for UI rendering, not logic control.
  const [isPlaying, setIsPlaying] = useState(false);
  const [localProgress, setLocalProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { partnerBuffering, reactions, partnerJoined } = useRoomStore();

  useEffect(() => {
    let animationFrameId: number;
    const updateProgress = () => {
      if (videoRef.current && !isDraggingRef.current) {
        setLocalProgress(videoRef.current.currentTime);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    updateProgress();
    return () => cancelAnimationFrame(animationFrameId);
  }, [videoRef, isDraggingRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateDuration = () => setDuration(video.duration);
    
    // Update React state strictly based on real HTML5 events
    const updatePlayStatePlay = () => setIsPlaying(true);
    const updatePlayStatePause = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', updatePlayStatePlay);
    video.addEventListener('pause', updatePlayStatePause);

    return () => {
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', updatePlayStatePlay);
      video.removeEventListener('pause', updatePlayStatePause);
    };
  }, [videoRef]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 2500);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (videoRef.current) {
      // SINGLE SOURCE OF TRUTH: The actual HTML5 video element state
      if (videoRef.current.paused) {
        videoRef.current.play().catch(err => console.error('Play error:', err));
      } else {
        videoRef.current.pause();
      }
    }
    
    handleMouseMove();
  };

  const toggleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {
        toast.error('Fullscreen failed');
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setLocalProgress(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const handleSeekStart = () => {
    if (isDraggingRef) isDraggingRef.current = true;
  };

  const handleSeekEnd = () => {
    if (isDraggingRef) isDraggingRef.current = false;
    if (videoRef.current) {
      emitSeek(videoRef.current.currentTime);
    }
  };

  const skip = (amount: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const newTime = Math.min(Math.max(videoRef.current.currentTime + amount, 0), duration);
      videoRef.current.currentTime = newTime;
      emitSeek(newTime);
    }
    handleMouseMove();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) setVolume(0);
      else setVolume(1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
    }
  };

  if (!videoSrc) {
    return (
      <div className="flex-1 flex flex-col relative bg-transparent group">
        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass-panel p-16 rounded-3xl flex flex-col items-center text-center max-w-lg border-white/10 shadow-[0_0_50px_rgba(225,29,72,0.15)]"
          >
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(225,29,72,0.3)]">
              <Upload className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-3 tracking-tight">Select a Movie</h2>
            <p className="text-white/50 mb-8 text-sm leading-relaxed">
              Both you and your partner need to select the same local video file. 
              Enjoy a flawless, high-quality stream directly from your device.
            </p>
            <label className="bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl cursor-pointer transition-all font-semibold shadow-lg hover:shadow-primary/50 hover:-translate-y-0.5 active:translate-y-0">
              Choose File
              <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
            </label>
          </motion.div>
        </div>
        <AnimatePresence>
          {partnerJoined && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)] text-white px-6 py-2.5 rounded-full text-sm font-medium z-50 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Your partner is waiting
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex flex-col relative bg-black group overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={hasInteracted ? togglePlay : undefined}
    >
      {/* Interaction Overlay to allow Autoplay */}
      <AnimatePresence>
        {!hasInteracted && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setHasInteracted(true);
              // Unlock the video element for programmatic play
              if (videoRef.current) {
                videoRef.current.play().then(() => videoRef.current?.pause()).catch(() => {});
              }
            }}
          >
            <div className="bg-primary/20 p-8 rounded-full animate-pulse mb-8 shadow-[0_0_50px_rgba(225,29,72,0.4)]">
              <Play className="w-16 h-16 text-primary ml-2" fill="currentColor" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Click to Join Watch Party</h2>
            <p className="text-white/60 text-lg">Interaction is required to enable synchronized playback.</p>
          </motion.div>
        )}
      </AnimatePresence>
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain cursor-pointer"
        controls={false}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Floating Reactions */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        <AnimatePresence>
          {reactions.map((r) => {
            // Generate stable pseudo-random values based on reaction ID to prevent jitter during re-renders
            const hash = r.id.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
            const randomX = (hash % 300) - 150;
            const randomRotation = (hash % 60) - 30;
            const randomScale = 1.2 + Math.abs(hash % 15) / 10;

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 100, scale: 0.5, x: 0, rotate: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0], 
                  y: -500, 
                  scale: [0.5, randomScale, randomScale * 1.1], 
                  x: [0, randomX * 0.5, randomX],
                  rotate: [0, randomRotation * 0.5, randomRotation]
                }}
                transition={{ 
                  duration: 4, 
                  ease: "easeOut",
                  times: [0, 0.15, 0.8, 1]
                }}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 text-5xl"
                style={{ 
                  filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.4)) drop-shadow(0 0 5px rgba(255,255,255,0.6))' 
                }}
              >
                {r.reaction}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Buffering Overlay */}
      <AnimatePresence>
        {partnerBuffering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none"
          >
            <motion.div 
              initial={{ y: 20, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              className="bg-black/60 px-8 py-4 rounded-full border border-white/10 flex items-center gap-4 shadow-2xl"
            >
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-semibold tracking-wide text-white/90">Syncing with partner...</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Center Paused Overlay */}
      <AnimatePresence>
        {!isPlaying && showControls && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          >
            <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
              <Play className="w-10 h-10 text-white ml-1.5" fill="white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 pt-32 pb-6 px-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col gap-4 z-40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress Slider */}
            <div className="flex items-center gap-4 w-full group/slider h-6">
              <span className="text-white/90 text-sm font-medium w-12 text-right font-mono tracking-wide">{formatTime(localProgress)}</span>
              
              <div className="relative flex-1 h-full flex items-center cursor-pointer">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={localProgress}
                  onChange={handleSeekChange}
                  onMouseDown={handleSeekStart}
                  onMouseUp={handleSeekEnd}
                  onTouchStart={handleSeekStart}
                  onTouchEnd={handleSeekEnd}
                  className="w-full h-1.5 hover:h-2 bg-white/20 rounded-full appearance-none transition-all duration-200 accent-primary z-10
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-125"
                  style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) ${(localProgress / duration) * 100}%, transparent ${(localProgress / duration) * 100}%)`
                  }}
                />
                {/* Glow effect underneath */}
                <div 
                  className="absolute left-0 h-1.5 group-hover/slider:h-2 rounded-full pointer-events-none opacity-40 blur-[4px] bg-primary transition-all duration-200 top-1/2 -translate-y-1/2"
                  style={{ width: `${(localProgress / duration) * 100}%` }}
                />
              </div>

              <span className="text-white/50 text-sm font-medium w-12 font-mono tracking-wide">{formatTime(duration)}</span>
            </div>

            {/* Bottom Bar Controls */}
            <div className="flex items-center justify-between w-full mt-1 px-1">
              <div className="flex items-center gap-6">
                <button 
                  onClick={togglePlay} 
                  className="text-white hover:text-primary hover:scale-110 transition-all"
                >
                  {isPlaying ? <Pause className="w-8 h-8" fill="currentColor" /> : <Play className="w-8 h-8" fill="currentColor" />}
                </button>
                
                <div className="flex items-center gap-4">
                  <button onClick={(e) => skip(-10, e)} className="text-white/70 hover:text-white hover:scale-110 transition-all">
                    <SkipBack className="w-6 h-6" />
                  </button>
                  <button onClick={(e) => skip(10, e)} className="text-white/70 hover:text-white hover:scale-110 transition-all">
                    <SkipForward className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 group/volume relative ml-2">
                  <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <div className="w-0 overflow-hidden opacity-0 group-hover/volume:w-24 group-hover/volume:opacity-100 transition-all duration-300 flex items-center h-6">
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                      style={{
                        background: `linear-gradient(to right, white ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%)`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white hover:scale-110 transition-all">
                  <Maximize className="w-6 h-6" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoPlayer;
