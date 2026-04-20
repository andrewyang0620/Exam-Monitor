'use client'

import Link from 'next/link'
import { Bell, ExternalLink, CheckCheck, ChevronRight } from 'lucide-react'
import type { NotificationDelivery } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusDotColor } from '@tcf-tracker/utils'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface NotificationsPanelProps {
  notifications: NotificationDelivery[]
}

function channelIcon(channel: string) {
  switch (channel) {
    case 'email': return '✉'
    case 'sms': return '📱'
    default: return '🔔'
  }
}

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  const unread = notifications.filter((n) => !n.isViewed)

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="p-8 text-center">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No notifications yet</p>
          <p className="text-xs text-slate-400 mt-1">Alerts will appear here</p>
        </div>
      </div>
    )
  }

  // Deduplicate by changeEventId to show one entry per event
  const uniqueByEvent = notifications.reduce((acc, n) => {
    if (!acc.has(n.changeEventId)) acc.set(n.changeEventId, n)
    return acc
  }, new Map<string, NotificationDelivery>())
  const dedupedNotifications = Array.from(uniqueByEvent.values()).slice(0, 6)

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card">
      <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
          {unread.length > 0 && (
            <p className="text-xs text-blue-600 font-medium mt-0.5">
              {unread.length} unread
            </p>
          )}
        </div>
        <Button size="sm" variant="ghost" asChild>
          <Link href="/dashboard/notifications">
            View all
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      <div className="divide-y divide-slate-50">
        {dedupedNotifications.map((notif) => {
          const event = notif.event
          if (!event) return null

          const isOpen = event.newStatus === 'OPEN'
          const isUnread = !notif.isViewed

          return (
            <div
              key={notif.id}
              className={cn(
                'px-5 py-3.5 flex gap-3 transition-colors hover:bg-slate-50/80',
                isUnread && 'bg-blue-50/30'
              )}
            >
              {/* Dot indicator */}
              <div className="flex-shrink-0 mt-1">
                <span className={cn(
                  'block w-2 h-2 rounded-full mt-0.5',
                  getStatusDotColor(event.newStatus)
                )} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800 leading-tight">
                    {event.centerName}
                  </p>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">
                    {formatTimeAgo(event.detectedAt)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {event.examType} ·{' '}
                  {isOpen ? (
                    <span className="text-emerald-600 font-medium">Seats opened</span>
                  ) : event.newStatus === 'SOLD_OUT' ? (
                    <span className="text-red-500 font-medium">Sold out</span>
                  ) : (
                    <span className="font-medium">{event.newStatus}</span>
                  )}
                </p>

                {/* Delivery channels */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  {event.deliveredChannels.map((ch) => (
                    <span
                      key={ch}
                      className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded"
                    >
                      {channelIcon(ch)} {ch}
                    </span>
                  ))}
                  {!isUnread && (
                    <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-0.5">
                      <CheckCheck className="w-3 h-3" />
                      seen
                    </span>
                  )}
                </div>

                {isOpen && (
                  <button className="mt-2 flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700">
                    <ExternalLink className="w-3 h-3" />
                    Open official page
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
