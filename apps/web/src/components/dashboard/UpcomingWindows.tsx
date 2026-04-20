'use client'

import { Calendar, Clock, Info } from 'lucide-react'
import type { UpcomingWindow } from '@tcf-tracker/types'
import { formatFullDate } from '@tcf-tracker/utils'
import { cn } from '@/lib/utils'

const confidenceConfig = {
  confirmed: { label: 'Confirmed', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  estimated: { label: 'Estimated', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  historical: { label: 'Historical', color: 'text-blue-700 bg-blue-50 border-blue-200' },
}

interface UpcomingWindowsProps {
  windows: UpcomingWindow[]
}

export function UpcomingWindows({ windows }: UpcomingWindowsProps) {
  if (windows.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="flex items-center gap-2 p-6 pb-4 border-b border-slate-100">
        <Clock className="w-4 h-4 text-slate-400" />
        <h2 className="text-base font-semibold text-slate-900">Upcoming Release Windows</h2>
        <span className="ml-auto text-xs text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Best-effort estimates
        </span>
      </div>

      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-3">
          {windows.map((win) => {
            const conf = confidenceConfig[win.confidence]
            const daysUntil = Math.ceil(
              (new Date(win.expectedDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            )

            return (
              <div
                key={`${win.platformId}-${win.examType}`}
                className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-slate-800 truncate">
                      {win.platformName}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                        conf.color
                      )}
                    >
                      {conf.label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {win.examType} · {formatFullDate(win.expectedDate)}
                    {daysUntil > 0 && (
                      <span className="text-slate-400 ml-1.5">
                        (in {daysUntil}d)
                      </span>
                    )}
                  </div>
                  {win.notes && (
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[220px]">
                      {win.notes}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
