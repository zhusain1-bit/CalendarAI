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
import { useSettingsStore } from '../../src/stores/settingsStore';
import MeetingForm from '../../src/components/MeetingForm';
import CalendarProviderSheet, { type CalendarProvider } from '../../src/components/CalendarProviderSheet';
import Button from '../../src/components/ui/Button';
import { api } from '../../src/services/api';
import { withGoogleRefresh } from '../../src/utils/withGoogleRefresh';
import { createNativeCalendarEvent } from '../../src/services/appleCalendar';
import { generateAndShareICS } from '../../src/services/icsDownload';
import type { MeetingData } from '../../src/stores/meetingStore';

export default function Preview() {
  const router = useRouter();
  const { currentMeeting, updateCurrentMeeting, resetExtraction, saveEvent } = useMeetingStore();
  const { googleAccessToken, microsoftAccessToken, zoomAccessToken, user, refreshGoogleToken } = useAuthStore();
  const { defaultMeetingDuration, defaultCalendarProvider } = useSettingsStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conferenceType, setConferenceType] = useState<'none' | 'meet' | 'zoom'>('none');

  useEffect(() => {
    if (!currentMeeting) {
      router.replace('/(app)/capture');
      return;
    }
    // Pre-fill end time if missing
    if (!currentMeeting.endTime && currentMeeting.startTime) {
      const [h, min] = currentMeeting.startTime.split(':').map(Number);
      const totalMin = h * 60 + min + defaultMeetingDuration;
      const endH = Math.floor(totalMin / 60) % 24;
      const endM = totalMin % 60;
      updateCurrentMeeting({
        endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      });
    }
  }, []);

  if (!currentMeeting) return null;

  // Apply default duration if endTime is missing
  function meetingWithDefaults(m: typeof currentMeeting) {
    if (!m || m.endTime || !m.startTime) return m;
    const [h, min] = m.startTime.split(':').map(Number);
    const totalMin = h * 60 + min + defaultMeetingDuration;
    const endH = Math.floor(totalMin / 60) % 24;
    const endM = totalMin % 60;
    return {
      ...m,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
    };
  }

  async function handleProviderSelect(provider: CalendarProvider) {
    setCreating(true);
    const meeting = meetingWithDefaults(currentMeeting);
    try {
      let calendarEventId: string | null = null;
      let calendarEventUrl: string | null = null;
      let calendarConferenceLink: string | null = null;

      if (provider === 'google') {
        const result = await withGoogleRefresh(
          (token) => api.post<{ eventId: string; eventUrl: string; conferenceLink?: string }>(
            '/calendar/create',
            {
              provider: 'google',
              accessToken: token,
              meeting,
              conferenceType: conferenceType !== 'none' ? conferenceType : undefined,
              zoomAccessToken: conferenceType === 'zoom' ? zoomAccessToken : undefined,
            }
          ),
          () => googleAccessToken,
          refreshGoogleToken
        );
        calendarEventId = result.eventId;
        calendarEventUrl = result.eventUrl;
        calendarConferenceLink = result.conferenceLink ?? null;
      } else if (provider === 'outlook') {
        const result = await api.post<{ eventId: string; eventUrl: string; conferenceLink?: string }>(
          '/calendar/create',
          {
            provider: 'outlook',
            accessToken: microsoftAccessToken,
            meeting,
            conferenceType: conferenceType !== 'none' ? conferenceType : undefined,
            zoomAccessToken: conferenceType === 'zoom' ? zoomAccessToken : undefined,
          }
        );
        calendarEventId = result.eventId;
        calendarEventUrl = result.eventUrl;
        calendarConferenceLink = result.conferenceLink ?? null;
      } else if (provider === 'apple') {
        const eventId = await createNativeCalendarEvent(meeting);
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
        params: { provider, eventUrl: calendarEventUrl ?? '', conferenceLink: calendarConferenceLink ?? '' },
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

        <View style={styles.conferenceRow}>
          <Text style={styles.conferenceLabel}>Video conference</Text>
          <View style={styles.conferenceChips}>
            {(['none', 'meet', 'zoom'] as const).map((ct) => {
              const labels = { none: 'None', meet: '🎥 Google Meet', zoom: '🟦 Zoom' };
              const disabled = (ct === 'meet' && !googleAccessToken) || (ct === 'zoom' && !zoomAccessToken);
              const selected = conferenceType === ct;
              return (
                <TouchableOpacity
                  key={ct}
                  style={[styles.confChip, selected && styles.confChipSelected, disabled && styles.confChipDisabled]}
                  onPress={() => !disabled && setConferenceType(ct)}
                  activeOpacity={disabled ? 1 : 0.7}
                >
                  <Text style={[styles.confChipText, selected && styles.confChipTextSelected, disabled && styles.confChipTextDisabled]}>
                    {labels[ct]}{disabled ? ' (not connected)' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        <Button
          label="Create Calendar Event →"
          onPress={() => {
            setError(null);
            if (defaultCalendarProvider) {
              handleProviderSelect(defaultCalendarProvider as any);
            } else {
              setSheetVisible(true);
            }
          }}
          variant="primary"
          fullWidth
          style={styles.createBtn}
        />
      </ScrollView>

      <CalendarProviderSheet
        visible={sheetVisible}
        onSelect={handleProviderSelect}
        onClose={() => setSheetVisible(false)}
        onConnectRequest={() => router.push('/(app)/account')}
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
  conferenceRow: { gap: 6 },
  conferenceLabel: { fontSize: 14, fontWeight: '600', color: '#374151' },
  conferenceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  confChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  confChipSelected: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  confChipDisabled: { opacity: 0.4 },
  confChipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  confChipTextSelected: { color: '#FFFFFF' },
  confChipTextDisabled: {},
});
