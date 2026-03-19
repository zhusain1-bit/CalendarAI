# Calify

**Screenshot a message. Get a calendar invite. Instantly.**

Calify is a cross-platform SaaS app (iOS, Android, Web) that uses Claude Vision AI to extract meeting information from any screenshot and automatically creates a calendar event — complete with attendee invites.

## Features

- 📸 **Screenshot any message** — iMessage, WhatsApp, Gmail, Slack, Teams, Telegram
- 🤖 **AI extraction** — Claude Vision reads date, time, location, attendees, title
- 📅 **Multiple calendars** — Google Calendar, Outlook/Microsoft 365, Apple Calendar, ICS download
- 👥 **Auto invites** — sends calendar invites to all attendees
- 📋 **Event history** — view, edit, and delete past events
- 💳 **Subscription billing** — Stripe (web) + RevenueCat (mobile)
- 🌐 **Cross-platform** — single codebase for iOS, Android, and web

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native + Expo (expo-router) |
| AI | Claude claude-sonnet-4-6 (Anthropic) |
| State | Zustand |
| Backend | Express.js + TypeScript |
| Database | PostgreSQL via Drizzle ORM |
| Auth | Google OAuth + Microsoft OAuth (PKCE) + JWT |
| Calendar | Google Calendar API, Microsoft Graph API, expo-calendar, ical-generator |
| Payments | Stripe Checkout (web) + RevenueCat (mobile) |
| Deployment | Railway (API) + Vercel (web) + EAS (iOS/Android) |

---

## Project Structure

```
CalendarAI/
├── app/          # Expo app (iOS, Android, Web)
├── server/       # Express API
├── .env.example  # Environment variable template
└── package.json  # npm workspaces root
```

---

## Setup

### Prerequisites

- Node.js 22+
- PostgreSQL database (local or Railway)
- Anthropic API key
- Google Cloud Console project with Calendar API enabled
- Microsoft Azure AD app registration
- Stripe account with a product/price created
- RevenueCat account (for mobile subscriptions)

### 1. Clone and install

```bash
git clone <repo-url>
cd CalendarAI
npm install
```

### 2. Configure environment variables

```bash
cp .env.example server/.env
cp .env.example app/.env
# Edit both files with your actual keys
```

### 3. Set up the database

```bash
# Create a PostgreSQL database, then:
cd server
npm run db:push    # Push schema to database (development)
# OR
npm run db:generate && npm run db:migrate  # Generate + run migrations (production)
```

### 4. Run locally

```bash
# Terminal 1 — API server
npm run dev:server

# Terminal 2 — Expo app
npm run dev:app
# Press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/google | — | Exchange Google auth code for JWT |
| POST | /auth/microsoft | — | Exchange Microsoft auth code for JWT |
| GET | /auth/me | JWT | Get current user + subscription status |
| POST | /extract | JWT + Sub | Extract meeting from screenshot image |
| GET | /events | JWT | List user's event history |
| POST | /events | JWT | Save an event to history |
| PATCH | /events/:id | JWT | Update an event |
| DELETE | /events/:id | JWT | Delete an event |
| POST | /calendar/create | JWT + Sub | Create Google or Outlook calendar event |
| POST | /ics/generate | — | Generate ICS file (no auth required) |
| POST | /billing/create-checkout | JWT | Create Stripe Checkout session |
| POST | /billing/portal | JWT | Create Stripe billing portal session |
| POST | /billing/webhook/stripe | — | Stripe webhook handler |
| POST | /billing/webhook/revenuecat | — | RevenueCat webhook handler |

---

## Google Cloud Console Setup

1. Create a project → Enable **Google Calendar API**
2. OAuth Consent Screen → External → Add scope: `https://www.googleapis.com/auth/calendar.events`
3. Credentials → OAuth 2.0 Client ID → **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:8081` (development)
   - `https://auth.expo.io/@your-username/calify` (Expo Go)
   - `calify://auth/callback` (native production)
   - `https://calify.app` (web production)

## Microsoft Azure Setup

1. Azure Portal → App registrations → New registration
2. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
3. Redirect URIs: Same as Google above
4. API permissions → Add: `Calendars.ReadWrite`, `openid`, `profile`, `email`, `offline_access`
5. Certificates & secrets → New client secret → copy value

## Stripe Setup

1. Create a product called "Calify" with a recurring price (e.g. $9/month)
2. Copy the **Price ID** → set as `STRIPE_PRICE_ID`
3. Webhooks → Add endpoint: `https://your-api.railway.app/billing/webhook/stripe`
4. Events to listen: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## RevenueCat Setup

1. Create a project → Add iOS and Android apps
2. Set up your products (match Stripe price if desired)
3. Integrations → Webhooks → `https://your-api.railway.app/billing/webhook/revenuecat`
4. Set a webhook authentication header and save in `REVENUECAT_WEBHOOK_AUTH_HEADER`

---

## Deployment

### Backend (Railway)

1. Connect your GitHub repo to Railway
2. Set root directory to `server/`
3. Add all environment variables from `server/.env`
4. Railway will auto-build and deploy on push

### Web App (Vercel)

1. Connect your GitHub repo to Vercel
2. Set root directory to `app/`
3. Build command: `npm run build:web`
4. Output directory: `dist`
5. Add `EXPO_PUBLIC_*` environment variables

### Mobile Apps (EAS Build)

```bash
cd app
npm install -g eas-cli
eas login
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios
eas submit --platform android
```

---

## License

MIT © 2026 Calify
