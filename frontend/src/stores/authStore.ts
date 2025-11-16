import { create } from 'zustand';
import { User, AuthTokens } from '@/types';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: true }),

  setTokens: (tokens) => {
    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    set({ tokens, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  checkAuth: () => {
    const accessToken = localStorage.getItem('access_token');
    const tokens: AuthTokens | null = accessToken
      ? {
          access: accessToken,
          refresh: localStorage.getItem('refresh_token') || '',
        }
      : null;

    if (tokens) {
      set({ tokens, isAuthenticated: true });
      return true;
    }
    return false;
  },
}));
