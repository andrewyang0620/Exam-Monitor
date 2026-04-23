# ExamSeat Monitor

> Near-real-time TEF / TCF Canada exam seat monitoring and local autofill assistant for Chinese-speaking candidates in Canada.

专为加拿大法语考试（TEF / TCF Canada）考生设计的考位监控与本地自动填表工具。

---

## What It Is

ExamSeat Monitor watches public exam registration pages across Alliance Francaise and university exam centers in Canada. When a seat becomes available, it sends an alert. The Chrome extension helps fill personal information on the official page, while the user still reviews, confirms, submits, and pays manually.

**This is a monitoring and local autofill assistant, not a registration bot.**

---

## What It Is Not

- Not a bot that registers for you
- Does not store official platform passwords or session cookies
- Does not fill payment information
- Does not auto-submit forms
- Does not store passport or ID images in the cloud

---

## V1 Scope

| Feature | Status |
|---|---|
| Public seat monitoring for AF Vancouver | V1 live |
| Rule-based browser and email alerts | V1 live |
| Chrome extension popup | V1 scaffold |
| Local profile autofill | V1 scaffold |
| Manual final submission | Always required |
| AF Toronto / Campus France / ULaval adapters | Configured, not fully live |
| Accelerated polling windows | V1.5 planned |
| Platform health dashboard | V1.5 planned |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web frontend | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui-style components |
| Database / Auth | Supabase |
| Email | Resend |
| Validation | Zod |
| Browser extension | Chrome MV3, React, TypeScript, Vite |
| Monorepo | pnpm workspaces |

---

## Repository Structure

```text
tcf-tracker/
├── apps/
│   ├── web/              # Next.js dashboard, auth, API routes
│   └── extension/        # Chrome extension (MV3)
├── packages/
│   ├── types/            # Shared TypeScript domain types
│   ├── platform-adapters/ # Platform adapter registry
│   └── utils/            # Shared utilities
├── docs/
├── supabase/
│   └── migrations/       # Supabase schema
└── README.md
```

---

## How to Run Locally

### Prerequisites

- Node.js 20+
- pnpm 9+

```bash
npm install -g pnpm
pnpm install
```

### Environment

```bash
cp apps/web/.env.local.example apps/web/.env.local
```

Fill in Supabase, monitor secret, and optional Resend settings.

### Web App

```bash
pnpm dev
```

Open `http://localhost:3000`.

### Chrome Extension

```bash
pnpm build:extension
```

Then open `chrome://extensions`, enable Developer mode, click **Load unpacked**, and select `apps/extension/dist`.

---

## Architecture Overview

```text
User browser
  ├─ Next.js dashboard
  └─ Chrome extension
       ├─ popup
       ├─ options page
       └─ content script for local autofill

Backend
  ├─ Next.js API routes
  ├─ AF Vancouver monitoring parser
  ├─ Supabase service client
  └─ Resend email wrapper

Supabase
  ├─ profiles
  ├─ monitoring_rules
  ├─ seat_observations
  ├─ change_events
  ├─ notification_deliveries
  ├─ platforms
  └─ user_preferences
```

**L1 - Server Sentinel:** Vercel Cron calls `/api/monitor` every 5 minutes. Current live parser focuses on AF Vancouver TCF Canada.

**L2 - Acceleration Window:** Release-window acceleration is typed and planned, but not active in V1.

**L3 - Local Execution:** The extension stores the autofill profile in `chrome.storage.local`, writes only to visible form fields, and never submits or pays.

---

## Privacy Boundaries

| Data | Storage | Notes |
|---|---|---|
| Monitoring rules | Supabase | No exam credentials |
| Notification preferences | Supabase | User controlled |
| Seat observations | Supabase | Public page data only |
| Autofill profile | Chrome local storage | Never uploaded |
| Official passwords | Not stored | Never requested |
| Payment card data | Not touched | Always manual |

---

## Current Development Notes

- AF Vancouver is the first real monitored platform.
- Other adapters are useful configuration scaffolds and UI previews until their parsers are wired into the monitor pipeline.
- The product is privacy-first by design: monitoring happens on public pages, and personal autofill data stays on the user's device.

## License

Private / proprietary. All rights reserved.
