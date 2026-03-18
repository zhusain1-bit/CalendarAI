import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMeetingStore } from '../../src/stores/meetingStore';
import Button from '../../src/components/ui/Button';
import { generateAndShareICS } from '../../src/services/icsDownload';

const PROVIDER_NAMES: Record<string, string> = {
  google: 'Google Calendar',
  outlook: 'Outlook',
  apple: 'Apple Calendar',
  ics: 'your calendar app',
};

export default function Success() {
  const router = useRouter();
  const { provider, eventUrl } = useLocalSearchParams<{ provider: string; eventUrl: string }>();
  const { currentMeeting, resetExtraction } = useMeetingStore();

  const providerName = PROVIDER_NAMES[provider ?? ''] ?? 'your calendar';

  function handleDone() {
    resetExtraction();
    router.replace('/(app)/home');
  }

  function handleOpenEvent() {
    if (eventUrl) Linking.openURL(eventUrl);
  }

  async function handleDownloadICS() {
    if (currentMeeting) {
      await generateAndShareICS(currentMeeting);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.checkmark}>✅</Text>
          <Text style={styles.title}>Event Created!</Text>
          <Text style={styles.subtitle}>
            Your meeting has been added to {providerName}.
            {'\n'}Attendees have been notified.
          </Text>
        </View>

        <View style={styles.actions}>
          {eventUrl ? (
            <Button
              label={`Open in ${providerName}`}
              onPress={handleOpenEvent}
              variant="primary"
              fullWidth
            />
          ) : null}

          {provider !== 'ics' && (
            <Button
              label="Also Download as ICS"
              onPress={handleDownloadICS}
              variant="secondary"
              fullWidth
            />
          )}

          <Button
            label="Add Another Meeting"
            onPress={() => {
              resetExtraction();
              router.replace('/(app)/capture');
            }}
            variant="ghost"
            fullWidth
          />

          <Button
            label="Back to Home"
            onPress={handleDone}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  checkmark: { fontSize: 80 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: { gap: 10 },
});
