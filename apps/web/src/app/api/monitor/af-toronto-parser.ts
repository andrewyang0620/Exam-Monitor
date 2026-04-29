import { createHash } from 'crypto'

export const AF_TORONTO_ID = 'af-toronto'
export const AF_TORONTO_TCF_PAGE_URL =
  'https://www.alliance-francaise.ca/en/exams/tests/informations-about-tcf-canada/tcf-canada'
export const AF_TORONTO_TCF_FAQ_URL =
  'https://www.alliance-francaise.ca/en/exams/tests/informations-about-tcf-canada'

export type AvailabilityStatus = 'OPEN' | 'NOT_OPEN' | 'MONITORING' | 'UNKNOWN'

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
  nextWindowText?: string
  upcomingSessionLabels?: string[]
  soldOutSessionLabels?: string[]
}

interface OpeningWindow {
  label: string
  opensText: string
  opensAt?: Date
}

interface RegistrationTimeContext {
  displayTime: string
  hour24: number
  minute: number
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rsquo;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function hashText(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16)
}

function normalizeHumanDate(input: string): string {
  return input
    .replace(/^[A-Za-z]+,\s*/, '')
    .replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
    .replace(/a\.m\./gi, 'AM')
    .replace(/p\.m\./gi, 'PM')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseHumanDate(input: string): Date | undefined {
  const normalized = normalizeHumanDate(input)
  const match = normalized.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i,
  )
  if (!match) return undefined

  const monthMap: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  }

  const month = monthMap[match[1].toLowerCase()]
  const day = Number(match[2])
  const year = Number(match[3])
  const minute = Number(match[5])
  let hour = Number(match[4])
  const ampm = match[6].toUpperCase()

  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0

  return new Date(year, month, day, hour, minute, 0, 0)
}

function parseMonthDayYearDate(input: string): Date | undefined {
  const normalized = normalizeHumanDate(input)
  const match = normalized.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})$/i,
  )
  if (!match) return undefined

  const monthMap: Record<string, number> = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  }

  return new Date(Number(match[3]), monthMap[match[1].toLowerCase()], Number(match[2]), 0, 0, 0, 0)
}

function parseRegistrationTimeContext(text: string): RegistrationTimeContext | undefined {
  const match = text.match(
    /Registration\s+for\s+\d{4}\s+will\s+open\s+at\s+(\d{1,2}):(\d{2})\s*(a\.m\.|p\.m\.|AM|PM)/i,
  )
  if (!match) return undefined

  const minute = Number(match[2])
  let hour24 = Number(match[1])
  const ampm = match[3].toUpperCase()

  if (ampm.includes('P') && hour24 !== 12) hour24 += 12
  if (ampm.includes('A') && hour24 === 12) hour24 = 0

  return {
    displayTime: `${match[1]}:${match[2]} ${ampm.includes('P') ? 'PM' : 'AM'}`,
    hour24,
    minute,
  }
}

function parseOpeningWindows(text: string): OpeningWindow[] {
  const windows: OpeningWindow[] = []
  const oldPattern =
    /Q([1-4])\s*\(([^)]+)\)\s+opens on\s+([A-Za-z]+,\s+[A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?\s+\d{4}\s+at\s+\d{1,2}:\d{2}\s+[ap]\.m\.)/gi
  const registrationTime = parseRegistrationTimeContext(text)
  const newPattern =
    /Q([1-4])\s*\(([^)]+)\)\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})(?:\s*\([^)]+\))?/gi

  let match: RegExpExecArray | null
  while ((match = oldPattern.exec(text)) !== null) {
    const opensText = match[3].trim()
    const opensAt = parseHumanDate(opensText)

    windows.push({
      label: `Q${match[1]} (${match[2].trim()})`,
      opensText,
      opensAt,
    })
  }

  while ((match = newPattern.exec(text)) !== null) {
    const label = `Q${match[1]} (${match[2].trim()})`
    const dateText = normalizeHumanDate(match[3])
    const opensText = registrationTime
      ? `${dateText} at ${registrationTime.displayTime}`
      : dateText
    const opensAt = parseMonthDayYearDate(dateText)

    windows.push({
      label,
      opensText,
      opensAt: opensAt
        ? new Date(
            opensAt.getFullYear(),
            opensAt.getMonth(),
            opensAt.getDate(),
            registrationTime?.hour24 ?? 0,
            registrationTime?.minute ?? 0,
            0,
            0,
          )
        : undefined,
    })
  }

  return windows
}

function getNextWindow(windows: OpeningWindow[], now: Date): OpeningWindow | undefined {
  return windows
    .filter((window) => !window.opensAt || window.opensAt.getTime() >= now.getTime())
    .sort((a, b) => {
      if (!a.opensAt && !b.opensAt) return 0
      if (!a.opensAt) return 1
      if (!b.opensAt) return -1
      return a.opensAt.getTime() - b.opensAt.getTime()
    })[0]
}

function extractRegistrationsSection(text: string): string {
  const lower = text.toLowerCase()
  const marker = 'registrations'
  const start = lower.lastIndexOf(marker)
  if (start === -1) return ''

  const rest = text.slice(start + marker.length)
  const endMatch = rest.match(/([\s\S]*?)(?:Examination information|Exam information|Location|$)/i)
  return endMatch?.[1]?.trim() ?? rest.trim()
}

function extractOpenSessions(sectionText: string): string[] {
  const sessions: string[] = []

  const datePattern =
    /\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)?(?:,\s*)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?(?:,\s*|\s+)\d{4}(?:\s*[-,]?\s*\d{1,2}:\d{2}\s*(?:AM|PM|a\.m\.|p\.m\.))?/gi

  let match: RegExpExecArray | null
  while ((match = datePattern.exec(sectionText)) !== null) {
    sessions.push(match[0].replace(/\s+/g, ' ').trim())
  }

  if (sessions.length > 0) return [...new Set(sessions)]

  if (
    !/no sessions currently available/i.test(sectionText) &&
    /activecommunities|book your test|register now|choose a date/i.test(sectionText)
  ) {
    return ['Registrations section contains a registration signal']
  }

  return []
}

export function parseAllianceFrancaiseTorontoHtml(params: {
  tcfPageHtml: string
  faqPageHtml?: string
  now?: Date
}): ParsedObservation {
  const { tcfPageHtml, faqPageHtml = '', now = new Date() } = params

  const pageText = stripTags(tcfPageHtml)
  const faqText = faqPageHtml ? stripTags(faqPageHtml) : ''
  const openingWindows = parseOpeningWindows(pageText)
  const nextWindow = getNextWindow(openingWindows, now)
  const registrationsText = extractRegistrationsSection(pageText)
  const openSessions = extractOpenSessions(registrationsText)
  const sourceText = registrationsText || 'registrations-missing'

  if (openSessions.length > 0) {
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: openSessions[0],
      availabilityStatus: 'OPEN',
      seatsText: openSessions.join('; '),
      sourceUrl: AF_TORONTO_TCF_PAGE_URL,
      sourceHash: hashText(sourceText),
      confidence: /activecommunities|book your test|register now/i.test(registrationsText) ? 0.92 : 0.82,
      detectedText: registrationsText.slice(0, 500),
      nextWindowText: nextWindow?.opensText,
      upcomingSessionLabels: openingWindows.map((window) => window.label),
    }
  }

  if (registrationsText || openingWindows.length > 0) {
    const seatsText = /no sessions currently available/i.test(registrationsText)
      ? 'No sessions currently available'
      : pageText.match(/If a session is not listed, it is full/i)
      ? 'If a session is not listed, it is full'
      : 'No current session listing detected'

    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: 'Not currently open',
      availabilityStatus: 'NOT_OPEN',
      seatsText,
      sourceUrl: AF_TORONTO_TCF_PAGE_URL,
      sourceHash: hashText(sourceText),
      confidence: faqText ? 0.83 : 0.8,
      detectedText: registrationsText.slice(0, 500) || pageText.slice(0, 500),
      nextWindowText: nextWindow?.opensText,
      upcomingSessionLabels: openingWindows.map((window) => window.label),
    }
  }

  return {
    platformId: AF_TORONTO_ID,
    centerName: 'Alliance Francaise de Toronto',
    city: 'Toronto',
    province: 'ON',
    examType: 'TCF Canada',
    sessionLabel: 'Unable to determine',
    availabilityStatus: 'MONITORING',
    seatsText: 'Could not confidently parse Toronto TCF Canada page',
    sourceUrl: AF_TORONTO_TCF_PAGE_URL,
    sourceHash: hashText(pageText.slice(0, 1500) || 'af-toronto-empty'),
    confidence: 0.25,
    detectedText: pageText.slice(0, 500),
  }
}

export async function parseAllianceFrancaiseToronto(): Promise<ParsedObservation> {
  const fetchOpts: RequestInit = {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-CA,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    signal: AbortSignal.timeout(12_000),
  }

  let tcfPageHtml = ''
  let faqPageHtml = ''
  let fetchedMain = false
  let fetchedFaq = false

  try {
    const res = await fetch(AF_TORONTO_TCF_PAGE_URL, fetchOpts)
    if (res.ok) {
      tcfPageHtml = await res.text()
      fetchedMain = true
    } else {
      throw new Error(`main page returned ${res.status}`)
    }
  } catch (err) {
    console.warn('[af-toronto parser] main page fetch failed:', err)
  }

  try {
    const res = await fetch(AF_TORONTO_TCF_FAQ_URL, fetchOpts)
    if (res.ok) {
      faqPageHtml = await res.text()
      fetchedFaq = true
    }
  } catch (err) {
    console.warn('[af-toronto parser] faq page fetch failed:', err)
  }

  if (!fetchedMain && !fetchedFaq) {
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: 'Fetch failed',
      availabilityStatus: 'MONITORING',
      seatsText: 'Could not reach Toronto TCF Canada pages',
      sourceUrl: AF_TORONTO_TCF_PAGE_URL,
      sourceHash: hashText('af-toronto-fetch-failed'),
      confidence: 0,
      detectedText: '',
    }
  }

  if (!fetchedMain) {
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: 'Monitoring',
      availabilityStatus: 'MONITORING',
      seatsText: fetchedFaq
        ? 'Main Toronto TCF Canada page unavailable; info page fetched for reference only'
        : 'Could not reach Toronto TCF Canada page',
      sourceUrl: AF_TORONTO_TCF_PAGE_URL,
      sourceHash: hashText(
        fetchedFaq ? `af-toronto-main-unavailable|${stripTags(faqPageHtml).slice(0, 1500)}` : 'af-toronto-main-unavailable',
      ),
      confidence: fetchedFaq ? 0.18 : 0,
      detectedText: fetchedFaq ? stripTags(faqPageHtml).slice(0, 500) : '',
    }
  }

  const parsed = parseAllianceFrancaiseTorontoHtml({
    tcfPageHtml,
    faqPageHtml,
  })

  if (!fetchedFaq) {
    parsed.confidence = Math.max(0, parsed.confidence - 0.08)
  }

  return parsed
}
