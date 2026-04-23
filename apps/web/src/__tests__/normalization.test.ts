import { describe, it, expect } from 'vitest'
import { normalizeStatus, detectChange, hashContent, getStatusLabel } from '@tcf-tracker/utils'
import type { SeatObservation } from '@tcf-tracker/types'

// Common keyword sets mirroring the AF Vancouver adapter
const AVAIL_KEYWORDS = ['available', 'disponible', 'register', 'inscription', 'book', 'open', 'places disponibles']
const SOLD_KEYWORDS = ['complet', 'sold out', 'no seats', 'no places', 'épuisé', 'full']

function makeObs(status: SeatObservation['availabilityStatus'], hash = 'abc'): SeatObservation {
  return {
    id: 'obs-1',
    platformId: 'af-vancouver',
    examType: 'TCF Canada',
    centerName: 'Alliance Française Vancouver',
    city: 'Vancouver',
    province: 'BC',
    availabilityStatus: status,
    seatsText: 'Complet',
    sourceHash: hash,
    observedAt: new Date().toISOString(),
    confidence: 0.8,
  }
}

// ─── normalizeStatus ──────────────────────────────────────────────────────────

describe('normalizeStatus', () => {
  it('returns SOLD_OUT for French sold-out keywords', () => {
    expect(normalizeStatus({ text: 'Complet', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('SOLD_OUT')
    expect(normalizeStatus({ text: 'Session complète — no seats', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('SOLD_OUT')
    expect(normalizeStatus({ text: 'sold out', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('SOLD_OUT')
  })

  it('returns OPEN for availability keywords', () => {
    expect(normalizeStatus({ text: 'seats available, register now', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('OPEN')
    expect(normalizeStatus({ text: 'places disponibles', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('OPEN')
    expect(normalizeStatus({ text: 'Inscription ouverte — book now', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('OPEN')
  })

  it('returns UNKNOWN for unrecognized text', () => {
    expect(normalizeStatus({ text: '', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('UNKNOWN')
    expect(normalizeStatus({ text: 'some random text 123', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS }).status).toBe('UNKNOWN')
  })

  it('returns a confidence score between 0 and 1', () => {
    const r = normalizeStatus({ text: 'Complet', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS })
    expect(r.confidence).toBeGreaterThan(0)
    expect(r.confidence).toBeLessThanOrEqual(1)
  })

  it('higher match count produces higher confidence', () => {
    const single = normalizeStatus({ text: 'complet', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS })
    const multi = normalizeStatus({ text: 'complet sold out épuisé', availabilityKeywords: AVAIL_KEYWORDS, soldOutKeywords: SOLD_KEYWORDS })
    expect(multi.confidence).toBeGreaterThanOrEqual(single.confidence)
  })
})

// ─── detectChange ─────────────────────────────────────────────────────────────

describe('detectChange', () => {
  it('returns null for first observation (no previous)', () => {
    expect(detectChange(null, makeObs('NOT_OPEN'))).toBeNull()
  })

  it('returns OPENED when NOT_OPEN → OPEN', () => {
    expect(detectChange(makeObs('NOT_OPEN', 'h1'), makeObs('OPEN', 'h2'))).toBe('OPENED')
  })

  it('returns OPENED when UNKNOWN → OPEN', () => {
    expect(detectChange(makeObs('UNKNOWN', 'h1'), makeObs('OPEN', 'h2'))).toBe('OPENED')
  })

  it('returns SOLD_OUT when OPEN → NOT_OPEN', () => {
    expect(detectChange(makeObs('OPEN', 'h1'), makeObs('NOT_OPEN', 'h2'))).toBe('SOLD_OUT')
  })

  it('returns DATE_ADDED when UNKNOWN → NOT_OPEN', () => {
    expect(detectChange(makeObs('UNKNOWN', 'h1'), makeObs('NOT_OPEN', 'h2'))).toBe('DATE_ADDED')
  })

  it('returns STATUS_CHANGED for other transitions', () => {
    expect(detectChange(makeObs('MONITORING', 'h1'), makeObs('NOT_OPEN', 'h2'))).toBe('STATUS_CHANGED')
  })

  it('returns null when status is unchanged', () => {
    expect(detectChange(makeObs('NOT_OPEN', 'h1'), makeObs('NOT_OPEN', 'h2'))).toBeNull()
  })
})

// ─── hashContent ──────────────────────────────────────────────────────────────

describe('hashContent', () => {
  it('returns a non-empty hex string', () => {
    const h = hashContent('hello world')
    expect(h).toMatch(/^[0-9a-f]+$/)
    expect(h.length).toBeGreaterThan(0)
  })

  it('same input produces same hash', () => {
    expect(hashContent('test')).toBe(hashContent('test'))
  })

  it('different inputs produce different hashes', () => {
    expect(hashContent('Complet')).not.toBe(hashContent('Available'))
  })
})

describe('getStatusLabel', () => {
  it('maps availability statuses to user-facing labels', () => {
    expect(getStatusLabel('OPEN')).toBe('Seats Available')
    expect(getStatusLabel('SOLD_OUT')).toBe('Sold Out')
    expect(getStatusLabel('EXPECTED')).toBe('Sold Out')
    expect(getStatusLabel('NOT_OPEN')).toBe('Sold Out')
    expect(getStatusLabel('MONITORING')).toBe('Monitoring')
    expect(getStatusLabel('UNKNOWN')).toBe('Unknown')
  })
})
