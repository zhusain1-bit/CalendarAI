import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export interface PickedImage {
  uri: string;
  mimeType: string;
  base64?: string;
}

export async function pickImageFromLibrary(): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.9,
    base64: Platform.OS === 'web',
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    base64: asset.base64 ?? undefined,
  };
}

export async function takePhotoWithCamera(): Promise<PickedImage | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: 0.9,
    base64: Platform.OS === 'web',
  });

  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    base64: asset.base64 ?? undefined,
  };
}

export async function imageToFormData(image: PickedImage): Promise<FormData> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // Web: fetch the blob from the object URL
    const response = await fetch(image.uri);
    const blob = await response.blob();
    formData.append('image', blob, 'screenshot.jpg');
  } else {
    // Native: use the file URI directly
    formData.append('image', {
      uri: image.uri,
      type: image.mimeType,
      name: 'screenshot.jpg',
    } as any);
  }

  return formData;
}
