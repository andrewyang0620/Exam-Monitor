import { createHash } from 'crypto'

export const AF_TORONTO_ID = 'af-toronto'
export const AF_TORONTO_TCF_PAGE_URL =
  'https://www.alliance-francaise.ca/en/exams/tests/informations-about-tcf-canada/tcf-canada'
export const AF_TORONTO_ACTIVE_SEARCH_URL =
  'https://anc.ca.apm.activecommunities.com/aftoronto/activity/search?onlineSiteId=0&activity_select_param=0&activity_category_ids=30&viewMode=list'
export const AF_TORONTO_ACTIVE_LIST_API_URL =
  'https://anc.ca.apm.activecommunities.com/aftoronto/rest/activities/list'
export const AF_TORONTO_ACTIVE_SUBS_API_URL =
  'https://anc.ca.apm.activecommunities.com/aftoronto/rest/activities/subs'

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

interface ActiveLink {
  href?: string
  label?: string
}

interface ActiveUrgentMessage {
  status_description?: string | null
}

interface ActiveLabeledField {
  label?: string | null
}

interface ActiveActivityItem {
  id: number
  name?: string | null
  num_of_sub_activities?: number | null
  urgent_message?: ActiveUrgentMessage | null
  action_link?: ActiveLink | null
  enroll_now?: ActiveLink | null
}

interface ActiveSubActivity {
  id: number
  name?: string | null
  number?: string | null
  date_range?: string | null
  enroll_now?: ActiveLink | null
  urgent_message?: ActiveUrgentMessage | null
  fee?: ActiveLabeledField | null
  location?: ActiveLabeledField | null
}

interface ActiveListResponse {
  body?: {
    activity_items?: ActiveActivityItem[]
  }
}

interface ActiveSubsResponse {
  body?: {
    sub_activities?: ActiveSubActivity[]
  }
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
  const registrationTime = parseRegistrationTimeContext(text)
  const newPattern =
    /Q([1-4])\s*\(([^)]+)\)\s*:\s*([A-Za-z]+\s+\d{1,2},\s+\d{4})(?:\s*\([^)]+\))?/gi

  let match: RegExpExecArray | null
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

function getUpcomingWindowLabels(windows: OpeningWindow[], now: Date): string[] | undefined {
  const upcoming = windows
    .filter((window) => !window.opensAt || window.opensAt.getTime() >= now.getTime())
    .map((window) => window.opensText)

  return upcoming.length > 0 ? upcoming : undefined
}

function normalizeStatusDescription(value?: string | null): string {
  return (value ?? '').trim().toLowerCase()
}

function isFullStatus(value?: string | null): boolean {
  return normalizeStatusDescription(value) === 'full'
}

function buildSessionSummary(sub: ActiveSubActivity): string {
  const parts = [
    sub.name?.trim(),
    sub.number?.trim(),
    sub.date_range?.trim(),
    sub.location?.label?.trim(),
    sub.fee?.label?.trim(),
    sub.urgent_message?.status_description?.trim(),
  ].filter(Boolean)

  return parts.join(' | ')
}

function summarizeParentActivity(item: ActiveActivityItem): string {
  const subCount = item.num_of_sub_activities ?? 0
  const urgent = item.urgent_message?.status_description?.trim()
  const parts = [item.name?.trim(), subCount > 0 ? `View sub-courses (${subCount})` : 'No sub-activities']
  if (urgent) parts.push(urgent)
  return parts.filter(Boolean).join(' | ')
}

function buildHashPayload(items: ActiveActivityItem[], subMap: Map<number, ActiveSubActivity[]>): string {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      name: item.name ?? '',
      num_of_sub_activities: item.num_of_sub_activities ?? 0,
      urgent_status: item.urgent_message?.status_description ?? '',
      action_link: item.action_link?.href ?? '',
      enroll_now: item.enroll_now?.href ?? '',
      subs: (subMap.get(item.id) ?? []).map((sub) => ({
        id: sub.id,
        status: sub.urgent_message?.status_description ?? '',
        enroll_now: sub.enroll_now?.href ?? '',
        date_range: sub.date_range ?? '',
        fee: sub.fee?.label ?? '',
        location: sub.location?.label ?? '',
        number: sub.number ?? '',
      })),
    })),
  )
}

export function parseAllianceFrancaiseTorontoHtml(params: {
  tcfPageHtml: string
  activityItems: ActiveActivityItem[]
  subActivitiesByParentId: Map<number, ActiveSubActivity[]>
  now?: Date
}): ParsedObservation {
  const { tcfPageHtml, activityItems, subActivitiesByParentId, now = new Date() } = params

  const pageText = stripTags(tcfPageHtml)
  const openingWindows = parseOpeningWindows(pageText)
  const nextWindow = getNextWindow(openingWindows, now)
  const upcomingWindowLabels = getUpcomingWindowLabels(openingWindows, now)

  const parentItemsWithSubs = activityItems.filter((item) => (item.num_of_sub_activities ?? 0) > 0)
  const allSubActivities = parentItemsWithSubs.flatMap((item) => subActivitiesByParentId.get(item.id) ?? [])
  const openSubActivities = allSubActivities.filter(
    (sub) => !isFullStatus(sub.urgent_message?.status_description),
  )
  const fullSubActivities = allSubActivities.filter((sub) => isFullStatus(sub.urgent_message?.status_description))

  const detectedText = [
    ...parentItemsWithSubs.map(summarizeParentActivity),
    ...allSubActivities.map(buildSessionSummary),
  ]
    .filter(Boolean)
    .join(' || ')
    .slice(0, 500)

  const sourceHash = hashText(buildHashPayload(activityItems, subActivitiesByParentId))

  if (openSubActivities.length > 0) {
    const primary = openSubActivities[0]
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: primary.date_range?.trim() || primary.name?.trim() || 'Session available',
      availabilityStatus: 'OPEN',
      seatsText: openSubActivities.map(buildSessionSummary).join('; '),
      sourceUrl: primary.enroll_now?.href || AF_TORONTO_ACTIVE_SEARCH_URL,
      sourceHash,
      confidence: 0.97,
      detectedText,
      nextWindowText: nextWindow?.opensText,
      upcomingSessionLabels: upcomingWindowLabels,
      soldOutSessionLabels: fullSubActivities.map((sub) => sub.date_range || sub.name || '').filter(Boolean),
    }
  }

  if (parentItemsWithSubs.length > 0) {
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: 'Not currently open',
      availabilityStatus: 'NOT_OPEN',
      seatsText:
        fullSubActivities.length > 0
          ? fullSubActivities.map(buildSessionSummary).join('; ')
          : parentItemsWithSubs.map(summarizeParentActivity).join('; '),
      sourceUrl: AF_TORONTO_ACTIVE_SEARCH_URL,
      sourceHash,
      confidence: 0.94,
      detectedText,
      nextWindowText: nextWindow?.opensText,
      upcomingSessionLabels: upcomingWindowLabels,
      soldOutSessionLabels: fullSubActivities.map((sub) => sub.date_range || sub.name || '').filter(Boolean),
    }
  }

  return {
    platformId: AF_TORONTO_ID,
    centerName: 'Alliance Francaise de Toronto',
    city: 'Toronto',
    province: 'ON',
    examType: 'TCF Canada',
    sessionLabel: 'Not currently open',
    availabilityStatus: 'NOT_OPEN',
    seatsText: 'No sub-activities currently available',
    sourceUrl: AF_TORONTO_ACTIVE_SEARCH_URL,
    sourceHash,
    confidence: activityItems.length > 0 ? 0.88 : 0.7,
    detectedText:
      activityItems.length > 0
        ? activityItems.map(summarizeParentActivity).join(' || ').slice(0, 500)
        : pageText.slice(0, 500),
    nextWindowText: nextWindow?.opensText,
    upcomingSessionLabels: upcomingWindowLabels,
  }
}

async function fetchJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-CA,en;q=0.9',
      'Content-Type': 'application/json',
      Origin: 'https://anc.ca.apm.activecommunities.com',
      Referer: AF_TORONTO_ACTIVE_SEARCH_URL,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  })

  if (!res.ok) {
    throw new Error(`request failed ${res.status} for ${url}`)
  }

  return (await res.json()) as T
}

export async function parseAllianceFrancaiseToronto(): Promise<ParsedObservation> {
  const pageFetchOpts: RequestInit = {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-CA,en;q=0.9',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
      Referer: AF_TORONTO_ACTIVE_SEARCH_URL,
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
    },
    signal: AbortSignal.timeout(12_000),
  }

  let tcfPageHtml = ''
  let activityItems: ActiveActivityItem[] = []
  const subActivitiesByParentId = new Map<number, ActiveSubActivity[]>()
  let fetchedMain = false
  let fetchedActive = false

  try {
    const res = await fetch(AF_TORONTO_TCF_PAGE_URL, pageFetchOpts)
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
    const listResponse = await fetchJson<ActiveListResponse>(AF_TORONTO_ACTIVE_LIST_API_URL, {
      activity_search_pattern: {
        online_site_id: 0,
        activity_select_param: 0,
        activity_category_ids: [30],
      },
      activity_transfer_pattern: {},
    })
    activityItems = listResponse.body?.activity_items ?? []
    fetchedActive = true

    for (const item of activityItems) {
      if ((item.num_of_sub_activities ?? 0) <= 0) continue
      const subResponse = await fetchJson<ActiveSubsResponse>(
        `${AF_TORONTO_ACTIVE_SUBS_API_URL}/${item.id}?locale=en-US`,
        {
          sub_activity_ids: '',
          activity_transfer_pattern: {},
          open_spots: 0,
        },
      )
      subActivitiesByParentId.set(item.id, subResponse.body?.sub_activities ?? [])
    }
  } catch (err) {
    console.warn('[af-toronto parser] Active Communities fetch failed:', err)
  }

  if (!fetchedMain && !fetchedActive) {
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: 'Fetch failed',
      availabilityStatus: 'MONITORING',
      seatsText: 'Could not reach Toronto TCF Canada sources',
      sourceUrl: AF_TORONTO_ACTIVE_SEARCH_URL,
      sourceHash: hashText('af-toronto-fetch-failed'),
      confidence: 0,
      detectedText: '',
    }
  }

  if (!fetchedActive) {
    return {
      platformId: AF_TORONTO_ID,
      centerName: 'Alliance Francaise de Toronto',
      city: 'Toronto',
      province: 'ON',
      examType: 'TCF Canada',
      sessionLabel: 'Monitoring',
      availabilityStatus: 'MONITORING',
      seatsText: fetchedMain
        ? 'Active Communities search unavailable; AF Toronto page fetched for future windows only'
        : 'Could not reach Toronto Active Communities search',
      sourceUrl: AF_TORONTO_ACTIVE_SEARCH_URL,
      sourceHash: hashText(
        fetchedMain ? `af-toronto-active-unavailable|${stripTags(tcfPageHtml).slice(0, 1500)}` : 'af-toronto-active-unavailable',
      ),
      confidence: fetchedMain ? 0.18 : 0,
      detectedText: fetchedMain ? stripTags(tcfPageHtml).slice(0, 500) : '',
    }
  }

  const parsed = parseAllianceFrancaiseTorontoHtml({
    tcfPageHtml,
    activityItems,
    subActivitiesByParentId,
  })

  if (!fetchedMain) {
    parsed.confidence = Math.max(0, parsed.confidence - 0.08)
  }

  return parsed
}
