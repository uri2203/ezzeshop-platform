import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  role: 'client' | 'creator' | 'admin' | 'viewer';
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  locale: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'creator';
  locale?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      setTokens(accessToken, refreshToken) {
        set({ accessToken, refreshToken });
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      async login(email, password) {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          const { user, accessToken, refreshToken } = data.data as { user: User; accessToken: string; refreshToken: string };
          get().setTokens(accessToken, refreshToken);
          set({ user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      async register(registerData) {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', registerData);
          const { user, accessToken, refreshToken } = data.data as { user: User; accessToken: string; refreshToken: string };
          get().setTokens(accessToken, refreshToken);
          set({ user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      async logout() {
        try {
          await api.post('/auth/logout');
        } finally {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, accessToken: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'ezzeshop-auth',
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
