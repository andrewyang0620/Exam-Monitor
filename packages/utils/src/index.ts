import type {
  AvailabilityStatus,
  SeatObservation,
  ChangeEvent,
  ChangeEventType,
} from '@tcf-tracker/types'

// ----------------------------
// ID generation
// ----------------------------

/** Generate a simple UUID-like ID (crypto.randomUUID if available, fallback otherwise) */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ----------------------------
// Content hashing
// ----------------------------

/**
 * Compute a simple hash of content string for change detection.
 * Uses a djb2-style hash — not cryptographic, just for change detection.
 */
export function hashContent(content: string): string {
  let hash = 5381
  for (let i = 0; i < content.length; i++) {
    hash = (hash << 5) + hash + content.charCodeAt(i)
    hash = hash & hash // Convert to 32-bit int
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

// ----------------------------
// Status normalization
// ----------------------------

/**
 * Normalize raw text from a page into a AvailabilityStatus.
 * This is the core keyword-matching logic used by monitoring workers.
 */
export function normalizeStatus(params: {
  text: string
  availabilityKeywords: string[]
  soldOutKeywords: string[]
  confidence?: number
}): { status: AvailabilityStatus; confidence: number } {
  const { text, availabilityKeywords, soldOutKeywords } = params
  const lower = text.toLowerCase()

  const availMatches = availabilityKeywords.filter((k) => lower.includes(k.toLowerCase()))
  const soldMatches = soldOutKeywords.filter((k) => lower.includes(k.toLowerCase()))

  // Sold out takes priority over available if both signals present
  if (soldMatches.length > 0 && availMatches.length === 0) {
    const confidence = Math.min(0.5 + soldMatches.length * 0.15, 0.95)
    return { status: 'SOLD_OUT', confidence }
  }

  if (availMatches.length > 0 && soldMatches.length === 0) {
    const confidence = Math.min(0.5 + availMatches.length * 0.15, 0.95)
    return { status: 'OPEN', confidence }
  }

  if (availMatches.length > 0 && soldMatches.length > 0) {
    // Conflicting signals — use the stronger one but reduce confidence
    const confidence = 0.4
    return { status: 'UNKNOWN', confidence }
  }

  return { status: 'UNKNOWN', confidence: 0.3 }
}

// ----------------------------
// Change detection
// ----------------------------

/**
 * Compare two seat observations and determine if a meaningful change occurred.
 * Returns a ChangeEventType or null if no meaningful change.
 */
export function detectChange(
  previous: SeatObservation | null,
  current: SeatObservation
): ChangeEventType | null {
  if (!previous) {
    // First observation — treat as status established, not a change event
    return null
  }

  if (previous.availabilityStatus === current.availabilityStatus) {
    // Same status — no change event (sourceHash may still differ for internal tracking)
    return null
  }

  const prev = previous.availabilityStatus
  const curr = current.availabilityStatus

  if ((prev === 'NOT_OPEN' || prev === 'SOLD_OUT' || prev === 'EXPECTED') && curr === 'OPEN') {
    return 'OPENED'
  }
  if (prev === 'UNKNOWN' && curr === 'OPEN') return 'OPENED'
  if (prev === 'MONITORING' && curr === 'OPEN') return 'OPENED'

  if (prev === 'OPEN' && (curr === 'NOT_OPEN' || curr === 'SOLD_OUT')) return 'SOLD_OUT'

  if (prev === 'UNKNOWN' && (curr === 'NOT_OPEN' || curr === 'EXPECTED')) return 'DATE_ADDED'

  return 'STATUS_CHANGED'
}

// ----------------------------
// Time formatting
// ----------------------------

/** Return a human-friendly relative time string. */
export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay === 1) return 'yesterday'
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

/** Format a date string to a readable date. */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

/** Format an ISO date to display like "April 27, 2026" */
export function formatFullDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ----------------------------
// Status display helpers
// ----------------------------

export function getStatusLabel(status: AvailabilityStatus): string {
  const labels: Record<AvailabilityStatus, string> = {
    OPEN: 'Seats Available',
    SOLD_OUT: 'Sold Out',
    EXPECTED: 'Sold Out',
    NOT_OPEN: 'Sold Out',
    MONITORING: 'Monitoring',
    UNKNOWN: 'Unknown',
  }
  return labels[status] ?? 'Unknown'
}

export function getStatusColor(status: AvailabilityStatus): string {
  const colors: Record<AvailabilityStatus, string> = {
    OPEN: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    SOLD_OUT: 'text-slate-600 bg-slate-100 border-slate-200',
    EXPECTED: 'text-amber-700 bg-amber-50 border-amber-200',
    NOT_OPEN: 'text-slate-600 bg-slate-100 border-slate-200',
    MONITORING: 'text-blue-600 bg-blue-50 border-blue-200',
    UNKNOWN: 'text-slate-500 bg-slate-50 border-slate-200',
  }
  return colors[status] ?? colors.UNKNOWN
}

export function getStatusDotColor(status: AvailabilityStatus): string {
  const colors: Record<AvailabilityStatus, string> = {
    OPEN: 'bg-emerald-500',
    SOLD_OUT: 'bg-slate-400',
    EXPECTED: 'bg-amber-500',
    NOT_OPEN: 'bg-slate-400',
    MONITORING: 'bg-blue-500',
    UNKNOWN: 'bg-slate-400',
  }
  return colors[status] ?? 'bg-slate-400'
}

// ----------------------------
// Profile completeness
// ----------------------------

import type { LocalProfileTemplate } from '@tcf-tracker/types'

const REQUIRED_PROFILE_FIELDS: (keyof LocalProfileTemplate)[] = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'dateOfBirth',
  'address',
  'city',
  'province',
  'postalCode',
]

export function computeProfileCompletion(profile: Partial<LocalProfileTemplate>): number {
  if (!profile) return 0
  const filled = REQUIRED_PROFILE_FIELDS.filter((f) => {
    const val = profile[f]
    return val !== undefined && val !== null && String(val).trim() !== ''
  })
  return Math.round((filled.length / REQUIRED_PROFILE_FIELDS.length) * 100)
}

export function getMissingProfileFields(profile: Partial<LocalProfileTemplate>): string[] {
  return REQUIRED_PROFILE_FIELDS.filter((f) => {
    const val = profile[f]
    return !val || String(val).trim() === ''
  })
}

// ----------------------------
// Deduplication
// ----------------------------

/** Generate a dedup key for a change event to prevent duplicate alerts. */
export function getDedupeKey(event: Pick<ChangeEvent, 'platformId' | 'newStatus'> & { examType?: string }): string {
  return `${event.platformId}:${event.examType ?? 'any'}:${event.newStatus}`
}
