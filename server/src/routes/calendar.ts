import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createGoogleCalendarEvent } from '../services/googleCalService';
import { createOutlookCalendarEvent } from '../services/outlookCalService';
import { createZoomMeeting } from '../services/zoomService';
import { createError } from '../middleware/errorHandler';
import type { MeetingExtraction } from '../services/claudeService';

const router = Router();

router.use(requireAuth);

router.post('/create', async (req, res, next) => {
  try {
    const {
      provider,
      accessToken,
      meeting: rawMeeting,
      conferenceType,
      zoomAccessToken,
    } = req.body as {
      provider: 'google' | 'outlook';
      accessToken: string;
      meeting: MeetingExtraction;
      conferenceType?: 'meet' | 'zoom';
      zoomAccessToken?: string;
    };

    let meeting: MeetingExtraction = rawMeeting;

    if (!provider || !accessToken || !meeting) {
      return next(createError('provider, accessToken, and meeting are required', 400, 'BAD_REQUEST'));
    }

    if (conferenceType === 'zoom' && !zoomAccessToken) {
      return next(createError('zoomAccessToken is required when conferenceType is zoom', 400, 'BAD_REQUEST'));
    }

    let zoomConferenceLink: string | undefined;

    if (conferenceType === 'zoom') {
      const startTimeIso = meeting.date && meeting.startTime
        ? `${meeting.date}T${meeting.startTime}:00`
        : null;
      const zoomResult = await createZoomMeeting(
        zoomAccessToken!,
        meeting.title,
        startTimeIso,
        60,
        meeting.timezone
      );
      zoomConferenceLink = zoomResult.joinUrl;

      // Embed zoom link into meeting description and location
      const zoomSuffix = `(Zoom: ${zoomResult.joinUrl})`;
      meeting = {
        ...meeting,
        location: meeting.location ?? zoomResult.joinUrl,
        description: meeting.description
          ? `${meeting.description}\n${zoomSuffix}`
          : zoomSuffix,
      };
    }

    let result: { eventId: string; eventUrl: string; conferenceLink?: string };

    if (provider === 'google') {
      result = await createGoogleCalendarEvent(
        accessToken,
        meeting,
        conferenceType === 'meet' ? 'meet' : undefined
      );
    } else if (provider === 'outlook') {
      result = await createOutlookCalendarEvent(accessToken, meeting);
    } else {
      return next(createError(`Unsupported provider: ${provider}`, 400, 'BAD_REQUEST'));
    }

    res.json({
      ...result,
      conferenceLink: result.conferenceLink ?? zoomConferenceLink ?? undefined,
    });
  } catch (err: any) {
    const is401 = err?.response?.status === 401 || err?.status === 401 || String(err?.code) === '401'
      || err?.message?.toLowerCase().includes('access token') && err?.message?.toLowerCase().includes('expired');
    if (is401) {
      return next(createError('Your Google session has expired. Please go to Account and reconnect Google Calendar.', 401, 'GOOGLE_TOKEN_EXPIRED'));
    }
    next(err);
  }
});

export default router;
