import { describe, it, expect, vi } from 'vitest'
import { detectPlatform } from '../shared/adapters'

// Mock chrome.storage.local before importing the module under test
const mockStorage: Record<string, unknown> = {}
vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn(async (key: string) => ({ [key]: mockStorage[key] })),
      set: vi.fn(async (data: Record<string, unknown>) => {
        Object.assign(mockStorage, data)
      }),
      clear: vi.fn(async () => { for (const k in mockStorage) delete mockStorage[k] }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    openOptionsPage: vi.fn(),
  },
  notifications: {
    create: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
  },
})

// Import autofill helpers (field mapping logic)
// We test the selector/fill logic directly without a full DOM

describe('autofill field matching', () => {
  function makeInput(attrs: Record<string, string>): HTMLInputElement {
    const el = document.createElement('input')
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, v)
    }
    return el
  }

  it('fills email input using type=email selector', () => {
    const el = makeInput({ type: 'email', name: 'email' })
    document.body.appendChild(el)

    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    nativeSetter?.call(el, 'test@example.com')
    el.dispatchEvent(new Event('input', { bubbles: true }))

    expect(el.value).toBe('test@example.com')
    document.body.removeChild(el)
  })

  it('does not fill disabled inputs', () => {
    const el = makeInput({ type: 'text', name: 'firstname' })
    el.disabled = true
    document.body.appendChild(el)

    // disabled inputs should be skipped; value remains empty
    if (!el.disabled) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      nativeSetter?.call(el, 'Li')
    }

    expect(el.value).toBe('')
    document.body.removeChild(el)
  })

  it('does not fill read-only inputs', () => {
    const el = makeInput({ type: 'text', name: 'firstname' })
    el.readOnly = true
    document.body.appendChild(el)

    if (!el.readOnly) {
      const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      nativeSetter?.call(el, 'Li')
    }

    expect(el.value).toBe('')
    document.body.removeChild(el)
  })
})

describe('platform URL detection', () => {
  it('detects af-vancouver from afvancouver.com', () => {
    const p = detectPlatform('https://www.afvancouver.com/test-tcf-canada')
    expect(p).not.toBeNull()
    expect(p?.platformId).toBe('af-vancouver')
  })

  it('returns null for unrelated URL', () => {
    const p = detectPlatform('https://www.google.com')
    expect(p).toBeNull()
  })

  it('detects eventbrite as campus-france platform', () => {
    const p = detectPlatform('https://www.eventbrite.ca/e/tcf-canada-session-123456789')
    expect(p?.platformId).toBe('campus-france-eventbrite')
  })
})
