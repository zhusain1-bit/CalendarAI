import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function Docs() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>How to Use Calify</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="What is Calify?">
          Calify is an AI-powered app that reads meeting details from screenshots, messages, or
          emails and instantly creates calendar events — including Zoom meeting links — without
          any manual data entry.
        </Section>

        <Section title="Step 1 — Sign In">
          Sign in with your Google or Microsoft account. This connects your calendar so Calify
          can create events on your behalf.
        </Section>

        <Section title="Step 2 — Connect Your Calendar">
          Go to Account → Connected Calendars and connect Google Calendar, Microsoft Outlook,
          or both. You can also connect Zoom to auto-generate meeting links.
        </Section>

        <Section title="Step 3 — Capture a Screenshot">
          On the Capture screen, upload a screenshot or image containing meeting details —
          an email invite, a chat message, a flyer, or any text with a date, time, and title.
        </Section>

        <Section title="Step 4 — Review and Confirm">
          Calify's AI extracts the meeting details and shows you a preview. Review the title,
          date, time, location, and attendees. Edit anything that looks off before saving.
        </Section>

        <Section title="Step 5 — Add to Calendar">
          Tap "Create Calendar Event" to add the event directly to your connected calendar.
          If Zoom is connected and the meeting is virtual, a Zoom link is generated automatically.
        </Section>

        <Section title="Zoom Integration">
          When you connect your Zoom account, Calify can create Zoom meetings on your behalf.
          The generated meeting link is embedded in the calendar event so all attendees receive it.
          To connect Zoom: Account → Connected Calendars → Zoom → Connect.
        </Section>

        <Section title="Free Plan vs Pro">
          Free plan includes 10 event extractions. Upgrade to Calify Pro ($4.99/month) for
          unlimited extractions, priority processing, and full access to all features.
        </Section>

        <Section title="Suggest My Availability">
          After extracting a meeting request, tap "Suggest My Availability" on the preview screen.
          Calify checks your Google Calendar for free slots and drafts a reply you can copy and send.
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  back: { fontSize: 17, color: '#0066FF', fontWeight: '500', width: 60 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scroll: { padding: 20, paddingBottom: 48 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
