import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';

export function initRevenueCat() {
  if (Platform.OS === 'web') return; // RevenueCat is mobile-only

  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS!
      : process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID!;

  if (!apiKey) return;

  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
}

export async function identifyRevenueCatUser(userId: string) {
  if (Platform.OS === 'web') return;
  await Purchases.logIn(userId);
}

export async function getOfferings() {
  if (Platform.OS === 'web') return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export async function purchasePackage(pkg: any) {
  const result = await Purchases.purchasePackage(pkg);
  return result;
}
