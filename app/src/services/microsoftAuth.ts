import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

const MS_CLIENT_ID = process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID!;
const TENANT = 'common';

const discovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${TENANT}/oauth2/v2.0/token`,
};

const SCOPES = [
  'openid',
  'profile',
  'email',
  'offline_access',
  'Calendars.ReadWrite',
];

export function useMicrosoftAuth() {
  const redirectUri = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri({ preferLocalhost: true })
    : AuthSession.makeRedirectUri({ scheme: 'calify', path: 'auth/callback' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MS_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
}
