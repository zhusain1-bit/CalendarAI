import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';

const SUPPORT_EMAIL = 'support@calify.app';

export default function Support() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="Getting Help">
          If you have questions, issues, or feedback, we're here to help. Email us at{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>{' '}
          and we'll get back to you within 1–2 business days.
        </Section>

        <Section title="Common Issues">
          <BulletList items={[
            'Screenshot not recognized — make sure the image is clear and contains readable meeting details (date, time, title).',
            'Calendar event not created — check that your Google or Outlook calendar is connected in Account settings.',
            'Zoom meeting link not generated — ensure your Zoom account is connected in Account settings.',
            'Subscription not activating — contact us with your email and we\'ll resolve it promptly.',
          ]} />
        </Section>

        <Section title="Zoom Integration">
          Calify uses your connected Zoom account to automatically create Zoom meeting links when
          scheduling events. To connect or disconnect your Zoom account, go to Account → Connected Calendars.
        </Section>

        <Section title="Data & Privacy">
          Screenshots you submit are processed by AI and are not stored on our servers after
          extraction. For full details, see our{' '}
          <Text style={styles.link} onPress={() => router.push('/privacy')}>
            Privacy Policy
          </Text>.
        </Section>

        <Section title="Contact">
          Email:{' '}
          <Text style={styles.link} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
            {SUPPORT_EMAIL}
          </Text>
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
  link: { color: '#0066FF', textDecorationLine: 'underline' },
  list: { marginTop: 6, gap: 6 },
  bullet: { fontSize: 14, color: '#374151', lineHeight: 22, paddingLeft: 4 },
});
