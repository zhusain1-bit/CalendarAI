import { format, parseISO, isValid } from 'date-fns';

export function formatEventDate(date: string | null, startTime: string | null): string {
  if (!date) return 'No date set';

  try {
    const dateObj = parseISO(date);
    if (!isValid(dateObj)) return date;

    const datePart = format(dateObj, 'EEE, MMM d, yyyy');
    if (!startTime) return datePart;

    const [h, m] = startTime.split(':').map(Number);
    const timeDate = new Date(dateObj);
    timeDate.setHours(h, m, 0, 0);
    const timePart = format(timeDate, 'h:mm a');
    return `${datePart} at ${timePart}`;
  } catch {
    return date;
  }
}

export function formatTimeRange(
  date: string | null,
  startTime: string | null,
  endTime: string | null
): string {
  if (!date) return '';
  if (!startTime) return formatEventDate(date, null);

  const dateObj = parseISO(date);
  const [sh, sm] = startTime.split(':').map(Number);
  const startDate = new Date(dateObj);
  startDate.setHours(sh, sm, 0, 0);

  const startStr = format(startDate, 'h:mm a');

  if (!endTime) return `${format(dateObj, 'EEE, MMM d')} · ${startStr}`;

  const [eh, em] = endTime.split(':').map(Number);
  const endDate = new Date(dateObj);
  endDate.setHours(eh, em, 0, 0);
  const endStr = format(endDate, 'h:mm a');

  return `${format(dateObj, 'EEE, MMM d')} · ${startStr}–${endStr}`;
}
