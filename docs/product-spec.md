# Product Specification — ExamSeat Monitor

Version: V1.0
Date: April 2026
Status: Active Development

---

## 1. Product Definition

**ExamSeat Monitor** is a narrow-purpose SaaS tool that:

1. **Monitors** public exam seat availability pages for TEF / TCF Canada test centers across Canada
2. **Alerts** users in near-real-time when seats become available
3. **Assists** users in filling official registration forms faster using a local Chrome extension autofill — without ever auto-submitting or automating payment

### What It Is Not

- Not a general exam marketplace
- Not a registration bot
- Not a credential vault
- Not a payment automation tool

---

## 2. Target Users

### Primary Users

- Chinese-speaking candidates in Canada / North America preparing for TEF or TCF Canada
- Immigration-focused candidates (PR, citizenship pathway)
- Candidates who struggle with manual refreshing of fragmented exam center pages
- Users in cities with high demand: Toronto, Vancouver, Montréal, Ottawa

### User Pain Points

1. Exam sessions at major centers (Alliance Française) sell out within minutes
2. No centralized view — each center has its own fragmented website
3. Registration pages give no advance warning before releasing new sessions
4. Forms are repetitive and time-consuming to fill

### Scale Expectations

| Stage | Users |
|---|---|
| Beta / V1 | 20–200 |
| Growth | 200–500 |
| Architecture ceiling | ~1,000 |

---

## 3. Product Versions

### V1 — Core (Current)

| Feature | Description |
|---|---|
| Public seat monitoring | L1 server polling at 1–5 min intervals |
| Rule-based alerts | Browser notification + email |
| Chrome extension popup | Status, latest alert, quick open |
| Local autofill | Extension fills non-sensitive fields from local template |
| Manual final confirmation | User always confirms and submits themselves |
| Manual payment | User always enters payment info themselves |
| 3+ supported platforms | AF Toronto, AF Vancouver, Campus France |

**V1 explicitly excludes:**
- Automatic form submission
- Payment automation
- Cloud storage of passwords or sessions
- Mobile app
- Complex scheduler logic

### V1.5 — Smarter Monitoring (Future)

| Feature | Description |
|---|---|
| Time-window acceleration | Boost polling frequency around known release windows |
| History-based prediction | Use historical release patterns to pre-position |
| Confidence scoring | Better certainty labels on observations |
| Deduplication engine | Suppress redundant alerts across sessions |
| "Arm for today" sprint mode | User enables high-priority mode manually |
| Platform health dashboard | Status page for each monitored center |

### V2 — Guided Execution (Future)

| Feature | Description |
|---|---|
| Selective advanced execution | More guided pre-submit flow for stable platforms |
| Multi-step form navigation | Extension assists across multi-page flows |
| Confidence-gated automation | Only proceed when confidence is high |
| Still user-confirmed | Final submission + payment always manual |

---

## 4. Supported Exam Types

| Exam | Description |
|---|---|
| TCF Canada | Test de Connaissance du Français — immigration/PR track |
| TEF Canada | Test d'Évaluation de Français — immigration/PR track |
| DELF/DALF | General French proficiency (some centers) |

---

## 5. Supported Platforms (V1 Launch)

| Platform | City | Detection | Autofill |
|---|---|---|---|
| Alliance Française de Toronto | Toronto, ON | HTML parsing | ✅ Full |
| Alliance Française de Vancouver | Vancouver, BC | HTML parsing | ✅ Full |
| Campus France Canada | Montréal, QC | Eventbrite-style | ⚠️ Partial |
| Université Laval — CLIC | Québec, QC | JSON/XHR | ⚠️ Limited |

---

## 6. Privacy Architecture

### Cloud stores:
- User account (email, preferences)
- Monitoring rules
- Seat observations (normalized, from public pages)
- Change events
- Notification delivery records

### Cloud NEVER stores:
- Official platform passwords
- Official platform session cookies
- Payment card data
- Passport or ID images
- Autofill profile data

### Extension stores locally:
- User autofill template (name, email, phone, DOB, address, ID number)
- Local storage only (chrome.storage.local)
- User can clear at any time

---

## 7. Notification Channels (V1)

| Channel | Status |
|---|---|
| Browser (extension push) | ✅ Active |
| Email (via Resend) | ✅ Active |
| SMS (via Twilio) | 🔜 Scaffolded (mock in V1) |

---

## 8. Key UX Principles

1. **Speed over perfection** — alert quickly, let user act
2. **Transparency** — always show when last check ran, what confidence is
3. **Trust** — clearly communicate what is and isn't automated
4. **User control** — user always confirms final submission
5. **Privacy first** — explain where data is stored, always
6. **Bilingual copy** — English primary, Chinese context
