'use client'

import { formatTimeAgo } from '@tcf-tracker/utils'
import { RefreshCw, Bell } from 'lucide-react'
import { MOCK_STATS, getUnreadCount } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const unreadCount = getUnreadCount()
  const lastCheck = MOCK_STATS.lastCheckAt

  return (
    <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Last check {lastCheck ? formatTimeAgo(lastCheck) : '—'}</span>
          </div>
          <Link href="/dashboard/notifications">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
