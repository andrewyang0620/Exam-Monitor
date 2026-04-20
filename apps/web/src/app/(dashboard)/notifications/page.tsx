'use client'

import { useState } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  ExternalLink,
  Filter,
  Eye,
} from 'lucide-react'
import type { NotificationDelivery } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusDotColor, getStatusLabel } from '@tcf-tracker/utils'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const CHANNEL_ICONS = {
  browser: Bell,
  email: Mail,
  sms: Smartphone,
}

const EVENT_TYPE_LABELS = {
  OPENED: 'Seats opened',
  SOLD_OUT: 'Sold out',
  DATE_ADDED: 'New date added',
  STATUS_CHANGED: 'Status changed',
  UNKNOWN_CHANGE: 'Change detected',
}

function NotificationRow({
  notification,
  onMarkViewed,
}: {
  notification: NotificationDelivery
  onMarkViewed: (id: string) => void
}) {
  const event = notification.event
  if (!event) return null

  const isOpen = event.newStatus === 'OPEN'
  const ChannelIcon = CHANNEL_ICONS[notification.channel] ?? Bell

  return (
    <div
      className={cn(
        'flex items-start gap-4 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50',
        !notification.isViewed && 'bg-blue-50/30'
      )}
    >
      {/* Channel icon + status dot */}
      <div className="flex-shrink-0 mt-0.5">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center',
          isOpen ? 'bg-emerald-50' : event.newStatus === 'SOLD_OUT' ? 'bg-red-50' : 'bg-slate-100'
        )}>
          <ChannelIcon className={cn(
            'w-4 h-4',
            isOpen ? 'text-emerald-600' : event.newStatus === 'SOLD_OUT' ? 'text-red-500' : 'text-slate-500'
          )} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">
                {event.centerName}
              </span>
              {!notification.isViewed && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500">{event.examType}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">{event.city}</span>
              <span className="text-slate-300">·</span>
              <span className={cn(
                'text-xs font-medium',
                isOpen ? 'text-emerald-600' : event.newStatus === 'SOLD_OUT' ? 'text-red-500' : 'text-slate-600'
              )}>
                {EVENT_TYPE_LABELS[event.eventType] ?? event.eventType}
              </span>
            </div>
          </div>
          <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
            {formatTimeAgo(notification.sentAt ?? event.detectedAt)}
          </span>
        </div>

        {/* Delivery info */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            <ChannelIcon className="w-2.5 h-2.5" />
            <span>via {notification.channel}</span>
          </div>
          <div className={cn(
            'text-[10px] px-2 py-0.5 rounded-full font-medium',
            notification.status === 'sent'
              ? 'bg-emerald-50 text-emerald-700'
              : notification.status === 'failed'
              ? 'bg-red-50 text-red-600'
              : 'bg-slate-100 text-slate-500'
          )}>
            {notification.status}
          </div>
          {notification.isViewed && (
            <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <CheckCheck className="w-3 h-3" />
              seen
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-2.5">
          {isOpen && (
            <button className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors">
              <ExternalLink className="w-3 h-3" />
              Open official page
            </button>
          )}
          {!notification.isViewed && (
            <button
              onClick={() => onMarkViewed(notification.id)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Eye className="w-3 h-3" />
              Mark as seen
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDelivery[]>(MOCK_NOTIFICATIONS)
  const [filter, setFilter] = useState<'all' | 'unread' | 'open'>('all')

  const markViewed = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isViewed: true } : n))
    )
  }

  const markAllViewed = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isViewed: true })))
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isViewed
    if (filter === 'open') return n.event?.newStatus === 'OPEN'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isViewed).length

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader
        title="Notifications"
        subtitle={`${unreadCount} unread · ${notifications.length} total`}
      />

      <main className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          {/* Filters + actions */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
                  { key: 'open', label: 'Open seats' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'px-4 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    filter === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {unreadCount > 0 && (
              <Button size="sm" variant="outline" onClick={markAllViewed} className="gap-1.5">
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all seen
              </Button>
            )}
          </div>

          {/* Notifications list */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-12 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-1">No notifications</p>
              <p className="text-xs text-slate-500">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : filter === 'open'
                  ? 'No open seat alerts at this time'
                  : 'Notifications will appear here when monitoring detects changes'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
                </span>
                <Filter className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div>
                {filtered.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onMarkViewed={markViewed}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Privacy note */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Notification history is stored for 30 days only.
              No personal data from official exam portals is included.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
