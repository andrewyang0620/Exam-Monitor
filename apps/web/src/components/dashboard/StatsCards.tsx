'use client'

import { BookOpen, Bell, RefreshCw, Globe, TrendingUp } from 'lucide-react'
import { formatTimeAgo } from '@tcf-tracker/utils'
import type { DashboardStats } from '@tcf-tracker/types'
import { cn } from '@/lib/utils'

interface StatsCardsProps {
  stats: DashboardStats
}

const statCards = (stats: DashboardStats) => [
  {
    label: 'Following',
    value: stats.activeRulesCount,
    icon: BookOpen,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    sublabel: 'followed exams',
    accent: false,
  },
  {
    label: 'Open Alerts',
    value: stats.openAlertsCount,
    icon: Bell,
    iconColor: stats.openAlertsCount > 0 ? 'text-emerald-600' : 'text-slate-400',
    iconBg: stats.openAlertsCount > 0 ? 'bg-emerald-50' : 'bg-slate-50',
    sublabel: stats.openAlertsCount > 0 ? 'action needed' : 'all clear',
    accent: stats.openAlertsCount > 0,
  },
  {
    label: 'Last Check',
    value: stats.lastCheckAt ? formatTimeAgo(stats.lastCheckAt) : '—',
    icon: RefreshCw,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
    sublabel: 'monitoring active',
    accent: false,
    smallValue: true,
  },
  {
    label: 'Platforms',
    value: stats.supportedPlatformsCount,
    icon: Globe,
    iconColor: 'text-slate-600',
    iconBg: 'bg-slate-100',
    sublabel: `${stats.monitoredCitiesCount} cities covered`,
    accent: false,
  },
]

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = statCards(stats)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <div
            key={card.label}
            className={cn(
              'bg-white rounded-2xl border p-5 shadow-card transition-all duration-200 hover:shadow-card-hover',
              card.accent ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-200'
            )}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p
                  className={cn(
                    'font-bold text-slate-900',
                    card.smallValue ? 'text-xl' : 'text-3xl'
                  )}
                >
                  {card.value}
                </p>
                <p className="text-xs text-slate-400 mt-1">{card.sublabel}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', card.iconBg)}>
                <Icon className={cn('w-4 h-4', card.iconColor)} />
              </div>
            </div>
            {card.accent && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <TrendingUp className="w-3 h-3" />
                Seats available now
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
