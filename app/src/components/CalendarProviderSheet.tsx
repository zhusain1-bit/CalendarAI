import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ics';

interface Props {
  visible: boolean;
  onSelect: (provider: CalendarProvider) => void;
  onClose: () => void;
  loading?: boolean;
}

interface ProviderOption {
  id: CalendarProvider;
  label: string;
  emoji: string;
  description: string;
  requiresAuth: boolean;
  webOnly?: boolean;
  nativeOnly?: boolean;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: 'google',
    label: 'Google Calendar',
    emoji: '📅',
    description: 'Creates event and sends invites',
    requiresAuth: true,
  },
  {
    id: 'outlook',
    label: 'Outlook / Microsoft 365',
    emoji: '📆',
    description: 'Creates event and sends invites',
    requiresAuth: true,
  },
  {
    id: 'apple',
    label: 'Apple Calendar',
    emoji: '🍎',
    description: 'Adds to your device calendar',
    requiresAuth: false,
    nativeOnly: true,
  },
  {
    id: 'ics',
    label: 'Download ICS File',
    emoji: '📎',
    description: 'Works with any calendar app',
    requiresAuth: false,
  },
];

export default function CalendarProviderSheet({ visible, onSelect, onClose, loading }: Props) {
  const { googleAccessToken, microsoftAccessToken } = useAuthStore();

  const availableProviders = PROVIDERS.filter((p) => {
    if (p.nativeOnly && Platform.OS === 'web') return false;
    if (p.id === 'google' && !googleAccessToken) return false;
    if (p.id === 'outlook' && !microsoftAccessToken) return false;
    return true;
  });

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
          <Text style={styles.title}>Add to Calendar</Text>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#0066FF" />
              <Text style={styles.loadingText}>Creating your event...</Text>
            </View>
          ) : (
            availableProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                style={styles.option}
                onPress={() => onSelect(provider.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionEmoji}>{provider.emoji}</Text>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{provider.label}</Text>
                  <Text style={styles.optionDesc}>{provider.description}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 14,
  },
  optionEmoji: { fontSize: 28 },
  optionText: { flex: 1 },
  optionLabel: { fontSize: 16, fontWeight: '600', color: '#111827' },
  optionDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  chevron: { fontSize: 20, color: '#9CA3AF' },
  cancelBtn: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  loadingBox: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  loadingText: { fontSize: 15, color: '#374151' },
});
