/**
 * Background service worker — MV3
 *
 * Responsibilities:
 * - Message router between popup, options, content script
 * - Alarm-based monitoring loop (every 5 min) — polls the real backend
 * - Chrome notification dispatch when a seat status change is detected
 * - Stateful runtime state management via chrome.storage.local
 *
 * Privacy: This worker polls the backend's public /api/latest-event endpoint.
 * No exam portal pages are fetched directly from the extension.
 */

import type { ExtensionMessage, LatestAlert } from '../shared/types'
import { storage } from '../shared/storage'
import { computeProfileCompletion } from '@tcf-tracker/utils'
import type { LocalProfileTemplate } from '@tcf-tracker/types'

const ALARM_NAME = 'esm-check'
const CHECK_INTERVAL_MINUTES = 5

// Base URL of the web app — keep in sync with your deployment
const APP_BASE_URL = 'https://examseats.app'
const AF_VANCOUVER_REGISTRATION_URL =
  'https://www.alliancefrancaise.ca/products/ciep-tcf-canada-full-exam/'

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

// ─── Alarm handler — real backend polling ─────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return

  const now = new Date().toISOString()
  const profile = await storage.getProfile()
  const profilePct = profile ? computeProfileCompletion(profile) : 0
  const currentState = await storage.getState()

  let latestAlert: LatestAlert | null = currentState.latestAlert ?? null

  try {
    // Poll the public latest-event endpoint (no auth required)
    const res = await fetch(`${APP_BASE_URL}/api/latest-event`, {
      cache: 'no-store',
    })

    if (res.ok) {
      const json = await res.json() as {
        event?: {
          id: string
          platform_id: string
          exam_type: string
          city: string
          center_name: string
          new_status: string
          detected_at: string
        } | null
        observation?: {
          seats_text: string | null
        } | null
      }

      const event = json.event ?? null
      const lastSeenId = latestAlert?.id ?? null

      // Only alert if this is a new OPEN event we haven't seen yet
      if (event && event.id !== lastSeenId && event.new_status === 'OPEN') {
        const dismissed = await storage.getDismissedAlerts()
        if (!dismissed.includes(event.id)) {
          const officialUrl =
            event.platform_id === 'af-vancouver'
              ? AF_VANCOUVER_REGISTRATION_URL
              : APP_BASE_URL + '/dashboard'

          latestAlert = {
            id: event.id,
            platformId: event.platform_id,
            platformName: event.center_name,
            examType: event.exam_type as LatestAlert['examType'],
            city: event.city,
            detectedAt: event.detected_at,
            officialUrl,
          }

          chrome.notifications.create('esm-alert-' + Date.now(), {
            type: 'basic',
            iconUrl: '../../../icons/icon-48.png',
            title: '🟢 Exam seats available!',
            message: `${event.center_name} — ${event.exam_type} seats just opened.`,
            priority: 2,
          })

          await storage.saveState({
            lastCheckAt: now,
            isMonitoring: true,
            latestAlert,
            profileCompletion: profilePct,
            unreadCount: (currentState.unreadCount ?? 0) + 1,
          })
          return
        }
      }
    }
  } catch (err) {
    // Network error — keep existing state, log silently
    console.error('[ESM background] poll failed', err)
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
