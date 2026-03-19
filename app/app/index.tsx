import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import LandingPage from './landing';

export default function Index() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (Platform.OS !== 'web' && !isLoading) {
      if (user) {
        router.replace('/(app)/home');
      } else {
        router.replace('/(auth)/sign-in');
      }
    }
  }, [user, isLoading]);

  // Web: always show landing page
  if (Platform.OS === 'web') {
    return <LandingPage />;
  }

  // Native: renders nothing while redirecting
  return null;
}
