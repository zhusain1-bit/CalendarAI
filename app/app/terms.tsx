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

export default function TermsOfService() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.meta}>Last updated: {LAST_UPDATED}</Text>

        <Section title="Acceptance of Terms">
          By using Calify, you agree to these Terms of Service. If you do not agree, do not use
          the app. These terms apply to all users, including free and paid subscribers.
        </Section>

        <Section title="Description of Service">
          Calify is an AI-powered tool that extracts meeting details from screenshots and creates
          calendar events in Google Calendar, Microsoft Outlook, Apple Calendar, or as ICS files.
          The service requires an internet connection and a valid account.
        </Section>

        <Section title="Free and Paid Plans">
          Calify offers a free plan with a limited number of event extractions per account, and
          a paid subscription for unlimited access. Subscription pricing is displayed in the app
          and on our website. Prices are subject to change with reasonable notice.
        </Section>

        <Section title="Subscriptions and Payments">
          Paid subscriptions are billed through Stripe (web) or Apple/Google in-app purchases
          (mobile) and renew automatically until cancelled. Refunds are handled per the policies
          of the respective payment platform. To cancel, use the platform's standard cancellation
          flow or contact us at {SUPPORT_EMAIL}.
        </Section>

        <Section title="Acceptable Use">
          You agree not to:
          {'\n'}• Use Calify for any unlawful purpose.
          {'\n'}• Attempt to circumvent rate limits, paywalls, or authentication.
          {'\n'}• Upload content that violates others' privacy or intellectual property rights.
          {'\n'}• Reverse engineer or attempt to extract the source code of the service.
        </Section>

        <Section title="Intellectual Property">
          Calify and its original content, features, and functionality are owned by us and are
          protected by applicable intellectual property laws. You retain ownership of any content
          you upload.
        </Section>

        <Section title="Disclaimer of Warranties">
          Calify is provided "as is" without warranty of any kind. We do not guarantee that the
          AI extraction will be accurate, complete, or error-free. Always review extracted meeting
          details before creating calendar events.
        </Section>

        <Section title="Limitation of Liability">
          To the maximum extent permitted by law, Calify shall not be liable for any indirect,
          incidental, special, or consequential damages arising from your use of the service,
          including but not limited to missed meetings due to incorrect extractions.
        </Section>

        <Section title="Termination">
          We reserve the right to suspend or terminate your account for violations of these terms.
          You may delete your account at any time by contacting us at {SUPPORT_EMAIL}.
        </Section>

        <Section title="Changes to Terms">
          We may modify these terms at any time. Continued use of Calify after changes constitutes
          acceptance of the new terms. We will indicate the date of the most recent update above.
        </Section>

        <Section title="Governing Law">
          These terms are governed by the laws of the jurisdiction in which Calify operates,
          without regard to conflict of law principles.
        </Section>

        <Section title="Contact">
          Questions about these terms? Contact us at {SUPPORT_EMAIL}.
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
});
