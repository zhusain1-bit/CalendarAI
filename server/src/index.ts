import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth';
import extractRouter from './routes/extract';
import eventsRouter from './routes/events';
import calendarRouter from './routes/calendar';
import icsRouter from './routes/ics';
import billingRouter from './routes/billing';
import availabilityRouter from './routes/availability';
import { errorHandler } from './middleware/errorHandler';

const app = express();

// ─── Trust Railway's proxy (required for express-rate-limit) ──────────────────
app.set('trust proxy', 1);

// ─── Security headers ─────────────────────────────────────────────────────────
// Disable crossOriginOpenerPolicy so OAuth popups can communicate back
app.use(helmet({ crossOriginOpenerPolicy: false }));

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').filter(Boolean);
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// ─── Stripe webhook needs raw body — register BEFORE json middleware ───────────
app.use(
  '/billing/webhook/stripe',
  express.raw({ type: 'application/json' })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
const extractLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,
  message: { error: { message: 'Too many extraction requests', code: 'RATE_LIMITED' } },
});

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: { message: 'Too many requests', code: 'RATE_LIMITED' } },
});

app.use(globalLimiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/auth', authRouter);
app.use('/extract', extractLimiter, extractRouter);
app.use('/events', eventsRouter);
app.use('/calendar', calendarRouter);
app.use('/ics', icsRouter);
app.use('/billing', billingRouter);
app.use('/availability', extractLimiter, availabilityRouter);

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

const PORT = parseInt(process.env.PORT ?? '3001', 10);
app.listen(PORT, () => {
  console.log(`Calify API listening on port ${PORT}`);
});

export default app;
