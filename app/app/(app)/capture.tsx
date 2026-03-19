import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMeetingStore } from '../../src/stores/meetingStore';
import { useAuthStore } from '../../src/stores/authStore';
import { pickImageFromLibrary, takePhotoWithCamera } from '../../src/utils/imageUtils';
import type { PickedImage } from '../../src/utils/imageUtils';
import Button from '../../src/components/ui/Button';
import LoadingOverlay from '../../src/components/ui/LoadingOverlay';

export default function Capture() {
  const router = useRouter();
  const { extractFromImage, status, error } = useMeetingStore();
  const { subscriptionStatus } = useAuthStore();
  const [selectedImage, setSelectedImage] = useState<PickedImage | null>(null);
  const isLoading = status === 'extracting';

  async function handlePickLibrary() {
    const image = await pickImageFromLibrary();
    if (image) setSelectedImage(image);
  }

  async function handleCamera() {
    const image = await takePhotoWithCamera();
    if (image) setSelectedImage(image);
  }

  async function handleExtract() {
    if (!selectedImage) return;

    if (subscriptionStatus !== 'active') {
      Alert.alert(
        'Subscription Required',
        'A subscription is required to extract meeting info from screenshots.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push(Platform.OS === 'web' ? '/pricing' : '/(app)/account') },
        ]
      );
      return;
    }

    await extractFromImage(selectedImage);

    if (useMeetingStore.getState().status === 'extracted') {
      router.push('/(app)/preview');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.backBtn}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Add from Screenshot</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Image preview */}
        <TouchableOpacity style={styles.imageArea} onPress={handlePickLibrary} activeOpacity={0.85}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage.uri }} style={styles.preview} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderEmoji}>📷</Text>
              <Text style={styles.placeholderText}>Tap to select a screenshot</Text>
              <Text style={styles.placeholderSub}>From your camera roll or take a new photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <Button
            label="Choose from Library"
            onPress={handlePickLibrary}
            variant="secondary"
            fullWidth
          />
          {Platform.OS !== 'web' && (
            <Button
              label="Take Photo"
              onPress={handleCamera}
              variant="secondary"
              fullWidth
            />
          )}
          <Button
            label={selectedImage ? 'Extract Meeting Info' : 'Select a Screenshot First'}
            onPress={handleExtract}
            variant="primary"
            disabled={!selectedImage || isLoading}
            fullWidth
          />
        </View>

        <Text style={styles.hint}>
          Works with iMessage, WhatsApp, email, Slack, and any message app.
        </Text>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Analyzing your screenshot..." />
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
  scroll: { padding: 20, gap: 16, paddingBottom: 40 },
  imageArea: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 260,
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
  actions: { gap: 10 },
  hint: { fontSize: 12, color: '#9CA3AF', textAlign: 'center' },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 14, color: '#B91C1C' },
});
