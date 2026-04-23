'use client'

import { useState, useEffect } from 'react'
import {
  Bell,
  Mail,
  Smartphone,
  CheckCheck,
  ExternalLink,
  Filter,
  Eye,
} from 'lucide-react'
import type { NotificationDelivery, ChangeEvent } from '@tcf-tracker/types'
import { formatTimeAgo, getStatusLabel } from '@tcf-tracker/utils'
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data'
import { supabase, isDemoMode } from '@/lib/supabase'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
          isOpen ? 'bg-emerald-50' : event.newStatus === 'NOT_OPEN' ? 'bg-slate-100' : 'bg-slate-100'
        )}>
          <ChannelIcon className={cn(
            'w-4 h-4',
            isOpen ? 'text-emerald-600' : event.newStatus === 'NOT_OPEN' ? 'text-slate-500' : 'text-slate-500'
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
                isOpen ? 'text-emerald-600' : event.newStatus === 'NOT_OPEN' ? 'text-slate-600' : 'text-slate-600'
              )}>
                {getStatusLabel(event.newStatus)}
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
            <a
              href={
                event.platformId === 'af-vancouver'
                  ? AF_VANCOUVER_REGISTRATION_URL
                  : '#'
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open official page
            </a>
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
  const [notifications, setNotifications] = useState<NotificationDelivery[]>(
    isDemoMode ? MOCK_NOTIFICATIONS : [],
  )
  const [filter, setFilter] = useState<'all' | 'unread' | 'open'>('all')

  useEffect(() => {
    if (isDemoMode || !supabase) return
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const { data: { user } } = await supabase!.auth.getUser()
    if (!user) return

    const { data } = await supabase!
      .from('notification_deliveries')
      .select('*, change_events(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (data) {
      setNotifications(
        (data as DbNotificationWithEvent[]).map((n) => {
          const ce = n.change_events
          return {
            id: n.id,
            userId: n.user_id,
            changeEventId: n.change_event_id,
            channel: n.channel as NotificationDelivery['channel'],
            status: n.status as NotificationDelivery['status'],
            sentAt: n.sent_at ?? undefined,
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
        }),
      )
    }
  }

  const markViewed = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isViewed: true } : n)))

    if (!isDemoMode && supabase) {
      await supabase
        .from('notification_deliveries')
        .update({ is_viewed: true, viewed_at: new Date().toISOString() })
        .eq('id', id)
    }
  }

  const markAllViewed = async () => {
    const unreadIds = notifications.filter((n) => !n.isViewed).map((n) => n.id)
    setNotifications((prev) => prev.map((n) => ({ ...n, isViewed: true })))

    if (!isDemoMode && supabase && unreadIds.length > 0) {
      await supabase
        .from('notification_deliveries')
        .update({ is_viewed: true, viewed_at: new Date().toISOString() })
        .in('id', unreadIds)
    }
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
                  { key: 'open', label: 'Seats Available' },
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
                  ? 'No Seats Available alerts at this time'
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
