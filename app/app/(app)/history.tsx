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
  Platform,
} from 'react-native';
import { useMeetingStore, type SavedEvent } from '../../src/stores/meetingStore';
import { useAuthStore } from '../../src/stores/authStore';
import EventCard from '../../src/components/EventCard';
import Button from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';

export default function History() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { history, historyLoading, loadHistory, deleteEvent } = useMeetingStore() as any;

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  const handleDelete = useCallback(async (event: SavedEvent) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Remove "${event.title}" from your history?`)
      : await new Promise<boolean>((resolve) =>
          Alert.alert('Delete Event', `Remove "${event.title}" from your history?`, [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ])
        );
    if (!confirmed) return;
    try {
      await deleteEvent(event.id);
    } catch (err: any) {
      const msg = err.message ?? 'Could not delete event';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    }
  }, [deleteEvent]);

  const handleEdit = useCallback((event: SavedEvent) => {
    router.push({ pathname: '/(app)/event-edit', params: { id: event.id } });
  }, [router]);

  const renderItem = ({ item }: { item: SavedEvent }) => (
    <EventCard
      event={item}
      onPress={() => {
        if (item.calendarEventUrl) {
          Linking.openURL(item.calendarEventUrl);
        }
      }}
      onEdit={() => handleEdit(item)}
      onDelete={() => handleDelete(item)}
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
          <Button
            label="Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="primary"
            style={{ marginTop: 8, paddingHorizontal: 32 }}
          />
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
