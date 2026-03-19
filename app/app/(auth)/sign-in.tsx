import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';
import { useGoogleAuth } from '../../src/services/googleAuth';
import { useMicrosoftAuth } from '../../src/services/microsoftAuth';
import { useAuthStore } from '../../src/stores/authStore';
import { api } from '../../src/services/api';
import Button from '../../src/components/ui/Button';
import LoadingOverlay from '../../src/components/ui/LoadingOverlay';

export default function SignIn() {
  const router = useRouter();
  const { setCredentials } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('Signing in...');

  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogle, redirectUri: googleRedirectUri } = useGoogleAuth();
  const { request: msRequest, response: msResponse, promptAsync: promptMicrosoft, redirectUri: msRedirectUri } = useMicrosoftAuth();

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { code } = googleResponse.params;
      handleGoogleCode(code);
    }
  }, [googleResponse]);

  // Handle Microsoft OAuth response
  useEffect(() => {
    if (msResponse?.type === 'success') {
      const { code } = msResponse.params;
      handleMicrosoftCode(code);
    }
  }, [msResponse]);

  async function handleGoogleCode(code: string) {
    setLoading(true);
    setLoadingMsg('Signing in with Google...');
    try {
      const data = await api.post<{
        token: string;
        accessToken: string;
        user: any;
      }>('/auth/google', { code, redirectUri: googleRedirectUri });

      await setCredentials({
        token: data.token,
        accessToken: data.accessToken,
        provider: 'google',
        user: data.user,
      });

      router.replace('/(app)/home');
    } catch (err: any) {
      console.error('Google sign-in error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleMicrosoftCode(code: string) {
    setLoading(true);
    setLoadingMsg('Signing in with Microsoft...');
    try {
      const data = await api.post<{
        token: string;
        accessToken: string;
        user: any;
      }>('/auth/microsoft', { code, redirectUri: msRedirectUri });

      await setCredentials({
        token: data.token,
        accessToken: data.accessToken,
        provider: 'microsoft',
        user: data.user,
      });

      router.replace('/(app)/home');
    } catch (err: any) {
      console.error('Microsoft sign-in error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.logo}>📅</Text>
          <Text style={styles.appName}>Calify</Text>
          <Text style={styles.tagline}>
            Screenshot a message.{'\n'}Get a calendar invite. Instantly.
          </Text>
        </View>

        <View style={styles.buttons}>
          <Button
            label="Continue with Google"
            onPress={() => promptGoogle()}
            disabled={!googleRequest || loading}
            variant="primary"
            fullWidth
          />

          <Button
            label="Continue with Microsoft"
            onPress={() => promptMicrosoft()}
            disabled={!msRequest || loading}
            variant="secondary"
            fullWidth
          />

          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => router.replace('/(app)/home')}
          >
            <Text style={styles.skipText}>Skip — use without account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
          Signing in enables calendar sync and event history.
        </Text>
      </View>

      <LoadingOverlay visible={loading} message={loadingMsg} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  logo: { fontSize: 72 },
  appName: { fontSize: 36, fontWeight: '800', color: '#111827', letterSpacing: -0.5 },
  tagline: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 4,
  },
  buttons: { gap: 12 },
  skipBtn: { paddingVertical: 14, alignItems: 'center' },
  skipText: { fontSize: 15, color: '#9CA3AF' },
  legal: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 16,
  },
});
