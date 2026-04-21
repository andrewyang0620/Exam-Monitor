// ============================================================
// Demo / Seed Data — ExamSeat Monitor V1
// ============================================================
// This module provides realistic mock data for the V1 demo.
// In production, this data would come from Supabase.

import type {
  User,
  Platform,
  MonitoringRule,
  SeatObservation,
  ChangeEvent,
  NotificationDelivery,
  DashboardStats,
  UpcomingWindow,
  AuditLog,
} from '@tcf-tracker/types'

// ----------------------------
// Demo User
// ----------------------------

export const DEMO_USER: User = {
  id: 'user-demo-001',
  email: 'liming@example.com',
  displayName: '李明 (Li Ming)',
  createdAt: '2026-03-01T08:00:00Z',
}

// ----------------------------
// Platforms
// ----------------------------

export const MOCK_PLATFORMS: Platform[] = [
  {
    id: 'af-toronto',
    displayName: 'Alliance Française de Toronto',
    shortName: 'AF Toronto',
    city: 'Toronto',
    province: 'ON',
    country: 'CA',
    examTypesSupported: ['TEF', 'TEF Canada', 'TCF Canada'],
    entryUrl: 'https://www.alliance-francaise.ca/en/services/french-tests',
    monitoring: {
      level: 'full',
      detectionMode: 'html',
      requiresAuth: false,
      pollingIntervalSec: 300,
    },
    autofill: {
      supported: true,
      level: 'full',
      fieldsCount: 10,
    },
    healthStatus: 'operational',
    lastHealthCheck: '2026-04-20T14:32:00Z',
    fixedReleaseWindows: [
      {
        label: 'Monthly release — last Monday',
        dayOfWeek: 1,
        timezone: 'America/Toronto',
        nextExpectedDate: '2026-04-27',
      },
    ],
    riskLevel: 'low',
    notes: 'Most popular Ontario center. Sessions sell out in under 30 minutes.',
  },
  {
    id: 'af-vancouver',
    displayName: 'Alliance Française de Vancouver',
    shortName: 'AF Vancouver',
    city: 'Vancouver',
    province: 'BC',
    country: 'CA',
    examTypesSupported: ['TEF', 'TEF Canada', 'TCF Canada'],
    entryUrl: 'https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/',
    monitoring: {
      level: 'full',
      detectionMode: 'html',
      requiresAuth: false,
      pollingIntervalSec: 300,
    },
    autofill: {
      supported: true,
      level: 'full',
      fieldsCount: 11,
    },
    healthStatus: 'operational',
    lastHealthCheck: '2026-04-20T14:30:00Z',
    fixedReleaseWindows: [
      {
        label: 'Irregular releases',
        timezone: 'America/Vancouver',
        nextExpectedDate: '2026-05-10',
        notes: 'No fixed pattern. Continuous monitoring recommended.',
      },
    ],
    riskLevel: 'low',
    notes: 'BC primary center. High competition from Pacific Rim applicants.',
  },
  {
    id: 'campus-france-eventbrite',
    displayName: 'Campus France Canada',
    shortName: 'Campus France',
    city: 'Montréal',
    province: 'QC',
    country: 'CA',
    examTypesSupported: ['TCF Canada', 'TCF SO'],
    entryUrl: 'https://www.canada.campusfrance.org/tests-et-examens',
    monitoring: {
      level: 'partial',
      detectionMode: 'eventbrite-link',
      requiresAuth: false,
      pollingIntervalSec: 300,
    },
    autofill: {
      supported: true,
      level: 'partial',
      fieldsCount: 3,
    },
    healthStatus: 'degraded',
    lastHealthCheck: '2026-04-20T14:25:00Z',
    fixedReleaseWindows: [
      {
        label: 'Session-by-session',
        nextExpectedDate: '2026-05-15',
        notes: 'Sessions announced 2–4 weeks before exam date.',
      },
    ],
    riskLevel: 'medium',
    notes: 'Uses Eventbrite for ticketing. Link detection may break if page changes.',
  },
  {
    id: 'universite-laval-clic',
    displayName: 'Université Laval — CLIC',
    shortName: 'ULaval CLIC',
    city: 'Québec',
    province: 'QC',
    country: 'CA',
    examTypesSupported: ['TEF', 'TEF Canada', 'TCF Canada', 'DELF', 'DALF'],
    entryUrl: 'https://www.clic.ulaval.ca/tests-et-certifications',
    monitoring: {
      level: 'partial',
      detectionMode: 'json-xhr',
      requiresAuth: false,
      pollingIntervalSec: 300,
    },
    autofill: {
      supported: false,
      level: 'none',
      fieldsCount: 0,
    },
    healthStatus: 'operational',
    lastHealthCheck: '2026-04-20T14:20:00Z',
    fixedReleaseWindows: [
      {
        label: 'Semester-based',
        nextExpectedDate: '2026-08-15',
        notes: 'New sessions each semester. Next: August 2026.',
      },
    ],
    riskLevel: 'low',
    notes: 'Broader exam coverage including DELF/DALF. Semester-based releases.',
  },
]

// ----------------------------
// Monitoring Rules
// ----------------------------

export const MOCK_RULES: MonitoringRule[] = [
  {
    id: 'rule-001',
    userId: DEMO_USER.id,
    platformId: 'af-toronto',
    examType: 'TCF Canada',
    city: 'Toronto',
    datePreference: 'any',
    channels: ['browser', 'email'],
    priority: 1,
    isActive: true,
    createdAt: '2026-03-05T10:00:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
    platformDisplayName: 'Alliance Française de Toronto',
  },
  {
    id: 'rule-002',
    userId: DEMO_USER.id,
    platformId: 'af-vancouver',
    examType: 'TEF Canada',
    city: 'Vancouver',
    datePreference: 'any',
    channels: ['browser', 'email'],
    priority: 1,
    isActive: true,
    createdAt: '2026-03-05T10:05:00Z',
    updatedAt: '2026-04-10T09:00:00Z',
    platformDisplayName: 'Alliance Française de Vancouver',
  },
  {
    id: 'rule-003',
    userId: DEMO_USER.id,
    platformId: 'campus-france-eventbrite',
    examType: 'TCF Canada',
    city: 'Montréal',
    datePreference: '2026-Q2',
    channels: ['browser'],
    priority: 2,
    isActive: true,
    createdAt: '2026-03-10T11:00:00Z',
    updatedAt: '2026-04-01T10:00:00Z',
    platformDisplayName: 'Campus France Canada',
  },
]

// ----------------------------
// Seat Observations (latest per platform)
// ----------------------------

export const MOCK_OBSERVATIONS: SeatObservation[] = [
  {
    id: 'obs-001',
    platformId: 'af-toronto',
    centerName: 'Alliance Française de Toronto',
    city: 'Toronto',
    province: 'ON',
    examType: 'TCF Canada',
    sessionLabel: 'Spring 2026 Sessions',
    availabilityStatus: 'NOT_OPEN',
    seatsText: 'No upcoming sessions available at this time',
    observedAt: '2026-04-18T09:15:00Z',
    sourceHash: 'a1b2c3d4',
    confidence: 0.88,
  },
  {
    id: 'obs-002',
    platformId: 'af-vancouver',
    centerName: 'Alliance Française de Vancouver',
    city: 'Vancouver',
    province: 'BC',
    examType: 'TEF Canada',
    sessionLabel: 'TEF Canada — May 2026',
    sessionDate: '2026-05-18',
    availabilityStatus: 'OPEN',
    seatsText: 'Seats available — register now',
    observedAt: '2026-04-20T13:52:00Z',
    sourceHash: 'e5f6g7h8',
    confidence: 0.92,
  },
  {
    id: 'obs-003',
    platformId: 'campus-france-eventbrite',
    centerName: 'Campus France Canada',
    city: 'Montréal',
    province: 'QC',
    examType: 'TCF Canada',
    sessionLabel: 'TCF Canada — Session de printemps',
    sessionDate: '2026-05-15',
    availabilityStatus: 'NOT_OPEN',
    seatsText: 'Next session expected ~May 15, 2026',
    observedAt: '2026-04-20T12:00:00Z',
    sourceHash: 'i9j0k1l2',
    confidence: 0.65,
  },
  {
    id: 'obs-004',
    platformId: 'universite-laval-clic',
    centerName: 'Université Laval — CLIC',
    city: 'Québec',
    province: 'QC',
    examType: 'TEF Canada',
    sessionLabel: 'Fall 2026 Sessions',
    availabilityStatus: 'MONITORING',
    seatsText: 'Next release expected August 2026',
    observedAt: '2026-04-20T11:30:00Z',
    sourceHash: 'm3n4o5p6',
    confidence: 0.7,
  },
]

// ----------------------------
// Change Events
// ----------------------------

export const MOCK_CHANGE_EVENTS: ChangeEvent[] = [
  {
    id: 'event-001',
    platformId: 'af-vancouver',
    ruleId: 'rule-002',
    previousStatus: 'NOT_OPEN',
    newStatus: 'OPEN',
    eventType: 'OPENED',
    detectedAt: '2026-04-20T13:52:00Z',
    confidence: 0.92,
    deliveredChannels: ['browser', 'email'],
    rawObservationRef: 'obs-002',
    centerName: 'Alliance Française de Vancouver',
    examType: 'TEF Canada',
    city: 'Vancouver',
  },
  {
    id: 'event-002',
    platformId: 'af-toronto',
    ruleId: 'rule-001',
    previousStatus: 'OPEN',
    newStatus: 'NOT_OPEN',
    eventType: 'SOLD_OUT',
    detectedAt: '2026-04-18T09:15:00Z',
    confidence: 0.88,
    deliveredChannels: ['browser', 'email'],
    rawObservationRef: 'obs-001',
    centerName: 'Alliance Française de Toronto',
    examType: 'TCF Canada',
    city: 'Toronto',
  },
  {
    id: 'event-003',
    platformId: 'campus-france-eventbrite',
    ruleId: 'rule-003',
    previousStatus: 'UNKNOWN',
    newStatus: 'NOT_OPEN',
    eventType: 'DATE_ADDED',
    detectedAt: '2026-04-15T08:00:00Z',
    confidence: 0.65,
    deliveredChannels: ['browser'],
    rawObservationRef: 'obs-003',
    centerName: 'Campus France Canada',
    examType: 'TCF Canada',
    city: 'Montréal',
  },
]

// ----------------------------
// Notification Deliveries
// ----------------------------

export const MOCK_NOTIFICATIONS: NotificationDelivery[] = [
  {
    id: 'notif-001',
    userId: DEMO_USER.id,
    changeEventId: 'event-001',
    channel: 'browser',
    status: 'sent',
    sentAt: '2026-04-20T13:52:15Z',
    isViewed: false,
    event: MOCK_CHANGE_EVENTS[0],
  },
  {
    id: 'notif-002',
    userId: DEMO_USER.id,
    changeEventId: 'event-001',
    channel: 'email',
    status: 'sent',
    sentAt: '2026-04-20T13:52:18Z',
    isViewed: false,
    event: MOCK_CHANGE_EVENTS[0],
  },
  {
    id: 'notif-003',
    userId: DEMO_USER.id,
    changeEventId: 'event-002',
    channel: 'browser',
    status: 'sent',
    sentAt: '2026-04-18T09:15:30Z',
    isViewed: true,
    event: MOCK_CHANGE_EVENTS[1],
  },
  {
    id: 'notif-004',
    userId: DEMO_USER.id,
    changeEventId: 'event-002',
    channel: 'email',
    status: 'sent',
    sentAt: '2026-04-18T09:15:35Z',
    isViewed: true,
    event: MOCK_CHANGE_EVENTS[1],
  },
  {
    id: 'notif-005',
    userId: DEMO_USER.id,
    changeEventId: 'event-003',
    channel: 'browser',
    status: 'sent',
    sentAt: '2026-04-15T08:00:45Z',
    isViewed: true,
    event: MOCK_CHANGE_EVENTS[2],
  },
]

// ----------------------------
// Dashboard Stats
// ----------------------------

export const MOCK_STATS: DashboardStats = {
  activeRulesCount: 3,
  openAlertsCount: 1,
  lastCheckAt: '2026-04-20T14:32:00Z',
  supportedPlatformsCount: 4,
  monitoredCitiesCount: 4,
  totalNotificationsSent: 5,
}

// ----------------------------
// Upcoming Windows
// ----------------------------

export const MOCK_UPCOMING_WINDOWS: UpcomingWindow[] = [
  {
    platformId: 'af-toronto',
    platformName: 'Alliance Française de Toronto',
    city: 'Toronto',
    examType: 'TCF Canada',
    expectedDate: '2026-04-27',
    confidence: 'historical',
    notes: 'Monthly release pattern — last Monday of April',
  },
  {
    platformId: 'campus-france-eventbrite',
    platformName: 'Campus France Canada',
    city: 'Montréal',
    examType: 'TCF Canada',
    expectedDate: '2026-05-15',
    confidence: 'estimated',
    notes: 'Based on session announcement patterns',
  },
  {
    platformId: 'af-vancouver',
    platformName: 'Alliance Française de Vancouver',
    city: 'Vancouver',
    examType: 'TEF Canada',
    expectedDate: '2026-05-10',
    confidence: 'estimated',
    notes: 'Next session expected mid-May',
  },
]

// ----------------------------
// Audit Logs
// ----------------------------

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    userId: DEMO_USER.id,
    eventType: 'notification_viewed',
    platformId: 'af-vancouver',
    ruleId: 'rule-002',
    createdAt: '2026-04-20T13:55:00Z',
  },
  {
    id: 'audit-002',
    userId: DEMO_USER.id,
    eventType: 'official_page_opened',
    platformId: 'af-vancouver',
    ruleId: 'rule-002',
    createdAt: '2026-04-20T13:55:30Z',
  },
  {
    id: 'audit-003',
    userId: DEMO_USER.id,
    eventType: 'autofill_attempted',
    platformId: 'af-vancouver',
    metadata: { fieldsAttempted: 9, fieldsFilled: 9 },
    createdAt: '2026-04-20T13:56:00Z',
  },
  {
    id: 'audit-004',
    userId: DEMO_USER.id,
    eventType: 'autofill_succeeded',
    platformId: 'af-vancouver',
    metadata: { fieldsFilled: 9, missingFields: [] },
    createdAt: '2026-04-20T13:56:01Z',
  },
]

// ----------------------------
// Helper: get latest observation for a platform
// ----------------------------

export function getLatestObservation(platformId: string): SeatObservation | undefined {
  return MOCK_OBSERVATIONS.find((o) => o.platformId === platformId)
}

// ----------------------------
// Helper: get unread notification count
// ----------------------------

export function getUnreadCount(): number {
  return MOCK_NOTIFICATIONS.filter((n) => !n.isViewed).length
}
