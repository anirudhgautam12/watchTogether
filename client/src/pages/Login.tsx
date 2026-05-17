import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { Film } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setAuth(data.user, data.token);
      toast.success('Welcome back!', { icon: '🍿' });
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4 relative overflow-hidden bg-[#050505]">
      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-primary/20 blur-[150px] rounded-full mix-blend-screen"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 0.5 }}
          className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vh] bg-rose-600/10 blur-[150px] rounded-full mix-blend-screen"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 p-10 rounded-3xl w-full max-w-md bg-white/[0.02] backdrop-blur-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5),inset_0_0_20px_rgba(255,255,255,0.02)]"
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(225,29,72,0.2)]">
            <Film className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-white/50 text-sm font-medium">Log in to continue watching together.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="group">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:shadow-[0_0_20px_rgba(225,29,72,0.15)] transition-all duration-300"
              placeholder="Enter your username"
            />
          </div>
          <div className="group">
            <label className="block text-xs font-bold text-white/40 uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 focus:shadow-[0_0_20px_rgba(225,29,72,0.15)] transition-all duration-300"
              placeholder="••••••••"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl transition-all mt-8 disabled:opacity-50 shadow-[0_0_20px_rgba(225,29,72,0.3)] hover:shadow-[0_0_30px_rgba(225,29,72,0.5)] border border-white/10 flex justify-center items-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Log In'
            )}
          </motion.button>
        </form>

        <p className="text-center text-white/40 text-sm mt-8 font-medium">
          Don't have an account?{' '}
          <Link to="/register" className="text-white hover:text-primary transition-colors underline decoration-white/20 hover:decoration-primary underline-offset-4">
            Register here
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
