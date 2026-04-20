'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { AlertBanner } from '@/components/dashboard/AlertBanner'
import { MonitoredExamsList } from '@/components/dashboard/MonitoredExamsList'
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel'
import { UpcomingWindows } from '@/components/dashboard/UpcomingWindows'
import { SupportedPlatformsSection } from '@/components/dashboard/SupportedPlatformsSection'
import {
  MOCK_STATS,
  MOCK_RULES,
  MOCK_OBSERVATIONS,
  MOCK_NOTIFICATIONS,
  MOCK_UPCOMING_WINDOWS,
  MOCK_PLATFORMS,
  MOCK_CHANGE_EVENTS,
  DEMO_USER,
} from '@/lib/mock-data'

export default function DashboardPage() {
  const [alertDismissed, setAlertDismissed] = useState(false)

  // The "live" alert — AF Vancouver TEF Canada is OPEN right now
  const liveAlert = !alertDismissed
    ? MOCK_CHANGE_EVENTS.find((e) => e.newStatus === 'OPEN')
    : undefined

  const displayName = DEMO_USER.displayName?.split(' ')[0] ?? 'there'

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="Dashboard"
        subtitle={`Welcome back, ${displayName}`}
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Live alert banner */}
        {liveAlert && (
          <AlertBanner
            event={liveAlert}
            onDismiss={() => setAlertDismissed(true)}
          />
        )}

        {/* Stats row */}
        <StatsCards stats={MOCK_STATS} />

        {/* Main content: 2-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left: Monitored exams */}
          <MonitoredExamsList
            rules={MOCK_RULES}
            observations={MOCK_OBSERVATIONS}
          />

          {/* Right: Notifications panel */}
          <NotificationsPanel notifications={MOCK_NOTIFICATIONS} />
        </div>

        {/* Upcoming release windows */}
        <UpcomingWindows windows={MOCK_UPCOMING_WINDOWS} />

        {/* Supported platforms preview */}
        <SupportedPlatformsSection platforms={MOCK_PLATFORMS} />

        {/* Privacy notice */}
        <div className="bg-slate-900 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-8 h-8 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
            <span className="text-slate-300 text-sm">🔒</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Privacy Boundaries</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ExamSeat Monitor only tracks <span className="text-slate-300 font-medium">publicly available seat information</span>.
              Your autofill profile is stored <span className="text-slate-300 font-medium">locally in your browser extension only</span> — never in the cloud.
              Payment information is <span className="text-slate-300 font-medium">never touched</span> by this system.
              Final registration always requires <span className="text-slate-300 font-medium">your manual confirmation</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
