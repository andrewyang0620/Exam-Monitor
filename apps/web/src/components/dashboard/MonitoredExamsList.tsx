'use client'

import Link from 'next/link'
import { ExternalLink, MapPin, Clock, ChevronRight, Plus } from 'lucide-react'
import type { SeatObservation, MonitoringRule } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusColor, getStatusLabel, getStatusDotColor } from '@tcf-tracker/utils'
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
  rules: MonitoringRule[]
  observations: SeatObservation[]
}

export function MonitoredExamsList({ rules, observations }: MonitoredExamsListProps) {
  // Map observations by platformId for quick lookup
  const obsMap = new Map(observations.map((o) => [o.platformId, o]))

  if (rules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Monitored Exams</h2>
          <p className="text-sm text-slate-500 mt-0.5">Your active monitoring rules</p>
        </div>
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">No exams monitored yet</p>
          <p className="text-xs text-slate-500 mb-4">Add a monitoring rule to start tracking seat availability</p>
          <Button size="sm" asChild>
            <Link href="/dashboard/rules">Add First Rule</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Monitored Exams</h2>
          <p className="text-sm text-slate-500 mt-0.5">{rules.length} active rules</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/rules">
            <Plus className="w-3.5 h-3.5" />
            Add Rule
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-slate-50">
        {rules.map((rule) => {
          const obs = obsMap.get(rule.platformId)
          const isOpen = obs?.availabilityStatus === 'OPEN'

          return (
            <div
              key={rule.id}
              className={cn(
                'px-6 py-4 flex items-center gap-4 transition-colors',
                isOpen ? 'bg-emerald-50/40' : 'hover:bg-slate-50/60'
              )}
            >
              {/* Status indicator */}
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                isOpen ? 'bg-emerald-100' : 'bg-slate-100'
              )}>
                {obs && (
                  <span className={cn(
                    'w-3 h-3 rounded-full',
                    getStatusDotColor(obs.availabilityStatus)
                  )} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-900 truncate">
                    {rule.platformDisplayName}
                  </span>
                  {obs && <StatusBadge status={obs.availabilityStatus} />}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-600">{rule.examType}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {rule.city}
                  </span>
                  {obs && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(obs.observedAt)}
                    </span>
                  )}
                </div>
                {obs?.seatsText && (
                  <p className="text-xs text-slate-500 mt-1 truncate">{obs.seatsText}</p>
                )}
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {isOpen && (
                  <Button size="sm" variant="success" className="gap-1.5 text-xs">
                    <ExternalLink className="w-3 h-3" />
                    Register
                  </Button>
                )}
                <Button size="icon-sm" variant="ghost" asChild>
                  <Link href="/dashboard/rules">
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
