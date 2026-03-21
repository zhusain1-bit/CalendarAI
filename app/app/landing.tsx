import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

const FEATURES = [
  {
    emoji: '📸',
    title: 'Screenshot any message',
    desc: 'iMessage, WhatsApp, Email, Slack — any app that mentions a meeting.',
  },
  {
    emoji: '🤖',
    title: 'AI extracts the details',
    desc: 'Claude Vision reads the date, time, location, attendees, and title instantly.',
  },
  {
    emoji: '📅',
    title: 'Event created automatically',
    desc: 'One tap and it\'s in Google Calendar, Outlook, or Apple Calendar with invites sent.',
  },
  {
    emoji: '🌐',
    title: 'Works everywhere',
    desc: 'iOS, Android, and web. One account, all your devices.',
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.scroll}>
      {/* Nav */}
      <View style={styles.nav}>
        <Text style={styles.navLogo}>📅 Calify</Text>
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => router.push('/about')}>
            <Text style={styles.navLink}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/pricing')}>
            <Text style={styles.navLink}>Pricing</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navCta}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.navCtaText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroBadge}>AI-powered · Works with any app</Text>
        <Text style={styles.heroTitle}>
          Screenshot a message.{'\n'}Get a calendar invite.
        </Text>
        <Text style={styles.heroSubtitle}>
          Calify reads any screenshot and creates a calendar event with the right date,
          time, location, and attendees — in seconds.
        </Text>

        {/* Product demo mockup */}
        <View style={styles.demoWrap}>
          <View style={styles.demoBubble}>
            <Text style={styles.demoBubbleFrom}>iMessage · Sarah</Text>
            <View style={styles.demoBubbleMsg}>
              <Text style={styles.demoBubbleMsgText}>
                "Hey! Lunch at Nobu Thursday at 1pm? 📍 145 W 67th St. Can you make it?"
              </Text>
            </View>
          </View>

          <View style={styles.demoArrowRow}>
            <View style={styles.demoArrowLine} />
            <Text style={styles.demoArrowLabel}>Calify AI</Text>
            <View style={styles.demoArrowLine} />
          </View>

          <View style={styles.demoEvent}>
            <View style={styles.demoEventHeader}>
              <Text style={styles.demoEventIcon}>📅</Text>
              <Text style={styles.demoEventBadge}>Added to Google Calendar</Text>
            </View>
            <Text style={styles.demoEventTitle}>Lunch with Sarah</Text>
            <Text style={styles.demoEventMeta}>📆 Thursday, Mar 27 · 1:00 – 2:00 PM</Text>
            <Text style={styles.demoEventMeta}>📍 145 W 67th St, New York</Text>
            <Text style={styles.demoEventMeta}>👥 Invite sent to sarah@example.com</Text>
          </View>
        </View>

        <View style={styles.heroCtas}>
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.primaryCtaText}>Try Calify Free →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryCta}
            onPress={() => router.push('/pricing')}
          >
            <Text style={styles.secondaryCtaText}>See Pricing</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.heroNote}>5 free extractions · No credit card required</Text>
      </View>

      {/* Feature grid */}
      <View style={styles.features}>
        <Text style={styles.sectionTitle}>Everything you need</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureCard}>
              <Text style={styles.featureEmoji}>{f.emoji}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA band */}
      <View style={styles.ctaBand}>
        <Text style={styles.ctaBandTitle}>Stop copy-pasting meeting details</Text>
        <Text style={styles.ctaBandSub}>
          One screenshot. Instant calendar event. Works with any messaging app.
        </Text>
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.primaryCtaText}>Get Started Today →</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>📅 Calify</Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => router.push('/pricing')}>
            <Text style={styles.footerLink}>Pricing</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/about')}>
            <Text style={styles.footerLink}>About</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/privacy')}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/terms')}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footerCopy}>© 2026 Calify. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { alignItems: 'center' },

  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 18,
    width: '100%',
    maxWidth: 1100,
  },
  navLogo: { fontSize: 20, fontWeight: '800', color: '#111827' },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  navLink: { fontSize: 15, color: '#6B7280', fontWeight: '500' },
  navCta: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  navCtaText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },

  hero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 80,
    maxWidth: 720,
    gap: 20,
    width: '100%',
  },
  heroBadge: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0066FF',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  heroNote: { fontSize: 13, color: '#9CA3AF', marginTop: -4 },

  demoWrap: {
    width: '100%',
    maxWidth: 480,
    gap: 0,
    marginVertical: 8,
  },
  demoBubble: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  demoBubbleFrom: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  demoBubbleMsg: {
    backgroundColor: '#E9F0FF',
    borderRadius: 12,
    padding: 12,
  },
  demoBubbleMsgText: { fontSize: 15, color: '#1E3A8A', lineHeight: 22 },

  demoArrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  demoArrowLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  demoArrowLabel: { fontSize: 12, fontWeight: '700', color: '#0066FF', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, overflow: 'hidden' },

  demoEvent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#0066FF',
    gap: 6,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  demoEventHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  demoEventIcon: { fontSize: 16 },
  demoEventBadge: { fontSize: 12, fontWeight: '600', color: '#059669', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  demoEventTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  demoEventMeta: { fontSize: 13, color: '#6B7280', lineHeight: 20 },

  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 56,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 30,
    maxWidth: 560,
  },
  heroCtas: { flexDirection: 'row', gap: 14, marginTop: 8 },
  primaryCta: {
    backgroundColor: '#0066FF',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryCtaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  secondaryCta: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 12,
  },
  secondaryCtaText: { color: '#374151', fontWeight: '600', fontSize: 16 },

  features: {
    width: '100%',
    maxWidth: 1100,
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: { fontSize: 32, fontWeight: '800', color: '#111827', textAlign: 'center' },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: 260,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureEmoji: { fontSize: 36 },
  featureTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  featureDesc: { fontSize: 14, color: '#6B7280', lineHeight: 21 },

  ctaBand: {
    width: '100%',
    maxWidth: 700,
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
    gap: 16,
  },
  ctaBandTitle: { fontSize: 36, fontWeight: '800', color: '#111827', textAlign: 'center', lineHeight: 44 },
  ctaBandSub: { fontSize: 17, color: '#6B7280', textAlign: 'center', lineHeight: 26 },

  footer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  footerLogo: { fontSize: 16, fontWeight: '700', color: '#374151' },
  footerLinks: { flexDirection: 'row', gap: 20 },
  footerLink: { fontSize: 14, color: '#6B7280' },
  footerCopy: { fontSize: 12, color: '#9CA3AF' },
});
