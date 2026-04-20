import React, { useEffect, useState } from 'react'
import type { ExtensionRuntimeState } from '../shared/types'
import type { LocalProfileTemplate } from '@tcf-tracker/types'
import { computeProfileCompletion } from '@tcf-tracker/utils'

const COLORS = {
  navy: '#0A1628',
  blue: '#2563EB',
  emerald: '#059669',
  amber: '#D97706',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate700: '#334155',
  slate900: '#0F172A',
  white: '#FFFFFF',
  bgLight: '#F8FAFC',
}

function dot(color: string, pulse = false) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
        animation: pulse ? 'pulse 2s ease-in-out infinite' : 'none',
      }}
    />
  )
}

function ProfileBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? COLORS.emerald : pct >= 40 ? COLORS.amber : '#EF4444'
  return (
    <div style={{ height: 4, borderRadius: 2, background: '#E2E8F0', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width 0.4s ease' }} />
    </div>
  )
}

export default function Popup() {
  const [state, setState] = useState<ExtensionRuntimeState | null>(null)
  const [profile, setProfile] = useState<LocalProfileTemplate | null>(null)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATE' }, (res) => {
      if (res?.payload) setState(res.payload)
    })
    chrome.runtime.sendMessage({ type: 'GET_PROFILE' }, (res) => {
      if (res?.payload) setProfile(res.payload)
    })
  }, [])

  const profilePct = profile ? computeProfileCompletion(profile) : (state?.profileCompletion ?? 0)
  const hasAlert = !!state?.latestAlert

  const openDashboard = () => {
    chrome.tabs.create({ url: 'https://examseats.app/dashboard' })
    window.close()
  }

  const openOptions = () => {
    chrome.runtime.openOptionsPage()
    window.close()
  }

  const openOfficialPage = () => {
    if (state?.latestAlert?.officialUrl) {
      chrome.tabs.create({ url: state.latestAlert.officialUrl })
      window.close()
    }
  }

  return (
    <div style={{ background: COLORS.white, color: COLORS.slate900 }}>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        button:hover { opacity: 0.85; }
        button:active { opacity: 0.7; }
      `}</style>

      {/* Header */}
      <div style={{ background: COLORS.navy, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>ExamSeat Monitor</div>
          <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 1 }}>TEF / TCF Canada</div>
        </div>
        {state && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {dot(state.isMonitoring ? COLORS.emerald : COLORS.slate400, state.isMonitoring)}
            <span style={{ fontSize: 10, color: '#94A3B8' }}>
              {state.isMonitoring ? 'Active' : 'Idle'}
            </span>
          </div>
        )}
      </div>

      {/* Alert banner */}
      {hasAlert && state?.latestAlert && (
        <div style={{ background: '#ECFDF5', borderBottom: '1px solid #A7F3D0', padding: '10px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            {dot(COLORS.emerald, true)}
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.emerald }}>Seats available!</span>
          </div>
          <div style={{ fontSize: 11, color: '#065F46', marginBottom: 8 }}>
            <strong>{state.latestAlert.platformName}</strong> · {state.latestAlert.examType} · {state.latestAlert.city}
          </div>
          <button
            onClick={openOfficialPage}
            style={{
              width: '100%',
              padding: '7px 0',
              background: COLORS.emerald,
              color: COLORS.white,
              border: 'none',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Open Official Page ↗
          </button>
        </div>
      )}

      {/* Profile completion */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: COLORS.slate500, fontWeight: 500 }}>Profile completeness</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: profilePct >= 80 ? COLORS.emerald : profilePct >= 40 ? COLORS.amber : '#EF4444' }}>
            {profilePct}%
          </span>
        </div>
        <ProfileBar pct={profilePct} />
        {profilePct < 60 && (
          <div style={{ fontSize: 10, color: COLORS.slate400, marginTop: 5 }}>
            Complete your profile for faster autofill →{' '}
            <button
              onClick={openOptions}
              style={{ background: 'none', border: 'none', color: COLORS.blue, fontSize: 10, cursor: 'pointer', fontWeight: 600, padding: 0 }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Status info */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
        {state?.lastCheckAt ? (
          <div style={{ fontSize: 11, color: COLORS.slate500 }}>
            Last check: <span style={{ color: COLORS.slate700, fontWeight: 500 }}>{new Date(state.lastCheckAt).toLocaleTimeString()}</span>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: COLORS.slate400 }}>Waiting for first check...</div>
        )}
        {state && state.unreadCount > 0 && (
          <div style={{ fontSize: 11, color: COLORS.slate500, marginTop: 3 }}>
            <span style={{ color: COLORS.blue, fontWeight: 600 }}>{state.unreadCount}</span> unread notification{state.unreadCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={openDashboard}
          style={{
            padding: '8px 0',
            background: COLORS.blue,
            color: COLORS.white,
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open Dashboard
        </button>
        <button
          onClick={openOptions}
          style={{
            padding: '7px 0',
            background: COLORS.bgLight,
            color: COLORS.slate700,
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Edit Profile / Settings
        </button>
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 16px 12px', textAlign: 'center' }}>
        <p style={{ fontSize: 9, color: COLORS.slate400, lineHeight: 1.5 }}>
          Registration &amp; payment are always done manually by you.
          <br />Your profile data stays on your device only.
        </p>
      </div>
    </div>
  )
}
