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
  googleRefreshToken: string | null;
  microsoftAccessToken: string | null;
  zoomAccessToken: string | null;
  subscriptionStatus: 'none' | 'active' | 'past_due' | 'canceled';
  isLoading: boolean;

  setCredentials: (params: {
    token: string;
    accessToken: string;
    refreshToken?: string | null;
    provider: 'google' | 'microsoft';
    user: AuthUser;
  }) => Promise<void>;

  connectCalendar: (provider: 'google' | 'microsoft' | 'zoom', code: string, redirectUri: string) => Promise<void>;
  disconnectCalendar: (provider: 'google' | 'microsoft' | 'zoom') => Promise<void>;
  refreshGoogleToken: () => Promise<string | null>;

  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  googleAccessToken: null,
  googleRefreshToken: null,
  microsoftAccessToken: null,
  zoomAccessToken: null,
  subscriptionStatus: 'none',
  isLoading: true,

  setCredentials: async ({ token, accessToken, refreshToken, provider, user }) => {
    await storage.setItem('calify_token', token);
    await storage.setItem(`calify_${provider}_access_token`, accessToken);
    if (provider === 'google' && refreshToken) {
      await storage.setItem('calify_google_refresh_token', refreshToken);
    }

    set({
      token,
      user,
      googleAccessToken: provider === 'google' ? accessToken : get().googleAccessToken,
      googleRefreshToken: provider === 'google' && refreshToken ? refreshToken : get().googleRefreshToken,
      microsoftAccessToken: provider === 'microsoft' ? accessToken : get().microsoftAccessToken,
    });

    await identifyRevenueCatUser(user.id).catch(() => {});
    await get().refreshMe();
  },

  connectCalendar: async (provider, code, redirectUri) => {
    const data = await api.post<{ accessToken: string; refreshToken?: string | null }>(`/auth/connect/${provider}`, { code, redirectUri });
    await storage.setItem(`calify_${provider}_access_token`, data.accessToken);
    if (provider === 'google' && data.refreshToken) {
      await storage.setItem('calify_google_refresh_token', data.refreshToken);
    }
    set(provider === 'google'
      ? { googleAccessToken: data.accessToken, ...(data.refreshToken ? { googleRefreshToken: data.refreshToken } : {}) }
      : provider === 'microsoft'
      ? { microsoftAccessToken: data.accessToken }
      : { zoomAccessToken: data.accessToken }
    );
  },

  disconnectCalendar: async (provider) => {
    await storage.removeItem(`calify_${provider}_access_token`);
    if (provider === 'google') await storage.removeItem('calify_google_refresh_token');
    set(provider === 'google'
      ? { googleAccessToken: null, googleRefreshToken: null }
      : provider === 'microsoft'
      ? { microsoftAccessToken: null }
      : { zoomAccessToken: null }
    );
  },

  refreshGoogleToken: async () => {
    const refreshToken = get().googleRefreshToken ?? await storage.getItem('calify_google_refresh_token');
    if (!refreshToken) return null;
    try {
      const data = await api.post<{ accessToken: string }>('/auth/refresh/google', { refreshToken });
      await storage.setItem('calify_google_access_token', data.accessToken);
      set({ googleAccessToken: data.accessToken });
      return data.accessToken;
    } catch {
      return null;
    }
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
    await storage.removeItem('calify_google_refresh_token');
    await storage.removeItem('calify_microsoft_access_token');
    await storage.removeItem('calify_zoom_access_token');
    set({
      user: null,
      token: null,
      googleAccessToken: null,
      googleRefreshToken: null,
      microsoftAccessToken: null,
      zoomAccessToken: null,
      subscriptionStatus: 'none',
    });
  },

  loadFromStorage: async () => {
    try {
      const token = await storage.getItem('calify_token');
      const googleToken = await storage.getItem('calify_google_access_token');
      const googleRefreshToken = await storage.getItem('calify_google_refresh_token');
      const msToken = await storage.getItem('calify_microsoft_access_token');
      const zoomToken = await storage.getItem('calify_zoom_access_token');

      if (token) {
        set({ token, googleAccessToken: googleToken, googleRefreshToken, microsoftAccessToken: msToken, zoomAccessToken: zoomToken });
        await get().refreshMe();
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
