import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useMeetingStore } from '../../src/stores/meetingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { pickImageFromLibrary, takePhotoWithCamera } from '../../src/utils/imageUtils';
import type { PickedImage } from '../../src/utils/imageUtils';
import Button from '../../src/components/ui/Button';
import LoadingOverlay from '../../src/components/ui/LoadingOverlay';
import AvailabilityPrefsSheet, {
  type AvailabilityPreferences,
  type FreeSlot,
} from '../../src/components/AvailabilityPrefsSheet';
import { api } from '../../src/services/api';
import { withGoogleRefresh } from '../../src/utils/withGoogleRefresh';

type InputMode = 'screenshot' | 'text';

const TEXT_PLACEHOLDER =
  'e.g. "Lunch with Sarah on Friday at 1pm at Nobu, sarah@example.com. ' +
  'Topic: Q2 planning."\n\nOr paste a message, email snippet, or any text mentioning a meeting.';

export default function Capture() {
  const router = useRouter();
  const { mode: flowMode } = useLocalSearchParams<{ mode?: string }>();
  const isSuggestMode = flowMode === 'suggest';

  const { extractFromImage, extractFromText, status, error } = useMeetingStore();
  const { googleAccessToken, refreshGoogleToken } = useAuthStore();
  const { defaultTimezone } = useSettingsStore();

  const [inputMode, setInputMode] = useState<InputMode>('screenshot');
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null);
  const [inputText, setInputText] = useState('');
  const textInputRef = useRef<TextInput>(null);
  const isLoading = status === 'extracting';

  const [prefsSheetVisible, setPrefsSheetVisible] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);

  // Web: listen for Ctrl+V paste events anywhere on the page
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    function handlePaste(e: Event) {
      const ce = e as ClipboardEvent;
      const items = ce.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (!blob) continue;
          const uri = URL.createObjectURL(blob);
          setSelectedImage({ uri, mimeType: item.type });
          setInputMode('screenshot');
          setPasteHint(null);
          break;
        }
      }
    }

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  async function handlePasteFromClipboard() {
    if (Platform.OS !== 'web') return;
    try {
      const items = await (navigator.clipboard as any).read();
      for (const item of items) {
        const imageType = (item.types as string[]).find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const uri = URL.createObjectURL(blob);
          setSelectedImage({ uri, mimeType: imageType });
          setPasteHint(null);
          return;
        }
      }
      setPasteHint('No image found in clipboard. Copy a screenshot first.');
    } catch {
      // Browser may block clipboard access without a prior copy — Ctrl+V still works
      setPasteHint('Press Ctrl+V anywhere on this page to paste a screenshot.');
    }
  }

  async function handlePickLibrary() {
    const image = await pickImageFromLibrary();
    if (image) setSelectedImage(image);
  }

  async function handleCamera() {
    const image = await takePhotoWithCamera();
    if (image) setSelectedImage(image);
  }

  async function handleExtract() {
    if (inputMode === 'screenshot') {
      if (!selectedImage) return;
      await extractFromImage(selectedImage);
    } else {
      if (!inputText.trim()) return;
      await extractFromText(inputText.trim());
    }

    if (useMeetingStore.getState().status === 'extracted') {
      if (isSuggestMode) {
        setPrefsSheetVisible(true);
      } else {
        router.push('/(app)/preview');
      }
    }
  }

  async function handlePrefsSubmit(prefs: AvailabilityPreferences) {
    const meeting = useMeetingStore.getState().currentMeeting;
    if (!meeting) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const meetingWithTz = { ...meeting, timezone: meeting.timezone ?? defaultTimezone };
      const result = await withGoogleRefresh(
        (token) => api.post<{ reply: string; slots: FreeSlot[] }>(
          '/availability/suggest',
          { accessToken: token, meeting: meetingWithTz, preferences: prefs }
        ),
        () => googleAccessToken,
        refreshGoogleToken
      );
      setPrefsSheetVisible(false);
      router.push({
        pathname: '/(app)/availability-reply',
        params: {
          reply: result.reply,
          slotsJson: JSON.stringify(result.slots),
          meetingJson: JSON.stringify(meeting),
          prefsJson: JSON.stringify(prefs),
        },
      });
    } catch (err: any) {
      setSuggestError(err.message ?? 'Could not find availability');
    } finally {
      setSuggesting(false);
    }
  }

  function handleModeSwitch(next: InputMode) {
    setInputMode(next);
    if (next === 'text') {
      setTimeout(() => textInputRef.current?.focus(), 100);
    }
  }

  const canExtract = inputMode === 'screenshot' ? !!selectedImage : inputText.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backBtn}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{isSuggestMode ? 'Suggest Availability' : 'Add Meeting'}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Mode toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, inputMode === 'screenshot' && styles.toggleActive]}
            onPress={() => handleModeSwitch('screenshot')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleLabel, inputMode === 'screenshot' && styles.toggleLabelActive]}>
              📷  Screenshot
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, inputMode === 'text' && styles.toggleActive]}
            onPress={() => handleModeSwitch('text')}
            activeOpacity={0.8}
          >
            <Text style={[styles.toggleLabel, inputMode === 'text' && styles.toggleLabelActive]}>
              ✏️  Type it
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {inputMode === 'screenshot' ? (
            <>
              {/* Image preview area */}
              <TouchableOpacity
                style={styles.imageArea}
                onPress={handlePickLibrary}
                activeOpacity={0.85}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.preview}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Text style={styles.placeholderEmoji}>📷</Text>
                    <Text style={styles.placeholderText}>Select or paste a screenshot</Text>
                    <Text style={styles.placeholderSub}>
                      {Platform.OS === 'web'
                        ? 'Choose from files, or press Ctrl+V to paste'
                        : 'Works with iMessage, WhatsApp, email, Slack, and more'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.actions}>
                <Button
                  label="Choose from Library"
                  onPress={handlePickLibrary}
                  variant="secondary"
                  fullWidth
                />
                {Platform.OS === 'web' && (
                  <Button
                    label="Paste Screenshot (Ctrl+V)"
                    onPress={handlePasteFromClipboard}
                    variant="secondary"
                    fullWidth
                  />
                )}
                {Platform.OS !== 'web' && (
                  <Button
                    label="Take Photo"
                    onPress={handleCamera}
                    variant="secondary"
                    fullWidth
                  />
                )}
              </View>
              {pasteHint && (
                <View style={styles.hintBanner}>
                  <Text style={styles.hintText}>{pasteHint}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Text input area */}
              <TextInput
                ref={textInputRef}
                style={styles.textArea}
                multiline
                value={inputText}
                onChangeText={setInputText}
                placeholder={TEXT_PLACEHOLDER}
                placeholderTextColor="#9CA3AF"
                textAlignVertical="top"
                scrollEnabled={false}
              />
              <Text style={styles.textHint}>
                Describe the meeting, paste a message, or write exactly what you need.
                AI will extract the details.
              </Text>
            </>
          )}

          {error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {suggestError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {suggestError}</Text>
            </View>
          )}

          <Button
            label={
              canExtract
                ? (isSuggestMode ? 'Check My Availability →' : 'Extract Meeting Info →')
                : (inputMode === 'screenshot' ? 'Select a Screenshot First' : 'Describe the Meeting First')
            }
            onPress={handleExtract}
            variant="primary"
            disabled={!canExtract || isLoading}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} message="Analyzing your screenshot..." />
      <LoadingOverlay visible={suggesting} message="Checking your calendar..." />

      <AvailabilityPrefsSheet
        visible={prefsSheetVisible}
        onClose={() => setPrefsSheetVisible(false)}
        onSubmit={handlePrefsSubmit}
        loading={suggesting}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backBtn: { fontSize: 17, color: '#0066FF', fontWeight: '500', width: 60 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },

  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleLabel: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  toggleLabelActive: { color: '#111827', fontWeight: '600' },

  scroll: { padding: 20, gap: 14, paddingBottom: 40 },

  imageArea: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 240,
    backgroundColor: '#F9FAFB',
  },
  preview: { width: '100%', height: 300 },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  placeholderEmoji: { fontSize: 48 },
  placeholderText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  placeholderSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center' },

  textArea: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
    minHeight: 200,
    backgroundColor: '#FAFAFA',
  },
  textHint: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    marginTop: -4,
  },

  actions: { gap: 10 },
  hintBanner: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  hintText: { fontSize: 13, color: '#92400E', textAlign: 'center' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#B91C1C' },
});
