import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Button from './ui/Button';

export interface FreeSlot {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM 24h
  endTime: string;    // HH:MM 24h
  timezone: string;   // IANA
}

export interface AvailabilityPreferences {
  count: 1 | 2 | 3;
  timeOfDay: 'morning' | 'afternoon' | 'any';
  timeframe: 'this_week' | 'next_week' | 'flexible';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (prefs: AvailabilityPreferences) => void;
  loading?: boolean;
}

interface ChipOption<T> {
  label: string;
  value: T;
}

function ChipRow<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: ChipOption<T>[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const isSelected = opt.value === selected;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(opt.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AvailabilityPrefsSheet({ visible, onClose, onSubmit, loading }: Props) {
  const [count, setCount] = useState<1 | 2 | 3>(2);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'any'>('any');
  const [timeframe, setTimeframe] = useState<'this_week' | 'next_week' | 'flexible'>('this_week');

  const countOptions: ChipOption<1 | 2 | 3>[] = [
    { label: '1', value: 1 },
    { label: '2', value: 2 },
    { label: '3', value: 3 },
  ];

  const timeOfDayOptions: ChipOption<'morning' | 'afternoon' | 'any'>[] = [
    { label: 'Morning 9–12', value: 'morning' },
    { label: 'Afternoon 12–5', value: 'afternoon' },
    { label: 'Any', value: 'any' },
  ];

  const timeframeOptions: ChipOption<'this_week' | 'next_week' | 'flexible'>[] = [
    { label: 'This week', value: 'this_week' },
    { label: 'Next week', value: 'next_week' },
    { label: 'Next 14 days', value: 'flexible' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />
          <Text style={styles.title}>Suggest My Availability</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Slots to suggest</Text>
            <ChipRow options={countOptions} selected={count} onSelect={setCount} />

            <Text style={styles.label}>Time of day</Text>
            <ChipRow options={timeOfDayOptions} selected={timeOfDay} onSelect={setTimeOfDay} />

            <Text style={styles.label}>When</Text>
            <ChipRow options={timeframeOptions} selected={timeframe} onSelect={setTimeframe} />

            <Button
              label="Find My Availability"
              onPress={() => onSubmit({ count, timeOfDay, timeframe })}
              variant="primary"
              fullWidth
              loading={loading}
              style={styles.submitBtn}
            />

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipSelected: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  submitBtn: {
    marginTop: 24,
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});
