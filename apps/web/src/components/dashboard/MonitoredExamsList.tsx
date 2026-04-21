'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { ExternalLink, MapPin, Clock, BookmarkPlus, BookmarkCheck, MousePointerClick, Timer } from 'lucide-react'
import type { SeatObservation, Platform } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusLabel, getStatusDotColor } from '@tcf-tracker/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

function StatusBadge({ status }: { status: SeatObservation['availabilityStatus'] }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    OPEN: 'open',
    NOT_OPEN: 'not-open',
    MONITORING: 'monitoring',
    UNKNOWN: 'unknown',
  }

  return (
    <Badge variant={variantMap[status] ?? 'unknown'}>
      <span className={cn('w-1.5 h-1.5 rounded-full', getStatusDotColor(status))} />
      {getStatusLabel(status)}
    </Badge>
  )
}

// ─── Countdown hook ───────────────────────────────────────────────────────────
//
// Timer model:
//   anchor      = platform.lastSuccessAt (real backend check time) ?? obs.observedAt (content-change time)
//   nextCheckAt = anchor + pollingIntervalSec
//   remaining   = nextCheckAt - Date.now()
//
// Display is minute-based ("~X min"), not mm:ss.
// The system is not precise enough to warrant second-level display:
//  - loadDashboard polls every 60s, so lastSuccessAt can lag by up to 60s
//  - Vercel Cron has its own scheduling jitter
//
// Interval is 60s (not 1s) — no need to re-render every second for minute-level display.
// obsRef/platformsRef lets the interval read fresh data without restarting.

function useCountdowns(
  platforms: Platform[],
  observations: SeatObservation[],
): Map<string, string> {
  const [countdowns, setCountdowns] = useState<Map<string, string>>(new Map())
  const obsRef = useRef(observations)
  obsRef.current = observations
  const platformsRef = useRef(platforms)
  platformsRef.current = platforms

  useEffect(() => {
    function compute() {
      const map = new Map<string, string>()
      const now = Date.now()
      for (const platform of platformsRef.current) {
        const obs = obsRef.current.find((o) => o.platformId === platform.id)
        const intervalSec = platform.monitoring.pollingIntervalSec ?? 300
        // Prefer last_success_at (real check time) over obs.observedAt (last content-change time)
        const anchor = platform.lastSuccessAt ?? obs?.observedAt
        if (!anchor) {
          // No backend data yet
          map.set(platform.id, `~${Math.round(intervalSec / 60)} min`)
          continue
        }
        const nextCheckAt = new Date(anchor).getTime() + intervalSec * 1000
        const remainingMs = nextCheckAt - now
        if (remainingMs <= 0) {
          map.set(platform.id, 'checking')
        } else {
          const mins = Math.ceil(remainingMs / 60_000)
          map.set(platform.id, `~${mins} min`)
        }
      }
      setCountdowns(new Map(map))
    }

    compute()
    // Re-compute every 60s — minute-level display doesn't need per-second updates
    const timer = setInterval(compute, 60_000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms])

  return countdowns
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MonitoredExamsListProps {
  platforms: Platform[]
  observations: SeatObservation[]
  followedIds: Set<string>
  onFollow: (platform: Platform) => Promise<void>
  onUnfollow: (platformId: string) => Promise<void>
}

export function MonitoredExamsList({
  platforms,
  observations,
  followedIds,
  onFollow,
  onUnfollow,
}: MonitoredExamsListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const obsMap = new Map(observations.map((o) => [o.platformId, o]))
  const countdowns = useCountdowns(platforms, observations)

  async function handleToggle(platform: Platform) {
    setPendingId(platform.id)
    try {
      if (followedIds.has(platform.id)) {
        await onUnfollow(platform.id)
      } else {
        await onFollow(platform)
      }
    } finally {
      setPendingId(null)
    }
  }

  if (platforms.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
        <p className="text-sm text-slate-500">No monitored platforms available.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Monitored Exams</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {followedIds.size > 0
              ? `Following ${followedIds.size} of ${platforms.length} exam${platforms.length !== 1 ? 's' : ''}`
              : `${platforms.length} exams monitored by the system`}
          </p>
        </div>
        {followedIds.size > 0 && (
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/rules">View Watchlist</Link>
          </Button>
        )}
      </div>

      <div className="divide-y divide-slate-50">
        {platforms.map((platform) => {
          const obs = obsMap.get(platform.id)
          const isOpen = obs?.availabilityStatus === 'OPEN'
          const isFollowed = followedIds.has(platform.id)
          const isPending = pendingId === platform.id
          const countdown = countdowns.get(platform.id)

          const officialUrl =
            platform.id === 'af-vancouver'
              ? 'https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/'
              : platform.entryUrl

          // Pull informational fields from metadata
          const meta = obs?.metadata as Record<string, unknown> | undefined
          const nextWindowText =
            obs?.nextWindowText ??
            (meta?.nextWindowText as string | undefined)
          const upcomingSessionLabels =
            obs?.upcomingSessionLabels ??
            (meta?.upcomingSessionLabels as string[] | undefined)

          return (
            <div
              key={platform.id}
              className={cn(
                'px-6 py-4 flex items-start gap-4 transition-colors',
                isOpen ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
              )}
            >
              {/* Status indicator dot */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                  isOpen ? 'bg-emerald-100' : 'bg-slate-100'
                )}
              >
                <span
                  className={cn(
                    'w-3 h-3 rounded-full',
                    obs ? getStatusDotColor(obs.availabilityStatus) : 'bg-slate-300'
                  )}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                {/* Row 1: name + badge */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {platform.displayName}
                  </span>
                  {platform.isPreview ? (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      Coming Soon
                    </span>
                  ) : (
                    obs && <StatusBadge status={obs.availabilityStatus} />
                  )}
                  {platform.autofill.supported && !platform.isPreview && (
                    <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-slate-400">
                      <MousePointerClick className="w-3 h-3" />
                      Autofill
                    </span>
                  )}
                </div>

                {/* Row 2: exam type + city + last checked */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">
                    {platform.examTypesSupported.slice(0, 2).join(', ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {platform.city}
                  </span>
                  {!platform.isPreview && (platform.lastSuccessAt ?? obs?.observedAt) && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(platform.lastSuccessAt ?? obs!.observedAt)}
                    </span>
                  )}
                </div>

                {/* Row 3: secondary info for NOT_OPEN — only for real platforms with real parser output */}
                {!platform.isPreview && obs?.availabilityStatus === 'NOT_OPEN' && (nextWindowText || upcomingSessionLabels) && (
                  <div className="mt-1.5 space-y-0.5">
                    {nextWindowText && (
                      <p className="text-xs text-slate-500">
                        <span className="text-slate-400">Next likely opening:</span>{' '}
                        <span className="text-slate-600">{nextWindowText}</span>
                      </p>
                    )}
                    {upcomingSessionLabels && upcomingSessionLabels.length > 0 && (
                      <p className="text-xs text-slate-400">
                        Upcoming: {upcomingSessionLabels.join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Row 4: next check timing — only for real (non-preview) platforms */}
                {!platform.isPreview && countdown && (
                  <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400">
                    <Timer className="w-3 h-3" />
                    {countdown === 'checking' ? (
                      <span className="italic">Checking…</span>
                    ) : (
                      <span>Next check in <span className="font-medium text-slate-500">{countdown}</span></span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                {isOpen && !platform.isPreview && (
                  <Button size="sm" variant="success" className="gap-1.5 text-xs" asChild>
                    <a href={officialUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                      Register
                    </a>
                  </Button>
                )}
                {!platform.isPreview && (
                <Button
                  size="sm"
                  variant={isFollowed ? 'outline' : 'ghost'}
                  className={cn(
                    'gap-1.5 text-xs transition-all',
                    isFollowed
                      ? 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                  )}
                  onClick={() => handleToggle(platform)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                  ) : isFollowed ? (
                    <>
                      <BookmarkCheck className="w-3 h-3" />
                      <span className="hidden sm:inline">Following</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">Follow</span>
                    </>
                  )}
                </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
