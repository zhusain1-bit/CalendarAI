import { create } from 'zustand';
import { storage } from '../utils/storage';
import { api } from '../services/api';
import { identifyRevenueCatUser } from '../services/revenueCat';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  googleAccessToken: string | null;
  microsoftAccessToken: string | null;
  subscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled';
  isLoading: boolean;

  setCredentials: (params: {
    token: string;
    accessToken: string;
    provider: 'google' | 'microsoft';
    user: AuthUser;
  }) => Promise<void>;

  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  googleAccessToken: null,
  microsoftAccessToken: null,
  subscriptionStatus: 'none',
  isLoading: true,

  setCredentials: async ({ token, accessToken, provider, user }) => {
    await storage.setItem('calify_token', token);
    await storage.setItem(`calify_${provider}_access_token`, accessToken);

    set({
      token,
      user,
      googleAccessToken: provider === 'google' ? accessToken : get().googleAccessToken,
      microsoftAccessToken: provider === 'microsoft' ? accessToken : get().microsoftAccessToken,
    });

    await identifyRevenueCatUser(user.id).catch(() => {});
    await get().refreshMe();
  },

  refreshMe: async () => {
    try {
      const data = await api.get<{
        user: AuthUser;
        subscriptionStatus: string;
      }>('/auth/me');
      set({
        user: data.user,
        subscriptionStatus: data.subscriptionStatus as AuthState['subscriptionStatus'],
      });
    } catch {}
  },

  signOut: async () => {
    await storage.removeItem('calify_token');
    await storage.removeItem('calify_google_access_token');
    await storage.removeItem('calify_microsoft_access_token');
    set({
      user: null,
      token: null,
      googleAccessToken: null,
      microsoftAccessToken: null,
      subscriptionStatus: 'none',
    });
  },

  loadFromStorage: async () => {
    try {
      const token = await storage.getItem('calify_token');
      const googleToken = await storage.getItem('calify_google_access_token');
      const msToken = await storage.getItem('calify_microsoft_access_token');

      if (token) {
        set({ token, googleAccessToken: googleToken, microsoftAccessToken: msToken });
        await get().refreshMe();
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
