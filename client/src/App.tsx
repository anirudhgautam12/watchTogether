import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WatchRoom from './pages/WatchRoom';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    // Validate token on mount
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setAuth(data.user, token);
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    };

    checkAuth();
  }, [setAuth, logout]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/room/:roomId" 
              element={
                <ProtectedRoute>
                  <WatchRoom />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        />
      </div>
    </BrowserRouter>
  );
};

export default App;
