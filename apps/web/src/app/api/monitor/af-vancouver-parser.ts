/**
 * Alliance Française de Vancouver — TCF Canada page parser
 *
 * Detection URL:   https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/
 * Product URL:     https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/
 * Registration:    https://www.alliancefrancaise.ca/products/ciep-tcf-canada-full-exam/
 *
 * Strategy:
 *  1. Fetch both pages
 *  2. Extract "Next sessions" section from detection page
 *  3. Parse each "Next Session: <label>" block for SOLD OUT / Registration starts
 *  4. Cross-validate with product page "Out of stock" indicator
 *  5. Compute SHA-256 hash of sessions section for change detection
 */

import { createHash } from 'crypto'

export const AF_VANCOUVER_ID = 'af-vancouver'
export const AF_VANCOUVER_DETECTION_URL =
  'https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/'
export const AF_VANCOUVER_PRODUCT_URL =
  'https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/'
export const AF_VANCOUVER_REGISTRATION_URL =
  'https://www.alliancefrancaise.ca/products/ciep-tcf-canada-full-exam/'

export type AvailabilityStatus = 'OPEN' | 'SOLD_OUT' | 'EXPECTED' | 'MONITORING' | 'UNKNOWN'

export interface ParsedObservation {
  platformId: string
  centerName: string
  city: string
  province: string
  examType: string
  sessionLabel: string
  availabilityStatus: AvailabilityStatus
  seatsText: string
  sourceUrl: string
  sourceHash: string
  confidence: number
  detectedText: string
}

interface SessionBlock {
  label: string
  statusText: string
}

// ─── HTML helpers ─────────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#[0-9]+;/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

// ─── Detection page parser ────────────────────────────────────────────────────

function parseDetectionPage(html: string): {
  sessions: SessionBlock[]
  sectionText: string
} {
  const text = stripTags(html)

  // Extract between "Next sessions" and next major section (Location / Register / footer)
  const sectionMatch = text.match(
    /Next\s+sessions([\s\S]*?)(?:Location\b|Register\b|Please\s+check|For\s+all\s+TCF)/i,
  )
  const sectionText = sectionMatch?.[1] ?? text.slice(0, 2000)

  // Collapse split "SOLD\n OUT" → "SOLD OUT" before parsing blocks
  const normalizedSection = sectionText.replace(/\bSOLD\s*\n+\s*OUT\b/gi, 'SOLD OUT')

  // Parse individual session blocks:
  // Pattern: "Next Session: <label>" followed by a status line
  const sessions: SessionBlock[] = []
  const blockPattern =
    /Next\s+Session[:\s]+([^\n\r]{3,80})\r?\n[\s\S]{0,100}?([^\n\r]{3,120})/gi

  let m: RegExpExecArray | null
  while ((m = blockPattern.exec(normalizedSection)) !== null) {
    const label = m[1].trim().replace(/\s+/g, ' ')
    // Only track TCF Canada Full Exam — ignore TCF Preparation / other products
    if (/preparation|préparation|prep\b/i.test(label)) continue
    sessions.push({
      label,
      statusText: m[2].trim().replace(/\s+/g, ' '),
    })
  }

  return { sessions, sectionText }
}

// ─── Product page parser ──────────────────────────────────────────────────────

function parseProductPage(html: string): 'OUT_OF_STOCK' | 'AVAILABLE' | 'UNKNOWN' {
  const lower = html.toLowerCase()
  // This is the dedicated TCF Canada Full Exam product page — any OOS signal means SOLD OUT
  if (lower.includes('out of stock') || lower.includes('sold out')) return 'OUT_OF_STOCK'
  if (lower.includes('add to cart') || lower.includes('order now') || lower.includes(' order '))
    return 'AVAILABLE'
  return 'UNKNOWN'
}

// ─── Status logic ─────────────────────────────────────────────────────────────

function deriveStatus(
  sessions: SessionBlock[],
  productStatus: 'OUT_OF_STOCK' | 'AVAILABLE' | 'UNKNOWN',
): { status: AvailabilityStatus; sessionLabel: string; confidence: number; seatsText: string } {
  if (sessions.length === 0) {
    // Couldn't parse sessions — fall back to product page only
    if (productStatus === 'AVAILABLE') {
      return {
        status: 'OPEN',
        sessionLabel: 'Session available',
        confidence: 0.65,
        seatsText: 'Product page shows available — register now',
      }
    }
    if (productStatus === 'OUT_OF_STOCK') {
      return {
        status: 'SOLD_OUT',
        sessionLabel: 'Unknown',
        confidence: 0.6,
        seatsText: 'Product page: Out of stock',
      }
    }
    return {
      status: 'MONITORING',
      sessionLabel: 'Unable to determine',
      confidence: 0.25,
      seatsText: 'Could not parse session availability',
    }
  }

  const soldOut = sessions.filter((s) => {
    const t = s.statusText.toLowerCase()
    return (
      t.includes('sold out') ||
      t.includes('complet') ||
      // "SOLD" alone = first half of a split "SOLD / OUT" after stripTags
      /^sold(\s|$)/.test(t)
    )
  })
  const registrationSoon = sessions.filter((s) => {
    const t = s.statusText.toLowerCase()
    return t.includes('registration starts') || t.includes('registration opens')
  })
  const openSessions = sessions.filter((s) => {
    const t = s.statusText.toLowerCase()
    return (
      !t.includes('sold out') &&
      !t.includes('complet') &&
      !/^sold(\s|$)/.test(t) &&
      !t.includes('registration starts') &&
      !t.includes('registration opens')
    )
  })

  // OPEN: at least one session with no "SOLD OUT" and no "Registration starts"
  if (openSessions.length > 0) {
    const labels = openSessions.map((s) => s.label).join(', ')
    const texts = openSessions.map((s) => `${s.label} — ${s.statusText}`).join('; ')
    // Cross-validate: if product page also says available, high confidence
    const confidence = productStatus === 'AVAILABLE' ? 0.97 : 0.85
    return {
      status: 'OPEN',
      sessionLabel: labels,
      confidence,
      seatsText: texts,
    }
  }

  // SOLD_OUT: all parsed sessions say SOLD OUT
  if (soldOut.length > 0 && openSessions.length === 0 && registrationSoon.length === 0) {
    const labels = soldOut.map((s) => s.label).join(', ')
    const texts = soldOut.map((s) => `${s.label} — SOLD OUT`).join('; ')
    // High confidence when both sources agree
    const confidence = productStatus === 'OUT_OF_STOCK' ? 0.95 : 0.88
    return {
      status: 'SOLD_OUT',
      sessionLabel: labels,
      confidence,
      seatsText: texts,
    }
  }

  // EXPECTED: some sessions have "Registration starts" (upcoming but not yet open)
  if (registrationSoon.length > 0) {
    const labels = registrationSoon.map((s) => s.label).join(', ')
    const texts = registrationSoon
      .map((s) => `${s.label} — ${s.statusText}`)
      .join('; ')
    return {
      status: 'EXPECTED',
      sessionLabel: labels,
      confidence: 0.85,
      seatsText: texts,
    }
  }

  // Mixed state: some sold out + some expected
  if (soldOut.length > 0 || registrationSoon.length > 0) {
    const allLabels = [...soldOut, ...registrationSoon].map((s) => s.label).join(', ')
    const allTexts = sessions.map((s) => `${s.label} — ${s.statusText}`).join('; ')
    return {
      status: 'EXPECTED',
      sessionLabel: allLabels,
      confidence: 0.78,
      seatsText: allTexts,
    }
  }

  return {
    status: 'MONITORING',
    sessionLabel: 'Unknown',
    confidence: 0.3,
    seatsText: 'No session blocks identified',
  }
}

// ─── Main parse function ──────────────────────────────────────────────────────

export async function parseAllianceFrancaiseVancouver(): Promise<ParsedObservation> {
  const fetchOpts: RequestInit = {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; ExamSeatMonitor/1.0; +https://examseats.app)',
      Accept: 'text/html,application/xhtml+xml',
    },
    // 10-second timeout
    signal: AbortSignal.timeout(10_000),
  }

  let detectionHtml = ''
  let productHtml = ''
  let fetchedDetection = false
  let fetchedProduct = false

  try {
    const res = await fetch(AF_VANCOUVER_DETECTION_URL, fetchOpts)
    if (res.ok) {
      detectionHtml = await res.text()
      fetchedDetection = true
    }
  } catch (err) {
    console.warn('[parser] detection page fetch failed:', err)
  }

  try {
    // Use the specific Full Exam product page, not the category page
    // (category page also lists TCF Preparation which has its own availability)
    const res = await fetch(AF_VANCOUVER_REGISTRATION_URL, fetchOpts)
    if (res.ok) {
      productHtml = await res.text()
      fetchedProduct = true
    }
  } catch (err) {
    console.warn('[parser] product page fetch failed:', err)
  }

  // Full failure
  if (!fetchedDetection && !fetchedProduct) {
    return {
      platformId: AF_VANCOUVER_ID,
      centerName: 'Alliance Française de Vancouver',
      city: 'Vancouver',
      province: 'BC',
      examType: 'TCF Canada',
      sessionLabel: 'Fetch failed',
      availabilityStatus: 'MONITORING',
      seatsText: 'Could not reach exam page',
      sourceUrl: AF_VANCOUVER_DETECTION_URL,
      sourceHash: hashText('fetch-failed'),
      confidence: 0.0,
      detectedText: '',
    }
  }

  const { sessions, sectionText } = fetchedDetection
    ? parseDetectionPage(detectionHtml)
    : { sessions: [], sectionText: '' }

  const productStatus = fetchedProduct ? parseProductPage(productHtml) : 'UNKNOWN'

  // Apply confidence penalty if one source failed
  const { status, sessionLabel, confidence: rawConfidence, seatsText } = deriveStatus(
    sessions,
    productStatus,
  )
  const confidence = fetchedDetection && fetchedProduct ? rawConfidence : rawConfidence - 0.1

  // Hash only the sessions section text for change detection
  const hashInput = sectionText || productHtml.slice(0, 2000)
  const sourceHash = hashText(hashInput)

  return {
    platformId: AF_VANCOUVER_ID,
    centerName: 'Alliance Française de Vancouver',
    city: 'Vancouver',
    province: 'BC',
    examType: 'TCF Canada',
    sessionLabel,
    availabilityStatus: status,
    seatsText,
    sourceUrl: AF_VANCOUVER_DETECTION_URL,
    sourceHash,
    confidence: Math.max(0, Math.min(1, confidence)),
    detectedText: sectionText.slice(0, 500),
  }
}
