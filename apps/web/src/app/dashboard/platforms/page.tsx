'use client'

import { useState, useEffect } from 'react'
import {
  Globe,
  CheckCircle,
  AlertCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  MousePointerClick,
  Search,
} from 'lucide-react'
import type { Platform } from '@tcf-tracker/types'
import { MOCK_PLATFORMS } from '@/lib/mock-data'
import { supabase, isDemoMode } from '@/lib/supabase'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatTimeAgo } from '@tcf-tracker/utils'
import { AF_VANCOUVER_DETECTION_URL } from '@/app/api/monitor/af-vancouver-parser'

const healthConfig = {
  operational: {
    label: 'Operational',
    icon: CheckCircle,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  degraded: {
    label: 'Degraded',
    icon: AlertCircle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  down: {
    label: 'Down',
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    dot: 'bg-red-500',
  },
  unknown: {
    label: 'Unknown',
    icon: RefreshCw,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
}

const monitoringLevelLabels = {
  full: { label: 'Full monitoring', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  partial: { label: 'Partial', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  limited: { label: 'Limited', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  none: { label: 'Manual only', color: 'text-slate-500 bg-slate-50 border-slate-200' },
}

const detectionModeLabels = {
  html: 'HTML parsing',
  'json-xhr': 'JSON / XHR',
  'eventbrite-link': 'Eventbrite detection',
  'manual-only': 'Manual only',
}

function PlatformCard({ platform }: { platform: Platform }) {
  const health = healthConfig[platform.healthStatus] ?? healthConfig.unknown
  const HealthIcon = health.icon
  const monitoring = monitoringLevelLabels[platform.monitoring.level]

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-50">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight mb-0.5">
                {platform.displayName}
              </h3>
              <p className="text-xs text-slate-400">
                {platform.city}, {platform.province}
              </p>
            </div>
          </div>
          <div className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
            health.bg, health.border, health.color
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', health.dot)} />
            {health.label}
          </div>
        </div>

        {/* Exam types */}
        <div className="flex flex-wrap gap-1.5">
          {platform.examTypesSupported.map((exam) => (
            <span
              key={exam}
              className="text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full"
            >
              {exam}
            </span>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="p-5 space-y-3">
        {/* Monitoring level */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Monitoring</span>
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full border', monitoring.color)}>
            {monitoring.label}
          </span>
        </div>

        {/* Detection mode */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Detection</span>
          <span className="text-xs text-slate-700 font-medium">
            {detectionModeLabels[platform.monitoring.detectionMode]}
          </span>
        </div>

        {/* Autofill */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Autofill</span>
          <div className="flex items-center gap-1.5">
            {platform.autofill.supported ? (
              <>
                <MousePointerClick className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-600">
                  {platform.autofill.level === 'full'
                    ? `Full (${platform.autofill.fieldsCount} fields)`
                    : platform.autofill.level === 'partial'
                    ? 'Partial'
                    : 'Limited'}
                </span>
              </>
            ) : (
              <span className="text-xs text-slate-400">Not supported</span>
            )}
          </div>
        </div>

        {/* Polling interval */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Check interval</span>
          <span className="text-xs text-slate-700">
            Every {Math.round(platform.monitoring.pollingIntervalSec / 60)} min
          </span>
        </div>

        {/* Last check */}
        {platform.lastHealthCheck && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Last check</span>
            <span className="text-xs text-slate-400">{formatTimeAgo(platform.lastHealthCheck)}</span>
          </div>
        )}

        {/* Next release window */}
        {platform.fixedReleaseWindows?.[0]?.nextExpectedDate && (
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs text-slate-500">Next window</span>
            <span className="text-xs text-amber-600 font-medium text-right">
              ~{new Date(platform.fixedReleaseWindows[0].nextExpectedDate).toLocaleDateString('en-CA', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Notes */}
        {platform.notes && (
          <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-50">
            {platform.notes}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5">
        <a
          href={
            platform.id === 'af-vancouver'
              ? AF_VANCOUVER_DETECTION_URL
              : platform.entryUrl
          }
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full py-2 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          Official page
        </a>
      </div>
    </div>
  )
}

export default function PlatformsPage() {
  const [search, setSearch] = useState('')
  const [afLastCheck, setAfLastCheck] = useState<string | null>(null)

  useEffect(() => {
    if (isDemoMode || !supabase) return
    // Load last observation time for AF Vancouver to show accurate "last check"
    supabase
      .from('seat_observations')
      .select('observed_at')
      .eq('platform_id', 'af-vancouver')
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.observed_at) setAfLastCheck(data.observed_at)
      })
  }, [])

  // Inject real last-check time for AF Vancouver
  const platforms = MOCK_PLATFORMS.map((p) =>
    p.id === 'af-vancouver' && afLastCheck
      ? { ...p, lastHealthCheck: afLastCheck }
      : p,
  )

  const filtered = platforms.filter(
    (p) =>
      search === '' ||
      p.displayName.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.examTypesSupported.some((e) => e.toLowerCase().includes(search.toLowerCase()))
  )

  const operational = platforms.filter((p) => p.healthStatus === 'operational').length
  const degraded = platforms.filter((p) => p.healthStatus === 'degraded').length

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="Platforms"
        subtitle={`${platforms.length} supported exam centers`}
      />

      <main className="flex-1 p-6">
        {/* Status summary */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {operational} operational
          </div>
          {degraded > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {degraded} degraded
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Search platforms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm w-52"
              />
            </div>
          </div>
        </div>

        {/* Platform grid */}
        <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-5">
          {filtered.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            No platforms match your search.
          </div>
        )}

        {/* Integration note */}
        <div className="mt-8 bg-slate-50 rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-2">
            Want a new platform added?
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Platform adapters define how each exam center is monitored. Adding a new center takes about 30 minutes
            of configuration work. If you know of an exam center not listed here, reach out and we'll evaluate it.
            See the <a href="#" className="text-blue-600 hover:underline">platform adapter spec</a> for technical details.
          </p>
        </div>
      </main>
    </div>
  )
}
