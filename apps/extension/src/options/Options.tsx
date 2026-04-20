import React, { useEffect, useState } from 'react'
import type { LocalProfileTemplate } from '@tcf-tracker/types'
import { computeProfileCompletion, getMissingProfileFields } from '@tcf-tracker/utils'
import { storage } from '../shared/storage'

const NAVY = '#0A1628'
const BLUE = '#2563EB'
const SLATE700 = '#334155'
const SLATE500 = '#64748B'
const SLATE400 = '#94A3B8'
const SLATE200 = '#E2E8F0'
const EMERALD = '#059669'
const RED = '#EF4444'
const WHITE = '#FFFFFF'

interface Field {
  key: keyof LocalProfileTemplate
  label: string
  placeholder: string
  type?: string
}

const FIELDS: Field[] = [
  { key: 'firstName', label: 'First name', placeholder: 'e.g. Li' },
  { key: 'lastName', label: 'Last name', placeholder: 'e.g. Ming' },
  { key: 'email', label: 'Email address', placeholder: 'you@example.com', type: 'email' },
  { key: 'phone', label: 'Phone number', placeholder: '+1 416 555 0100', type: 'tel' },
  { key: 'dateOfBirth', label: 'Date of birth', placeholder: 'YYYY-MM-DD', type: 'date' },
  { key: 'nationality', label: 'Nationality', placeholder: 'e.g. Chinese / Canadian PR' },
  { key: 'passportNumber', label: 'Passport / ID number', placeholder: 'Optional' },
  { key: 'address', label: 'Street address', placeholder: '123 Main St' },
  { key: 'city', label: 'City', placeholder: 'Toronto' },
  { key: 'province', label: 'Province', placeholder: 'ON' },
  { key: 'postalCode', label: 'Postal code', placeholder: 'M5V 2H1' },
  { key: 'nativeLanguage', label: 'Native language', placeholder: 'e.g. Mandarin' },
  { key: 'frenchLevel', label: 'French level', placeholder: 'e.g. B1, B2, intermediate' },
  { key: 'immigrationPurpose', label: 'Purpose', placeholder: 'e.g. Express Entry, PEQ, Study permit' },
]

function Label({ children }: { children: React.ReactNode }) {
  return <label style={{ fontSize: 12, fontWeight: 600, color: SLATE700, display: 'block', marginBottom: 5 }}>{children}</label>
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  type?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        height: 38,
        padding: '0 12px',
        border: `1px solid ${SLATE200}`,
        borderRadius: 8,
        fontSize: 13,
        color: SLATE700,
        background: WHITE,
        outline: 'none',
      }}
      onFocus={(e) => { e.target.style.borderColor = BLUE; e.target.style.boxShadow = `0 0 0 3px rgba(37,99,235,0.1)` }}
      onBlur={(e) => { e.target.style.borderColor = SLATE200; e.target.style.boxShadow = 'none' }}
    />
  )
}

function StatusMessage({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 8,
      background: type === 'success' ? '#ECFDF5' : '#FEF2F2',
      border: `1px solid ${type === 'success' ? '#A7F3D0' : '#FECACA'}`,
      color: type === 'success' ? '#065F46' : '#B91C1C',
      fontSize: 12,
      fontWeight: 500,
    }}>
      {text}
    </div>
  )
}

export default function Options() {
  const [profile, setProfile] = useState<Partial<LocalProfileTemplate>>({})
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    storage.getProfile().then((p) => {
      if (p) setProfile(p)
    })
  }, [])

  const completion = computeProfileCompletion(profile as LocalProfileTemplate)
  const missing = getMissingProfileFields(profile as LocalProfileTemplate)

  const handleSave = async () => {
    setSaving(true)
    setStatus(null)
    try {
      await storage.saveProfile(profile as LocalProfileTemplate)
      setStatus({ type: 'success', text: 'Profile saved locally. Data never leaves your device.' })
    } catch {
      setStatus({ type: 'error', text: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    await storage.clearAll()
    setProfile({})
    setConfirmClear(false)
    setStatus({ type: 'success', text: 'All local data cleared.' })
  }

  const update = (key: keyof LocalProfileTemplate, val: string) => {
    setProfile((prev) => ({ ...prev, [key]: val }))
  }

  const pctColor = completion >= 80 ? EMERALD : completion >= 40 ? '#D97706' : RED

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', padding: '0 0 48px' }}>
      {/* Header */}
      <div style={{ background: NAVY, padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: WHITE }}>ExamSeat Monitor</div>
          <div style={{ fontSize: 11, color: SLATE400 }}>Profile &amp; Settings</div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px' }}>
        {/* Profile completion card */}
        <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${SLATE200}`, padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: SLATE700 }}>Profile completeness</span>
            <span style={{ fontSize: 20, fontWeight: 700, color: pctColor }}>{completion}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: '#E2E8F0', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${completion}%`, background: pctColor, transition: 'width 0.4s' }} />
          </div>
          {missing.length > 0 && (
            <p style={{ fontSize: 11, color: SLATE500 }}>
              Fill in: <span style={{ color: SLATE700 }}>{missing.slice(0, 4).join(', ')}{missing.length > 4 ? ` +${missing.length - 4} more` : ''}</span>
            </p>
          )}
        </div>

        {/* Privacy notice */}
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
            <strong>🔒 Privacy guarantee:</strong> Your profile template is stored <strong>only in your browser</strong> using <code>chrome.storage.local</code>.
            It is never uploaded to any server. The extension reads this data to autofill forms locally.
            Final registration and payment remain entirely your responsibility.
          </p>
        </div>

        {/* Fields */}
        <div style={{ background: WHITE, borderRadius: 16, border: `1px solid ${SLATE200}`, padding: '24px', marginBottom: 20 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: SLATE700, marginBottom: 20 }}>
            Local Profile Template
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            {FIELDS.map(({ key, label, placeholder, type }) => (
              <div key={key} style={{ gridColumn: ['address', 'immigrationPurpose'].includes(key) ? 'span 2' : undefined }}>
                <Label>{label}</Label>
                <TextInput
                  value={(profile[key] as string) ?? ''}
                  onChange={(v) => update(key, v)}
                  placeholder={placeholder}
                  type={type}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Status message */}
        {status && <div style={{ marginBottom: 16 }}><StatusMessage type={status.type} text={status.text} /></div>}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            padding: '11px 0',
            background: saving ? '#93C5FD' : BLUE,
            color: WHITE,
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            marginBottom: 12,
          }}
        >
          {saving ? 'Saving...' : 'Save Profile Locally'}
        </button>

        {/* Clear data */}
        <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: `1px solid ${SLATE200}` }}>
          <p style={{ fontSize: 11, color: SLATE400, marginBottom: 8 }}>
            To remove all locally stored data (profile + alert history):
          </p>
          <button
            onClick={handleClear}
            style={{
              padding: '7px 20px',
              background: confirmClear ? RED : 'transparent',
              color: confirmClear ? WHITE : RED,
              border: `1px solid ${RED}`,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {confirmClear ? 'Click again to confirm — this is permanent' : 'Clear All Local Data'}
          </button>
          {confirmClear && (
            <button
              onClick={() => setConfirmClear(false)}
              style={{ marginLeft: 8, padding: '7px 16px', background: 'transparent', border: `1px solid ${SLATE200}`, borderRadius: 8, fontSize: 12, cursor: 'pointer', color: SLATE500 }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
