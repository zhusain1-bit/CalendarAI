import { google } from 'googleapis';

export interface FreeSlot {
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:MM 24h
  endTime: string;    // HH:MM 24h
  timezone: string;   // IANA
}

export interface AvailabilityPreferences {
  count: 1 | 2 | 3;
  timeOfDay: 'morning' | 'afternoon' | 'any';
  timeframe: 'this_week' | 'next_week' | 'flexible';
}

// Convert a local date (YYYY-MM-DD) + hour to the equivalent UTC Date
function localToUTC(dateStr: string, hour: number, tz: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Treat the desired local time as UTC as an initial guess
  const candidate = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));

  // Find what local time this UTC candidate corresponds to
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(candidate);

  const lYear = parseInt(parts.find((p) => p.type === 'year')!.value);
  const lMonth = parseInt(parts.find((p) => p.type === 'month')!.value);
  const lDay = parseInt(parts.find((p) => p.type === 'day')!.value);
  const lHour = parseInt(parts.find((p) => p.type === 'hour')!.value) % 24;

  // offset = UTC - (local expressed as UTC)
  const offset = candidate.getTime() - Date.UTC(lYear, lMonth - 1, lDay, lHour, 0, 0);

  // Actual UTC = desired local (expressed as UTC) + offset
  return new Date(Date.UTC(year, month - 1, day, hour, 0, 0) + offset);
}

// Return YYYY-MM-DD in a given timezone
function getDateStr(date: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(date);
}

// Format a UTC timestamp as HH:MM in a given timezone
function formatHHMM(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const h = parts.find((p) => p.type === 'hour')!.value;
  const m = parts.find((p) => p.type === 'minute')!.value;
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000);
}

async function getCalendarTimezone(accessToken: string): Promise<string> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });
  try {
    const cal = await calendar.calendars.get({ calendarId: 'primary' });
    return cal.data.timeZone ?? 'UTC';
  } catch {
    return 'UTC';
  }
}

function generateCandidateDates(prefs: AvailabilityPreferences, todayStr: string): string[] {
  const [year, month, day] = todayStr.split('-').map(Number);
  const todayUTC = new Date(Date.UTC(year, month - 1, day));
  const dow = todayUTC.getUTCDay(); // 0=Sun, 1=Mon … 6=Sat

  let startUTC: Date;
  let endUTC: Date;

  if (prefs.timeframe === 'this_week') {
    startUTC = todayUTC;
    const daysUntilSun = dow === 0 ? 0 : 7 - dow;
    endUTC = addDays(todayUTC, daysUntilSun);
  } else if (prefs.timeframe === 'next_week') {
    const daysUntilNextMon = dow === 0 ? 1 : 8 - dow;
    startUTC = addDays(todayUTC, daysUntilNextMon);
    endUTC = addDays(startUTC, 6);
  } else {
    // flexible: 14 days
    startUTC = todayUTC;
    endUTC = addDays(todayUTC, 14);
  }

  const dates: string[] = [];
  let cur = startUTC;
  while (cur.getTime() <= endUTC.getTime()) {
    dates.push(cur.toISOString().split('T')[0]);
    cur = addDays(cur, 1);
  }
  return dates;
}

function getWorkingHours(prefs: AvailabilityPreferences): { startHour: number; endHour: number } {
  if (prefs.timeOfDay === 'morning') return { startHour: 9, endHour: 12 };
  if (prefs.timeOfDay === 'afternoon') return { startHour: 12, endHour: 17 };
  return { startHour: 9, endHour: 17 };
}

export async function getFreeSlotsFromGoogle(
  accessToken: string,
  preferences: AvailabilityPreferences,
  timezone?: string | null
): Promise<FreeSlot[]> {
  const tz = timezone ?? (await getCalendarTimezone(accessToken));

  const now = new Date();
  const todayStr = getDateStr(now, tz);

  const candidateDates = generateCandidateDates(preferences, todayStr);
  if (candidateDates.length === 0) return [];

  const { startHour, endHour } = getWorkingHours(preferences);

  // Compute full UTC range for freebusy query
  const firstDate = candidateDates[0];
  const lastDate = candidateDates[candidateDates.length - 1];
  const timeMin = localToUTC(firstDate, startHour, tz);
  const timeMax = localToUTC(lastDate, endHour, tz);

  // Query Google FreeBusy API
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const calendar = google.calendar({ version: 'v3', auth });

  const freeBusyRes = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: 'primary' }],
    },
  });

  const busyIntervals = (freeBusyRes.data.calendars?.['primary']?.busy ?? []).map((b) => ({
    start: new Date(b.start!).getTime(),
    end: new Date(b.end!).getTime(),
  }));

  // Per-day free-slot extraction
  const slotsByDay: FreeSlot[][] = [];

  for (const dateStr of candidateDates) {
    const dayWindowStart = localToUTC(dateStr, startHour, tz).getTime();
    const dayWindowEnd = localToUTC(dateStr, endHour, tz).getTime();

    // Skip days entirely in the past
    if (dayWindowEnd <= now.getTime()) continue;

    // Round effective start up to next 30-minute boundary
    const effectiveStart = Math.max(dayWindowStart, now.getTime());
    const roundedStart = Math.ceil(effectiveStart / 1_800_000) * 1_800_000;

    if (roundedStart + 1_800_000 > dayWindowEnd) continue;

    // Busy intervals overlapping this day's window, clipped to it
    const dayBusy = busyIntervals
      .filter((b) => b.end > dayWindowStart && b.start < dayWindowEnd)
      .map((b) => ({
        start: Math.max(b.start, dayWindowStart),
        end: Math.min(b.end, dayWindowEnd),
      }))
      .sort((a, b) => a.start - b.start);

    // Invert busy to get free intervals
    const freeIntervals: { start: number; end: number }[] = [];
    let cursor = roundedStart;

    for (const busy of dayBusy) {
      if (busy.start > cursor && busy.start - cursor >= 1_800_000) {
        freeIntervals.push({ start: cursor, end: busy.start });
      }
      cursor = Math.max(cursor, busy.end);
    }

    if (dayWindowEnd - cursor >= 1_800_000) {
      freeIntervals.push({ start: cursor, end: dayWindowEnd });
    }

    // Take first 30-minute slot from each free interval
    const daySlots: FreeSlot[] = [];
    for (const interval of freeIntervals) {
      const slotStart = interval.start;
      const slotEnd = slotStart + 1_800_000;
      if (slotEnd <= interval.end) {
        daySlots.push({
          date: dateStr,
          startTime: formatHHMM(new Date(slotStart), tz),
          endTime: formatHHMM(new Date(slotEnd), tz),
          timezone: tz,
        });
        break; // one slot per free block to keep suggestions brief
      }
    }

    if (daySlots.length > 0) {
      slotsByDay.push(daySlots);
    }
  }

  // Spread suggestions: one slot per day, round-robin until count is met
  const result: FreeSlot[] = [];
  const { count } = preferences;

  for (const daySlots of slotsByDay) {
    if (result.length >= count) break;
    result.push(daySlots[0]);
  }

  return result.slice(0, count);
}
