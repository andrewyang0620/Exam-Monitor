/**
 * Content script — runs on supported exam registration pages
 *
 * Responsibilities:
 * 1. Detect which platform we're on via URL matching
 * 2. Determine if this is a registration/booking page
 * 3. Inject the floating autofill panel if autofill is supported
 * 4. Execute autofill field mapping when the user clicks "Autofill"
 * 5. Never read or transmit form data — only writes to input fields
 *
 * Privacy boundary: This script only WRITES to form fields.
 * It never reads submitted form data or sends anything externally.
 */

import type { ExtensionMessage } from '../shared/types'
import type { LocalProfileTemplate } from '@tcf-tracker/types'
import { detectPlatform, isRegistrationPage } from '../shared/adapters'

// ─── Platform detection ───────────────────────────────────────────────────────

const currentUrl = window.location.href
const platform = detectPlatform(currentUrl)

// Not a monitored platform — do nothing
if (!platform) {
  // eslint-disable-next-line no-constant-condition
  null // no-op
} else {
  const onRegistrationPage = isRegistrationPage(platform, currentUrl)
  notifyBackground(platform.platformId, currentUrl)

  if (platform.autofillSupported && onRegistrationPage) {
    injectPanel()
  }
}

// ─── Background notification ──────────────────────────────────────────────────

function notifyBackground(platformId: string, url: string) {
  const msg: ExtensionMessage = { type: 'PAGE_DETECTED', payload: { platformId, url } }
  chrome.runtime.sendMessage(msg).catch(() => { /* extension may be reloading */ })
}

// ─── Panel injection ──────────────────────────────────────────────────────────

function injectPanel() {
  // Prevent double injection
  if (document.getElementById('esm-panel-root')) return

  const root = document.createElement('div')
  root.id = 'esm-panel-root'
  document.body.appendChild(root)

  const shadow = root.attachShadow({ mode: 'open' })

  // Fetch profile from background/storage
  const msg: ExtensionMessage = { type: 'GET_PROFILE' }
  chrome.runtime.sendMessage(msg, (res) => {
    const profile: LocalProfileTemplate | null = res?.payload ?? null
    shadow.innerHTML = buildPanelHTML(profile)
    attachPanelListeners(shadow, profile)
  })
}

// ─── Panel HTML ───────────────────────────────────────────────────────────────

function buildPanelHTML(profile: LocalProfileTemplate | null): string {
  const hasProfile = !!profile?.firstName

  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      #panel {
        width: 280px;
        background: #0A1628;
        border-radius: 16px;
        padding: 0;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      .header {
        padding: 12px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .header-left { display: flex; align-items: center; gap: 8px; }
      .logo {
        width: 26px; height: 26px; border-radius: 6px;
        background: #2563EB;
        display: flex; align-items: center; justify-content: center;
      }
      .name { font-size: 12px; font-weight: 700; color: #FFFFFF; }
      .sub { font-size: 10px; color: #94A3B8; margin-top: 1px; }
      .dismiss {
        background: none; border: none; cursor: pointer;
        color: #94A3B8; font-size: 14px; padding: 2px 4px; border-radius: 4px;
      }
      .dismiss:hover { background: rgba(255,255,255,0.1); }
      .body { background: #FFFFFF; padding: 14px; }
      .profile-line {
        font-size: 11px; color: #334155; margin-bottom: 10px;
        padding: 8px 10px; background: #F8FAFC; border-radius: 8px;
        border: 1px solid #E2E8F0;
      }
      .profile-line strong { color: #1E40AF; }
      .warn {
        font-size: 11px; color: #B45309; background: #FFFBEB;
        border: 1px solid #FDE68A; border-radius: 8px; padding: 8px 10px;
        margin-bottom: 10px; line-height: 1.5;
      }
      .btn-fill {
        width: 100%; padding: 9px 0; background: #2563EB; color: #FFFFFF;
        border: none; border-radius: 8px; font-size: 12px; font-weight: 700;
        cursor: pointer; margin-bottom: 6px;
      }
      .btn-fill:hover { background: #1D4ED8; }
      .btn-fill:disabled { background: #93C5FD; cursor: not-allowed; }
      .btn-settings {
        width: 100%; padding: 7px 0; background: transparent; color: #64748B;
        border: 1px solid #E2E8F0; border-radius: 8px; font-size: 11px;
        cursor: pointer;
      }
      .btn-settings:hover { background: #F8FAFC; }
      .result {
        font-size: 11px; padding: 7px 10px; border-radius: 8px; margin-top: 8px;
        display: none;
      }
      .result.success { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
      .result.error { background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; }
      .disclaimer {
        font-size: 9px; color: #94A3B8; text-align: center;
        margin-top: 8px; line-height: 1.5;
      }
    </style>
    <div id="panel">
      <div class="header">
        <div class="header-left">
          <div class="logo">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <div class="name">ExamSeat Monitor</div>
            <div class="sub">Autofill assistant</div>
          </div>
        </div>
        <button class="dismiss" id="esm-dismiss" title="Dismiss">✕</button>
      </div>
      <div class="body">
        ${hasProfile
          ? `<div class="profile-line">Autofilling as <strong>${profile!.firstName} ${profile!.lastName}</strong></div>`
          : `<div class="warn">⚠️ Profile incomplete. <a href="#" id="esm-open-settings" style="color:#2563EB;font-weight:600;">Complete your profile</a> to enable autofill.</div>`
        }
        <div class="warn" style="margin-bottom: 10px;">
          ⚠️ Review all fields before submitting. Autofill does not guarantee accuracy.
        </div>
        <button class="btn-fill" id="esm-autofill" ${!hasProfile ? 'disabled' : ''}>
          Autofill My Info
        </button>
        <button class="btn-settings" id="esm-settings">Edit Profile / Settings</button>
        <div class="result" id="esm-result"></div>
        <p class="disclaimer">Final registration &amp; payment are your responsibility.<br/>Your data stays on this device only.</p>
      </div>
    </div>
  `
}

// ─── Panel event listeners ────────────────────────────────────────────────────

function attachPanelListeners(shadow: ShadowRoot, profile: LocalProfileTemplate | null) {
  shadow.getElementById('esm-dismiss')?.addEventListener('click', () => {
    document.getElementById('esm-panel-root')?.remove()
    chrome.runtime.sendMessage({ type: 'DISMISS_PANEL' } satisfies ExtensionMessage)
  })

  shadow.getElementById('esm-settings')?.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  shadow.getElementById('esm-open-settings')?.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.runtime.openOptionsPage()
  })

  shadow.getElementById('esm-autofill')?.addEventListener('click', () => {
    if (!profile) return
    const btn = shadow.getElementById('esm-autofill') as HTMLButtonElement
    btn.disabled = true
    btn.textContent = 'Filling...'

    const result = autofillPage(profile)

    const resultEl = shadow.getElementById('esm-result') as HTMLDivElement
    resultEl.style.display = 'block'
    if (result.filled > 0) {
      resultEl.className = 'result success'
      resultEl.textContent = `✓ Filled ${result.filled} field${result.filled !== 1 ? 's' : ''}. ${result.skipped > 0 ? `${result.skipped} skipped.` : ''} Review before submitting.`
      btn.textContent = `✓ Done — ${result.filled} fields filled`
    } else {
      resultEl.className = 'result error'
      resultEl.textContent = 'No fillable fields found on this page. Try navigating to the registration form.'
      btn.disabled = false
      btn.textContent = 'Autofill My Info'
    }
  })
}

// ─── Autofill logic ───────────────────────────────────────────────────────────
// Uses a priority-ordered list of selectors per field.
// Never reads or transmits any data. Only writes to inputs the user can see.

interface FieldMapping {
  selectors: string[]
  getValue: (profile: LocalProfileTemplate) => string
}

const FIELD_MAPPINGS: FieldMapping[] = [
  {
    selectors: [
      'input[name*="first" i][name*="name" i]',
      'input[autocomplete="given-name"]',
      'input[placeholder*="first name" i]',
      'input[id*="first" i][id*="name" i]',
      'input[name="fname"]',
      'input[name="firstname"]',
    ],
    getValue: (p) => p.firstName ?? '',
  },
  {
    selectors: [
      'input[name*="last" i][name*="name" i]',
      'input[autocomplete="family-name"]',
      'input[placeholder*="last name" i]',
      'input[id*="last" i][id*="name" i]',
      'input[name="lname"]',
      'input[name="lastname"]',
    ],
    getValue: (p) => p.lastName ?? '',
  },
  {
    selectors: [
      'input[type="email"]',
      'input[name*="email" i]',
      'input[autocomplete="email"]',
      'input[placeholder*="email" i]',
    ],
    getValue: (p) => p.email ?? '',
  },
  {
    selectors: [
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[autocomplete="tel"]',
      'input[placeholder*="phone" i]',
    ],
    getValue: (p) => p.phone ?? '',
  },
  {
    selectors: [
      'input[type="date"][name*="birth" i]',
      'input[name*="dob" i]',
      'input[name*="birth" i]',
      'input[autocomplete="bday"]',
      'input[placeholder*="birth" i]',
    ],
    getValue: (p) => p.dateOfBirth ?? '',
  },
  {
    selectors: [
      'input[name*="address" i]',
      'input[autocomplete="street-address"]',
      'input[placeholder*="address" i]',
    ],
    getValue: (p) => p.address ?? '',
  },
  {
    selectors: [
      'input[name*="city" i]',
      'input[autocomplete="address-level2"]',
      'input[placeholder*="city" i]',
    ],
    getValue: (p) => p.city ?? '',
  },
  {
    selectors: [
      'input[name*="postal" i]',
      'input[name*="zip" i]',
      'input[autocomplete="postal-code"]',
      'input[placeholder*="postal" i]',
    ],
    getValue: (p) => p.postalCode ?? '',
  },
]

function autofillPage(profile: LocalProfileTemplate): { filled: number; skipped: number } {
  let filled = 0
  let skipped = 0

  for (const mapping of FIELD_MAPPINGS) {
    const value = mapping.getValue(profile)
    if (!value) {
      skipped++
      continue
    }

    let didFill = false
    for (const selector of mapping.selectors) {
      const el = document.querySelector<HTMLInputElement>(selector)
      if (el && !el.disabled && !el.readOnly && el.offsetParent !== null) {
        // Use native input value setter to trigger React/Vue/Svelte event listeners
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
        nativeInputValueSetter?.call(el, value)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
        filled++
        didFill = true
        break
      }
    }

    if (!didFill) skipped++
  }

  return { filled, skipped }
}
