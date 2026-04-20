'use client'

import { useState, useEffect } from 'react'
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
import { supabase, isDemoMode } from '@/lib/supabase'
import type {
  MonitoringRule,
  SeatObservation,
  ChangeEvent,
  NotificationDelivery,
  DashboardStats,
} from '@tcf-tracker/types'
import type { DbRule, DbObservation, DbChangeEvent, DbNotificationWithEvent } from '@/lib/database.types'

// ─── DB → Domain type converters ─────────────────────────────────────────────

function toRule(r: DbRule): MonitoringRule {
  const platform = MOCK_PLATFORMS.find((p) => p.id === r.platform_id)
  return {
    id: r.id,
    userId: r.user_id,
    platformId: r.platform_id,
    examType: r.exam_type as MonitoringRule['examType'],
    city: r.city ?? r.platform_id,
    datePreference: r.date_preference ?? 'any',
    channels: r.channels as MonitoringRule['channels'],
    priority: (Math.min(3, Math.max(1, r.priority)) as 1 | 2 | 3),
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    platformDisplayName: platform?.displayName ?? r.platform_id,
  }
}

function toObservation(o: DbObservation): SeatObservation {
  return {
    id: o.id,
    platformId: o.platform_id,
    centerName: o.center_name,
    city: o.city,
    province: o.province ?? '',
    examType: o.exam_type as SeatObservation['examType'],
    sessionLabel: o.session_label ?? undefined,
    sessionDate: o.session_date ?? undefined,
    availabilityStatus: o.availability_status as SeatObservation['availabilityStatus'],
    seatsText: o.seats_text ?? undefined,
    observedAt: o.observed_at,
    sourceHash: o.source_hash ?? '',
    confidence: o.confidence ?? 1,
  }
}

function toChangeEvent(e: DbChangeEvent): ChangeEvent {
  return {
    id: e.id,
    platformId: e.platform_id,
    ruleId: undefined,
    previousStatus: (e.previous_status ?? 'UNKNOWN') as ChangeEvent['previousStatus'],
    newStatus: e.new_status as ChangeEvent['newStatus'],
    eventType: e.event_type as ChangeEvent['eventType'],
    detectedAt: e.detected_at,
    confidence: e.confidence ?? 1,
    deliveredChannels: [],
    rawObservationRef: e.raw_observation_id ?? '',
    centerName: e.center_name,
    examType: e.exam_type as ChangeEvent['examType'],
    city: e.city,
  }
}

function toNotification(n: DbNotificationWithEvent): NotificationDelivery {
  const event = n.change_events ? toChangeEvent(n.change_events) : undefined
  return {
    id: n.id,
    userId: n.user_id,
    changeEventId: n.change_event_id,
    channel: n.channel as NotificationDelivery['channel'],
    status: n.status as NotificationDelivery['status'],
    sentAt: n.sent_at ?? undefined,
    isViewed: n.is_viewed,
    event,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [alertDismissed, setAlertDismissed] = useState(false)
  const [displayName, setDisplayName] = useState(
    DEMO_USER.displayName?.split(' ')[0] ?? 'there',
  )
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [rules, setRules] = useState<MonitoringRule[]>(isDemoMode ? MOCK_RULES : [])
  const [observations, setObservations] = useState<SeatObservation[]>(
    isDemoMode ? MOCK_OBSERVATIONS : [],
  )
  const [notifications, setNotifications] = useState<NotificationDelivery[]>(
    isDemoMode ? MOCK_NOTIFICATIONS : [],
  )
  const [changeEvents, setChangeEvents] = useState<ChangeEvent[]>(
    isDemoMode ? MOCK_CHANGE_EVENTS : [],
  )

  useEffect(() => {
    if (isDemoMode || !supabase) return
    loadDashboard()
  }, [])

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    // Profile display name
    const { data: profile } = await supabase!
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    if (profile?.display_name) {
      setDisplayName(profile.display_name.split(' ')[0])
    }

    // Rules
    const { data: dbRules } = await supabase!
      .from('monitoring_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    const mappedRules = (dbRules ?? []).map(toRule)
    setRules(mappedRules)

    // Latest observations per platform (latest N)
    const { data: dbObs } = await supabase!
      .from('seat_observations')
      .select('*')
      .order('observed_at', { ascending: false })
      .limit(20)
    setObservations((dbObs ?? []).map(toObservation))

    // Latest change events
    const { data: dbEvents } = await supabase!
      .from('change_events')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(10)
    const mappedEvents = (dbEvents ?? []).map(toChangeEvent)
    setChangeEvents(mappedEvents)

    // User notifications joined with change events
    const { data: dbNotifs } = await supabase!
      .from('notification_deliveries')
      .select('*, change_events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    const mappedNotifs = (dbNotifs ?? []).map(
      (n) => toNotification(n as DbNotificationWithEvent),
    )
    setNotifications(mappedNotifs)

    // Computed stats
    const activeRules = (dbRules ?? []).filter((r) => r.is_active).length
    const openAlerts = mappedEvents.filter((e) => e.newStatus === 'OPEN').length
    const lastCheck = (dbObs ?? [])[0]?.observed_at ?? new Date().toISOString()
    const uniqueCities = [
      ...new Set((dbRules ?? []).map((r) => r.city).filter(Boolean)),
    ]
    setStats({
      activeRulesCount: activeRules,
      openAlertsCount: openAlerts,
      lastCheckAt: lastCheck,
      supportedPlatformsCount: MOCK_PLATFORMS.length,
      monitoredCitiesCount: uniqueCities.length,
      totalNotificationsSent: (dbNotifs ?? []).length,
    })
  }

  const liveAlert = !alertDismissed
    ? changeEvents.find((e) => e.newStatus === 'OPEN')
    : undefined

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
        <StatsCards stats={stats} />

        {/* Main content: 2-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left: Monitored exams */}
          <MonitoredExamsList
            rules={rules}
            observations={observations}
          />

          {/* Right: Notifications panel */}
          <NotificationsPanel notifications={notifications} />
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
              ExamSeat Monitor only tracks{' '}
              <span className="text-slate-300 font-medium">publicly available seat information</span>.
              Your autofill profile is stored{' '}
              <span className="text-slate-300 font-medium">locally in your browser extension only</span> — never in the cloud.
              Payment information is{' '}
              <span className="text-slate-300 font-medium">never touched</span> by this system.
              Final registration always requires{' '}
              <span className="text-slate-300 font-medium">your manual confirmation</span>.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
