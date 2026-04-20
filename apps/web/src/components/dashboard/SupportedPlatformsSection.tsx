'use client'

import Link from 'next/link'
import { ChevronRight, CheckCircle, AlertCircle, XCircle, Minus } from 'lucide-react'
import type { Platform } from '@tcf-tracker/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const healthConfig = {
  operational: { label: 'Operational', icon: CheckCircle, color: 'text-emerald-600', dot: 'bg-emerald-500' },
  degraded: { label: 'Degraded', icon: AlertCircle, color: 'text-amber-600', dot: 'bg-amber-500' },
  down: { label: 'Down', icon: XCircle, color: 'text-red-600', dot: 'bg-red-500' },
  unknown: { label: 'Unknown', icon: Minus, color: 'text-slate-400', dot: 'bg-slate-400' },
}

const monitoringLevelLabels = {
  full: 'Full monitoring',
  partial: 'Partial',
  limited: 'Limited',
  none: 'Manual only',
}

interface SupportedPlatformsSectionProps {
  platforms: Platform[]
  limit?: number
}

export function SupportedPlatformsSection({ platforms, limit = 4 }: SupportedPlatformsSectionProps) {
  const displayed = platforms.slice(0, limit)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between p-6 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Supported Platforms</h2>
          <p className="text-sm text-slate-500 mt-0.5">{platforms.length} exam centers integrated</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/dashboard/platforms">
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayed.map((platform) => {
            const health = healthConfig[platform.healthStatus]
            const HealthIcon = health.icon

            return (
              <div
                key={platform.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-colors"
              >
                {/* Health dot */}
                <div className="flex-shrink-0 mt-1">
                  <span className={cn('block w-2.5 h-2.5 rounded-full', health.dot)} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {platform.shortName}
                    </span>
                    <span className="text-xs text-slate-400">{platform.province}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {platform.examTypesSupported.slice(0, 2).map((exam) => (
                      <span
                        key={exam}
                        className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-full font-medium"
                      >
                        {exam}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500">
                    <span>{monitoringLevelLabels[platform.monitoring.level]}</span>
                    {platform.autofill.supported && (
                      <span className="text-emerald-600 font-medium">✓ Autofill</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
