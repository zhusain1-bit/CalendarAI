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
  const { provider, eventUrl, conferenceLink } = useLocalSearchParams<{ provider: string; eventUrl: string; conferenceLink: string }>();
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
          <View style={styles.checkCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>
          <Text style={styles.title}>Event Created!</Text>

          {currentMeeting && (
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle} numberOfLines={2}>{currentMeeting.title}</Text>
              {currentMeeting.date && (
                <Text style={styles.eventMeta}>
                  📅 {currentMeeting.date}
                  {currentMeeting.startTime ? `  ·  ${currentMeeting.startTime}${currentMeeting.endTime ? ` – ${currentMeeting.endTime}` : ''}` : ''}
                </Text>
              )}
              {currentMeeting.location && (
                <Text style={styles.eventMeta} numberOfLines={1}>📍 {currentMeeting.location}</Text>
              )}
            </View>
          )}

          <Text style={styles.subtitle}>
            Added to {providerName}.
            {(provider === 'google' || provider === 'outlook') && ' Invites sent to attendees.'}
            {conferenceLink ? ' Video link included.' : ''}
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            label="Add Another Meeting"
            onPress={() => {
              resetExtraction();
              router.replace('/(app)/capture');
            }}
            variant="primary"
            fullWidth
          />

          {eventUrl ? (
            <Button
              label={`Open in ${providerName}`}
              onPress={handleOpenEvent}
              variant="secondary"
              fullWidth
            />
          ) : null}

          {conferenceLink ? (
            <Button
              label={provider === 'zoom' ? 'Join Zoom Meeting' : 'Join Google Meet'}
              onPress={() => Linking.openURL(conferenceLink)}
              variant="secondary"
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
    paddingTop: 16,
  },
  checkCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIcon: { fontSize: 36, color: '#FFFFFF', fontWeight: '800', lineHeight: 44 },
  title: { fontSize: 28, fontWeight: '800', color: '#111827' },
  eventCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    gap: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eventTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  eventMeta: { fontSize: 14, color: '#6B7280' },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: { gap: 10 },
});
