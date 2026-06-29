import { create } from 'zustand';
import * as LocalAuthentication from 'expo-local-authentication';
import api, { tokenStorage } from '../services/api';

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
  isLoading: boolean;
  biometricAvailable: boolean;
  isAuthenticated: boolean;

  checkBiometric: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginOAuth: (data: OAuthData) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'creator';
}

interface OAuthData {
  email: string;
  firstName: string;
  lastName: string;
  provider: 'google' | 'apple' | 'facebook';
  providerId: string;
  role?: 'client' | 'creator';
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  biometricAvailable: false,
  isAuthenticated: false,

  async checkBiometric() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    set({ biometricAvailable: compatible && enrolled });
  },

  async loginWithBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Usa tu biometría para acceder a EzzeShop',
      cancelLabel: 'Cancelar',
      disableDeviceFallback: false,
    });
    if (result.success) {
      await get().loadUser();
      return true;
    }
    return false;
  },

  async login(email, password) {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = data.data as { user: User; accessToken: string; refreshToken: string };
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
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
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  async loginOAuth(oauthData) {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/oauth', oauthData);
      const { user, accessToken, refreshToken } = data.data as { user: User; accessToken: string; refreshToken: string };
      await tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      await tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  async loadUser() {
    const token = await tokenStorage.getAccess();
    if (!token) return;
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data as User, isAuthenticated: true });
    } catch {
      await tokenStorage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },
}));
