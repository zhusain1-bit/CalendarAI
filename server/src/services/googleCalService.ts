import { google } from 'googleapis';
import type { MeetingExtraction } from './claudeService';

function buildDateTime(date: string | null, time: string | null, timezone: string | null) {
  if (!date) return null;
  if (!time) {
    return { date, timeZone: timezone ?? 'UTC' };
  }
  return {
    dateTime: `${date}T${time}:00`,
    timeZone: timezone ?? 'UTC',
  };
}

export interface CreateEventResult {
  eventId: string;
  eventUrl: string;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  meeting: MeetingExtraction
): Promise<CreateEventResult> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const start = buildDateTime(meeting.date, meeting.startTime, meeting.timezone);
  const end = buildDateTime(meeting.date, meeting.endTime ?? meeting.startTime, meeting.timezone);

  // Default 1-hour duration if only start time provided
  if (start && end && start.dateTime === end.dateTime && meeting.startTime) {
    const [h, m] = meeting.startTime.split(':').map(Number);
    const endHour = String(h + 1).padStart(2, '0');
    end.dateTime = `${meeting.date}T${endHour}:${String(m).padStart(2, '0')}:00`;
  }

  const attendees = (meeting.attendees ?? [])
    .filter((a) => a.email)
    .map((a) => ({ email: a.email!, displayName: a.name }));

  const event = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody: {
      summary: meeting.title,
      location: meeting.location ?? undefined,
      description: meeting.description ?? undefined,
      start: start ?? { date: new Date().toISOString().split('T')[0] },
      end: end ?? { date: new Date().toISOString().split('T')[0] },
      attendees,
    },
  });

  return {
    eventId: event.data.id!,
    eventUrl: event.data.htmlLink!,
  };
}
