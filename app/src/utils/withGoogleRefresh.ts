import { ApiError } from '../services/api';

/**
 * Calls fn(token). If the server returns GOOGLE_TOKEN_EXPIRED, refreshes
 * the token and retries once. Throws on any other error.
 */
export async function withGoogleRefresh<T>(
  fn: (token: string) => Promise<T>,
  getToken: () => string | null,
  refresh: () => Promise<string | null>
): Promise<T> {
  const token = getToken();
  if (!token) throw new Error('Google account not connected');

  try {
    return await fn(token);
  } catch (err: any) {
    if (err instanceof ApiError && err.code === 'GOOGLE_TOKEN_EXPIRED') {
      const newToken = await refresh();
      if (!newToken) {
        throw new Error('Google session expired. Please go to Account and reconnect Google Calendar.');
      }
      return await fn(newToken);
    }
    throw err;
  }
}
