import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import TextInput from './TextInput';
import type { Attendee } from '../../stores/meetingStore';

interface Props {
  attendee: Attendee;
  index: number;
  onChange: (index: number, field: keyof Attendee, value: string) => void;
  onRemove: (index: number) => void;
}

export default function AttendeeRow({ attendee, index, onChange, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.fields}>
        <TextInput
          value={attendee.name}
          onChangeText={(v) => onChange(index, 'name', v)}
          placeholder="Name"
          containerStyle={styles.nameField}
        />
        <TextInput
          value={attendee.email ?? ''}
          onChangeText={(v) => onChange(index, 'email', v)}
          placeholder="Email (for invite)"
          keyboardType="email-address"
          autoCapitalize="none"
          containerStyle={styles.emailField}
        />
      </View>
      <TouchableOpacity onPress={() => onRemove(index)} style={styles.removeBtn} hitSlop={8}>
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  fields: { flex: 1, gap: 6 },
  nameField: { flex: 1 },
  emailField: { flex: 1 },
  removeBtn: {
    marginTop: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },
});
