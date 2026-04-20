# Platform Adapter Specification

---

## Overview

Each exam center or registration platform is described as a **Platform Adapter** — a typed configuration object that defines how to monitor that platform and how to autofill its registration form.

All adapter-specific logic is isolated in adapter files. No platform-specific code should appear in the monitoring engine, notification system, or UI components.

---

## Adapter Interface

```typescript
interface PlatformAdapter {
  // Identity
  id: string                          // Unique slug: 'af-toronto'
  displayName: string                 // Human name: 'Alliance Française de Toronto'
  shortName: string                   // Short label: 'AF Toronto'
  logoUrl?: string
  
  // Geography
  city: string
  province: string                    // 'ON' | 'BC' | 'QC' | etc.
  country: string                     // Default: 'CA'
  region?: string                     // 'Greater Toronto Area'
  
  // Exam types
  examTypesSupported: ExamType[]      // ['TEF', 'TCF Canada']
  
  // URLs
  entryUrl: string                    // Official registration or info page
  monitoringUrl?: string              // URL to actually fetch (may differ from entry)
  
  // Detection
  detectionMode: DetectionMode
  // 'html'            — parse HTML, look for keywords/selectors
  // 'json-xhr'        — intercept XHR or fetch a JSON endpoint
  // 'eventbrite-link' — look for Eventbrite link on page
  // 'manual-only'     — no automated monitoring possible
  
  // Monitoring config
  authRequiredForMonitoring: boolean  // Does fetching the page require login?
  recommendedPollingIntervalSec: number
  cooldownSeconds: number             // Min time between alerts for same status
  
  // Availability detection
  availabilitySelectors?: string[]    // CSS selectors to find seat info
  availabilityKeywords: string[]      // Keywords that signal availability
  soldOutKeywords: string[]           // Keywords that signal sold out
  
  // Release windows (V1.5 scaffold)
  fixedReleaseWindows?: ReleaseWindow[]
  
  // Confidence
  confidenceRules: ConfidenceRule[]
  
  // Extension support
  supportsLocalAutofill: boolean
  supportsJumpToOfficialPage: boolean
  contentScriptUrlPatterns?: string[] // URL patterns for content script injection
  autofillFieldMap?: AutofillFieldMap
  
  // Meta
  riskLevel: 'low' | 'medium' | 'high'
  notes?: string
  lastVerified?: string               // ISO date when adapter was last tested
}
```

### Supporting Types

```typescript
type ExamType = 'TEF' | 'TCF Canada' | 'DELF' | 'DALF' | 'TCF SO' | 'TEF SO'

type DetectionMode = 'html' | 'json-xhr' | 'eventbrite-link' | 'manual-only'

interface ReleaseWindow {
  label: string                       // 'Monthly batch — last Monday'
  dayOfWeek?: number                  // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfMonth?: number                 // 1-31
  timeUtc?: string                    // 'HH:MM' in UTC
  timezone?: string                   // 'America/Toronto'
  notes?: string
}

interface ConfidenceRule {
  condition: string                   // Description of condition
  confidenceBoost: number             // -0.3 to +0.3
}

interface AutofillFieldMap {
  fullName?: string                   // CSS selector for full name field
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  dob?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  idNumber?: string
  // Note: payment fields are NEVER included
}
```

---

## How the Monitoring Engine Uses Adapters

```
1. Load all adapters from registry
2. For each adapter where authRequiredForMonitoring = false:
   a. Fetch adapter.monitoringUrl (or entryUrl)
   b. Parse response using adapter.detectionMode
   c. If 'html': look for availabilitySelectors and availabilityKeywords
   d. If 'json-xhr': parse JSON, check relevant fields
   e. If 'eventbrite-link': look for Eventbrite URL on page
   f. Compute sourceHash from relevant content section
   g. Compare with previous observation
   h. If changed: create ChangeEvent, dispatch notifications
3. Apply cooldownSeconds per platform before re-alerting
4. Log result to platform_health_checks
```

---

## How Content Scripts Use Adapters

```
1. Extension loads adapter registry at startup
2. Content script runs on every page load
3. Check: does current URL match any adapter.contentScriptUrlPatterns?
4. If yes: read adapter.autofillFieldMap
5. Read LocalProfileTemplate from chrome.storage.local
6. Map profile fields to form fields using autofillFieldMap
7. Show autofill panel UI
8. On "Autofill" click: fill each mapped field
9. Highlight fields not in autofillFieldMap (user must fill manually)
10. Show "Final submission is manual" notice
```

---

## Adding a New Platform Adapter

1. Create a new file in `packages/platform-adapters/src/adapters/your-platform.ts`
2. Implement the `PlatformAdapter` interface
3. Export as default
4. Import and add to the registry in `packages/platform-adapters/src/index.ts`

That's it. No other files need changing.

### Adapter Template

```typescript
// packages/platform-adapters/src/adapters/my-new-platform.ts
import type { PlatformAdapter } from '../types'

const myNewPlatformAdapter: PlatformAdapter = {
  id: 'my-platform-slug',
  displayName: 'My New Exam Platform',
  shortName: 'My Platform',
  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  examTypesSupported: ['TCF Canada'],
  entryUrl: 'https://www.example.com/register',
  detectionMode: 'html',
  authRequiredForMonitoring: false,
  recommendedPollingIntervalSec: 180,
  cooldownSeconds: 600,
  availabilitySelectors: ['.session-list', '#available-dates'],
  availabilityKeywords: ['available', 'register now', 's\'inscrire'],
  soldOutKeywords: ['sold out', 'complet', 'no seats'],
  fixedReleaseWindows: [],
  confidenceRules: [
    { condition: 'Multiple keywords found', confidenceBoost: 0.2 },
    { condition: 'Selector match found', confidenceBoost: 0.2 },
  ],
  supportsLocalAutofill: true,
  supportsJumpToOfficialPage: true,
  contentScriptUrlPatterns: ['*://www.example.com/register*'],
  autofillFieldMap: {
    fullName: '#field-name',
    email: '#field-email',
    phone: '#field-phone',
  },
  riskLevel: 'low',
  notes: 'Registration opens monthly. Check on last Monday of each month.',
  lastVerified: '2026-04-01',
}

export default myNewPlatformAdapter
```

---

## V1 Adapter Inventory

### 1. Alliance Française de Toronto

| Property | Value |
|---|---|
| ID | `af-toronto` |
| Detection | HTML parsing |
| Autofill | Full |
| Exams | TEF, TCF Canada |
| Release pattern | Monthly |
| Risk | Low |

### 2. Alliance Française de Vancouver

| Property | Value |
|---|---|
| ID | `af-vancouver` |
| Detection | HTML parsing |
| Autofill | Full |
| Exams | TEF, TCF Canada |
| Release pattern | Irregular |
| Risk | Low |

### 3. Campus France Canada (Eventbrite-style)

| Property | Value |
|---|---|
| ID | `campus-france-eventbrite` |
| Detection | Eventbrite link detection |
| Autofill | Partial (Eventbrite fields) |
| Exams | TCF Canada |
| Release pattern | Session-by-session |
| Risk | Medium |

### 4. Université Laval — CLIC (Demo)

| Property | Value |
|---|---|
| ID | `universite-laval-clic` |
| Detection | JSON/XHR (demo mock) |
| Autofill | Limited |
| Exams | TEF, TCF Canada, DELF/DALF |
| Release pattern | Semester-based |
| Risk | Low |

---

## Confidence Scoring

Each observation is assigned a confidence score (0.0–1.0):

| Condition | Effect |
|---|---|
| Multiple availability keywords found | +0.2 |
| Selector match found | +0.2 |
| Single keyword match only | Base |
| No selector match | -0.1 |
| Platform recently unreachable | -0.3 |
| Response time > 5s | -0.1 |

Confidence < 0.5 → status labeled UNKNOWN, no alert sent
Confidence 0.5–0.7 → status labeled, alert sent with low confidence warning
Confidence > 0.7 → full alert sent

---

## Monitoring Risk Levels

| Risk | Meaning |
|---|---|
| Low | Public page, no login, stable structure |
| Medium | Public page but fragile structure or requires extra headers |
| High | Auth required, frequently changes, fragile selectors |

High-risk adapters are excluded from default monitoring in V1.
