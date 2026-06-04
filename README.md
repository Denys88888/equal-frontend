# Equal Frontend

> Dating dApp for Pi Network | "Your affection has no price"

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | React 19 + TypeScript |
| Styling | Tailwind CSS 3 |
| UI Components | shadcn/ui |
| Animation | Framer Motion |
| i18n | react-i18next (25 languages) |
| Router | React Router (HashRouter) |
| Icons | Lucide React |

## Pi Network Integration

- `Pi.authenticate()` for login (only auth method)
- `Pi.createPayment()` for Double-Check payments
- Runs inside Pi Browser webview
- PWA-ready with service worker

## Supported Languages (25)

English, Russian, Spanish, French, Chinese, German, Italian, Portuguese, Ukrainian, Turkish, Arabic, Hindi, Indonesian, Japanese, Korean, Vietnamese, Thai, Filipino, Malay, Swahili, Dutch, Polish, Persian, Bengali, Tamil

## Pages

| Route | Page |
|-------|------|
| `/` | Welcome (Pi Login) |
| `/onboarding` | Profile setup |
| `/discover` | Swipe cards |
| `/matches` | Matches & messages |
| `/chat/:id` | Chat room |
| `/profile` | User profile |
| `/settings` | App settings |
| `/clubs` | Interest clubs |
| `/events` | Local events |
| `/admin` | Admin dashboard |

## Build & Deploy

```bash
npm install
npm run build
# Deploy dist/ folder to static hosting
```
