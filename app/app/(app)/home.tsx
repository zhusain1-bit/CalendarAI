import React, { useEffect } from 'react';
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
import { useAuthStore } from '../../src/stores/authStore';
import { useMeetingStore } from '../../src/stores/meetingStore';
import EventCard from '../../src/components/EventCard';
import SubscriptionBanner from '../../src/components/SubscriptionBanner';

export default function Home() {
  const router = useRouter();
  const { user, subscriptionStatus } = useAuthStore();
  const { history, loadHistory } = useMeetingStore();

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const recentEvents = history.slice(0, 3);
  const isSubscribed = subscriptionStatus === 'active';
  const showBanner = !isSubscribed;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {user ? `Hey, ${user.name?.split(' ')[0] ?? 'there'} 👋` : 'Hey there 👋'}
            </Text>
            <Text style={styles.subtitle}>Turn any screenshot into a calendar event</Text>
          </View>
          <Text style={styles.logo}>📅</Text>
        </View>

        {/* Subscription banner */}
        {showBanner && (
          <SubscriptionBanner />
        )}

        {/* Main CTA */}
        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/(app)/capture')}
          activeOpacity={0.9}
        >
          <Text style={styles.ctaEmoji}>📸</Text>
          <Text style={styles.ctaTitle}>Add Meeting from Screenshot</Text>
          <Text style={styles.ctaSubtitle}>Pick a photo or take a new one</Text>
        </TouchableOpacity>

        {/* Recent events */}
        {user && recentEvents.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Events</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/history')}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {/* Empty state for new users */}
        {user && recentEvents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✨</Text>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyText}>
              Take a screenshot of a message with meeting info and tap the button above.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, gap: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  logo: { fontSize: 32 },
  cta: {
    backgroundColor: '#0066FF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaEmoji: { fontSize: 44 },
  ctaTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  ctaSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 14, color: '#0066FF', fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
});
