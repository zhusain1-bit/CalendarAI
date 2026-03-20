import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../middleware/auth';
import { createCheckoutSession, stripe as getStripe } from '../services/stripeService';
import { upsertSubscription } from '../db/queries';
import { createError } from '../middleware/errorHandler';
import Stripe from 'stripe';

const router = Router();

// POST /billing/create-checkout — authenticated users only
router.post('/create-checkout', requireAuth, async (req, res, next) => {
  try {
    const { successUrl, cancelUrl } = req.body as {
      successUrl: string;
      cancelUrl: string;
    };

    if (!successUrl || !cancelUrl) {
      return next(createError('successUrl and cancelUrl are required', 400, 'BAD_REQUEST'));
    }

    const url = await createCheckoutSession(
      req.user!.userId,
      req.user!.email,
      successUrl,
      cancelUrl
    );

    res.json({ url });
  } catch (err) {
    next(err);
  }
});

// POST /billing/portal — create Stripe customer portal session
router.post('/portal', requireAuth, async (req, res, next) => {
  try {
    const { returnUrl } = req.body as { returnUrl: string };

    // Look up customer by email
    const customers = await getStripe().customers.list({ email: req.user!.email, limit: 1 });
    if (!customers.data.length) {
      return next(createError('No Stripe customer found', 404, 'NOT_FOUND'));
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: returnUrl,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// POST /billing/webhook/stripe — Stripe webhook (raw body required)
router.post(
  '/webhook/stripe',
  async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers['stripe-signature'] as string;
    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        req.body as Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      return res.status(400).send(`Webhook signature error: ${err.message}`);
    }

    try {
      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated'
      ) {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await upsertSubscription({
            userId,
            status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
            provider: 'stripe',
            providerSubId: sub.id,
            currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
          });
        }
      } else if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;
        if (userId) {
          await upsertSubscription({
            userId,
            status: 'canceled',
            provider: 'stripe',
            providerSubId: sub.id,
          });
        }
      }

      res.json({ received: true });
    } catch (err) {
      next(err);
    }
  }
);

// POST /billing/webhook/revenuecat — RevenueCat webhook
router.post('/webhook/revenuecat', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (authHeader !== process.env.REVENUECAT_WEBHOOK_AUTH_HEADER) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { event } = req.body as {
      event: {
        type: string;
        app_user_id: string;
        expiration_at_ms?: number;
      };
    };

    const userId = event.app_user_id;
    const isActive = ['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION'].includes(event.type);
    const isCanceled = ['CANCELLATION', 'EXPIRATION', 'BILLING_ISSUE'].includes(event.type);

    if (isActive) {
      await upsertSubscription({
        userId,
        status: 'active',
        provider: 'revenuecat',
        currentPeriodEnd: event.expiration_at_ms ? new Date(event.expiration_at_ms) : undefined,
      });
    } else if (isCanceled) {
      await upsertSubscription({ userId, status: 'canceled', provider: 'revenuecat' });
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
});

export default router;
