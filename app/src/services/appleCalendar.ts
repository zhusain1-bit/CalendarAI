import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export interface MeetingData {
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  location: string | null;
  description: string | null;
  attendees: Array<{ name: string; email: string | null }>;
}

export async function createNativeCalendarEvent(meeting: MeetingData): Promise<string | null> {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  // Find the default calendar
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCal = calendars.find((c) =>
    Platform.OS === 'ios'
      ? c.allowsModifications && c.source?.type === Calendar.SourceType.LOCAL
      : c.isPrimary && c.allowsModifications
  ) ?? calendars.find((c) => c.allowsModifications);

  if (!defaultCal) return null;

  let startDate: Date;
  if (meeting.date) {
    const t = meeting.startTime ?? '09:00';
    startDate = new Date(`${meeting.date}T${t}:00`);
  } else {
    startDate = new Date();
    startDate.setHours(startDate.getHours() + 1, 0, 0, 0);
  }

  let endDate: Date;
  if (meeting.endTime && meeting.date) {
    endDate = new Date(`${meeting.date}T${meeting.endTime}:00`);
  } else {
    endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  }

  const eventId = await Calendar.createEventAsync(defaultCal.id, {
    title: meeting.title,
    startDate,
    endDate,
    location: meeting.location ?? undefined,
    notes: meeting.description ?? undefined,
    timeZone: meeting.timezone ?? undefined,
  });

  return eventId;
}
