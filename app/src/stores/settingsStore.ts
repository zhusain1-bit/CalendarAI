import { create } from 'zustand';
import { storage } from '../utils/storage';

const STORAGE_KEY = 'calify_settings';

export type DurationOption = 15 | 30 | 45 | 60 | 90 | 120;
export type TimeFormat = '12h' | '24h';
export type DefaultProvider = 'google' | 'outlook' | 'apple' | 'ics' | null;

export interface AppSettings {
  defaultMeetingDuration: DurationOption;
  timeFormat: TimeFormat;
  defaultTimezone: string;
  defaultCalendarProvider: DefaultProvider;
  defaultMeetingTitleTemplate: string | null;
}

interface SettingsState extends AppSettings {
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

const SYSTEM_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

const DEFAULTS: AppSettings = {
  defaultMeetingDuration: 30,
  timeFormat: '12h',
  defaultTimezone: SYSTEM_TZ,
  defaultCalendarProvider: null,
  defaultMeetingTitleTemplate: null,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,

  updateSettings: async (patch) => {
    set(patch);
    const current = get();
    await storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        defaultMeetingDuration: current.defaultMeetingDuration,
        timeFormat: current.timeFormat,
        defaultTimezone: current.defaultTimezone,
        defaultCalendarProvider: current.defaultCalendarProvider,
        defaultMeetingTitleTemplate: current.defaultMeetingTitleTemplate,
        ...patch,
      })
    );
  },

  loadFromStorage: async () => {
    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as Partial<AppSettings>;
      set({ ...DEFAULTS, ...saved });
    } catch {}
  },
}));

// Helpers used across the app
export function formatDuration(minutes: DurationOption): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes === 90) return '1h 30m';
  return `${minutes / 60}h`;
}

export function formatTimeWithSettings(hhmm: string, timeFormat: TimeFormat): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (timeFormat === '24h') return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}
