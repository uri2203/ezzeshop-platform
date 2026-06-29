# Deployment Guide — EzzeShop Platform

## Architecture Overview

| Service | Provider | URL pattern |
|---------|----------|-------------|
| Frontend (Next.js) | Vercel | `https://ezzeshop.vercel.app` |
| Backend (Express) | Render | `https://ezzeshop-api.onrender.com` |
| Database (PostgreSQL 16) | Render | Managed, internal URL |
| Cache (Redis 7) | Render | Managed, internal URL |
| Mobile (iOS/Android) | EAS (Expo) | App Store / Play Store |
| Media Storage | Cloudflare R2 | CDN-backed |

---

## 1. Frontend — Vercel

### First deploy
```bash
cd frontend
npx vercel --prod
```

### Environment variables (set in Vercel dashboard)
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL, e.g. `https://ezzeshop-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics ID |

### Auto-deploy
Push to `main` → Vercel redeploys automatically. The `frontend/vercel.json` config handles security headers and routing.

---

## 2. Backend — Render

### First deploy
1. Connect your GitHub repo at render.com
2. Select `backend/render.yaml` as the blueprint
3. Render creates: web service + PostgreSQL 16 + Redis automatically
4. Set the **sync: false** env vars manually in the dashboard (API keys)

### Run database migration
After first deploy, open the Render shell for the web service and run:
```bash
npm run migrate
```
Or connect directly:
```bash
DATABASE_URL=<from render dashboard> ./scripts/migrate-prod.sh
```

### Health check
`GET https://ezzeshop-api.onrender.com/health` → `{ "status": "ok" }`

---

## 3. Mobile — EAS (Expo Application Services)

### Prerequisites
```bash
npm install -g eas-cli
eas login
```

### Configure
```bash
cd mobile
cp .env.example .env
# Set EXPO_PUBLIC_API_URL=https://ezzeshop-api.onrender.com/api/v1
```

### Build

| Target | Command | Output |
|--------|---------|--------|
| Android (APK preview) | `eas build --profile preview --platform android` | `.apk` |
| iOS (simulator) | `eas build --profile development --platform ios` | `.app` |
| Production Android | `eas build --profile production --platform android` | `.aab` |
| Production iOS | `eas build --profile production --platform ios` | `.ipa` |

### Submit to stores
```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

### OTA Updates (no store review)
```bash
eas update --branch production --message "Hotfix: ..."
```

---

## 4. Required API Keys

The following secrets must be set before production goes live:

| Key | Where | Purpose |
|-----|-------|---------|
| `ANTHROPIC_API_KEY` | Render env | AI agent (claude-sonnet-4-6) |
| `STRIPE_SECRET_KEY` | Render env | Payments |
| `STRIPE_WEBHOOK_SECRET` | Render env | Stripe webhooks |
| `SENDGRID_API_KEY` | Render env | Transactional email |
| `GOOGLE_CLIENT_ID` | Render env | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | Render env | Google OAuth |
| `CLOUDFLARE_R2_ACCESS_KEY` | Render env | Media uploads |
| `CLOUDFLARE_R2_SECRET_KEY` | Render env | Media uploads |
| `CLOUDFLARE_R2_BUCKET` | Render env | Media uploads |
| `CLOUDFLARE_R2_ENDPOINT` | Render env | Media CDN endpoint |
| `FIREBASE_CREDENTIALS` | Render env | Push notifications (Android) |

---

## 5. CI/CD (GitHub Actions — optional)

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd backend && npm ci && npm run build && npm test
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: cd frontend && npm ci && npm run build
```

---

## 6. Domain Setup

1. Add custom domain in Vercel dashboard → `app.ezzeshop.com`
2. Point `api.ezzeshop.com` CNAME to `ezzeshop-api.onrender.com`
3. Update `CORS_ORIGIN` on Render to `https://app.ezzeshop.com`
4. Update `NEXT_PUBLIC_API_URL` on Vercel to `https://api.ezzeshop.com/api/v1`

---

## 7. Monitoring

- **Logs**: Render dashboard → service logs
- **Errors**: Add Sentry DSN to `SENTRY_DSN` env var (optional)
- **Uptime**: Render built-in health checks on `/health`
- **Performance**: Vercel Analytics (enable in dashboard)
