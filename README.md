# ExamSeat Monitor

> Near-real-time TEF / TCF Canada exam seat monitoring and local autofill assistant for Chinese-speaking candidates in Canada.

专为加拿大法语考试（TEF / TCF Canada）候选人设计的席位监控与本地自动填表工具。

---

## What It Is

ExamSeat Monitor watches public exam registration pages across multiple Alliance Française and university exam centers in Canada. When a seat becomes available, it sends you an alert instantly. The Chrome extension helps you fill your personal info quickly on the official page — you confirm and submit yourself.

**This is a monitoring + local autofill assistant, not a registration bot.**

---

## What It Is NOT

- ❌ Not a bot that registers for you
- ❌ Does not store your passwords or official session cookies
- ❌ Does not auto-fill payment information
- ❌ Does not auto-submit any form
- ❌ Does not store passport or ID images in the cloud

---

## V1 Scope

| Feature | Status |
|---|---|
| Public seat monitoring (HTML/XHR) | ✅ V1 |
| Rule-based alerts (browser + email) | ✅ V1 |
| Chrome extension popup | ✅ V1 |
| Local profile autofill (extension) | ✅ V1 |
| Manual final submission | ✅ V1 (always required) |
| Accelerated polling windows | 🔜 V1.5 |
| Platform health dashboard | 🔜 V1.5 |
| Advanced guided flow | 🔜 V2 |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui patterns |
| Animation | Framer Motion (light) |
| Database / Auth | Supabase |
| Email | Resend |
| SMS | Twilio (abstracted, mock in V1) |
| Validation | Zod |
| State / queries | TanStack Query |
| Icons | lucide-react |
| Browser extension | Chrome MV3, React, TypeScript, Vite |
| Monorepo | pnpm workspaces |

---

## Repository Structure

```
tcf-tracker/
├── apps/
│   ├── web/              # Next.js web app (dashboard + landing)
│   └── extension/        # Chrome extension (MV3)
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── platform-adapters/ # Platform adapter registry
│   └── utils/            # Shared utilities
├── docs/
│   ├── product-spec.md
│   ├── architecture.md
│   └── platform-adapter-spec.md
└── README.md
```

---

## How to Run Locally

### Prerequisites

- Node.js 20+
- pnpm 9+

```bash
npm install -g pnpm
```

### Install dependencies

```bash
pnpm install
```

### Set up environment variables

```bash
cp apps/web/.env.local.example apps/web/.env.local
# Fill in your Supabase, Resend, and Twilio keys
```

### Run the web app (development)

```bash
cd apps/web
pnpm dev
# or from root:
pnpm --filter web dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build and load the Chrome extension

```bash
cd apps/extension
pnpm build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `apps/extension/dist`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   USER BROWSER                  │
│  ┌───────────────┐    ┌─────────────────────┐   │
│  │ ExamSeat Web  │    │  Chrome Extension   │   │
│  │  Dashboard    │    │  (MV3)              │   │
│  └───────┬───────┘    └──────────┬──────────┘   │
└──────────┼───────────────────────┼──────────────┘
           │ HTTPS                 │ chrome.storage (local)
┌──────────▼───────────────────────▼──────────────┐
│                 BACKEND / API                   │
│  ┌────────────────┐  ┌───────────────────────┐  │
│  │ Next.js Routes │  │ Monitoring Workers    │  │
│  │ (auth, rules,  │  │ L1: low-freq polling  │  │
│  │  notifications)│  │ L2: accel windows     │  │
│  └───────┬────────┘  └──────────┬────────────┘  │
│          │                      │               │
│  ┌───────▼──────────────────────▼────────────┐  │
│  │              Supabase                     │  │
│  │  (users, rules, observations, events)     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**L1 — Server Sentinel:** Polls public pages at 1–5 min intervals. Stores normalized `SeatObservation` snapshots. Detects changes.

**L2 — Acceleration Window (V1.5):** Higher-frequency polling triggered by known release windows or suspicious state changes. Scaffolded in V1 types and config.

**L3 — Local Execution (Extension):** User receives alert → opens official page → extension autofills local template data → user manually confirms and pays.

---

## Key Privacy Boundaries

| What | Where stored | Notes |
|---|---|---|
| Monitoring rules | Supabase (cloud) | No credentials involved |
| Notification preferences | Supabase (cloud) | |
| Personal autofill template | Extension localStorage | Never sent to server |
| Official platform password | **Never stored** | |
| Payment card info | **Never touched** | Extension skips payment fields |
| Passport/ID images | **Never stored** | |

---

## Demo / Seed Data

V1 ships with realistic seed data:

- 4 supported platforms (AF Toronto, AF Vancouver, Campus France, Université Laval)
- 3 demo monitoring rules
- 1 live open-seat alert (AF Vancouver TEF Canada)
- Recent change events and notification history

---

## License

Private / proprietary. All rights reserved.
