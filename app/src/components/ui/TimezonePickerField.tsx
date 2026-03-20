import React, { useState, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, FlatList, ViewStyle,
} from 'react-native';

const TIMEZONES = [
  { value: 'Pacific/Honolulu',        label: 'Hawaii',              offset: 'UTC-10' },
  { value: 'America/Anchorage',        label: 'Alaska',              offset: 'UTC-9' },
  { value: 'America/Los_Angeles',      label: 'Pacific Time',        offset: 'UTC-8/−7' },
  { value: 'America/Denver',           label: 'Mountain Time',       offset: 'UTC-7/−6' },
  { value: 'America/Phoenix',          label: 'Arizona',             offset: 'UTC-7' },
  { value: 'America/Chicago',          label: 'Central Time',        offset: 'UTC-6/−5' },
  { value: 'America/New_York',         label: 'Eastern Time',        offset: 'UTC-5/−4' },
  { value: 'America/Toronto',          label: 'Toronto',             offset: 'UTC-5/−4' },
  { value: 'America/Halifax',          label: 'Atlantic Time',       offset: 'UTC-4/−3' },
  { value: 'America/Sao_Paulo',        label: 'São Paulo',           offset: 'UTC-3' },
  { value: 'America/Buenos_Aires',     label: 'Buenos Aires',        offset: 'UTC-3' },
  { value: 'America/Mexico_City',      label: 'Mexico City',         offset: 'UTC-6/−5' },
  { value: 'America/Vancouver',        label: 'Vancouver',           offset: 'UTC-8/−7' },
  { value: 'UTC',                      label: 'UTC',                 offset: 'UTC+0' },
  { value: 'Europe/London',            label: 'London',              offset: 'UTC+0/+1' },
  { value: 'Europe/Dublin',            label: 'Dublin',              offset: 'UTC+0/+1' },
  { value: 'Europe/Paris',             label: 'Paris',               offset: 'UTC+1/+2' },
  { value: 'Europe/Berlin',            label: 'Berlin',              offset: 'UTC+1/+2' },
  { value: 'Europe/Madrid',            label: 'Madrid',              offset: 'UTC+1/+2' },
  { value: 'Europe/Rome',              label: 'Rome',                offset: 'UTC+1/+2' },
  { value: 'Europe/Amsterdam',         label: 'Amsterdam',           offset: 'UTC+1/+2' },
  { value: 'Europe/Stockholm',         label: 'Stockholm',           offset: 'UTC+1/+2' },
  { value: 'Europe/Warsaw',            label: 'Warsaw',              offset: 'UTC+1/+2' },
  { value: 'Europe/Athens',            label: 'Athens',              offset: 'UTC+2/+3' },
  { value: 'Europe/Helsinki',          label: 'Helsinki',            offset: 'UTC+2/+3' },
  { value: 'Europe/Moscow',            label: 'Moscow',              offset: 'UTC+3' },
  { value: 'Europe/Istanbul',          label: 'Istanbul',            offset: 'UTC+3' },
  { value: 'Africa/Cairo',             label: 'Cairo',               offset: 'UTC+2' },
  { value: 'Africa/Johannesburg',      label: 'Johannesburg',        offset: 'UTC+2' },
  { value: 'Africa/Lagos',             label: 'Lagos',               offset: 'UTC+1' },
  { value: 'Africa/Nairobi',           label: 'Nairobi',             offset: 'UTC+3' },
  { value: 'Asia/Dubai',               label: 'Dubai',               offset: 'UTC+4' },
  { value: 'Asia/Karachi',             label: 'Karachi',             offset: 'UTC+5' },
  { value: 'Asia/Kolkata',             label: 'India',               offset: 'UTC+5:30' },
  { value: 'Asia/Dhaka',              label: 'Dhaka',               offset: 'UTC+6' },
  { value: 'Asia/Bangkok',             label: 'Bangkok',             offset: 'UTC+7' },
  { value: 'Asia/Jakarta',             label: 'Jakarta',             offset: 'UTC+7' },
  { value: 'Asia/Singapore',           label: 'Singapore',           offset: 'UTC+8' },
  { value: 'Asia/Shanghai',            label: 'Shanghai',            offset: 'UTC+8' },
  { value: 'Asia/Hong_Kong',           label: 'Hong Kong',           offset: 'UTC+8' },
  { value: 'Asia/Taipei',              label: 'Taipei',              offset: 'UTC+8' },
  { value: 'Asia/Tokyo',               label: 'Tokyo',               offset: 'UTC+9' },
  { value: 'Asia/Seoul',               label: 'Seoul',               offset: 'UTC+9' },
  { value: 'Australia/Perth',          label: 'Perth',               offset: 'UTC+8' },
  { value: 'Australia/Adelaide',       label: 'Adelaide',            offset: 'UTC+9:30/+10:30' },
  { value: 'Australia/Sydney',         label: 'Sydney',              offset: 'UTC+10/+11' },
  { value: 'Australia/Melbourne',      label: 'Melbourne',           offset: 'UTC+10/+11' },
  { value: 'Pacific/Auckland',         label: 'Auckland',            offset: 'UTC+12/+13' },
];

interface Props {
  label?: string;
  value: string | null; // IANA timezone
  onChange: (v: string | null) => void;
  containerStyle?: ViewStyle;
}

export default function TimezonePickerField({ label, value, onChange, containerStyle }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TIMEZONES;
    return TIMEZONES.filter(tz =>
      tz.label.toLowerCase().includes(q) ||
      tz.value.toLowerCase().includes(q) ||
      tz.offset.toLowerCase().includes(q)
    );
  }, [query]);

  // Display label: show the friendly label if it's in our list, otherwise raw IANA value
  const displayLabel = value
    ? (TIMEZONES.find(t => t.value === value)?.label ?? value)
    : '';

  function select(tz: typeof TIMEZONES[0]) {
    onChange(tz.value);
    setQuery('');
    setOpen(false);
  }

  function openPicker() {
    setQuery('');
    setOpen(true);
  }

  return (
    <View style={[fieldStyles.wrap, containerStyle]}>
      {label && <Text style={fieldStyles.label}>{label}</Text>}
      <TouchableOpacity style={fieldStyles.inputRow} onPress={openPicker} activeOpacity={0.8}>
        <Text style={[fieldStyles.valueText, !value && fieldStyles.placeholder]} numberOfLines={1}>
          {value ? displayLabel : 'Select timezone'}
        </Text>
        <Text style={fieldStyles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={() => { setQuery(''); setOpen(false); }}>
          <View style={sheet.container}>
            <View style={sheet.handle} />
            <Text style={sheet.title}>{label ?? 'Select Timezone'}</Text>

            {/* Search */}
            <View style={sheet.searchRow}>
              <Text style={sheet.searchIcon}>🔍</Text>
              <TextInput
                style={sheet.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Search city or timezone..."
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Text style={sheet.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filtered}
              keyExtractor={item => item.value}
              style={sheet.list}
              keyboardShouldPersistTaps="handled"
              getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[sheet.item, isSelected && sheet.itemSelected]}
                    onPress={() => select(item)}
                    activeOpacity={0.7}
                  >
                    <View style={sheet.itemContent}>
                      <Text style={[sheet.itemLabel, isSelected && sheet.itemLabelSelected]}>
                        {item.label}
                      </Text>
                      <Text style={sheet.itemSub}>{item.value}</Text>
                    </View>
                    <View style={sheet.itemRight}>
                      <Text style={sheet.itemOffset}>{item.offset}</Text>
                      {isSelected && <Text style={sheet.checkmark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={sheet.empty}>
                  <Text style={sheet.emptyText}>No timezones match "{query}"</Text>
                  <Text style={sheet.emptyHint}>You can also type the IANA name directly in the form.</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ITEM_H = 62;

const fieldStyles = StyleSheet.create({
  wrap: { gap: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 8,
  },
  valueText: { flex: 1, fontSize: 15, color: '#111827' },
  placeholder: { color: '#9CA3AF' },
  chevron: { fontSize: 14, color: '#6B7280' },
});

const sheet = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    gap: 8,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', paddingVertical: 2 },
  clearSearch: { fontSize: 14, color: '#9CA3AF', padding: 2 },
  list: { flexGrow: 0 },
  item: {
    height: ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 4,
  },
  itemSelected: { backgroundColor: '#EEF2FF', borderRadius: 10, borderBottomColor: 'transparent', paddingHorizontal: 8 },
  itemContent: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, color: '#111827', fontWeight: '500' },
  itemLabelSelected: { color: '#0066FF' },
  itemSub: { fontSize: 12, color: '#9CA3AF' },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemOffset: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  checkmark: { fontSize: 16, color: '#0066FF', fontWeight: '700' },
  empty: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  emptyHint: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },
});
