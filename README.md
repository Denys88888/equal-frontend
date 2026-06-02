# Equal — Dating dApp for Pi Network

> **"Your affection has no price"**

Equal is the first dating app on [Pi Network](https://minepi.com) where connections are earned through authenticity and activity — not bought. Zero pay-to-win. All core dating features are completely free.

**Live Demo:** https://r7wcbaj5aor3o.kimi.page

![Equal Screenshot](https://r7wcbaj5aor3o.kimi.page/screenshot.png)

---

## Philosophy

- **No paid subscriptions** — no boosters, no super-likes for purchase
- **No swipe limits** — infinite discovery
- **Full transparency** — see everyone who liked you, no blurred paywalls
- **Trust over money** — profile ranking based on verification, behavior, and activity
- **Optional Pi donations** — stickers and "coffee" gifts that don't affect algorithms
- **Monetization via B2B** — partner offers (restaurants, events) instead of user fees

---

## Features

| Feature | Status | Description |
|---------|--------|-------------|
| **Welcome** | Ready | Animated landing with Pi Login |
| **Onboarding** | Ready | 5-step wizard: personality questions, photo grid, bio, interests, goals |
| **Discover** | Ready | Swipe cards with spring physics, Like/Dislike/Spark, confetti match celebration |
| **Matches** | Ready | Mutual matches list, B2B partner offers carousel, post-match celebration |
| **Chat** | Ready | Text/voice messages, Pi coffee gifts, icebreakers, typing indicator, report system |
| **Video Call** | UI Ready | Full video call interface (WebRTC backend needed) |
| **Profile** | Ready | Trust Score gauge, badges, Spark balance, photo gallery, edit mode |
| **Settings** | Ready | Ghost Mode, block list, Pi Wallet, voluntary donations, account deletion |
| **Clubs** | Ready | Interest-based communities with posts, likes, comments, group chat |
| **Events** | Ready | Offline events listing, RSVP, Pi ticket purchase, post-event feedback |
| **Admin Panel** | Ready | Moderation dashboard, stats, user management, reports, manual actions |

### Tech Highlights

- **PWA** — Service Worker, offline caching, installable on mobile
- **Toast Notifications** — 4 types with spring animations
- **Report System** — In-app user reporting with moderation
- **B2B Partner Offers** — Native monetization without user fees
- **8 AI-Generated Avatars** — Realistic profile photos
- **Skeleton Loaders** — Smooth loading states
- **Pull-to-Refresh** — Mobile UX pattern
- **Page Transitions** — Smooth fade-up animations

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v3.4 + shadcn/ui |
| Animations | Framer Motion |
| Build Tool | Vite v7.2 |
| Routing | React Router (HashRouter) |
| PWA | Service Worker + Web App Manifest |
| Icons | Lucide React |
| Charts | Recharts |
| Backend Spec | OpenAPI 3.0 (see `equal-backend-api.yaml`) |

### Pi SDK Integration (prepared)

```typescript
// Pi Authentication
Pi.authenticate(['username', 'payments'], onIncompletePaymentFound)
  .then(auth => { /* handle login */ });

// Pi Payment (Double-Check Flow)
Pi.createPayment(
  { amount: 1, memo: "Coffee gift", metadata: {...} },
  { onReadyForServerApproval, onReadyForServerCompletion, onCancel, onError }
);
```

---

## Project Structure

```
equal-frontend/
├── public/                    # Static assets
│   ├── icon-192.png           # PWA icon
│   ├── icon-512.png           # PWA icon
│   ├── apple-touch-icon.png   # iOS icon
│   ├── manifest.json          # Web App Manifest
│   ├── sw.js                  # Service Worker
│   ├── hero-couple.png        # Landing illustration
│   ├── avatar-*.jpg           # 8 AI-generated profile avatars
│   └── event-*.jpg            # Event photos
├── src/
│   ├── pages/                 # Route pages
│   │   ├── Welcome.tsx        # Landing page
│   │   ├── Onboarding.tsx     # Registration wizard
│   │   ├── Discover.tsx       # Swipe cards
│   │   ├── Matches.tsx        # Mutual matches + offers
│   │   ├── Chat.tsx           # Messaging interface
│   │   ├── VideoCall.tsx      # Video call UI
│   │   ├── Profile.tsx        # User profile
│   │   ├── Settings.tsx       # Privacy & account
│   │   ├── Clubs.tsx          # Interest communities
│   │   ├── Events.tsx         # Offline events
│   │   └── Admin.tsx          # Admin dashboard
│   ├── components/            # Shared components
│   │   ├── Navbar.tsx         # Top app bar
│   │   ├── Footer.tsx         # Bottom navigation
│   │   ├── Layout.tsx         # Page wrapper
│   │   ├── ToastProvider.tsx  # Toast notifications
│   │   ├── ReportDialog.tsx   # Report modal
│   │   ├── SkeletonLoader.tsx # Loading skeletons
│   │   └── PartnerOffers.tsx  # B2B offer cards
│   ├── hooks/
│   │   ├── useToast.ts        # Toast hook
│   │   └── usePullToRefresh.ts # Pull-to-refresh hook
│   ├── App.tsx                # Router setup
│   ├── main.tsx               # Entry point + SW registration
│   └── index.css              # Global styles + Tailwind
├── equal-backend-api.yaml     # OpenAPI 3.0 specification
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/equal-frontend.git
cd equal-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will be available at `http://localhost:5173`

### Deploy

The `dist/` folder is a static SPA ready for any hosting:
- **Vercel**: `vercel --prod dist/`
- **Netlify**: Drag `dist/` folder to dashboard
- **Cloudflare Pages**: Connect repo, build command: `npm run build`, output: `dist`

---

## Pi Network Integration Guide

### 1. Register Your App

1. Open **Pi Browser** on your phone
2. Navigate to `develop.pi`
3. Sign in with your Pi account
4. Create a new app:
   - **Name**: Equal
   - **URL**: Your deployed URL (e.g., `https://your-domain.com`)
   - **Description**: Dating app on Pi Network

### 2. Configure SDK

```typescript
// In your app initialization
Pi.init({ 
  version: "2.0",
  sandbox: false // true for testing in sandbox
});
```

### 3. Authentication Flow

```typescript
function onIncompletePaymentFound(payment) {
  // Handle unfinished payments
  console.log('Incomplete payment:', payment.identifier);
}

const scopes = ['username', 'payments'];

Pi.authenticate(scopes, onIncompletePaymentFound)
  .then(auth => {
    const { accessToken, user } = auth;
    // Send accessToken to your backend for verification
    // Backend calls: GET https://api.minepi.com/v2/me
    // Header: Authorization: Bearer {accessToken}
  })
  .catch(error => {
    console.error('Auth failed:', error);
  });
```

### 4. Payment Flow (Double-Check)

```typescript
// Frontend
Pi.createPayment(
  {
    amount: 1,
    memo: "Coffee gift",
    metadata: { type: 'gift', toUser: recipientId }
  },
  {
    onReadyForServerApproval: (paymentId) => {
      // Your backend calls: POST /payments/{paymentId}/approve
      fetch('/api/payments/approve', { 
        method: 'POST', 
        body: JSON.stringify({ paymentId }) 
      });
    },
    onReadyForServerCompletion: (paymentId, txid) => {
      // Your backend calls: POST /payments/{paymentId}/complete
      fetch('/api/payments/complete', { 
        method: 'POST', 
        body: JSON.stringify({ paymentId, txid }) 
      });
    },
    onCancel: (paymentId) => { /* User cancelled */ },
    onError: (error) => { /* Payment error */ }
  }
);
```

### 5. Testing in Sandbox

```html
<!-- Load SDK -->
<script src="https://sdk.minepi.com/pi-sdk.js"></script>
<script>
  Pi.init({ version: "2.0", sandbox: true });
</script>
```

Test at: `https://sandbox.minepi.com`

---

## Backend API Specification

Full OpenAPI 3.0 specification: [`equal-backend-api.yaml`](./equal-backend-api.yaml)

**50+ endpoints** covering:
- Authentication (Pi + email)
- User profiles & photos
- Discovery & matching algorithm
- Matches & real-time messaging (WebSocket)
- Clubs & events
- Spark currency system
- Pi payment flows
- Admin moderation

**WebSocket Events:**
- `message:new` — New message received
- `message:read` — Message read receipt
- `typing:start` / `typing:stop` — Typing indicators
- `match:new` — New mutual match

### Quick Backend Setup

```bash
# Using Docker (recommended)
docker-compose up -d postgres redis
npm run migrate  # Prisma migrations
npm run seed     # Seed mock data
npm run dev      # Start server
```

---

## Architecture Diagram

```
User (Pi Browser)
    │
    ▼
┌─────────────────────────────────────────┐
│           Equal Frontend (PWA)          │
│  React + TypeScript + Tailwind + Framer │
│                                         │
│  Welcome → Onboarding → Discover → ...  │
│  Pi SDK: authenticate, createPayment    │
│  Service Worker: offline caching        │
└─────────────┬───────────────────────────┘
              │  HTTP / WebSocket
              ▼
┌─────────────────────────────────────────┐
│           Backend API (Node.js)         │
│  Express + Prisma + PostgreSQL + Redis  │
│                                         │
│  Auth: JWT + Pi Platform API verify     │
│  Matching: geo + interests + trust      │
│  Real-time: Socket.io pub/sub           │
│  Payments: Pi Double-Check flow         │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 PostgreSQL  Redis   Pi Platform
 (data)    (cache)   API
```

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| **Mauve** | `#BB83C9` | Primary, CTAs, highlights |
| **Emerald** | `#7DE0B3` | Success, Spark, positive |
| **Charcoal** | `#232323` | Text, dark backgrounds |
| **Linen** | `#F7F4EE` | Page background |
| **Error** | `#E86A6A` | Destructive actions |
| **Warning** | `#FFB84D` | Alerts, badges |
| **Sky** | `#A3D5FF` | Icebreakers, secondary |
| **Gold** | `#FFD700` | Sparkles, celebrations |
| **Font** | Outfit | All UI text |
| **Mono** | JetBrains Mono | Timestamps, metadata |

---

## Roadmap

### v1.0 — Current (Frontend)
- [x] All 12 pages implemented
- [x] PWA support
- [x] Toast notifications
- [x] Report system
- [x] B2B partner offers
- [x] Video call UI
- [x] 8 AI-generated avatars
- [x] Skeleton loaders
- [x] Pull-to-refresh

### v1.1 — Backend Integration
- [ ] Node.js + Express + PostgreSQL backend
- [ ] Pi SDK server-side authentication
- [ ] Real-time messaging (Socket.io)
- [ ] File upload (S3/IPFS)
- [ ] Push notifications
- [ ] WebRTC video signaling

### v1.2 — Pi Network Launch
- [ ] Pi Browser testing in sandbox
- [ ] Pi payment integration (Double-Check)
- [ ] Pi Ads integration
- [ ] Mainnet deployment

### v1.3 — Scale
- [ ] i18n (20+ languages)
- [ ] Advanced matching algorithm (ML)
- [ ] Voice messages
- [ ] Stories feature

---

## License

This project is licensed under **Pi Open Source (PiOS)** — the open source license for applications in the Pi Network ecosystem.

## Team

Built with love for the Pi Network community.

**Contact:** Join the Equal community on Pi Network

---

<p align="center">
  <sub>Powered by Pi Network | Made with React + Framer Motion + Tailwind</sub>
</p>
