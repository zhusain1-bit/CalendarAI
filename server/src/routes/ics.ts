import { Router } from 'express';
import { generateICS } from '../services/icsService';
import { createError } from '../middleware/errorHandler';
import type { MeetingExtraction } from '../services/claudeService';

const router = Router();

// POST /ics/generate — no auth required (ICS is the anonymous fallback)
router.post('/generate', (req, res, next) => {
  try {
    const meeting = req.body as MeetingExtraction;
    if (!meeting?.title) {
      return next(createError('meeting.title is required', 400, 'BAD_REQUEST'));
    }

    const icsContent = generateICS(meeting);
    const filename = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(icsContent);
  } catch (err) {
    next(err);
  }
});

export default router;
