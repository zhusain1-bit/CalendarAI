import { Linking, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { api } from './api';

export async function openStripeCheckout(successUrl: string, cancelUrl: string) {
  const { url } = await api.post<{ url: string }>('/billing/create-checkout', {
    successUrl,
    cancelUrl,
  });

  if (Platform.OS === 'web') {
    window.location.href = url;
  } else {
    await WebBrowser.openBrowserAsync(url);
  }
}

export async function openStripeBillingPortal(returnUrl: string) {
  const { url } = await api.post<{ url: string }>('/billing/portal', { returnUrl });

  if (Platform.OS === 'web') {
    window.location.href = url;
  } else {
    await WebBrowser.openBrowserAsync(url);
  }
}
