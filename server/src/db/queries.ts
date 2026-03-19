import { eq, desc } from 'drizzle-orm';
import { db } from './client';
import { users, subscriptions, events, type NewUser, type NewEvent } from './schema';

// ─── Users ────────────────────────────────────────────────────────────────────

export async function findUserByProvider(provider: string, providerId: string) {
  return db.query.users.findFirst({
    where: (u, { and }) => and(eq(u.provider, provider), eq(u.providerId, providerId)),
  });
}

export async function findUserById(id: string) {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function upsertUser(data: NewUser) {
  const [user] = await db
    .insert(users)
    .values(data)
    .onConflictDoUpdate({
      target: users.email,
      set: { name: data.name, avatarUrl: data.avatarUrl },
    })
    .returning();
  return user;
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

export async function getActiveSubscription(userId: string) {
  return db.query.subscriptions.findFirst({
    where: (s, { and }) => and(eq(s.userId, userId), eq(s.status, 'active')),
  });
}

export async function upsertSubscription(data: {
  userId: string;
  status: string;
  provider: string;
  providerSubId?: string;
  currentPeriodEnd?: Date;
}) {
  const existing = await db.query.subscriptions.findFirst({
    where: (s, { and }) =>
      and(eq(s.userId, data.userId), eq(s.provider, data.provider)),
  });

  if (existing) {
    const [updated] = await db
      .update(subscriptions)
      .set({ status: data.status, currentPeriodEnd: data.currentPeriodEnd, updatedAt: new Date() })
      .where(eq(subscriptions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db.insert(subscriptions).values(data).returning();
  return created;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function createEvent(data: NewEvent) {
  const [event] = await db.insert(events).values(data).returning();
  return event;
}

export async function getEventsByUser(userId: string, limit = 50) {
  return db.query.events.findMany({
    where: eq(events.userId, userId),
    orderBy: desc(events.createdAt),
    limit,
  });
}

export async function getEventById(id: string, userId: string) {
  return db.query.events.findFirst({
    where: (e, { and }) => and(eq(e.id, id), eq(e.userId, userId)),
  });
}

export async function updateEvent(id: string, userId: string, data: Partial<NewEvent>) {
  const [updated] = await db
    .update(events)
    .set(data)
    .where(eq(events.id, id))
    .returning();
  return updated;
}

export async function deleteEvent(id: string, userId: string) {
  await db
    .delete(events)
    .where(eq(events.id, id));
}
