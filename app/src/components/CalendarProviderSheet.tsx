import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../stores/authStore';

export type CalendarProvider = 'google' | 'outlook' | 'apple' | 'ics';

interface Props {
  visible: boolean;
  onSelect: (provider: CalendarProvider) => void;
  onClose: () => void;
  onConnectRequest?: () => void;
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

export default function CalendarProviderSheet({ visible, onSelect, onClose, onConnectRequest, loading }: Props) {
  const { googleAccessToken, microsoftAccessToken } = useAuthStore();

  function isConnected(id: CalendarProvider): boolean {
    if (id === 'google') return !!googleAccessToken;
    if (id === 'outlook') return !!microsoftAccessToken;
    return true;
  }

  const providers = PROVIDERS.filter((p) => !(p.nativeOnly && Platform.OS === 'web'));

  function handlePress(provider: ProviderOption) {
    if (!isConnected(provider.id)) {
      Alert.alert(
        `Connect ${provider.label}`,
        `Sign in with ${provider.id === 'google' ? 'Google' : 'Microsoft'} from your Account settings to use this calendar.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Account',
            onPress: () => {
              onClose();
              onConnectRequest?.();
            },
          },
        ]
      );
      return;
    }
    onSelect(provider.id);
  }

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
            providers.map((provider) => {
              const connected = isConnected(provider.id);
              return (
                <TouchableOpacity
                  key={provider.id}
                  style={[styles.option, !connected && styles.optionDisconnected]}
                  onPress={() => handlePress(provider)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.optionEmoji, !connected && styles.dimmed]}>{provider.emoji}</Text>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionLabel, !connected && styles.dimmed]}>{provider.label}</Text>
                    <Text style={styles.optionDesc}>
                      {connected ? provider.description : 'Tap to connect account'}
                    </Text>
                  </View>
                  {connected
                    ? <Text style={styles.chevron}>›</Text>
                    : <Text style={styles.connectBadge}>Connect</Text>
                  }
                </TouchableOpacity>
              );
            })
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
  optionDisconnected: { opacity: 0.65 },
  dimmed: { color: '#9CA3AF' },
  connectBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0066FF',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
});
