import React from 'react';
import { Film, LogOut } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 px-6 py-3 flex items-center justify-between bg-black/40 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all">
      <div 
        className="flex items-center gap-2.5 cursor-pointer group"
        onClick={() => navigate('/')}
      >
        <Film className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
        <span className="text-lg font-bold tracking-tight text-white/90 group-hover:text-white transition-colors">
          Watch<span className="text-primary">Together</span>
        </span>
      </div>

      {user && (
        <div className="flex items-center gap-5">
          <span className="text-sm font-medium text-white/60 tracking-wide">Hi, {user.username}</span>
          <button
            onClick={handleLogout}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 text-white/60 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
