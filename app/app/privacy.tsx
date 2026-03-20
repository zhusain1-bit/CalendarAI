import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';

const LAST_UPDATED = 'March 19, 2026';
const SUPPORT_EMAIL = 'support@calify.app';

export default function PrivacyPolicy() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.meta}>Last updated: {LAST_UPDATED}</Text>

        <Section title="Overview">
          Calify ("we", "us", "our") operates the Calify mobile and web application. This Privacy
          Policy explains what information we collect, how we use it, and your rights regarding
          your data.
        </Section>

        <Section title="Information We Collect">
          <BulletList items={[
            'Account information: name and email address obtained via Google or Microsoft OAuth sign-in.',
            'Calendar event data: meeting details extracted from screenshots you submit (title, date, time, location, attendees). This data is stored to power your event history.',
            'Screenshots: images you upload are sent to Anthropic\'s Claude API for processing and are not stored on our servers after processing.',
            'Usage data: basic analytics such as number of extractions performed, used solely for enforcing free-tier limits.',
            'Subscription information: managed by Stripe (web) or Apple/Google (mobile). We do not store your full payment details.',
          ]} />
        </Section>

        <Section title="How We Use Your Information">
          <BulletList items={[
            'To provide the core service: extracting meeting details and creating calendar events on your behalf.',
            'To enforce subscription limits and process payments.',
            'To authenticate you and maintain your session.',
            'We do not sell your personal data to third parties.',
            'We do not use your data to train AI models.',
          ]} />
        </Section>

        <Section title="Third-Party Services">
          Calify integrates with the following third-party services, each governed by their own privacy policies:
          <BulletList items={[
            'Anthropic (Claude API) — processes screenshot images for meeting extraction.',
            'Google — OAuth authentication and Google Calendar integration.',
            'Microsoft — OAuth authentication and Outlook Calendar integration.',
            'Stripe — payment processing for web subscriptions.',
            'Apple / Google — in-app purchase processing for mobile subscriptions.',
          ]} />
        </Section>

        <Section title="Data Retention">
          We retain your account and event data for as long as your account is active. You may
          delete your account and all associated data at any time by contacting us at {SUPPORT_EMAIL}.
        </Section>

        <Section title="Your Rights">
          Depending on your location, you may have rights to access, correct, or delete your
          personal data. To exercise these rights, contact us at {SUPPORT_EMAIL}.
        </Section>

        <Section title="Children's Privacy">
          Calify is not directed at children under 13. We do not knowingly collect personal
          information from children under 13.
        </Section>

        <Section title="Changes to This Policy">
          We may update this Privacy Policy periodically. We will notify you of material changes
          by updating the "Last updated" date above.
        </Section>

        <Section title="Contact Us">
          Questions? Email us at {SUPPORT_EMAIL}.
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

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={styles.list}>
      {items.map((item, i) => (
        <Text key={i} style={styles.bullet}>• {item}</Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  back: { fontSize: 17, color: '#0066FF', fontWeight: '500', width: 60 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scroll: { padding: 20, paddingBottom: 48, gap: 0 },
  meta: { fontSize: 13, color: '#9CA3AF', marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  body: { fontSize: 14, color: '#374151', lineHeight: 22 },
  list: { marginTop: 6, gap: 6 },
  bullet: { fontSize: 14, color: '#374151', lineHeight: 22, paddingLeft: 4 },
});
