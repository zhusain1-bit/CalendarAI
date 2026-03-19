import { Router } from 'express';
import { createGoogleCalendarEvent } from '../services/googleCalService';
import { createOutlookCalendarEvent } from '../services/outlookCalService';
import { createError } from '../middleware/errorHandler';
import type { MeetingExtraction } from '../services/claudeService';

const router = Router();

router.post('/create', async (req, res, next) => {
  try {
    const {
      provider,
      accessToken,
      meeting,
    } = req.body as {
      provider: 'google' | 'outlook';
      accessToken: string;
      meeting: MeetingExtraction;
    };

    if (!provider || !accessToken || !meeting) {
      return next(createError('provider, accessToken, and meeting are required', 400, 'BAD_REQUEST'));
    }

    let result: { eventId: string; eventUrl: string };

    if (provider === 'google') {
      result = await createGoogleCalendarEvent(accessToken, meeting);
    } else if (provider === 'outlook') {
      result = await createOutlookCalendarEvent(accessToken, meeting);
    } else {
      return next(createError(`Unsupported provider: ${provider}`, 400, 'BAD_REQUEST'));
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
