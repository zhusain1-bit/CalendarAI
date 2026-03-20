import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useAuthStore } from '../../src/stores/authStore';
import { useMeetingStore } from '../../src/stores/meetingStore';
import { api } from '../../src/services/api';
import { withGoogleRefresh } from '../../src/utils/withGoogleRefresh';
import Button from '../../src/components/ui/Button';
import LoadingOverlay from '../../src/components/ui/LoadingOverlay';
import AvailabilityPrefsSheet, {
  type AvailabilityPreferences,
} from '../../src/components/AvailabilityPrefsSheet';
import type { FreeSlot } from '../../src/components/AvailabilityPrefsSheet';
import type { MeetingData } from '../../src/stores/meetingStore';
import { useSettingsStore, formatTimeWithSettings } from '../../src/stores/settingsStore';

function formatSlotDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z');
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}


export default function AvailabilityReply() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reply: string;
    slotsJson: string;
    meetingJson: string;
    prefsJson: string;
  }>();

  const { googleAccessToken, refreshGoogleToken } = useAuthStore();
  const { timeFormat } = useSettingsStore();
  const { resetExtraction } = useMeetingStore();

  const initialSlots: FreeSlot[] = JSON.parse(params.slotsJson ?? '[]');
  const meeting: MeetingData = JSON.parse(params.meetingJson ?? '{}');
  const initialPrefs: AvailabilityPreferences = JSON.parse(params.prefsJson ?? '{}');

  const [currentReply, setCurrentReply] = useState(params.reply ?? '');
  const [slots, setSlots] = useState<FreeSlot[]>(initialSlots);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [prefsSheetVisible, setPrefsSheetVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    await Clipboard.setStringAsync(currentReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate(newPrefs?: AvailabilityPreferences) {
    setRegenerating(true);
    setPrefsSheetVisible(false);
    setError(null);
    try {
      const result = await withGoogleRefresh(
        (token) => api.post<{ reply: string; slots: FreeSlot[] }>(
          '/availability/suggest',
          { accessToken: token, meeting, preferences: newPrefs ?? initialPrefs }
        ),
        () => googleAccessToken,
        refreshGoogleToken
      );
      setCurrentReply(result.reply);
      setSlots(result.slots);
    } catch (err: any) {
      setError(err.message ?? 'Could not regenerate reply');
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Suggested Reply</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Slot chips */}
        <Text style={styles.sectionLabel}>Suggested times</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotScroll}>
          {slots.map((slot, i) => (
            <View key={i} style={styles.slotChip}>
              <Text style={styles.slotChipDate}>{formatSlotDate(slot.date)}</Text>
              <Text style={styles.slotChipTime}>
                {formatTimeWithSettings(slot.startTime, timeFormat)}–{formatTimeWithSettings(slot.endTime, timeFormat)}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Editable reply */}
        <Text style={styles.sectionLabel}>Your reply</Text>
        <View style={styles.replyCard}>
          <TextInput
            style={styles.replyInput}
            multiline
            value={currentReply}
            onChangeText={setCurrentReply}
            textAlignVertical="top"
            placeholder="Generating reply..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={copied ? 'Copied ✓' : 'Copy Reply'}
            onPress={handleCopy}
            variant="primary"
            fullWidth
          />
          <Button
            label="Regenerate"
            onPress={() => handleRegenerate()}
            variant="secondary"
            fullWidth
          />
          <Button
            label="Tweak Preferences"
            onPress={() => setPrefsSheetVisible(true)}
            variant="ghost"
            fullWidth
          />
          <Button
            label="Back to Home"
            onPress={() => {
              resetExtraction();
              router.replace('/(app)/home');
            }}
            variant="ghost"
            fullWidth
          />
        </View>
      </ScrollView>

      <LoadingOverlay visible={regenerating} message="Regenerating reply..." />

      <AvailabilityPrefsSheet
        visible={prefsSheetVisible}
        onClose={() => setPrefsSheetVisible(false)}
        onSubmit={(newPrefs) => handleRegenerate(newPrefs)}
        loading={regenerating}
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
  scroll: { padding: 20, gap: 12, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  slotScroll: { marginBottom: 4 },
  slotChip: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    alignItems: 'center',
  },
  slotChipDate: { fontSize: 12, fontWeight: '600', color: '#0066FF' },
  slotChipTime: { fontSize: 13, color: '#374151', marginTop: 2 },
  replyCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 14,
    minHeight: 180,
  },
  replyInput: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 24,
    minHeight: 160,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#B91C1C' },
  actions: { gap: 10, marginTop: 8 },
});
