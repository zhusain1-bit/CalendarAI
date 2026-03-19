import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireSubscription } from '../middleware/requireSubscription';
import { upload } from '../middleware/upload';
import { extractMeetingFromImage } from '../services/claudeService';
import { createError } from '../middleware/errorHandler';

const router = Router();

router.post(
  '/',
  requireAuth,
  requireSubscription,
  upload.single('image'),
  async (req, res, next) => {
    try {
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

export default router;
