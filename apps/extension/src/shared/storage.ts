import type { LocalProfileTemplate } from '@tcf-tracker/types'
import type { ExtensionRuntimeState, LatestAlert } from './types'

const STORAGE_KEYS = {
  PROFILE: 'local_profile_template',
  STATE: 'extension_state',
  DISMISSED_ALERTS: 'dismissed_alerts',
} as const

// All storage is chrome.storage.local — nothing is synced externally
export const storage = {
  async getProfile(): Promise<LocalProfileTemplate | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.PROFILE)
    return (result[STORAGE_KEYS.PROFILE] as LocalProfileTemplate) ?? null
  },

  async saveProfile(profile: LocalProfileTemplate): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.PROFILE]: profile })
  },

  async getState(): Promise<ExtensionRuntimeState> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.STATE)
    return (result[STORAGE_KEYS.STATE] as ExtensionRuntimeState) ?? defaultState()
  },

  async saveState(state: Partial<ExtensionRuntimeState>): Promise<void> {
    const current = await storage.getState()
    await chrome.storage.local.set({
      [STORAGE_KEYS.STATE]: { ...current, ...state },
    })
  },

  async getDismissedAlerts(): Promise<string[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.DISMISSED_ALERTS)
    return (result[STORAGE_KEYS.DISMISSED_ALERTS] as string[]) ?? []
  },

  async dismissAlert(alertId: string): Promise<void> {
    const current = await storage.getDismissedAlerts()
    const updated = [...new Set([...current, alertId])]
    await chrome.storage.local.set({ [STORAGE_KEYS.DISMISSED_ALERTS]: updated })
  },

  async clearAll(): Promise<void> {
    await chrome.storage.local.clear()
  },
}

function defaultState(): ExtensionRuntimeState {
  return {
    isMonitoring: false,
    lastCheckAt: null,
    latestAlert: null,
    profileCompletion: 0,
    unreadCount: 0,
  }
}
