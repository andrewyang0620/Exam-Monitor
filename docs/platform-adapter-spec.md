# Platform Adapter Specification

---

## Overview

Each exam center or registration platform is described as a typed `PlatformAdapter`. Adapter files isolate platform-specific details so the monitoring engine, notification code, and UI do not need center-specific logic.

---

## Adapter Interface

```typescript
interface PlatformAdapter {
  id: string
  displayName: string
  shortName: string

  city: string
  province: string
  country: string
  region?: string

  examTypesSupported: ExamType[]

  entryUrl: string
  monitoringUrl?: string

  detectionMode: DetectionMode
  authRequiredForMonitoring: boolean

  recommendedPollingIntervalSec: number
  cooldownSeconds: number

  availabilitySelectors?: string[]
  availabilityKeywords: string[]
  soldOutKeywords: string[]

  fixedReleaseWindows: ReleaseWindow[]
  confidenceRules: ConfidenceRule[]

  supportsLocalAutofill: boolean
  supportsJumpToOfficialPage: boolean
  contentScriptUrlPatterns: string[]
  autofillFieldMap?: AutofillFieldMap

  riskLevel: 'low' | 'medium' | 'high'
  notes?: string
  lastVerified?: string
}
```

Detection modes:

| Mode | Meaning |
|---|---|
| `html` | Fetch HTML and parse selectors / keywords |
| `json-xhr` | Fetch or inspect a JSON endpoint |
| `eventbrite-link` | Detect public Eventbrite-style event links |
| `manual-only` | No automated public monitoring |

Autofill maps contain CSS selectors for non-payment fields only. Payment fields must never be mapped.

---

## Adding A New Adapter

1. Create a file under `packages/platform-adapters/src/adapters/`.
2. Fill in identity, geography, URLs, exam types, detection keywords, and polling interval.
3. Add local autofill selectors only for visible, non-sensitive fields.
4. Register the adapter in `packages/platform-adapters/src/index.ts`.
5. Add tests for required fields and lookup behavior.
6. If the platform should be live, add a parser or monitor route and seed the `platforms` table.

---

## Current Adapters

| Adapter | Status |
|---|---|
| `af-vancouver` | Live V1 parser exists |
| `af-toronto` | Adapter configured |
| `campus-france-eventbrite` | Adapter configured |
| `universite-laval-clic` | Adapter configured |

---

## Risk Levels

| Risk | Meaning |
|---|---|
| `low` | Stable public page, straightforward parser |
| `medium` | Page can change or third-party event links are involved |
| `high` | Fragile selectors, frequent redesigns, or unclear public signals |

---

## Privacy Rules

- Do not store or request official portal passwords.
- Do not store official session cookies.
- Do not map payment fields.
- Do not auto-submit forms.
- Keep autofill profile data local to the extension.
