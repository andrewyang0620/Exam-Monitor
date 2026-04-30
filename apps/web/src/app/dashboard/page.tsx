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
import { fetchLatestObservationsForPlatforms } from '@/lib/latest-observations'
import type {
  Platform,
  SeatObservation,
  ChangeEvent,
  NotificationDelivery,
  DashboardStats,
} from '@tcf-tracker/types'
import type { DbPlatform, DbObservation, DbChangeEvent, DbNotificationWithEvent } from '@/lib/database.types'

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Merge DB platform rows with mock fallback for platforms not yet in DB
function mergePlatforms(dbRows: DbPlatform[]): Platform[] {
  const dbIds = new Set(dbRows.map((r) => r.id))
  return [
    ...dbRows.map((r) => {
      const mock = MOCK_PLATFORMS.find((p) => p.id === r.id)
      return {
        id: r.id,
        displayName: r.display_name,
        shortName: mock?.shortName ?? r.display_name,
        city: r.city,
        province: r.province,
        country: r.country,
        examTypesSupported: r.exam_types_supported as Platform['examTypesSupported'],
        entryUrl: r.entry_url,
        monitoring: {
          level: r.monitoring_level as Platform['monitoring']['level'],
          detectionMode: r.detection_mode as Platform['monitoring']['detectionMode'],
          requiresAuth: false,
          pollingIntervalSec: r.polling_interval_s,
        },
        autofill: mock?.autofill ?? { supported: r.autofill_supported, level: 'full' as const, fieldsCount: 0 },
        healthStatus: r.health_status as Platform['healthStatus'],
        lastHealthCheck: r.last_health_check ?? undefined,
        lastSuccessAt: r.last_success_at ?? undefined,
        riskLevel: mock?.riskLevel ?? 'low',
        fixedReleaseWindows: mock?.fixedReleaseWindows,
        notes: mock?.notes,
      } satisfies Platform
    }),
    ...MOCK_PLATFORMS.filter((p) => !dbIds.has(p.id)).map((p) => ({ ...p, isPreview: true })),
  ]
}

function normalizeStatus(s: string): SeatObservation['availabilityStatus'] {
  if (s === 'SOLD_OUT' || s === 'EXPECTED') return 'NOT_OPEN'
  if (s === 'OPEN' || s === 'NOT_OPEN' || s === 'MONITORING' || s === 'UNKNOWN') {
    return s as SeatObservation['availabilityStatus']
  }
  return 'UNKNOWN'
}

function toObservation(o: DbObservation): SeatObservation {
  const meta = (o.metadata ?? {}) as Record<string, unknown>
  return {
    id: o.id,
    platformId: o.platform_id,
    centerName: o.center_name,
    city: o.city,
    province: o.province ?? '',
    examType: o.exam_type as SeatObservation['examType'],
    sessionLabel: o.session_label ?? undefined,
    sessionDate: o.session_date ?? undefined,
    availabilityStatus: normalizeStatus(o.availability_status),
    seatsText: o.seats_text ?? undefined,
    observedAt: o.observed_at,
    sourceHash: o.source_hash ?? '',
    confidence: o.confidence ?? 1,
    metadata: meta,
    nextWindowText: (meta.nextWindowText as string | undefined) ?? undefined,
    upcomingSessionLabels: (meta.upcomingSessionLabels as string[] | undefined) ?? undefined,
    soldOutSessionLabels: (meta.soldOutSessionLabels as string[] | undefined) ?? undefined,
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
    errorMessage: n.error_message ?? undefined,
    isViewed: n.is_viewed,
    event,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const EMPTY_STATS: DashboardStats = {
  activeRulesCount: 0,
  openAlertsCount: 0,
  lastCheckAt: undefined,
  supportedPlatformsCount: 0,
  monitoredCitiesCount: 0,
  totalNotificationsSent: 0,
}

const DEV_MONITOR_INTERVAL_MS = 5 * 60 * 1000

export default function DashboardPage() {
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(!isDemoMode)
  const [displayName, setDisplayName] = useState(
    isDemoMode ? (DEMO_USER.displayName?.split(' ')[0] ?? 'there') : '',
  )
  const [stats, setStats] = useState<DashboardStats>(isDemoMode ? MOCK_STATS : EMPTY_STATS)
  const [platforms, setPlatforms] = useState<Platform[]>(isDemoMode ? MOCK_PLATFORMS : [])
  const [followedIds, setFollowedIds] = useState<Set<string>>(
    isDemoMode ? new Set(MOCK_RULES.map((r) => r.platformId)) : new Set<string>(),
  )
  const [userId, setUserId] = useState<string | null>(null)
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
    // Re-fetch every 60 s so UI stays reasonably fresh.
    const refreshTimer = setInterval(() => loadDashboard(), 60_000)
    return () => clearInterval(refreshTimer)
  }, [])

  // Dev auto-monitor via page useEffect was removed — it was page-lifecycle-bound
  // (setInterval resets on every React mount, so it almost never fired in practice).
  // To trigger a monitor run in development, run:
  //   pnpm monitor   (or manually POST /api/monitor with x-monitor-secret header)
  // Production monitoring is handled by Vercel Cron (vercel.json: */5 * * * *)

  useEffect(() => {
    if (isDemoMode || !supabase || process.env.NODE_ENV === 'production') return

    let cancelled = false
    let inFlight = false

    async function runDevMonitor() {
      if (inFlight || cancelled) return
      inFlight = true

      try {
        await fetch('/api/dev-monitor', {
          method: 'POST',
          cache: 'no-store',
        })
      } catch (error) {
        console.warn('[dashboard] dev monitor trigger failed:', error)
      } finally {
        inFlight = false
      }

      if (!cancelled) {
        await loadDashboard()
      }
    }

    void runDevMonitor()
    const monitorTimer = setInterval(() => {
      void runDevMonitor()
    }, DEV_MONITOR_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(monitorTimer)
    }
  }, [])

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    setUserId(user.id)

    // Profile display name
    const { data: profile } = await supabase!
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single()
    if (profile?.display_name) {
      setDisplayName(profile.display_name.split(' ')[0])
    }

    // All platforms (DB rows + mock fallback for platforms not in DB yet)
    const { data: dbPlatformRows } = await supabase!
      .from('platforms')
      .select('*')
      .eq('is_active', true)
      .order('display_name')
    const mergedPlatforms = mergePlatforms((dbPlatformRows ?? []) as DbPlatform[])
    setPlatforms(mergedPlatforms)

    // Subscriptions (monitoring_rules = followed platforms)
    const { data: dbSubs } = await supabase!
      .from('monitoring_rules')
      .select('platform_id, city')
      .eq('user_id', user.id)
    const followedPlatformIds = new Set<string>((dbSubs ?? []).map((r) => r.platform_id as string))
    setFollowedIds(followedPlatformIds)

    // Latest observations per platform
    const dbObs = await fetchLatestObservationsForPlatforms(
      supabase!,
      (dbPlatformRows ?? []).map((row) => row.id),
    )
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
    const latestObservationByPlatform = new Map<string, SeatObservation>()
    for (const observation of (dbObs ?? []).map(toObservation)) {
      if (!latestObservationByPlatform.has(observation.platformId)) {
        latestObservationByPlatform.set(observation.platformId, observation)
      }
    }
    const openAlerts = [...latestObservationByPlatform.values()].filter(
      (observation) => observation.availabilityStatus === 'OPEN',
    ).length
    // Use the most recent successful monitor run across all DB platforms as global Last Check.
    // Falls back to the most recent seat_observation.observed_at if no platform has been checked yet.
    const allSuccessTimestamps = (dbPlatformRows ?? [])
      .map((p) => p.last_success_at)
      .filter(Boolean) as string[]
    const lastCheck = allSuccessTimestamps.length > 0
      ? allSuccessTimestamps.sort().at(-1)
      : (dbObs ?? [])[0]?.observed_at ?? undefined
    const uniqueCities = [...new Set((dbSubs ?? []).map((r) => r.city as string).filter(Boolean))]
    const dbPlatIds = new Set((dbPlatformRows ?? []).map((p) => p.id as string))
    const mockOnlyCount = MOCK_PLATFORMS.filter((p) => !dbPlatIds.has(p.id)).length
    const totalPlatforms = (dbPlatformRows?.length ?? 0) + mockOnlyCount

    setStats({
      activeRulesCount: followedPlatformIds.size,
      openAlertsCount: openAlerts,
      lastCheckAt: lastCheck,
      supportedPlatformsCount: totalPlatforms,
      monitoredCitiesCount: uniqueCities.length || mergedPlatforms.length,
      totalNotificationsSent: (dbNotifs ?? []).length,
    })
    setIsLoading(false)
  }

  async function handleFollow(platform: Platform) {
    // Optimistic update
    setFollowedIds((prev) => new Set([...prev, platform.id]))
    setStats((prev) => ({ ...prev, activeRulesCount: prev.activeRulesCount + 1 }))

    if (isDemoMode || !supabase || !userId) return

    const primaryExam = (platform.examTypesSupported as string[])[0] ?? 'TCF Canada'
    const { error } = await supabase.from('monitoring_rules').insert({
      user_id: userId,
      platform_id: platform.id,
      exam_type: primaryExam,
      city: platform.city,
      channels: ['email'],
      is_active: true,
      priority: 1,
      date_preference: 'any',
    })
    if (error) {
      // Revert on failure
      setFollowedIds((prev) => {
        const s = new Set(prev)
        s.delete(platform.id)
        return s
      })
      setStats((prev) => ({ ...prev, activeRulesCount: Math.max(0, prev.activeRulesCount - 1) }))
    }
  }

  async function handleUnfollow(platformId: string) {
    // Optimistic update
    setFollowedIds((prev) => {
      const s = new Set(prev)
      s.delete(platformId)
      return s
    })
    setStats((prev) => ({ ...prev, activeRulesCount: Math.max(0, prev.activeRulesCount - 1) }))

    if (isDemoMode || !supabase || !userId) return

    await supabase
      .from('monitoring_rules')
      .delete()
      .eq('user_id', userId)
      .eq('platform_id', platformId)
  }

  const latestObservationByPlatform = new Map<string, SeatObservation>()
  for (const observation of observations) {
    if (!latestObservationByPlatform.has(observation.platformId)) {
      latestObservationByPlatform.set(observation.platformId, observation)
    }
  }

  const openPlatformIds = new Set(
    [...latestObservationByPlatform.values()]
      .filter((observation) => observation.availabilityStatus === 'OPEN')
      .map((observation) => observation.platformId),
  )

  const latestOpenEventByPlatform = new Map<string, ChangeEvent>()
  for (const event of changeEvents) {
    if (
      event.newStatus === 'OPEN' &&
      event.platformId &&
      openPlatformIds.has(event.platformId) &&
      !latestOpenEventByPlatform.has(event.platformId)
    ) {
      latestOpenEventByPlatform.set(event.platformId, event)
    }
  }

  const liveAlerts = [...latestOpenEventByPlatform.values()].filter(
    (event) => !dismissedAlertIds.has(event.id),
  )

  if (isLoading) {
    return (
      <div className="flex flex-col flex-1">
        <DashboardHeader title="Dashboard" subtitle="Loading..." lastCheckAt={undefined} />
        <main className="flex-1 p-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
              ))}
            </div>
            <div className="h-64 bg-slate-100 rounded-2xl" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="Dashboard"
        subtitle={displayName ? `Welcome back, ${displayName}` : 'Dashboard'}
        lastCheckAt={stats.lastCheckAt}
        unreadCount={notifications.filter((n) => !n.isViewed).length}
      />

      <main className="flex-1 p-6 space-y-6">
        {/* Live alert banner */}
        {liveAlerts.length > 0 && (
          <div className="space-y-3">
            {liveAlerts.map((event) => (
              <AlertBanner
                key={event.id}
                event={event}
                onDismiss={() =>
                  setDismissedAlertIds((prev) => new Set(prev).add(event.id))
                }
              />
            ))}
          </div>
        )}

        {/* Stats row */}
        <StatsCards stats={stats} />

        {/* Main content: 2-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* Left: Monitored exams */}
          <MonitoredExamsList
            platforms={platforms}
            observations={observations}
            followedIds={followedIds}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
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
