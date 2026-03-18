import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import { openStripeCheckout, openStripeBillingPortal } from '../../src/services/stripe';
import { getOfferings, purchasePackage } from '../../src/services/revenueCat';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '✅ Active', color: '#059669' },
  past_due: { label: '⚠️ Past Due', color: '#D97706' },
  canceled: { label: '❌ Canceled', color: '#DC2626' },
  none: { label: 'No subscription', color: '#6B7280' },
};

export default function Account() {
  const router = useRouter();
  const { user, subscriptionStatus, subscriptionPeriodEnd, signOut, refreshMe } = useAuthStore() as any;
  const [loading, setLoading] = useState(false);

  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.none;

  async function handleSubscribe() {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await openStripeCheckout(
          `${window.location.origin}/account?subscribed=true`,
          `${window.location.origin}/pricing`
        );
      } else {
        const offering = await getOfferings();
        if (!offering) {
          Alert.alert('Error', 'No subscription plans available at this time.');
          return;
        }
        const pkg = offering.availablePackages[0];
        await purchasePackage(pkg);
        await refreshMe();
        Alert.alert('Success!', 'Your subscription is now active.');
      }
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert('Error', err.message ?? 'Could not complete purchase');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await openStripeBillingPortal(`${window.location.origin}/account`);
      } else {
        Alert.alert('Manage Subscription', 'Manage your subscription in your device settings.', [
          { text: 'OK' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyTitle}>Not signed in</Text>
          <Button
            label="Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Account</Text>

        {/* Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name ?? 'User'}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        </Card>

        {/* Subscription */}
        <Card style={styles.subCard}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>

          {subscriptionStatus === 'active' ? (
            <>
              <Button
                label="Manage Subscription"
                onPress={handleManageSubscription}
                variant="secondary"
                loading={loading}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </>
          ) : (
            <>
              <Text style={styles.subDesc}>
                Subscribe to create unlimited calendar events from screenshots.
              </Text>
              <Button
                label="Subscribe — Unlock Full Access"
                onPress={handleSubscribe}
                variant="primary"
                loading={loading}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </Card>

        {/* Actions */}
        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  profileCard: { padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  subCard: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusText: { fontSize: 17, fontWeight: '700' },
  subDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
});
