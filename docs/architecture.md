# Architecture — ExamSeat Monitor

---

## 1. System Overview

ExamSeat Monitor has three major parts:

```
┌──────────────────────────────────────────────────────────────┐
│                     WEB APP (Next.js)                        │
│  Landing Page → Auth → Dashboard → Rules → Notifications     │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST / Supabase Realtime
┌────────────────────────▼─────────────────────────────────────┐
│                  BACKEND / API LAYER                         │
│  Next.js Route Handlers + Background Workers                 │
│  ┌─────────────────┐  ┌──────────────────────────────────┐   │
│  │  Auth API       │  │  Monitoring Engine               │   │
│  │  Rules API      │  │  L1: Server Sentinel (1-5 min)   │   │
│  │  Notif API      │  │  L2: Accel Windows (V1.5)        │   │
│  └─────────────────┘  └──────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Platform Adapter Registry               │    │
│  │  AdapterA | AdapterB | AdapterC | ...               │    │
│  └──────────────────────────────────────────────────────┘    │
└────────────────────────┬─────────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────────┐
│                    SUPABASE                                  │
│  users | rules | observations | change_events | notifs       │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│               CHROME EXTENSION (MV3)                         │
│  Popup → Options → Content Script                            │
│  Local Storage: autofill template (never sent to cloud)      │
│  L3: Local Execution Assistant                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Monitoring Architecture

### Layer 1 (L1) — Server Sentinel

**Purpose:** Low-frequency polling of public exam pages.

**Behavior:**
- Runs on a recurring schedule (cron / Vercel cron jobs / external worker)
- Default interval: 2–5 minutes depending on platform adapter config
- Fetches public HTML/JSON from each monitored adapter endpoint
- Normalizes result into `SeatObservation` model
- Computes `sourceHash` (MD5 of relevant content section)
- If `sourceHash` unchanged from previous: no-op
- If changed: store new observation, emit `ChangeEvent`, trigger notifications

**State machine per observation:**
```
UNKNOWN → EXPECTED → OPEN → SOLD_OUT
                   ↑_______________↓
```

### Layer 2 (L2) — Acceleration Window (V1.5 Scaffold)

**Purpose:** Higher-frequency polling during known release windows.

**Trigger conditions:**
1. Known fixed release window in adapter config (`fixedReleaseWindows`)
2. Suspicious state change detected by L1 (confidence < 0.7)
3. Manual "arm for today" sprint mode (future)

**V1 status:** Types and config are defined. Scheduler logic is scaffolded but inactive in V1. L1 runs uniformly.

### Layer 3 (L3) — Local Execution (Browser Extension)

**Purpose:** Local autofill assistant after user receives alert.

**Flow:**
1. User receives notification (browser push or email)
2. User opens official exam center page
3. Extension content script detects page matches a known adapter (URL pattern)
4. Extension shows autofill panel
5. User clicks "Autofill" — extension fills mapped fields from local profile
6. Extension highlights missing required fields
7. User reviews, makes any edits, manually submits
8. User manually enters payment info

**L3 is NOT:**
- A background polling bot
- An automatic submitter
- A payment processor

---

## 3. Platform Adapter Layer

Each supported exam center/platform is defined as a typed adapter object.

```typescript
interface PlatformAdapter {
  id: string                     // Unique slug: 'af-toronto'
  displayName: string
  examTypesSupported: ExamType[]
  region: string
  city: string
  province: string
  entryUrl: string
  detectionMode: DetectionMode   // 'html' | 'json-xhr' | 'eventbrite-link' | 'manual-only'
  authRequiredForMonitoring: boolean
  supportsLocalAutofill: boolean
  supportsJumpToOfficialPage: boolean
  availabilitySelectors?: string[]
  availabilityKeywords: string[]
  fixedReleaseWindows?: ReleaseWindow[]
  recommendedPollingIntervalSec: number
  cooldownSeconds: number
  confidenceRules: ConfidenceRule[]
  riskLevel: 'low' | 'medium' | 'high'
  autofillFieldMap?: AutofillFieldMap
  notes?: string
}
```

Each adapter encapsulates all platform-specific knowledge. Adding a new platform = adding a new adapter file. No other code changes needed.

See [platform-adapter-spec.md](./platform-adapter-spec.md) for full specification.

---

## 4. Normalized State Model

All monitored platforms emit normalized observations:

```typescript
interface SeatObservation {
  id: string
  platformId: string
  centerName: string
  city: string
  examType: ExamType
  sessionDate?: string        // ISO date if known
  sessionLabel?: string       // Human label: "Spring 2026 Session"
  availabilityStatus: AvailabilityStatus  // OPEN | SOLD_OUT | EXPECTED | UNKNOWN
  seatsText?: string          // Raw text: "3 spots remaining"
  observedAt: Date
  sourceHash: string          // MD5 of relevant content section
  confidence: number          // 0.0–1.0
  metadata?: Record<string, unknown>
}

interface ChangeEvent {
  id: string
  platformId: string
  ruleId?: string
  previousStatus: AvailabilityStatus
  newStatus: AvailabilityStatus
  eventType: ChangeEventType  // OPENED | SOLD_OUT | DATE_ADDED | STATUS_CHANGED | UNKNOWN_CHANGE
  detectedAt: Date
  confidence: number
  deliveredChannels: NotificationChannel[]
  rawObservationRef: string
}
```

---

## 5. Notification Flow

```
ChangeEvent detected
       │
       ▼
NotificationService.dispatch(event, rules)
       │
       ├──→ BrowserChannel.send()   ← Chrome extension push
       ├──→ EmailChannel.send()     ← Resend API
       └──→ SmsChannel.send()       ← Twilio (mock in V1)
       │
       ▼
NotificationDelivery record saved
(status: pending → sent | failed)
       │
       ▼
Cooldown applied per rule
(no duplicate alerts within cooldownSeconds)
```

**Deduplication:**
- Hash of (platformId + examType + status) per cooldown window
- Same status change not re-delivered within `cooldownSeconds`

---

## 6. Extension Interaction Flow

```
1. Cloud detects seat change → ChangeEvent created
2. Server sends browser push notification (Web Push / extension messaging)
3. User sees Chrome notification: "Seats available at AF Vancouver!"
4. User clicks notification → opens official page in new tab
5. Extension content script runs URL pattern match against adapter registry
6. If match found: inject floating autofill panel
7. User sees: "Autofill available for this page"
8. User clicks Autofill → extension reads local profile template
9. Extension fills mapped fields (name, email, phone, DOB, etc.)
10. Highlighted missing required fields shown
11. Notice displayed: "Final submission and payment remain manual"
12. User reviews, edits if needed, submits form
13. User enters payment info manually
14. Audit log records: autofill_attempted=true, autofill_success=true
```

---

## 7. Database Schema

### Supabase Tables

```sql
-- Users (managed by Supabase Auth + extension)
users (
  id uuid PRIMARY KEY,
  email text,
  display_name text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Monitoring rules created by users
monitoring_rules (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  platform_id text,              -- adapter id
  exam_type text,
  city text,
  date_preference text,
  channels text[],               -- ['browser', 'email', 'sms']
  priority int DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
)

-- Seat observations (from monitoring workers)
seat_observations (
  id uuid PRIMARY KEY,
  platform_id text,
  center_name text,
  city text,
  exam_type text,
  session_date date,
  session_label text,
  availability_status text,
  seats_text text,
  observed_at timestamptz,
  source_hash text,
  confidence float,
  metadata jsonb
)

-- Change events (state transitions)
change_events (
  id uuid PRIMARY KEY,
  platform_id text,
  rule_id uuid REFERENCES monitoring_rules,
  previous_status text,
  new_status text,
  event_type text,
  detected_at timestamptz,
  confidence float,
  delivered_channels text[],
  raw_observation_ref uuid REFERENCES seat_observations
)

-- Notification delivery records
notification_deliveries (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  change_event_id uuid REFERENCES change_events,
  channel text,
  status text,                   -- pending | sent | failed
  sent_at timestamptz,
  error_message text
)

-- Platform health (from monitoring workers)
platform_health_checks (
  id uuid PRIMARY KEY,
  platform_id text,
  checked_at timestamptz,
  is_reachable boolean,
  response_time_ms int,
  http_status int,
  notes text
)

-- Minimal audit logs
audit_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users,
  event_type text,               -- rule_created | notification_sent | autofill_attempted | page_opened
  platform_id text,
  metadata jsonb,
  created_at timestamptz
)

-- User preferences
user_preferences (
  user_id uuid PRIMARY KEY REFERENCES users,
  default_channels text[],
  timezone text,
  language text DEFAULT 'zh',
  email_digest_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  updated_at timestamptz
)
```

### Extension Local Storage Schema

```typescript
interface LocalProfileTemplate {
  fullName: string
  email: string
  phone: string
  dob: string             // ISO date: "1990-01-15"
  addressLine1: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string         // Default: "Canada"
  idNumber?: string       // PR card or passport number (optional)
  notes?: string
  updatedAt: string
}
```

---

## 8. Security & Privacy Boundaries

| Concern | Decision |
|---|---|
| Official passwords | Never stored anywhere |
| Official sessions | Never managed server-side |
| Payment data | Extension explicitly skips payment fields |
| Autofill template | Extension local storage only |
| ID number (if provided) | Extension local storage only, encrypted at rest |
| Seat observations | Public data only — no login required to fetch |
| OWASP | All API inputs validated with Zod |
| Rate limiting | Per-user rule creation, notification delivery throttled |
| CSRF | Next.js built-in protections + Supabase auth tokens |
