import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, SafeAreaView,
  ScrollView, Alert, Platform, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMeetingStore } from '../../src/stores/meetingStore';
import Button from '../../src/components/ui/Button';

export default function EventEdit() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { history, updateEvent } = useMeetingStore() as any;

  const event = history.find((e: any) => e.id === id);

  const [title, setTitle] = useState(event?.title ?? '');
  const [date, setDate] = useState(event?.date ?? '');
  const [startTime, setStartTime] = useState(event?.startTime ?? '');
  const [endTime, setEndTime] = useState(event?.endTime ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [saving, setSaving] = useState(false);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.notFound}>Event not found.</Text>
      </SafeAreaView>
    );
  }

  async function handleSave() {
    if (!title.trim()) {
      if (Platform.OS === 'web') { window.alert('Please enter a title for the event.'); } else { Alert.alert('Title required', 'Please enter a title for the event.'); }
      return;
    }
    setSaving(true);
    try {
      await updateEvent(id, {
        title: title.trim(),
        date: date.trim() || null,
        startTime: startTime.trim() || null,
        endTime: endTime.trim() || null,
        location: location.trim() || null,
      });
      router.back();
    } catch (err: any) {
      const msg = err.message ?? 'Could not save changes';
      if (Platform.OS === 'web') { window.alert(msg); } else { Alert.alert('Error', msg); }
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.back} onPress={() => router.back()}>‹ Back</Text>
        <Text style={styles.headerTitle}>Edit Event</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Field label="Title">
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="Date (YYYY-MM-DD)">
          <TextInput
            style={styles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2026-03-25"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="Start Time (HH:MM)">
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={setStartTime}
            placeholder="14:00"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="End Time (HH:MM)">
          <TextInput
            style={styles.input}
            value={endTime}
            onChangeText={setEndTime}
            placeholder="15:00"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Field label="Location">
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Location or meeting link"
            placeholderTextColor="#9CA3AF"
          />
        </Field>

        <Button
          label="Save Changes"
          onPress={handleSave}
          variant="primary"
          loading={saving}
          fullWidth
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFFFFF',
  },
  back: { fontSize: 17, color: '#0066FF', fontWeight: '500', width: 60 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scroll: { padding: 20, gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#111827',
  },
  notFound: { padding: 40, textAlign: 'center', color: '#6B7280' },
});
