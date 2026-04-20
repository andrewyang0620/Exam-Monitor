/**
 * Background service worker — MV3
 *
 * Responsibilities:
 * - Message router between popup, options, content script
 * - Alarm-based mock monitoring loop (every 5 min in V1)
 * - Chrome notification dispatch when a seat status change is detected
 * - Stateful runtime state management via chrome.storage.local
 *
 * Privacy: This worker never makes HTTP requests to exam portals directly.
 * In V1, monitoring is simulated (mock data). In V2+, a cloud monitoring
 * service sends push notifications; the worker only receives them.
 */

import type { ExtensionMessage, LatestAlert } from '../shared/types'
import { storage } from '../shared/storage'
import { computeProfileCompletion } from '@tcf-tracker/utils'
import type { LocalProfileTemplate } from '@tcf-tracker/types'

const ALARM_NAME = 'esm-mock-check'
const CHECK_INTERVAL_MINUTES = 5

// ─── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  await storage.saveState({
    isMonitoring: true,
    lastCheckAt: null,
    latestAlert: null,
    profileCompletion: 0,
    unreadCount: 0,
  })

  // Register alarm for periodic mock check
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CHECK_INTERVAL_MINUTES,
    delayInMinutes: 1,
  })
})

// ─── Alarm handler — mock monitoring ─────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return

  const now = new Date().toISOString()
  const profile = await storage.getProfile()
  const profilePct = profile ? computeProfileCompletion(profile) : 0

  // Mock: simulate an OPEN alert from AF Vancouver ~20% of the time in demo
  const shouldAlert = Math.random() < 0.2
  let latestAlert: LatestAlert | null = null

  if (shouldAlert) {
    const dismissed = await storage.getDismissedAlerts()
    const mockAlertId = 'mock-af-vancouver-open'

    if (!dismissed.includes(mockAlertId)) {
      latestAlert = {
        id: mockAlertId,
        platformId: 'af-vancouver',
        platformName: 'Alliance Française Vancouver',
        examType: 'TCF Canada',
        city: 'Vancouver',
        detectedAt: now,
        officialUrl: 'https://www.afvancouver.com/test-tcf-canada',
      }

      // Send a Chrome notification
      chrome.notifications.create('esm-alert-' + Date.now(), {
        type: 'basic',
        iconUrl: '../../../icons/icon-48.png',
        title: '🟢 Exam seats available!',
        message: `Alliance Française Vancouver — TCF Canada seats just opened.`,
        priority: 2,
      })

      await storage.saveState({
        lastCheckAt: now,
        isMonitoring: true,
        latestAlert,
        profileCompletion: profilePct,
        unreadCount: 1,
      })
      return
    }
  }

  await storage.saveState({
    lastCheckAt: now,
    isMonitoring: true,
    latestAlert,
    profileCompletion: profilePct,
  })
})

// ─── Message router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    handleMessage(message).then(sendResponse).catch((err) => {
      console.error('[ESM background] message error', err)
      sendResponse(null)
    })
    return true // keep channel open for async
  }
)

async function handleMessage(msg: ExtensionMessage): Promise<unknown> {
  switch (msg.type) {
    case 'GET_STATE': {
      const state = await storage.getState()
      return { type: 'STATE_RESPONSE', payload: state }
    }

    case 'GET_PROFILE': {
      const profile = await storage.getProfile()
      return { type: 'PROFILE_RESPONSE', payload: profile }
    }

    case 'SAVE_PROFILE': {
      await storage.saveProfile(msg.payload as LocalProfileTemplate)
      const pct = computeProfileCompletion(msg.payload as LocalProfileTemplate)
      await storage.saveState({ profileCompletion: pct })
      return { type: 'SAVE_PROFILE_OK' }
    }

    case 'DISMISS_PANEL': {
      const state = await storage.getState()
      if (state.latestAlert) {
        await storage.dismissAlert(state.latestAlert.id)
        await storage.saveState({ latestAlert: null, unreadCount: 0 })
      }
      return null
    }

    case 'CLEAR_DATA': {
      await storage.clearAll()
      return { type: 'CLEAR_DATA_OK' }
    }

    case 'PAGE_DETECTED': {
      // Log platform detection — could be used for analytics in V2
      // Privacy: we deliberately do not log the full URL
      return null
    }

    default:
      return null
  }
}

// ─── Notification click → open official page ──────────────────────────────────

chrome.notifications.onClicked.addListener(async (notifId) => {
  if (!notifId.startsWith('esm-alert-')) return
  const state = await storage.getState()
  if (state.latestAlert?.officialUrl) {
    chrome.tabs.create({ url: state.latestAlert.officialUrl })
  }
})
