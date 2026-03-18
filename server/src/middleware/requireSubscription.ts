import { Request, Response, NextFunction } from 'express';
import { getActiveSubscription } from '../db/queries';
import { createError } from './errorHandler';

export async function requireSubscription(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(createError('Unauthorized', 401, 'UNAUTHORIZED'));
  }

  const sub = await getActiveSubscription(req.user.userId);
  if (!sub) {
    return next(createError('Active subscription required', 402, 'SUBSCRIPTION_REQUIRED'));
  }

  next();
}
