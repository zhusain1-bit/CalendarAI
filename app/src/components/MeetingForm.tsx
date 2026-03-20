import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import TextInput from './ui/TextInput';
import DatePickerField from './ui/DatePickerField';
import TimePickerField from './ui/TimePickerField';
import TimezonePickerField from './ui/TimezonePickerField';
import AttendeeRow from './ui/AttendeeRow';
import type { MeetingData, Attendee } from '../stores/meetingStore';

interface Props {
  meeting: MeetingData;
  onChange: (updated: MeetingData) => void;
}

export default function MeetingForm({ meeting, onChange }: Props) {
  const update = (field: keyof MeetingData, value: any) =>
    onChange({ ...meeting, [field]: value });

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const next = meeting.attendees.map((a, i) =>
      i === index ? { ...a, [field]: value || null } : a
    );
    update('attendees', next);
  };

  const removeAttendee = (index: number) => {
    update('attendees', meeting.attendees.filter((_, i) => i !== index));
  };

  const addAttendee = () => {
    update('attendees', [...meeting.attendees, { name: '', email: null }]);
  };

  return (
    <View style={styles.container}>
      {meeting.confidence === 'low' && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            ⚠️ Low confidence — please review and fill in any missing details
          </Text>
        </View>
      )}

      <TextInput
        label="Meeting Title *"
        value={meeting.title}
        onChangeText={(v) => update('title', v)}
        placeholder="e.g. Product Sync"
      />

      <View style={styles.row}>
        <DatePickerField
          label="Date"
          value={meeting.date}
          onChange={(v) => update('date', v)}
          containerStyle={styles.half}
        />
        <TimezonePickerField
          label="Timezone"
          value={meeting.timezone}
          onChange={(v) => update('timezone', v)}
          containerStyle={styles.half}
        />
      </View>

      <View style={styles.row}>
        <TimePickerField
          label="Start Time"
          value={meeting.startTime}
          onChange={(v) => update('startTime', v)}
          containerStyle={styles.half}
        />
        <TimePickerField
          label="End Time"
          value={meeting.endTime}
          onChange={(v) => update('endTime', v)}
          containerStyle={styles.half}
        />
      </View>

      <TextInput
        label="Location"
        value={meeting.location ?? ''}
        onChangeText={(v) => update('location', v || null)}
        placeholder="e.g. Conference Room B or Zoom link"
      />

      <TextInput
        label="Description"
        value={meeting.description ?? ''}
        onChangeText={(v) => update('description', v || null)}
        placeholder="Add a description or agenda..."
        multiline
        numberOfLines={4}
        style={styles.multiline}
      />

      <Text style={styles.sectionLabel}>Attendees</Text>

      {meeting.attendees.map((attendee, i) => (
        <AttendeeRow
          key={i}
          attendee={attendee}
          index={i}
          onChange={updateAttendee}
          onRemove={removeAttendee}
        />
      ))}

      <TouchableOpacity onPress={addAttendee} style={styles.addAttendeeBtn}>
        <Text style={styles.addAttendeeText}>+ Add Attendee</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  half: { flex: 1 },
  multiline: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 4 },
  addAttendeeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  addAttendeeText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  warningBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 12,
  },
  warningText: { fontSize: 13, color: '#92400E', lineHeight: 18 },
});
