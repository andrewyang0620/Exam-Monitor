# Architecture - ExamSeat Monitor

---

## 1. System Overview

ExamSeat Monitor has three major parts:

```text
User browser
  ├─ Web app dashboard (Next.js)
  └─ Chrome extension (MV3)
       ├─ popup
       ├─ options page
       └─ content script for local autofill

Backend / API layer
  ├─ Next.js route handlers
  ├─ monitoring parser for AF Vancouver
  ├─ notification delivery records
  └─ email wrapper

Supabase
  ├─ profiles
  ├─ monitoring_rules
  ├─ seat_observations
  ├─ change_events
  ├─ notification_deliveries
  ├─ platforms
  └─ user_preferences
```

---

## 2. Monitoring Architecture

### Layer 1 - Server Sentinel

Purpose: low-frequency polling of public exam pages.

Current V1 behavior:

- Vercel Cron calls `/api/monitor` every 5 minutes.
- The live parser focuses on Alliance Francaise de Vancouver TCF Canada.
- The parser fetches public HTML pages, extracts the relevant session area, and derives an availability status.
- The API stores a `seat_observations` row when relevant page content changes.
- If status changes, it creates a `change_events` row and notification delivery records.

Observation state:

```text
UNKNOWN -> EXPECTED -> OPEN -> SOLD_OUT
              ^                |
              |________________|
```

The UI may collapse `SOLD_OUT` and `EXPECTED` into `NOT_OPEN` for simpler display, but the lower-level monitoring utilities can preserve the more specific states.

### Layer 2 - Acceleration Window

Purpose: higher-frequency polling during known release windows.

V1 status: types and adapter configuration exist, but scheduler logic is not active yet.

Potential triggers:

- Known fixed release window in adapter config
- Low-confidence status change
- Future manual "arm for today" mode

### Layer 3 - Local Execution

Purpose: help the user register quickly after an alert.

Flow:

1. User receives a browser or email alert.
2. User opens the official exam page.
3. Extension content script detects a supported URL.
4. User clicks Autofill.
5. Extension reads the local profile from `chrome.storage.local`.
6. Extension writes visible profile fields into the form.
7. User reviews, edits, submits, and pays manually.

The extension does not fetch official portal pages in the background, read payment fields, auto-submit, or upload the local profile.

---

## 3. Platform Adapter Layer

Each supported exam center is represented by a `PlatformAdapter` object. Adapter files contain platform-specific knowledge such as:

- official URLs
- supported exam types
- detection mode
- availability keywords
- polling interval
- autofill URL patterns
- autofill selectors
- release-window hints

Adding a new platform should mainly require adding a new adapter file and, once ready, a parser or monitor implementation.

---

## 4. Database Model

Primary tables:

| Table | Purpose |
|---|---|
| `profiles` | User profile linked to Supabase Auth |
| `monitoring_rules` | User subscriptions / watchlist entries |
| `seat_observations` | Public page observations from monitor runs |
| `change_events` | Derived status changes |
| `notification_deliveries` | Per-user notification records |
| `platforms` | Live platform registry and monitor health |
| `user_preferences` | Notification and display preferences |

Service-role API routes write monitor data. Authenticated users read their own rules and notifications through Supabase RLS.

---

## 5. Notification Flow

```text
Monitor run
  -> parsed observation
  -> compare with latest observation
  -> change event if status changed
  -> match active monitoring rules
  -> create notification_deliveries
  -> send email when configured
  -> extension polls /api/latest-event and shows browser notification
```

V1 email uses Resend when `RESEND_API_KEY` is configured. Without it, email sends are skipped and logged.

---

## 6. Privacy Boundaries

| Concern | Decision |
|---|---|
| Official passwords | Never stored or requested |
| Official sessions | Never handled server-side |
| Payment data | Never read or filled |
| Autofill profile | Stored only in Chrome local storage |
| Seat observations | Public data only |
| Final submission | Always manual |

---

## 7. Current Implementation Notes

- AF Vancouver is the only fully wired live parser in V1.
- AF Toronto, Campus France, and ULaval are adapter/UI scaffolds.
- The dashboard can run in demo mode when Supabase credentials are missing.
- The extension currently polls the public `/api/latest-event` endpoint and does not authenticate against the web app.
