import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useMeetingStore, type SavedEvent } from '../../src/stores/meetingStore';
import { useAuthStore } from '../../src/stores/authStore';
import EventCard from '../../src/components/EventCard';
import { useRouter } from 'expo-router';

export default function History() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { history, historyLoading, loadHistory, deleteEvent } = useMeetingStore();

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const handleDelete = useCallback((event: SavedEvent) => {
    Alert.alert(
      'Delete Event',
      `Remove "${event.title}" from your history?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEvent(event.id),
        },
      ]
    );
  }, [deleteEvent]);

  const renderItem = ({ item }: { item: SavedEvent }) => (
    <EventCard
      event={item}
      onPress={() => {
        if (item.calendarEventUrl) {
          Linking.openURL(item.calendarEventUrl);
        }
      }}
    />
  );

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔒</Text>
          <Text style={styles.emptyTitle}>Sign in to see history</Text>
          <Text style={styles.emptyText}>
            Your event history is saved when you sign in with Google or Microsoft.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Event History</Text>
        <Text style={styles.count}>{history.length} event{history.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={historyLoading} onRefresh={loadHistory} tintColor="#0066FF" />
        }
        onLongPress={(e) => {}}
        ListEmptyComponent={
          !historyLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>No events yet</Text>
              <Text style={styles.emptyText}>
                Events you create will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#111827' },
  count: { fontSize: 14, color: '#9CA3AF', fontWeight: '500' },
  list: { padding: 20, paddingBottom: 40 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', maxWidth: 260, lineHeight: 20 },
});
