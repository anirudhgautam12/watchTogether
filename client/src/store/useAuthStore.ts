import { create } from 'zustand';

interface User {
  id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isCheckingAuth: boolean;
  setAuth: (user: User, token: string) => void;
  setAuthChecking: (isChecking: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isCheckingAuth: !!localStorage.getItem('token'),
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token, isCheckingAuth: false });
  },
  setAuthChecking: (isCheckingAuth) => set({ isCheckingAuth }),
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isCheckingAuth: false });
  },
}));
