import ical, { ICalCalendarMethod } from 'ical-generator';
import type { MeetingExtraction } from './claudeService';

export function generateICS(meeting: MeetingExtraction): string {
  const calendar = ical({ name: 'Calify', method: ICalCalendarMethod.REQUEST });

  let start: Date;
  let end: Date;

  if (meeting.date) {
    const dateStr = meeting.date;
    const startTime = meeting.startTime ?? '09:00';
    start = new Date(`${dateStr}T${startTime}:00`);
  } else {
    start = new Date();
    start.setHours(start.getHours() + 1, 0, 0, 0);
  }

  if (meeting.endTime && meeting.date) {
    end = new Date(`${meeting.date}T${meeting.endTime}:00`);
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour
  }

  const attendees = (meeting.attendees ?? []).filter((a) => a.email);

  const event = calendar.createEvent({
    start,
    end,
    summary: meeting.title,
    description: meeting.description ?? undefined,
    location: meeting.location ?? undefined,
    timezone: meeting.timezone ?? 'UTC',
    organizer: meeting.organizer
      ? { name: meeting.organizer, email: 'noreply@calify.app' }
      : undefined,
  });

  for (const attendee of attendees) {
    event.createAttendee({ email: attendee.email!, name: attendee.name });
  }

  return calendar.toString();
}
