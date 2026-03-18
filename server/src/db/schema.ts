import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  provider: text('provider').notNull(),       // 'google' | 'microsoft'
  providerId: text('provider_id').notNull(),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  status: text('status').notNull(),           // 'active' | 'canceled' | 'past_due'
  provider: text('provider').notNull(),       // 'stripe' | 'revenuecat'
  providerSubId: text('provider_sub_id'),
  currentPeriodEnd: timestamp('current_period_end'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  date: text('date'),
  startTime: text('start_time'),
  endTime: text('end_time'),
  timezone: text('timezone'),
  location: text('location'),
  description: text('description'),
  attendees: jsonb('attendees'),              // Array<{ name: string; email: string | null }>
  calendarProvider: text('calendar_provider'), // 'google' | 'outlook' | 'apple' | 'ics'
  calendarEventId: text('calendar_event_id'),
  calendarEventUrl: text('calendar_event_url'),
  rawExtraction: jsonb('raw_extraction'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
