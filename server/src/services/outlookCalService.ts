import type { MeetingExtraction } from './claudeService';

export interface CreateEventResult {
  eventId: string;
  eventUrl: string;
}

function toISODateTime(date: string | null, time: string | null, timezone: string | null): string {
  if (!date) return new Date().toISOString();
  const t = time ?? '09:00';
  return `${date}T${t}:00`;
}

export async function createOutlookCalendarEvent(
  accessToken: string,
  meeting: MeetingExtraction
): Promise<CreateEventResult> {
  const startDateTime = toISODateTime(meeting.date, meeting.startTime, meeting.timezone);

  let endDateTime: string;
  if (meeting.endTime && meeting.date) {
    endDateTime = toISODateTime(meeting.date, meeting.endTime, meeting.timezone);
  } else {
    // Default +1 hour
    const start = new Date(startDateTime);
    start.setHours(start.getHours() + 1);
    endDateTime = start.toISOString();
  }

  const timeZone = meeting.timezone ?? 'UTC';

  const attendees = (meeting.attendees ?? [])
    .filter((a) => a.email)
    .map((a) => ({
      emailAddress: { address: a.email!, name: a.name },
      type: 'required',
    }));

  const body = {
    subject: meeting.title,
    body: { contentType: 'text', content: meeting.description ?? '' },
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    location: meeting.location ? { displayName: meeting.location } : undefined,
    attendees,
    isOnlineMeeting: false,
  };

  const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Microsoft Graph error: ${response.status} ${err}`);
  }

  const data = await response.json() as { id: string; webLink: string };

  return {
    eventId: data.id,
    eventUrl: data.webLink,
  };
}
