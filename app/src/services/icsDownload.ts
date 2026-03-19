import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { api } from './api';
import type { MeetingData } from '../stores/meetingStore';

export async function generateAndShareICS(meeting: MeetingData): Promise<void> {
  const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

  const response = await fetch(`${BASE_URL}/ics/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(meeting),
  });

  if (!response.ok) throw new Error('Failed to generate ICS file');

  if (Platform.OS === 'web') {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  // Native: save to temp file and share
  const icsText = await response.text();
  const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
  const fileUri = FileSystem.cacheDirectory + filename;

  await FileSystem.writeAsStringAsync(fileUri, icsText, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/calendar',
      dialogTitle: 'Add to Calendar',
    });
  }
}
