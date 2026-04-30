'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  ExternalLink,
  Filter,
} from 'lucide-react'
import type { NotificationDelivery, ChangeEvent } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusLabel } from '@tcf-tracker/utils'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { supabase, isDemoMode } from '@/lib/supabase'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DbNotificationWithEvent } from '@/lib/database.types'
import { AF_VANCOUVER_REGISTRATION_URL } from '@/app/api/monitor/af-vancouver-parser'

const CHANNEL_ICONS = {
  browser: Bell,
  email: Mail,
  sms: Smartphone,
}

function NotificationRow({
  notification,
}: {
  notification: NotificationDelivery
}) {
  const event = notification.event
  if (!event) return null

  const isOpen = event.newStatus === 'OPEN'
  const ChannelIcon = CHANNEL_ICONS[notification.channel] ?? Bell

  return (
    <div
      className={cn(
        'flex items-start gap-4 border-b border-slate-50 px-6 py-4 transition-colors last:border-0 hover:bg-slate-50/50',
        !notification.isViewed && 'bg-blue-50/30',
      )}
    >
      <div className="mt-0.5 flex-shrink-0">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl',
            isOpen ? 'bg-emerald-50' : 'bg-slate-100',
          )}
        >
          <ChannelIcon className={cn('h-4 w-4', isOpen ? 'text-emerald-600' : 'text-slate-500')} />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900">{event.centerName}</span>
              {!notification.isViewed && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-xs text-slate-500">{event.examType}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs text-slate-500">{event.city}</span>
              <span className="text-slate-300">·</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  isOpen ? 'text-emerald-600' : event.newStatus === 'NOT_OPEN' ? 'text-slate-600' : 'text-slate-600',
                )}
              >
                {getStatusLabel(event.newStatus)}
              </span>
            </div>
          </div>
          <span className="mt-0.5 flex-shrink-0 text-xs text-slate-400">
            {formatTimeAgo(notification.sentAt ?? event.detectedAt)}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-400">
            <ChannelIcon className="h-2.5 w-2.5" />
            <span>via {notification.channel}</span>
          </div>
          <div
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium',
              notification.status === 'sent'
                ? 'bg-emerald-50 text-emerald-700'
                : notification.status === 'failed'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-slate-100 text-slate-500',
            )}
          >
            {notification.status}
          </div>
          {notification.isViewed && (
            <div className="flex items-center gap-0.5 text-[10px] text-slate-400">
              <CheckCheck className="h-3 w-3" />
              seen
            </div>
          )}
        </div>

        {notification.status === 'failed' && notification.errorMessage && (
          <p className="mt-2 text-[11px] leading-relaxed text-red-600">{notification.errorMessage}</p>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          {isOpen && (
            <Link
              href={event.platformId === 'af-vancouver' ? AF_VANCOUVER_REGISTRATION_URL : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
            >
              <ExternalLink className="h-3 w-3" />
              Open official page
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function mapNotifications(data: DbNotificationWithEvent[]): NotificationDelivery[] {
  return data.map((n) => {
    const ce = n.change_events
    return {
      id: n.id,
      userId: n.user_id,
      changeEventId: n.change_event_id,
      channel: n.channel as NotificationDelivery['channel'],
      status: n.status as NotificationDelivery['status'],
      sentAt: n.sent_at ?? undefined,
      errorMessage: n.error_message ?? undefined,
      isViewed: n.is_viewed,
      event: ce
        ? {
            id: ce.id,
            platformId: ce.platform_id,
            ruleId: undefined,
            previousStatus: (ce.previous_status ?? 'UNKNOWN') as ChangeEvent['previousStatus'],
            newStatus: ce.new_status as ChangeEvent['newStatus'],
            eventType: ce.event_type as ChangeEvent['eventType'],
            detectedAt: ce.detected_at,
            confidence: ce.confidence ?? 1,
            deliveredChannels: [],
            rawObservationRef: ce.raw_observation_id ?? '',
            centerName: ce.center_name,
            examType: ce.exam_type as ChangeEvent['examType'],
            city: ce.city,
          }
        : undefined,
    }
  })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDelivery[]>(
    isDemoMode ? MOCK_NOTIFICATIONS : [],
  )
  const [filter, setFilter] = useState<'all' | 'unread' | 'open'>('all')

  useEffect(() => {
    if (isDemoMode || !supabase) return
    void loadNotifications()
  }, [])

  async function loadNotifications() {
    const {
      data: { user },
    } = await supabase!.auth.getUser()
    if (!user) return

    const { data } = await supabase!
      .from('notification_deliveries')
      .select('*, change_events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!data) return

    const mapped = mapNotifications(data as DbNotificationWithEvent[])
    setNotifications(mapped)

    const unreadIds = mapped.filter((n) => !n.isViewed).map((n) => n.id)
    if (!isDemoMode && supabase && unreadIds.length > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isViewed: true })))
      await supabase!
        .from('notification_deliveries')
        .update({ is_viewed: true, viewed_at: new Date().toISOString() })
        .in('id', unreadIds)
    }
  }

  async function clearHistory() {
    const ids = notifications.map((n) => n.id)
    setNotifications([])

    if (!isDemoMode && supabase && ids.length > 0) {
      await supabase.from('notification_deliveries').delete().in('id', ids)
    }
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isViewed
    if (filter === 'open') return n.event?.newStatus === 'OPEN'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isViewed).length

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Notifications" subtitle={`${unreadCount} unread`} />

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
                  { key: 'open', label: 'Seats Available' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    'rounded-lg px-4 py-1.5 text-xs font-medium transition-colors',
                    filter === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {notifications.length > 0 && (
              <Button size="sm" variant="outline" onClick={clearHistory} className="gap-1.5">
                <CheckCheck className="h-3.5 w-3.5" />
                Clear history
              </Button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-card">
              <Bell className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="mb-1 text-sm font-medium text-slate-700">No notifications</p>
              <p className="text-xs text-slate-500">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : filter === 'open'
                    ? 'No Seats Available alerts at this time'
                    : 'Notifications will appear here when monitoring detects changes'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {filtered.length} notification{filtered.length !== 1 ? 's' : ''}
                </span>
                <Filter className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div>
                {filtered.map((n) => (
                  <NotificationRow key={n.id} notification={n} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Notification history is stored for 30 days only. No personal data from official exam portals is included.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
