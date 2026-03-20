import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Card from './ui/Card';
import { formatTimeRange } from '../utils/dateUtils';
import type { SavedEvent } from '../stores/meetingStore';

const PROVIDER_LABELS: Record<string, string> = {
  google: '📅 Google',
  outlook: '📆 Outlook',
  apple: '🍎 Apple',
  ics: '📎 ICS',
};

interface Props {
  event: SavedEvent;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function EventCard({ event, onPress, onEdit, onDelete }: Props) {
  const timeStr = formatTimeRange(event.date, event.startTime, event.endTime);
  const attendeeCount = Array.isArray(event.attendees) ? event.attendees.length : 0;
  const providerLabel = event.calendarProvider ? PROVIDER_LABELS[event.calendarProvider] : null;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} disabled={!onPress}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{event.title}</Text>
          <View style={styles.actions}>
            {providerLabel && <Text style={styles.provider}>{providerLabel}</Text>}
            {onEdit && (
              <TouchableOpacity onPress={onEdit} hitSlop={8} style={styles.actionBtn}>
                <Text style={styles.actionEdit}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={onDelete} hitSlop={8} style={styles.actionBtn}>
                <Text style={styles.actionDelete}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {timeStr ? <Text style={styles.time}>{timeStr}</Text> : null}

        {event.location ? (
          <Text style={styles.meta} numberOfLines={1}>📍 {event.location}</Text>
        ) : null}

        {attendeeCount > 0 && (
          <Text style={styles.meta}>
            👥 {attendeeCount} attendee{attendeeCount !== 1 ? 's' : ''}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  provider: { fontSize: 12, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  actionBtn: { paddingHorizontal: 4 },
  actionEdit: { fontSize: 13, color: '#0066FF', fontWeight: '500' },
  actionDelete: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  time: { fontSize: 13, color: '#0066FF', marginTop: 4, fontWeight: '500' },
  meta: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});
