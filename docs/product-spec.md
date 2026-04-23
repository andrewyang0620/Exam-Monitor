# Product Specification - ExamSeat Monitor

Version: V1.0
Date: April 2026
Status: Active development

---

## 1. Product Definition

ExamSeat Monitor is a narrow-purpose SaaS tool that:

1. Monitors public TEF / TCF Canada seat availability pages.
2. Alerts users when seats become available.
3. Helps users fill official registration forms faster through a local Chrome extension.

It does not auto-submit, automate payment, store official portal credentials, or act as a registration bot.

---

## 2. Target Users

Primary users are Chinese-speaking candidates in Canada or North America preparing for TEF Canada or TCF Canada, especially immigration-focused candidates who need fast access to limited exam seats.

Common pain points:

- Popular centers sell out quickly.
- Availability is fragmented across multiple official websites.
- Release timing is inconsistent.
- Registration forms are repetitive and time-sensitive.

Expected scale:

| Stage | Users |
|---|---|
| Beta / V1 | 20-200 |
| Growth | 200-500 |
| Architecture ceiling | About 1,000 |

---

## 3. Product Versions

### V1 - Core

| Feature | Description |
|---|---|
| Public seat monitoring | Server polling at 1-5 minute intervals |
| Rule-based alerts | Browser notification and email |
| Chrome extension popup | Status, latest alert, quick official-page link |
| Local autofill | Extension fills non-sensitive fields from a local profile |
| Manual confirmation | User always reviews and submits manually |
| Manual payment | User always enters payment manually |

V1 currently has one live monitoring pipeline for AF Vancouver. Other platforms are configured as adapters and UI previews until their parsers are wired into the same pipeline.

### V1.5 - Smarter Monitoring

| Feature | Description |
|---|---|
| Time-window acceleration | Increase polling around known release windows |
| Historical prediction | Use past release patterns |
| Deduplication | Reduce repeated alerts |
| Platform health dashboard | Show monitor status per center |

### V2 - Guided Execution

| Feature | Description |
|---|---|
| Multi-step guidance | Assist users across stable official forms |
| Confidence gates | Only assist when platform detection is reliable |
| User-confirmed flow | Final submission and payment remain manual |

---

## 4. Supported Exam Types

| Exam | Description |
|---|---|
| TCF Canada | Immigration / PR French test |
| TEF Canada | Immigration / PR French test |
| DELF / DALF | General French proficiency, supported by some centers |

---

## 5. Supported Platforms

| Platform | City | Detection | Current status |
|---|---|---|---|
| Alliance Francaise de Vancouver | Vancouver, BC | HTML parsing | Live V1 parser |
| Alliance Francaise de Toronto | Toronto, ON | HTML parsing | Adapter configured |
| Campus France Canada | Montreal, QC | Eventbrite-style link detection | Adapter configured |
| Universite Laval - CLIC | Quebec, QC | JSON / XHR concept | Adapter configured |

---

## 6. Privacy Architecture

Cloud stores:

- User account and preferences
- Monitoring rules
- Public seat observations
- Change events
- Notification delivery records

Cloud never stores:

- Official platform passwords
- Official platform session cookies
- Payment card data
- Passport or ID document images
- Autofill profile data

Extension local storage contains:

- Name and contact fields
- Date of birth
- Address
- Optional passport / ID number
- Optional exam-related profile notes

---

## 7. Notification Channels

| Channel | Status |
|---|---|
| Browser / extension notification | Active scaffold |
| Email via Resend | Active when configured |
| SMS | Not implemented in V1 |

---

## 8. UX Principles

1. Speed over perfection.
2. Transparency about last check, confidence, and source.
3. Clear privacy boundaries.
4. User control over final submission.
5. Bilingual-friendly copy for Chinese-speaking candidates.
