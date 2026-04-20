import type { LocalProfileTemplate, ExamType } from '@tcf-tracker/types'

// Messages between popup/options ↔ background ↔ content script
export type ExtensionMessage =
  | { type: 'GET_STATE' }
  | { type: 'STATE_RESPONSE'; payload: ExtensionRuntimeState }
  | { type: 'GET_PROFILE' }
  | { type: 'PROFILE_RESPONSE'; payload: LocalProfileTemplate | null }
  | { type: 'SAVE_PROFILE'; payload: LocalProfileTemplate }
  | { type: 'SAVE_PROFILE_OK' }
  | { type: 'TRIGGER_AUTOFILL'; payload: { fieldMap: Record<string, string> } }
  | { type: 'AUTOFILL_DONE'; payload: { filled: number; skipped: number } }
  | { type: 'AUTOFILL_ERROR'; payload: { error: string } }
  | { type: 'PAGE_DETECTED'; payload: { platformId: string; url: string } }
  | { type: 'DISMISS_PANEL' }
  | { type: 'CLEAR_DATA' }
  | { type: 'CLEAR_DATA_OK' }

export interface ExtensionRuntimeState {
  isMonitoring: boolean
  lastCheckAt: string | null
  latestAlert: LatestAlert | null
  profileCompletion: number
  unreadCount: number
}

export interface LatestAlert {
  id: string
  platformId: string
  platformName: string
  examType: ExamType
  city: string
  detectedAt: string
  officialUrl: string
}

// Platform URL patterns for content script matching
export interface PlatformUrlPattern {
  platformId: string
  displayName: string
  patterns: RegExp[]
  registrationUrls: RegExp[]
  autofillSupported: boolean
}
