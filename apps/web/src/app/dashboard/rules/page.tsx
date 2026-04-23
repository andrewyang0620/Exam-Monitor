'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  MapPin,
  ExternalLink,
  Bookmark,
  BookmarkMinus,
} from 'lucide-react'
import type { MonitoringRule, Platform, SeatObservation } from '@tcf-tracker/types'
import { getStatusDotColor, getStatusLabel, formatTimeAgo } from '@tcf-tracker/utils'
import { MOCK_RULES, MOCK_PLATFORMS, MOCK_OBSERVATIONS } from '@/lib/mock-data'
import { supabase, isDemoMode } from '@/lib/supabase'
import type { DbPlatform } from '@/lib/database.types'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Helpers

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

function toObservation(o: {
  id: string; platform_id: string; center_name: string; city: string;
  province: string | null; exam_type: string; session_label: string | null;
  session_date: string | null; availability_status: string; seats_text: string | null;
  observed_at: string; source_hash: string | null; confidence: number | null;
}): SeatObservation {
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
  }
}

// StatusBadge

function StatusBadge({ status }: { status: SeatObservation['availabilityStatus'] }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    OPEN: 'open', SOLD_OUT: 'sold', EXPECTED: 'expected', NOT_OPEN: 'not-open', MONITORING: 'monitoring', UNKNOWN: 'unknown',
  }
  return (
    <Badge variant={variantMap[status] ?? 'unknown'}>
      <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDotColor(status))} />
      {getStatusLabel(status)}
    </Badge>
  )
}

// SubscriptionCard

function SubscriptionCard({
  rule,
  platform,
  obs,
  onToggleChannel,
  onUnfollow,
}: {
  rule: MonitoringRule
  platform: Platform | undefined
  obs: SeatObservation | undefined
  onToggleChannel: (ruleId: string, channel: string) => void
  onUnfollow: (ruleId: string) => void
}) {
  const officialUrl =
    rule.platformId === 'af-vancouver'
      ? 'https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/'
      : platform?.entryUrl ?? '#'

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {rule.platformDisplayName}
            </h3>
            {obs && <StatusBadge status={obs.availabilityStatus} />}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {rule.examType}
            </span>
            {rule.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {rule.city}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onUnfollow(rule.id)}
          className="flex-shrink-0 text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 pt-0.5"
        >
          <BookmarkMinus className="w-3.5 h-3.5" />
          Unfollow
        </button>
      </div>

      {/* Last observation */}
      {obs?.seatsText && (
        <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-500">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">{obs.seatsText}</span>
            <span className="text-slate-400 flex-shrink-0">{formatTimeAgo(obs.observedAt)}</span>
          </div>
        </div>
      )}

      {/* Notification channels */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Notify via</span>
        {(['browser', 'email'] as const).map((ch) => {
          const enabled = rule.channels.includes(ch)
          const Icon = ch === 'browser' ? Bell : Mail
          return (
            <button
              key={ch}
              onClick={() => onToggleChannel(rule.id, ch)}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-lg border transition-colors',
                enabled
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
              )}
            >
              <Icon className="w-3 h-3" />
              {ch === 'browser' ? 'Browser' : 'Email'}
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Official page
        </a>
      </div>
    </div>
  )
}

// Page

export default function WatchlistPage() {
  const [rules, setRules] = useState<MonitoringRule[]>(isDemoMode ? MOCK_RULES : [])
  const [platforms, setPlatforms] = useState<Platform[]>(MOCK_PLATFORMS)
  const [observations, setObservations] = useState<SeatObservation[]>(isDemoMode ? MOCK_OBSERVATIONS : [])

  useEffect(() => {
    if (isDemoMode || !supabase) return
    loadData()
  }, [])

  async function loadData() {
    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    // Subscriptions
    const { data: dbSubs } = await supabase!
      .from('monitoring_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    // Platforms
    const { data: dbPlatRows } = await supabase!
      .from('platforms')
      .select('*')
      .eq('is_active', true)
    const mergedPlatforms = mergePlatforms((dbPlatRows ?? []) as DbPlatform[])
    setPlatforms(mergedPlatforms)

    if (dbSubs) {
      setRules(
        dbSubs.map((r) => ({
          id: r.id,
          userId: r.user_id,
          platformId: r.platform_id,
          examType: r.exam_type as MonitoringRule['examType'],
          city: r.city ?? '',
          datePreference: r.date_preference ?? 'any',
          channels: r.channels as MonitoringRule['channels'],
          priority: (Math.min(3, Math.max(1, r.priority)) as 1 | 2 | 3),
          isActive: r.is_active,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          platformDisplayName:
            mergedPlatforms.find((p) => p.id === r.platform_id)?.displayName ?? r.platform_id,
        })),
      )
    }

    const { data: dbObs } = await supabase!
      .from('seat_observations')
      .select('*')
      .order('observed_at', { ascending: false })
      .limit(20)
    if (dbObs) setObservations(dbObs.map(toObservation))
  }

  const toggleChannel = async (ruleId: string, channel: string) => {
    setRules((prev) =>
      prev.map((r) => {
        if (r.id !== ruleId) return r
        const has = r.channels.includes(channel as never)
        const newChannels = has
          ? r.channels.filter((c) => c !== channel)
          : ([...r.channels, channel] as MonitoringRule['channels'])
        return { ...r, channels: newChannels }
      }),
    )
    if (!isDemoMode && supabase) {
      const rule = rules.find((r) => r.id === ruleId)
      if (!rule) return
      const has = rule.channels.includes(channel as never)
      const newChannels = has ? rule.channels.filter((c) => c !== channel) : [...rule.channels, channel]
      await supabase
        .from('monitoring_rules')
        .update({ channels: newChannels, updated_at: new Date().toISOString() })
        .eq('id', ruleId)
    }
  }

  const unfollow = async (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId))
    if (!isDemoMode && supabase) {
      await supabase.from('monitoring_rules').delete().eq('id', ruleId)
    }
  }

  const obsMap = new Map(observations.map((o) => [o.platformId, o]))

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="Watchlist"
        subtitle={
          rules.length > 0
            ? `${rules.length} followed exam${rules.length !== 1 ? 's' : ''}`
            : 'No followed exams yet'
        }
      />

      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Followed Exams</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Control notifications for exams you follow
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">Browse All Exams</Link>
            </Button>
          </div>

          {/* Content */}
          {rules.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Bookmark className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">No followed exams</p>
              <p className="text-xs text-slate-500 mb-4">
                Go to the dashboard, find an exam center, and click Follow to receive alerts.
              </p>
              <Button size="sm" asChild>
                <Link href="/dashboard">Browse All Exams</Link>
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rules.map((rule) => (
                <SubscriptionCard
                  key={rule.id}
                  rule={rule}
                  platform={platforms.find((p) => p.id === rule.platformId)}
                  obs={obsMap.get(rule.platformId)}
                  onToggleChannel={toggleChannel}
                  onUnfollow={unfollow}
                />
              ))}
            </div>
          )}

          {/* Info */}
          <div className="mt-8 bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">How it works</h3>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">-</span>
                The system continuously monitors public exam pages - no setup required
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">-</span>
                When seats open, you receive alerts via your chosen channels
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">-</span>
                Use the Chrome extension to autofill your registration profile locally
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">-</span>
                Final registration and payment are always completed manually by you
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
