import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, FlatList, ViewStyle,
} from 'react-native';

// Generate 30-min interval times 00:00 → 23:30
const TIMES: { value: string; display: string }[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    const hStr = String(h).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const period = h < 12 ? 'AM' : 'PM';
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    TIMES.push({ value: `${hStr}:${mStr}`, display: `${h12}:${mStr} ${period}` });
  }
}

interface Props {
  label?: string;
  value: string | null; // HH:MM
  onChange: (v: string | null) => void;
  containerStyle?: ViewStyle;
}

export default function TimePickerField({ label, value, onChange, containerStyle }: Props) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<FlatList>(null);

  const selectedIndex = value ? TIMES.findIndex(t => t.value === value) : -1;

  useEffect(() => {
    if (open && selectedIndex >= 0) {
      // Slight delay so the modal has rendered
      setTimeout(() => {
        listRef.current?.scrollToIndex({ index: selectedIndex, animated: false, viewPosition: 0.3 });
      }, 80);
    }
  }, [open]);

  function select(t: { value: string; display: string }) {
    onChange(t.value);
    setOpen(false);
  }

  return (
    <View style={[fieldStyles.wrap, containerStyle]}>
      {label && <Text style={fieldStyles.label}>{label}</Text>}
      <View style={fieldStyles.inputRow}>
        <TextInput
          style={fieldStyles.input}
          value={value ?? ''}
          onChangeText={v => onChange(v || null)}
          placeholder="HH:MM"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={fieldStyles.iconBtn} onPress={() => setOpen(true)} hitSlop={4}>
          <Text style={fieldStyles.iconText}>🕐</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={sheet.container}>
            <View style={sheet.handle} />
            <Text style={sheet.title}>{label ?? 'Select Time'}</Text>

            <FlatList
              ref={listRef}
              data={TIMES}
              keyExtractor={item => item.value}
              style={sheet.list}
              getItemLayout={(_, index) => ({ length: ITEM_H, offset: ITEM_H * index, index })}
              onScrollToIndexFailed={() => {}}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[sheet.item, isSelected && sheet.itemSelected]}
                    onPress={() => select(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[sheet.itemText, isSelected && sheet.itemTextSelected]}>
                      {item.display}
                    </Text>
                    {isSelected && <Text style={sheet.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}
            />

            {value ? (
              <TouchableOpacity
                style={sheet.clearBtn}
                onPress={() => { onChange(null); setOpen(false); }}
              >
                <Text style={sheet.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const ITEM_H = 52;

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
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  iconBtn: { paddingHorizontal: 12, paddingVertical: 12 },
  iconText: { fontSize: 18 },
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
    maxHeight: '60%',
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  list: { flexGrow: 0 },
  item: {
    height: ITEM_H,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemSelected: { backgroundColor: '#EEF2FF', borderRadius: 10, borderBottomColor: 'transparent' },
  itemText: { fontSize: 16, color: '#374151' },
  itemTextSelected: { color: '#0066FF', fontWeight: '600' },
  checkmark: { fontSize: 16, color: '#0066FF', fontWeight: '700' },
  clearBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  clearText: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
});
