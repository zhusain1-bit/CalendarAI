import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

const ZOOM_CLIENT_ID = process.env.EXPO_PUBLIC_ZOOM_CLIENT_ID!;

const discovery = {
  authorizationEndpoint: 'https://zoom.us/oauth/authorize',
  tokenEndpoint: 'https://zoom.us/oauth/token',
};

const SCOPES = ['meeting:write:meeting'];

export function useZoomAuth() {
  const redirectUri = Platform.OS === 'web'
    ? AuthSession.makeRedirectUri()
    : AuthSession.makeRedirectUri({ scheme: 'calify', path: 'auth/callback' });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: ZOOM_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: false,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
}
