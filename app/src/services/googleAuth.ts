import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!;

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

export function useGoogleAuth() {
  // On web: use the bare origin (e.g. http://localhost:8081) so Google
  // redirects back to a real page where maybeCompleteAuthSession() runs.
  // On native: use the custom scheme registered in app.json.
  const redirectUri = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri({ preferLocalhost: true })
    : AuthSession.makeRedirectUri({ scheme: 'calify', path: 'auth/callback' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
}
