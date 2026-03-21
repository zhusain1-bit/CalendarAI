import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore, formatDuration, type DurationOption, type TimeFormat, type DefaultProvider } from '../../src/stores/settingsStore';

const TITLE_PRESETS = [
  { value: 'Meeting with [Name]', fallback: 'Meeting' },
  { value: 'Intro Call with [Name]', fallback: 'Intro Call' },
  { value: 'Sync with [Name]', fallback: 'Sync' },
  { value: 'Coffee Chat with [Name]', fallback: 'Coffee Chat' },
];
import { useGoogleAuth } from '../../src/services/googleAuth';
import { useMicrosoftAuth } from '../../src/services/microsoftAuth';
import { useZoomAuth } from '../../src/services/zoomAuth';
import Button from '../../src/components/ui/Button';
import Card from '../../src/components/ui/Card';
import TimezonePickerField from '../../src/components/ui/TimezonePickerField';
import { openStripeCheckout, openStripeBillingPortal } from '../../src/services/stripe';
import { getOfferings, purchasePackage } from '../../src/services/revenueCat';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: '✅ Active', color: '#059669' },
  past_due: { label: '⚠️ Past Due', color: '#D97706' },
  canceled: { label: '❌ Canceled', color: '#DC2626' },
  none: { label: 'No subscription', color: '#6B7280' },
};

export default function Account() {
  const router = useRouter();
  const { user, subscriptionStatus, googleAccessToken, microsoftAccessToken, zoomAccessToken, connectCalendar, disconnectCalendar, signOut, refreshMe } = useAuthStore() as any;
  const { defaultMeetingDuration, timeFormat, defaultTimezone, defaultCalendarProvider, defaultMeetingTitleTemplate, updateSettings } = useSettingsStore();
  const [loading, setLoading] = useState(false);

  const isPreset = TITLE_PRESETS.some(p => p.value === defaultMeetingTitleTemplate);
  const isCustomMode = defaultMeetingTitleTemplate !== null && !isPreset;
  const [customTitleInput, setCustomTitleInput] = useState(isCustomMode ? defaultMeetingTitleTemplate : '');
  const [calendarLoading, setCalendarLoading] = useState<'google' | 'microsoft' | 'zoom' | null>(null);

  const connectingRef = useRef<'google' | 'microsoft' | 'zoom' | null>(null);

  const { request: googleRequest, response: googleResponse, promptAsync: promptGoogle, redirectUri: googleRedirectUri } = useGoogleAuth();
  const { request: msRequest, response: msResponse, promptAsync: promptMicrosoft, redirectUri: msRedirectUri } = useMicrosoftAuth();
  const { request: zoomRequest, response: zoomResponse, promptAsync: promptZoom, redirectUri: zoomRedirectUri } = useZoomAuth();

  useEffect(() => {
    if (googleResponse?.type === 'success' && connectingRef.current === 'google') {
      connectingRef.current = null;
      handleConnectCode('google', googleResponse.params.code, googleRedirectUri);
    }
  }, [googleResponse]);

  useEffect(() => {
    if (msResponse?.type === 'success' && connectingRef.current === 'microsoft') {
      connectingRef.current = null;
      handleConnectCode('microsoft', msResponse.params.code, msRedirectUri);
    }
  }, [msResponse]);

  useEffect(() => {
    if (zoomResponse?.type === 'success' && connectingRef.current === 'zoom') {
      connectingRef.current = null;
      handleConnectCode('zoom', zoomResponse.params.code, zoomRedirectUri);
    }
  }, [zoomResponse]);

  async function handleConnectCode(provider: 'google' | 'microsoft' | 'zoom', code: string, redirectUri: string) {
    setCalendarLoading(provider);
    try {
      await connectCalendar(provider, code, redirectUri);
      const label = provider === 'google' ? 'Google Calendar' : provider === 'microsoft' ? 'Microsoft Outlook' : 'Zoom';
      Alert.alert('Connected!', `Your ${label} is now linked.`);
    } catch (err: any) {
      Alert.alert('Connection failed', err.message ?? 'Could not connect calendar');
    } finally {
      setCalendarLoading(null);
    }
  }

  function handleConnectCalendar(provider: 'google' | 'microsoft' | 'zoom') {
    connectingRef.current = provider;
    if (provider === 'google') promptGoogle();
    else if (provider === 'microsoft') promptMicrosoft();
    else promptZoom();
  }

  function handleDisconnectCalendar(provider: 'google' | 'microsoft' | 'zoom') {
    const label = provider === 'google' ? 'Google Calendar' : provider === 'microsoft' ? 'Microsoft Outlook' : 'Zoom';
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove your ${label} connection?`)) {
        disconnectCalendar(provider);
      }
      return;
    }
    Alert.alert(`Disconnect ${label}`, `Remove your ${label} connection?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: () => disconnectCalendar(provider),
      },
    ]);
  }

  const statusInfo = STATUS_LABELS[subscriptionStatus] ?? STATUS_LABELS.none;

  async function handleSubscribe() {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await openStripeCheckout(
          `${window.location.origin}/account?subscribed=true`,
          `${window.location.origin}/pricing`
        );
      } else {
        const offering = await getOfferings();
        if (!offering) {
          Alert.alert('Error', 'No subscription plans available at this time.');
          return;
        }
        const pkg = offering.availablePackages[0];
        await purchasePackage(pkg);
        await refreshMe();
        Alert.alert('Success!', 'Your subscription is now active.');
      }
    } catch (err: any) {
      if (!err.userCancelled) {
        Alert.alert('Error', err.message ?? 'Could not complete purchase');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    setLoading(true);
    try {
      if (Platform.OS === 'web') {
        await openStripeBillingPortal(`${window.location.origin}/account`);
      } else {
        Alert.alert('Manage Subscription', 'Manage your subscription in your device settings.', [
          { text: 'OK' },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await signOut();
        router.replace('/(auth)/sign-in');
      }
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/sign-in');
        },
      },
    ]);
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centered}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyTitle}>Not signed in</Text>
          <Button
            label="Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="primary"
            style={{ marginTop: 16 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Account</Text>

        {/* Profile */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name ?? 'User'}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
            </View>
          </View>
        </Card>

        {/* Connected Calendars */}
        <Card style={styles.subCard}>
          <Text style={styles.sectionLabel}>Connected Calendars</Text>

          <View style={styles.calendarRow}>
            <Text style={styles.calendarLabel}>📅 Google Calendar</Text>
            {googleAccessToken ? (
              <View style={styles.calendarActions}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
                <TouchableOpacity onPress={() => handleDisconnectCalendar('google')}>
                  <Text style={styles.disconnectText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                label={calendarLoading === 'google' ? 'Connecting…' : 'Connect'}
                onPress={() => handleConnectCalendar('google')}
                variant="secondary"
                disabled={!googleRequest || calendarLoading !== null}
                style={styles.connectBtn}
              />
            )}
          </View>

          <View style={[styles.calendarRow, styles.calendarRowBorder]}>
            <Text style={styles.calendarLabel}>📆 Microsoft Outlook</Text>
            {microsoftAccessToken ? (
              <View style={styles.calendarActions}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
                <TouchableOpacity onPress={() => handleDisconnectCalendar('microsoft')}>
                  <Text style={styles.disconnectText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                label={calendarLoading === 'microsoft' ? 'Connecting…' : 'Connect'}
                onPress={() => handleConnectCalendar('microsoft')}
                variant="secondary"
                disabled={!msRequest || calendarLoading !== null}
                style={styles.connectBtn}
              />
            )}
          </View>

          <View style={[styles.calendarRow, styles.calendarRowBorder]}>
            <Text style={styles.calendarLabel}>📹 Zoom</Text>
            {zoomAccessToken ? (
              <View style={styles.calendarActions}>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedText}>Connected</Text>
                </View>
                <TouchableOpacity onPress={() => handleDisconnectCalendar('zoom')}>
                  <Text style={styles.disconnectText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Button
                label={calendarLoading === 'zoom' ? 'Connecting…' : 'Connect'}
                onPress={() => handleConnectCalendar('zoom')}
                variant="secondary"
                disabled={!zoomRequest || calendarLoading !== null}
                style={styles.connectBtn}
              />
            )}
          </View>
        </Card>

        {/* Settings */}
        <Card style={styles.subCard}>
          <Text style={styles.sectionLabel}>Preferences</Text>

          {/* Default meeting duration */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default meeting duration</Text>
            <View style={styles.chipRow}>
              {([15, 30, 45, 60, 90, 120] as DurationOption[]).map((d) => {
                const selected = defaultMeetingDuration === d;
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => updateSettings({ defaultMeetingDuration: d })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {formatDuration(d)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Time format */}
          <View style={[styles.settingRow, styles.settingBorder]}>
            <Text style={styles.settingLabel}>Time format</Text>
            <View style={styles.chipRow}>
              {(['12h', '24h'] as TimeFormat[]).map((f) => {
                const selected = timeFormat === f;
                return (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => updateSettings({ timeFormat: f })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {f === '12h' ? '12h AM/PM' : '24-hour'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Default timezone */}
          <View style={[styles.settingRow, styles.settingBorder]}>
            <TimezonePickerField
              label="Default timezone"
              value={defaultTimezone}
              onChange={(tz) => updateSettings({ defaultTimezone: tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone })}
            />
          </View>

          {/* Default calendar provider */}
          <View style={[styles.settingRow, styles.settingBorder]}>
            <Text style={styles.settingLabel}>Default calendar</Text>
            <View style={styles.chipRow}>
              {([null, 'google', 'outlook'] as DefaultProvider[]).map((p) => {
                const selected = defaultCalendarProvider === p;
                const label = p === null ? 'Ask me' : p === 'google' ? 'Google' : 'Outlook';
                return (
                  <TouchableOpacity
                    key={String(p)}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => updateSettings({ defaultCalendarProvider: p })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Default meeting title template */}
          <View style={[styles.settingRow, styles.settingBorder]}>
            <Text style={styles.settingLabel}>Default meeting title</Text>
            <Text style={styles.settingHint}>
              Used when no title is found. Use [Name] as a placeholder — replaced with the attendee's name.
            </Text>
            <View style={styles.chipRow}>
              {/* None */}
              <TouchableOpacity
                style={[styles.chip, defaultMeetingTitleTemplate === null && styles.chipSelected]}
                onPress={() => updateSettings({ defaultMeetingTitleTemplate: null })}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, defaultMeetingTitleTemplate === null && styles.chipTextSelected]}>None</Text>
              </TouchableOpacity>

              {/* Presets */}
              {TITLE_PRESETS.map((p) => {
                const selected = defaultMeetingTitleTemplate === p.value;
                return (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, selected && styles.chipSelected]}
                    onPress={() => updateSettings({ defaultMeetingTitleTemplate: p.value })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{p.value}</Text>
                  </TouchableOpacity>
                );
              })}

              {/* Custom */}
              <TouchableOpacity
                style={[styles.chip, isCustomMode && styles.chipSelected]}
                onPress={() => {
                  const val = customTitleInput.trim() || 'Meeting with [Name]';
                  setCustomTitleInput(val);
                  updateSettings({ defaultMeetingTitleTemplate: val });
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, isCustomMode && styles.chipTextSelected]}>Custom</Text>
              </TouchableOpacity>
            </View>

            {isCustomMode && (
              <TextInput
                style={styles.titleTemplateInput}
                value={customTitleInput}
                onChangeText={(v) => {
                  setCustomTitleInput(v);
                  updateSettings({ defaultMeetingTitleTemplate: v || null });
                }}
                placeholder="e.g. Chat with [Name]"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="words"
                returnKeyType="done"
              />
            )}
          </View>
        </Card>

        {/* Subscription */}
        <Card style={styles.subCard}>
          <Text style={styles.sectionLabel}>Subscription</Text>
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>

          {subscriptionStatus === 'active' ? (
            <>
              <Button
                label="Manage Subscription"
                onPress={handleManageSubscription}
                variant="secondary"
                loading={loading}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </>
          ) : (
            <>
              <Text style={styles.subDesc}>
                Subscribe to create unlimited calendar events from screenshots.
              </Text>
              <Button
                label="Subscribe — Unlock Full Access"
                onPress={handleSubscribe}
                variant="primary"
                loading={loading}
                fullWidth
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </Card>

        {/* Actions */}
        <Button
          label="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          fullWidth
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: '#111827' },
  profileCard: { padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0066FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  profileEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  subCard: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statusText: { fontSize: 17, fontWeight: '700' },
  subDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  calendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  calendarRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  calendarLabel: { fontSize: 15, fontWeight: '500', color: '#374151', flex: 1 },
  calendarActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectedBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  connectedText: { fontSize: 12, fontWeight: '600', color: '#059669' },
  disconnectText: { fontSize: 13, color: '#EF4444', fontWeight: '500' },
  connectBtn: { paddingHorizontal: 14, paddingVertical: 6, minHeight: 0 },
  settingRow: { paddingVertical: 14 },
  settingBorder: { borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  settingLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  settingHint: { fontSize: 12, color: '#9CA3AF', lineHeight: 16, marginBottom: 10 },
  titleTemplateInput: {
    marginTop: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#111827',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  chipSelected: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  chipTextSelected: { color: '#FFFFFF' },
});
