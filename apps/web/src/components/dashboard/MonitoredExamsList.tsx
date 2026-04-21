'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ExternalLink, MapPin, Clock, BookmarkPlus, BookmarkCheck, MousePointerClick } from 'lucide-react'
import type { SeatObservation, Platform } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusLabel, getStatusDotColor } from '@tcf-tracker/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { BadgeProps } from '@/components/ui/badge'

function StatusBadge({ status }: { status: SeatObservation['availabilityStatus'] }) {
  const variantMap: Record<string, BadgeProps['variant']> = {
    OPEN: 'open',
    SOLD_OUT: 'sold',
    EXPECTED: 'expected',
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

          const officialUrl =
            platform.id === 'af-vancouver'
              ? 'https://www.alliancefrancaise.ca/products/categories/exams-and-tests/tcf-canada/'
              : platform.entryUrl

          return (
            <div
              key={platform.id}
              className={cn(
                'px-6 py-4 flex items-center gap-4 transition-colors',
                isOpen ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
              )}
            >
              {/* Status indicator */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {platform.displayName}
                  </span>
                  {obs && <StatusBadge status={obs.availabilityStatus} />}
                  {platform.autofill.supported && (
                    <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-slate-400">
                      <MousePointerClick className="w-3 h-3" />
                      Autofill
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="font-medium text-slate-600">
                    {platform.examTypesSupported.slice(0, 2).join(', ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {platform.city}
                  </span>
                  {obs && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(obs.observedAt)}
                    </span>
                  )}
                </div>
                {obs?.seatsText && (
                  <p className="text-xs text-slate-400 mt-1 truncate">{obs.seatsText}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOpen && (
                  <Button size="sm" variant="success" className="gap-1.5 text-xs" asChild>
                    <a href={officialUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3" />
                      Register
                    </a>
                  </Button>
                )}
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
