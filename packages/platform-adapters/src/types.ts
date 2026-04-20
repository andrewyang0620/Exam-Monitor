import type {
  ExamType,
  DetectionMode,
  ReleaseWindow,
  ConfidenceRule,
  AutofillFieldMap,
  RiskLevel,
  AvailabilityStatus,
} from '@tcf-tracker/types'

// ----------------------------
// Full Platform Adapter Type
// (used in packages layer, more detailed than UI Platform type)
// ----------------------------

export interface PlatformAdapter {
  // Identity
  id: string
  displayName: string
  shortName: string
  logoUrl?: string

  // Geography
  city: string
  province: string
  country: string
  region?: string

  // Exam types
  examTypesSupported: ExamType[]

  // URLs
  entryUrl: string
  monitoringUrl?: string        // Defaults to entryUrl if not set

  // Detection strategy
  detectionMode: DetectionMode
  authRequiredForMonitoring: boolean

  // Monitoring config
  recommendedPollingIntervalSec: number
  cooldownSeconds: number

  // Availability signals
  availabilitySelectors?: string[]
  availabilityKeywords: string[]
  soldOutKeywords: string[]

  // Release windows (V1.5 scaffold — define but don't enforce scheduling in V1)
  fixedReleaseWindows: ReleaseWindow[]

  // Confidence scoring
  confidenceRules: ConfidenceRule[]

  // Extension autofill
  supportsLocalAutofill: boolean
  supportsJumpToOfficialPage: boolean
  contentScriptUrlPatterns: string[]
  autofillFieldMap?: AutofillFieldMap

  // Meta
  riskLevel: RiskLevel
  notes?: string
  lastVerified?: string         // ISO date

  // Mock data for V1 demo
  demoCurrentStatus?: AvailabilityStatus
  demoSeatsText?: string
}

export type AdapterRegistry = Record<string, PlatformAdapter>
