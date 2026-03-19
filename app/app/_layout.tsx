import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../src/stores/authStore';
import { initRevenueCat } from '../src/services/revenueCat';

// Completes any in-progress auth session when the app (or popup) loads.
// Must live here so it runs on every page, including the OAuth redirect target.
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    initRevenueCat();
    loadFromStorage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
        <Stack.Screen name="pricing" options={{ presentation: 'modal' }} />
        <Stack.Screen name="about" />
      </Stack>
    </GestureHandlerRootView>
  );
}
