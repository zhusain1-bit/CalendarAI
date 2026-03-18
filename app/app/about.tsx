import React from 'react';
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

export default function About() {
  const router = useRouter();

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
        <Text style={styles.title}>About Calify</Text>
        <Text style={styles.body}>
          Calify was built to solve a simple but annoying problem: when someone sends you
          a message like "Let's meet Tuesday at 3pm at the Starbucks on 5th", you
          still have to manually open your calendar app, create a new event, type everything
          in, and invite everyone.
        </Text>

        <Text style={styles.body}>
          With Calify, you take a screenshot of that message. In seconds, AI extracts
          the meeting details and creates the calendar event — with invites sent automatically.
        </Text>

        <Text style={styles.body}>
          It works with any messaging app: iMessage, WhatsApp, Gmail, Slack, Teams,
          Telegram, and more. And it syncs with Google Calendar, Outlook, and Apple Calendar.
        </Text>

        <Text style={styles.sectionTitle}>The technology</Text>
        <Text style={styles.body}>
          Calify uses Claude (by Anthropic), a state-of-the-art AI model with powerful
          vision capabilities, to read and understand screenshots. Your image is processed
          securely and never stored.
        </Text>

        <TouchableOpacity
          style={styles.cta}
          onPress={() => router.push('/pricing')}
        >
          <Text style={styles.ctaText}>View Pricing →</Text>
        </TouchableOpacity>
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
  scroll: { paddingHorizontal: 32, paddingVertical: 60, maxWidth: 700, alignSelf: 'center', gap: 20 },
  title: { fontSize: 38, fontWeight: '900', color: '#111827', letterSpacing: -0.5, marginBottom: 8 },
  body: { fontSize: 17, color: '#374151', lineHeight: 28 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginTop: 12 },
  cta: {
    backgroundColor: '#0066FF',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});
