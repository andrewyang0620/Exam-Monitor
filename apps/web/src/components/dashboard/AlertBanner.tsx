'use client'

import { AlertTriangle, ExternalLink, X } from 'lucide-react'
import type { ChangeEvent } from '@tcf-tracker/types'
import { formatTimeAgo } from '@tcf-tracker/utils'
import { Button } from '@/components/ui/button'

interface AlertBannerProps {
  event: ChangeEvent
  onDismiss?: () => void
}

export function AlertBanner({ event, onDismiss }: AlertBannerProps) {
  if (event.newStatus !== 'OPEN') return null

  return (
    <div className="bg-emerald-600 rounded-2xl p-4 flex items-center gap-4 shadow-md animate-slide-up">
      {/* Pulsing dot */}
      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white">Seats Available</span>
          <span className="text-emerald-200 text-xs">·</span>
          <span className="text-xs text-emerald-200">{formatTimeAgo(event.detectedAt)}</span>
        </div>
        <p className="text-sm text-emerald-100">
          <span className="font-medium text-white">{event.centerName}</span>
          {' — '}
          <span>{event.examType} · {event.city}</span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          className="bg-white text-emerald-700 hover:bg-emerald-50 font-medium gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open Official Page
        </Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-200 hover:bg-emerald-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
