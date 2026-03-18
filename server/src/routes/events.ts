import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import {
  createEvent,
  getEventsByUser,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../db/queries';

const router = Router();

// All event routes require auth
router.use(requireAuth);

// GET /events — list all events for the user
router.get('/', async (req, res, next) => {
  try {
    const eventList = await getEventsByUser(req.user!.userId);
    res.json({ events: eventList });
  } catch (err) {
    next(err);
  }
});

// POST /events — save a new event record
router.post('/', async (req, res, next) => {
  try {
    const {
      title, date, startTime, endTime, timezone,
      location, description, attendees,
      calendarProvider, calendarEventId, calendarEventUrl,
      rawExtraction,
    } = req.body;

    if (!title) return next(createError('title is required', 400, 'BAD_REQUEST'));

    const event = await createEvent({
      userId: req.user!.userId,
      title,
      date: date ?? null,
      startTime: startTime ?? null,
      endTime: endTime ?? null,
      timezone: timezone ?? null,
      location: location ?? null,
      description: description ?? null,
      attendees: attendees ?? null,
      calendarProvider: calendarProvider ?? null,
      calendarEventId: calendarEventId ?? null,
      calendarEventUrl: calendarEventUrl ?? null,
      rawExtraction: rawExtraction ?? null,
    });

    res.status(201).json({ event });
  } catch (err) {
    next(err);
  }
});

// PATCH /events/:id — update an event
router.patch('/:id', async (req, res, next) => {
  try {
    const existing = await getEventById(req.params.id, req.user!.userId);
    if (!existing) return next(createError('Event not found', 404, 'NOT_FOUND'));

    const updated = await updateEvent(req.params.id, req.user!.userId, req.body);
    res.json({ event: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /events/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await getEventById(req.params.id, req.user!.userId);
    if (!existing) return next(createError('Event not found', 404, 'NOT_FOUND'));

    await deleteEvent(req.params.id, req.user!.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
