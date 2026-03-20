import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { getFreeSlotsFromGoogle, type AvailabilityPreferences } from '../services/availabilityService';
import { draftAvailabilityReply } from '../services/claudeService';
import type { MeetingExtraction } from '../services/claudeService';

const router = Router();

router.use(requireAuth);

router.post('/suggest', async (req, res, next) => {
  try {
    const { accessToken, meeting, preferences } = req.body as {
      accessToken: string;
      meeting: MeetingExtraction;
      preferences: AvailabilityPreferences;
    };

    if (!accessToken || !meeting || !preferences) {
      return next(createError('accessToken, meeting, and preferences are required', 400, 'BAD_REQUEST'));
    }

    if (![1, 2, 3].includes(preferences.count)) {
      return next(createError('count must be 1, 2, or 3', 400, 'BAD_REQUEST'));
    }

    if (!['morning', 'afternoon', 'any'].includes(preferences.timeOfDay)) {
      return next(createError('Invalid timeOfDay value', 400, 'BAD_REQUEST'));
    }

    if (!['this_week', 'next_week', 'flexible'].includes(preferences.timeframe)) {
      return next(createError('Invalid timeframe value', 400, 'BAD_REQUEST'));
    }

    const slots = await getFreeSlotsFromGoogle(accessToken, preferences, meeting.timezone);

    if (slots.length === 0) {
      return next(
        createError(
          'No available slots found in the selected timeframe. Try a wider timeframe or different time of day.',
          422,
          'NO_SLOTS_FOUND'
        )
      );
    }

    const reply = await draftAvailabilityReply(meeting, slots);

    res.json({ reply, slots });
  } catch (err: any) {
    if (err?.response?.status === 401 || err?.status === 401 || err?.code === 401) {
      return next(createError('Google access token expired. Please reconnect your Google account.', 401, 'GOOGLE_TOKEN_EXPIRED'));
    }
    next(err);
  }
});

export default router;
