import { create } from 'zustand';
import { api } from '../services/api';
import { imageToFormData, type PickedImage } from '../utils/imageUtils';

export interface Attendee {
  name: string;
  email: string | null;
}

export interface MeetingData {
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  location: string | null;
  description: string | null;
  attendees: Attendee[];
  organizer: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface SavedEvent {
  id: string;
  userId: string;
  title: string;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  timezone: string | null;
  location: string | null;
  description: string | null;
  attendees: Attendee[] | null;
  calendarProvider: string | null;
  calendarEventId: string | null;
  calendarEventUrl: string | null;
  createdAt: string;
}

type ExtractionStatus = 'idle' | 'extracting' | 'extracted' | 'error';

interface MeetingState {
  status: ExtractionStatus;
  error: string | null;
  currentMeeting: MeetingData | null;
  history: SavedEvent[];
  historyLoading: boolean;

  extractFromImage: (image: PickedImage) => Promise<void>;
  extractFromText: (text: string) => Promise<void>;
  updateCurrentMeeting: (data: Partial<MeetingData>) => void;
  resetExtraction: () => void;

  loadHistory: () => Promise<void>;
  saveEvent: (data: Omit<SavedEvent, 'id' | 'userId' | 'createdAt'>) => Promise<SavedEvent>;
  deleteEvent: (id: string) => Promise<void>;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  status: 'idle',
  error: null,
  currentMeeting: null,
  history: [],
  historyLoading: false,

  extractFromImage: async (image) => {
    set({ status: 'extracting', error: null });
    try {
      const formData = await imageToFormData(image);
      const result = await api.upload<{ meeting: MeetingData }>('/extract', formData);
      set({ status: 'extracted', currentMeeting: result.meeting });
    } catch (err: any) {
      set({
        status: 'error',
        error: err.code === 'SUBSCRIPTION_REQUIRED'
          ? err.message
          : (err.code === 'UNAUTHORIZED' ? 'Sign in to extract meeting details.' : (err.message ?? 'Extraction failed')),
      });
    }
  },

  extractFromText: async (text) => {
    set({ status: 'extracting', error: null });
    try {
      const result = await api.post<{ meeting: MeetingData }>('/extract/text', { text });
      set({ status: 'extracted', currentMeeting: result.meeting });
    } catch (err: any) {
      set({
        status: 'error',
        error: err.code === 'SUBSCRIPTION_REQUIRED'
          ? err.message
          : (err.code === 'UNAUTHORIZED' ? 'Sign in to extract meeting details.' : (err.message ?? 'Extraction failed')),
      });
    }
  },

  updateCurrentMeeting: (data) => {
    const current = get().currentMeeting;
    if (!current) return;
    set({ currentMeeting: { ...current, ...data } });
  },

  resetExtraction: () => {
    set({ status: 'idle', error: null, currentMeeting: null });
  },

  loadHistory: async () => {
    set({ historyLoading: true });
    try {
      const result = await api.get<{ events: SavedEvent[] }>('/events');
      set({ history: result.events });
    } catch {}
    finally {
      set({ historyLoading: false });
    }
  },

  saveEvent: async (data) => {
    const result = await api.post<{ event: SavedEvent }>('/events', data);
    set((state) => ({ history: [result.event, ...state.history] }));
    return result.event;
  },

  deleteEvent: async (id) => {
    await api.delete(`/events/${id}`);
    set((state) => ({ history: state.history.filter((e) => e.id !== id) }));
  },
}));
