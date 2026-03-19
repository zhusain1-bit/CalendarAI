import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMeetingStore } from '../../src/stores/meetingStore';
import { useAuthStore } from '../../src/stores/authStore';
import MeetingForm from '../../src/components/MeetingForm';
import CalendarProviderSheet, { type CalendarProvider } from '../../src/components/CalendarProviderSheet';
import Button from '../../src/components/ui/Button';
import { api } from '../../src/services/api';
import { createNativeCalendarEvent } from '../../src/services/appleCalendar';
import { generateAndShareICS } from '../../src/services/icsDownload';
import type { MeetingData } from '../../src/stores/meetingStore';

export default function Preview() {
  const router = useRouter();
  const { currentMeeting, updateCurrentMeeting, resetExtraction, saveEvent } = useMeetingStore();
  const { googleAccessToken, microsoftAccessToken, user } = useAuthStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentMeeting) {
      router.replace('/(app)/capture');
    }
  }, [currentMeeting]);

  if (!currentMeeting) return null;

  async function handleProviderSelect(provider: CalendarProvider) {
    setCreating(true);
    try {
      let calendarEventId: string | null = null;
      let calendarEventUrl: string | null = null;

      if (provider === 'google') {
        const result = await api.post<{ eventId: string; eventUrl: string }>(
          '/calendar/create',
          { provider: 'google', accessToken: googleAccessToken, meeting: currentMeeting }
        );
        calendarEventId = result.eventId;
        calendarEventUrl = result.eventUrl;
      } else if (provider === 'outlook') {
        const result = await api.post<{ eventId: string; eventUrl: string }>(
          '/calendar/create',
          { provider: 'outlook', accessToken: microsoftAccessToken, meeting: currentMeeting }
        );
        calendarEventId = result.eventId;
        calendarEventUrl = result.eventUrl;
      } else if (provider === 'apple') {
        const eventId = await createNativeCalendarEvent(currentMeeting);
        calendarEventId = eventId;
      } else if (provider === 'ics') {
        await generateAndShareICS(currentMeeting);
        setSheetVisible(false);
        setCreating(false);
        return;
      }

      // Save to history (if signed in)
      if (user) {
        await saveEvent({
          title: currentMeeting.title,
          date: currentMeeting.date,
          startTime: currentMeeting.startTime,
          endTime: currentMeeting.endTime,
          timezone: currentMeeting.timezone,
          location: currentMeeting.location,
          description: currentMeeting.description,
          attendees: currentMeeting.attendees,
          calendarProvider: provider,
          calendarEventId,
          calendarEventUrl,
          rawExtraction: currentMeeting as any,
        });
      }

      setSheetVisible(false);
      router.push({
        pathname: '/(app)/success',
        params: { provider, eventUrl: calendarEventUrl ?? '' },
      });
    } catch (err: any) {
      setSheetVisible(false);
      setError(err.message ?? 'Could not create calendar event');
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            resetExtraction();
            router.back();
          }}
          hitSlop={8}
        >
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Review Meeting</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.instruction}>
          Review and edit the extracted details before creating the event.
        </Text>

        <MeetingForm
          meeting={currentMeeting}
          onChange={(updated) => updateCurrentMeeting(updated)}
        />

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <Button
          label="Create Calendar Event →"
          onPress={() => { setError(null); setSheetVisible(true); }}
          variant="primary"
          fullWidth
          style={styles.createBtn}
        />
      </ScrollView>

      <CalendarProviderSheet
        visible={sheetVisible}
        onSelect={handleProviderSelect}
        onClose={() => setSheetVisible(false)}
        loading={creating}
      />
    </SafeAreaView>
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
  },
  backBtn: { fontSize: 17, color: '#0066FF', fontWeight: '500', width: 60 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  instruction: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  errorBanner: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { fontSize: 14, color: '#B91C1C' },
  createBtn: { marginTop: 8 },
});
