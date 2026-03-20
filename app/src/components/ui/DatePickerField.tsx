import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ViewStyle,
} from 'react-native';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

interface Props {
  label?: string;
  value: string | null; // YYYY-MM-DD
  onChange: (v: string | null) => void;
  containerStyle?: ViewStyle;
}

export default function DatePickerField({ label, value, onChange, containerStyle }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date();

  // Parse safely at noon to avoid DST boundary issues
  const sel = value ? new Date(value + 'T12:00:00') : null;
  const [viewYear, setViewYear] = useState(() => sel?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => sel?.getMonth() ?? today.getMonth());

  function openPicker() {
    if (sel) { setViewYear(sel.getFullYear()); setViewMonth(sel.getMonth()); }
    setOpen(true);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }

  // Build 6-row × 7-col calendar grid
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstWeekday).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={[fieldStyles.wrap, containerStyle]}>
      {label && <Text style={fieldStyles.label}>{label}</Text>}
      <View style={fieldStyles.inputRow}>
        <TextInput
          style={fieldStyles.input}
          value={value ?? ''}
          onChangeText={v => onChange(v || null)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={fieldStyles.iconBtn} onPress={openPicker} hitSlop={4}>
          <Text style={fieldStyles.iconText}>📅</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={sheet.backdrop} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={sheet.container}>
            <View style={sheet.handle} />
            <Text style={sheet.title}>{label ?? 'Select Date'}</Text>

            {/* Month nav */}
            <View style={cal.monthNav}>
              <TouchableOpacity onPress={prevMonth} hitSlop={12} style={cal.navBtn}>
                <Text style={cal.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={cal.monthLabel}>{MONTHS[viewMonth]} {viewYear}</Text>
              <TouchableOpacity onPress={nextMonth} hitSlop={12} style={cal.navBtn}>
                <Text style={cal.navArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Day-of-week headers */}
            <View style={cal.row}>
              {DAYS.map(d => (
                <View key={d} style={cal.cell}>
                  <Text style={cal.dayHeader}>{d}</Text>
                </View>
              ))}
            </View>

            {/* Date cells */}
            <View style={cal.grid}>
              {cells.map((day, i) => {
                if (!day) return <View key={i} style={cal.cell} />;
                const isSelected = sel?.getDate() === day &&
                  sel?.getMonth() === viewMonth &&
                  sel?.getFullYear() === viewYear;
                const isToday = today.getDate() === day &&
                  today.getMonth() === viewMonth &&
                  today.getFullYear() === viewYear;
                return (
                  <TouchableOpacity
                    key={i}
                    style={cal.cell}
                    onPress={() => selectDay(day)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      cal.dayInner,
                      isSelected && cal.daySelected,
                      !isSelected && isToday && cal.dayToday,
                    ]}>
                      <Text style={[cal.dayText, isSelected && cal.dayTextSelected]}>
                        {day}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

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
  iconBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
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
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
  },
  handle: {
    width: 40, height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 16 },
  clearBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 10 },
  clearText: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
});

const cal = StyleSheet.create({
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navBtn: { padding: 4 },
  navArrow: { fontSize: 24, color: '#374151', fontWeight: '300' },
  monthLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  row: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%` as any, alignItems: 'center', paddingVertical: 3 },
  dayHeader: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', paddingVertical: 6 },
  dayInner: {
    width: 36, height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelected: { backgroundColor: '#0066FF' },
  dayToday: { borderWidth: 1.5, borderColor: '#0066FF' },
  dayText: { fontSize: 14, color: '#111827' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '600' },
});
