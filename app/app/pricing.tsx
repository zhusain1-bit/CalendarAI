import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { openStripeCheckout } from '../src/services/stripe';
import { getOfferings, purchasePackage } from '../src/services/revenueCat';
import Button from '../src/components/ui/Button';

const FEATURES = [
  'Unlimited meeting extractions',
  'Google Calendar integration',
  'Zoom meeting link generation',
  'ICS file download (works with Apple Calendar)',
  'Suggest My Availability — AI-drafted replies',
  'Full event history with edit & delete',
];

const COMING_SOON = [
  'Outlook / Microsoft 365',
  'Auto attendee invites',
];

export default function Pricing() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!user) {
      router.push('/(auth)/sign-in');
      return;
    }

    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await openStripeCheckout(
          `${window.location.origin}/account?subscribed=true`,
          `${window.location.origin}/pricing`
        );
      } else {
        const offering = await getOfferings();
        if (!offering?.availablePackages.length) return;
        await purchasePackage(offering.availablePackages[0]);
        router.replace('/(app)/account');
      }
    } catch (err: any) {
      if (!err.userCancelled) console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {Platform.OS === 'web' && (
        <View style={styles.nav}>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={styles.navLogo}>📅 Calify</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eyebrow}>Simple Pricing</Text>
        <Text style={styles.title}>One plan. Full access.</Text>
        <Text style={styles.subtitle}>
          Everything you need to stop copy-pasting meeting details forever.
        </Text>

        <View style={styles.card}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>$4.99</Text>
            <View>
              <Text style={styles.period}>/month</Text>
              <Text style={styles.priceNote}>Cancel anytime</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.features}>
            {FEATURES.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureCheck}>✓</Text>
                <Text style={styles.feature}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.comingSoonBox}>
            <Text style={styles.comingSoonLabel}>Coming Soon</Text>
            {COMING_SOON.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.comingSoonDot}>⏳</Text>
                <Text style={styles.comingSoonFeature}>{f}</Text>
              </View>
            ))}
          </View>

          <Button
            label={user ? 'Get Calify Now →' : 'Sign Up to Subscribe →'}
            onPress={handleSubscribe}
            variant="primary"
            loading={loading}
            fullWidth
            style={styles.ctaBtn}
          />

          <Text style={styles.guarantee}>
            30-day money-back guarantee. No questions asked.
          </Text>
        </View>

        <Text style={styles.faq}>
          Works with iMessage, WhatsApp, Gmail, Slack, Teams, and any app. iOS,
          Android, and web.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  nav: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navLogo: { fontSize: 20, fontWeight: '800', color: '#111827' },
  scroll: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 60, gap: 20 },
  eyebrow: { fontSize: 13, fontWeight: '700', color: '#0066FF', letterSpacing: 1, textTransform: 'uppercase' },
  title: { fontSize: 38, fontWeight: '900', color: '#111827', textAlign: 'center', lineHeight: 46, letterSpacing: -0.5 },
  subtitle: { fontSize: 17, color: '#6B7280', textAlign: 'center', lineHeight: 26, maxWidth: 480 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 460,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 20 },
  price: { fontSize: 64, fontWeight: '900', color: '#111827', lineHeight: 68 },
  period: { fontSize: 20, fontWeight: '600', color: '#6B7280' },
  priceNote: { fontSize: 13, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginBottom: 20 },
  features: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureCheck: { fontSize: 15, color: '#059669', fontWeight: '700', width: 16 },
  feature: { fontSize: 15, color: '#374151', lineHeight: 22, flex: 1 },
  comingSoonBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  comingSoonLabel: { fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  comingSoonDot: { fontSize: 13, width: 16 },
  comingSoonFeature: { fontSize: 14, color: '#9CA3AF', flex: 1 },
  ctaBtn: { marginBottom: 14 },
  guarantee: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
  faq: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 22, maxWidth: 420 },
});
