import { Router } from 'express';
import { google } from 'googleapis';
import { signToken, requireAuth } from '../middleware/auth';
import { upsertUser, findUserById, getActiveSubscription } from '../db/queries';
import { createError } from '../middleware/errorHandler';

const router = Router();

// ─── Google OAuth ─────────────────────────────────────────────────────────────

router.post('/google', async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body as { code: string; redirectUri: string };
    if (!code || !redirectUri) {
      return next(createError('Missing code or redirectUri', 400, 'BAD_REQUEST'));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email) {
      return next(createError('Could not retrieve Google account email', 400, 'BAD_REQUEST'));
    }

    const user = await upsertUser({
      provider: 'google',
      providerId: profile.id!,
      email: profile.email,
      name: profile.name ?? null,
      avatarUrl: profile.picture ?? null,
    });

    const appToken = signToken({ userId: user.id, email: user.email });

    res.json({
      token: appToken,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Microsoft OAuth ──────────────────────────────────────────────────────────

router.post('/microsoft', async (req, res, next) => {
  try {
    const { code, redirectUri } = req.body as { code: string; redirectUri: string };
    if (!code || !redirectUri) {
      return next(createError('Missing code or redirectUri', 400, 'BAD_REQUEST'));
    }

    const tokenRes = await fetch(
      `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? 'common'}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          scope: 'openid profile email Calendars.ReadWrite',
        }),
      }
    );

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      throw new Error(`Microsoft token exchange failed: ${errText}`);
    }

    const tokens = await tokenRes.json() as {
      access_token: string;
      refresh_token?: string;
    };

    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const profile = await profileRes.json() as { id: string; mail: string; displayName: string };

    const email = profile.mail;
    if (!email) return next(createError('Could not retrieve Microsoft email', 400, 'BAD_REQUEST'));

    const user = await upsertUser({
      provider: 'microsoft',
      providerId: profile.id,
      email,
      name: profile.displayName ?? null,
      avatarUrl: null,
    });

    const appToken = signToken({ userId: user.id, email: user.email });

    res.json({
      token: appToken,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Get current user + subscription status ───────────────────────────────────

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await findUserById(req.user!.userId);
    if (!user) return next(createError('User not found', 404, 'NOT_FOUND'));

    const sub = await getActiveSubscription(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name, avatarUrl: user.avatarUrl },
      subscriptionStatus: sub?.status ?? 'none',
      subscriptionPeriodEnd: sub?.currentPeriodEnd ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
