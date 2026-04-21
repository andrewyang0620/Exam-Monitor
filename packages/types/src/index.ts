// ============================================================
// Core Domain Types — ExamSeat Monitor
// ============================================================

// ----------------------------
// Enumerations
// ----------------------------

export type ExamType =
  | 'TEF'
  | 'TEF Canada'
  | 'TCF'
  | 'TCF Canada'
  | 'DELF'
  | 'DALF'
  | 'TCF SO'
  | 'TEF SO'

export type AvailabilityStatus =
  | 'OPEN'
  | 'NOT_OPEN'
  | 'MONITORING'
  | 'UNKNOWN'

export type ChangeEventType =
  | 'OPENED'
  | 'SOLD_OUT'
  | 'DATE_ADDED'
  | 'STATUS_CHANGED'
  | 'UNKNOWN_CHANGE'

export type NotificationChannel = 'browser' | 'email' | 'sms'

export type DetectionMode =
  | 'html'
  | 'json-xhr'
  | 'eventbrite-link'
  | 'manual-only'

export type MonitoringLayer = 'L1' | 'L2'

export type PlatformHealthStatus =
  | 'operational'
  | 'degraded'
  | 'down'
  | 'unknown'

export type RiskLevel = 'low' | 'medium' | 'high'

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed'

export type RulePriority = 1 | 2 | 3 // 1 = highest

// ----------------------------
// Core Observation Model
// ----------------------------

export interface SeatObservation {
  id: string
  platformId: string
  centerName: string
  city: string
  province: string
  examType: ExamType
  sessionDate?: string           // ISO date: "2026-06-15"
  sessionLabel?: string          // "Spring 2026 Session"
  availabilityStatus: AvailabilityStatus
  seatsText?: string             // Raw text: "3 spots remaining"
  observedAt: string             // ISO timestamp
  sourceHash: string             // MD5 of relevant content section
  confidence: number             // 0.0 to 1.0
  // Informational fields — stored in metadata jsonb
  nextWindowText?: string        // e.g. "First week of June 2026"
  upcomingSessionLabels?: string[] // e.g. ["3rd trimester of 2026"]
  soldOutSessionLabels?: string[]  // e.g. ["April 2026", "June 2026"]
  metadata?: Record<string, unknown>
}

export interface ChangeEvent {
  id: string
  platformId: string
  ruleId?: string
  previousStatus: AvailabilityStatus
  newStatus: AvailabilityStatus
  eventType: ChangeEventType
  detectedAt: string             // ISO timestamp
  confidence: number
  deliveredChannels: NotificationChannel[]
  rawObservationRef: string
  // Denormalized for display
  centerName?: string
  examType?: ExamType
  city?: string
}

// ----------------------------
// User & Rules
// ----------------------------

export interface User {
  id: string
  email: string
  displayName?: string
  createdAt: string
}

export interface MonitoringRule {
  id: string
  userId: string
  platformId: string
  examType: ExamType
  city?: string
  datePreference?: string       // "any" | "2026-Q2" | "2026-06"
  channels: NotificationChannel[]
  priority: RulePriority
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Denormalized for display
  platformDisplayName?: string
  lastObservation?: SeatObservation
  lastAlert?: ChangeEvent
}

export interface UserPreferences {
  userId: string
  defaultChannels: NotificationChannel[]
  timezone: string
  language: 'zh' | 'en' | 'fr'
  emailDigestEnabled: boolean
  smsEnabled: boolean
  updatedAt: string
}

// ----------------------------
// Notifications
// ----------------------------

export interface NotificationDelivery {
  id: string
  userId: string
  changeEventId: string
  channel: NotificationChannel
  status: NotificationDeliveryStatus
  sentAt?: string
  errorMessage?: string
  // Denormalized
  event?: ChangeEvent
  isViewed?: boolean
}

// ----------------------------
// Platform / Adapter
// ----------------------------

export interface ReleaseWindow {
  label: string
  dayOfWeek?: number            // 0=Sun, 1=Mon, ..., 6=Sat
  dayOfMonth?: number           // 1-31
  timeUtc?: string              // 'HH:MM'
  timezone?: string             // 'America/Toronto'
  notes?: string
  nextExpectedDate?: string     // ISO date
}

export interface ConfidenceRule {
  condition: string
  confidenceBoost: number       // -0.3 to +0.3
}

export interface AutofillFieldMap {
  fullName?: string
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
}

export interface PlatformMonitoringCapability {
  level: 'full' | 'partial' | 'limited' | 'none'
  detectionMode: DetectionMode
  requiresAuth: boolean
  pollingIntervalSec: number
}

export interface PlatformAutofillCapability {
  supported: boolean
  level: 'full' | 'partial' | 'limited' | 'none'
  fieldsCount?: number
}

// This is the lightweight display-facing version used in UI
export interface Platform {
  id: string
  displayName: string
  shortName: string
  city: string
  province: string
  country: string
  examTypesSupported: ExamType[]
  entryUrl: string
  monitoring: PlatformMonitoringCapability
  autofill: PlatformAutofillCapability
  healthStatus: PlatformHealthStatus
  lastHealthCheck?: string
  fixedReleaseWindows?: ReleaseWindow[]
  riskLevel: RiskLevel
  notes?: string
}

export interface PlatformHealthCheck {
  id: string
  platformId: string
  checkedAt: string
  isReachable: boolean
  responseTimeMs?: number
  httpStatus?: number
  notes?: string
}

// ----------------------------
// Audit Log
// ----------------------------

export type AuditEventType =
  | 'rule_created'
  | 'rule_updated'
  | 'rule_deleted'
  | 'notification_sent'
  | 'notification_viewed'
  | 'official_page_opened'
  | 'autofill_attempted'
  | 'autofill_succeeded'
  | 'autofill_failed'
  | 'local_data_cleared'

export interface AuditLog {
  id: string
  userId: string
  eventType: AuditEventType
  platformId?: string
  ruleId?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

// ----------------------------
// Extension Local Storage
// ----------------------------

export interface LocalProfileTemplate {
  fullName: string
  email: string
  phone: string
  dob: string               // "YYYY-MM-DD"
  addressLine1: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string           // Default: "Canada"
  idNumber?: string         // Optional, stored locally
  notes?: string
  updatedAt: string
}

export interface ExtensionState {
  isConnectedToCloud: boolean
  activeRulesCount: number
  openAlertsCount: number
  lastCheckAt?: string
  latestAlert?: ChangeEvent
  profileTemplate?: LocalProfileTemplate
  profileCompletionPct: number
  desktopNotificationsEnabled: boolean
}

// ----------------------------
// API Response Types
// ----------------------------

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: 'ok' | 'error'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ----------------------------
// Dashboard Stats
// ----------------------------

export interface DashboardStats {
  activeRulesCount: number
  openAlertsCount: number
  lastCheckAt?: string
  supportedPlatformsCount: number
  monitoredCitiesCount: number
  totalNotificationsSent: number
}

// ----------------------------
// Upcoming Windows (V1.5 Scaffold)
// ----------------------------

export interface UpcomingWindow {
  platformId: string
  platformName: string
  city: string
  examType: ExamType
  expectedDate: string          // ISO date
  confidence: 'confirmed' | 'estimated' | 'historical'
  notes?: string
}
