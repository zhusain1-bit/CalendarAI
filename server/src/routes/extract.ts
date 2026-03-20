import { Router } from 'express';
import { upload } from '../middleware/upload';
import { requireAuth } from '../middleware/auth';
import { extractMeetingFromImage, extractMeetingFromText } from '../services/claudeService';
import { createError } from '../middleware/errorHandler';
import { getActiveSubscription, countEventsByUser } from '../db/queries';

const FREE_EXTRACTION_LIMIT = 10;

async function checkPaywall(userId: string): Promise<boolean> {
  const sub = await getActiveSubscription(userId);
  if (sub) return true;
  const used = await countEventsByUser(userId);
  return used < FREE_EXTRACTION_LIMIT;
}

const router = Router();

router.post(
  '/',
  requireAuth,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!await checkPaywall(req.user!.userId)) {
        return next(createError(
          `Free plan includes ${FREE_EXTRACTION_LIMIT} events. Subscribe for unlimited access.`,
          402,
          'SUBSCRIPTION_REQUIRED'
        ));
      }

      if (!req.file) {
        return next(createError('No image file provided', 400, 'NO_IMAGE'));
      }

      const meeting = await extractMeetingFromImage(req.file.buffer, req.file.mimetype);
      res.json({ meeting });
    } catch (err) {
      next(err);
    }
  }
);

router.post('/text', requireAuth, async (req, res, next) => {
  try {
    if (!await checkPaywall(req.user!.userId)) {
      return next(createError(
        `Free plan includes ${FREE_EXTRACTION_LIMIT} events. Subscribe for unlimited access.`,
        402,
        'SUBSCRIPTION_REQUIRED'
      ));
    }

    const { text } = req.body as { text: string };
    if (!text?.trim()) {
      return next(createError('text is required', 400, 'BAD_REQUEST'));
    }

    const meeting = await extractMeetingFromText(text.trim());
    res.json({ meeting });
  } catch (err) {
    next(err);
  }
});

export default router;
