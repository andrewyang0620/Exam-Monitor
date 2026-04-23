'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BookOpen,
  Bell,
  Globe,
  HelpCircle,
  Activity,
  ExternalLink,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DEMO_USER, getUnreadCount } from '@/lib/mock-data'
import { supabase, isDemoMode } from '@/lib/supabase'

interface SidebarUser {
  displayName: string
  email: string
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Watchlist',
    href: '/dashboard/rules',
    icon: BookOpen,
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    badgeKey: 'notifications' as const,
  },
  {
    label: 'Platforms',
    href: '/dashboard/platforms',
    icon: Globe,
  },
  {
    label: 'FAQ',
    href: '/dashboard/faq',
    icon: HelpCircle,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const unreadCount = getUnreadCount()
  const [user, setUser] = useState<SidebarUser>({
    displayName: DEMO_USER.displayName ?? 'Demo User',
    email: DEMO_USER.email,
  })
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (isDemoMode || !supabase) return

    let isMounted = true

    async function loadUser() {
      const {
        data: { user: authUser },
      } = await supabase!.auth.getUser()

      if (!authUser || !isMounted) return

      const { data: profile } = await supabase!
        .from('profiles')
        .select('email, display_name')
        .eq('id', authUser.id)
        .maybeSingle()

      if (!isMounted) return

      const email = profile?.email ?? authUser.email ?? ''
      const metadataDisplayName = authUser.user_metadata?.display_name
      const displayName =
        profile?.display_name?.trim() ||
        (typeof metadataDisplayName === 'string' ? metadataDisplayName.trim() : '') ||
        email.split('@')[0] ||
        'Account'

      setUser({
        displayName,
        email,
      })
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace('/auth')
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [router])

  async function handleSignOut() {
    setIsSigningOut(true)

    if (isDemoMode || !supabase) {
      router.replace('/auth')
      return
    }

    const { error } = await supabase.auth.signOut()
    if (error) {
      setIsSigningOut(false)
      return
    }

    router.replace('/auth')
  }

  function getInitials(name: string, email: string) {
    const source = name.trim() || email.split('@')[0] || 'Account'
    const parts = source.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return source.slice(0, 2).toUpperCase()
  }

  const initials = getInitials(user.displayName, user.email)

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-30"
      style={{ backgroundColor: '#0A1628', borderRight: '1px solid #1a2740' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1a2740]">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">ExamSeat</div>
          <div className="text-slate-400 text-xs">Monitor</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          const badge = item.badgeKey === 'notifications' && unreadCount > 0 ? unreadCount : null

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-slate-400 hover:bg-[#141f35] hover:text-slate-200'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <span className="flex-1">{item.label}</span>
              {badge !== null && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-semibold text-white">
                  {badge}
                </span>
              )}
              {isActive && (
                <ChevronRight className="w-3 h-3 text-blue-400 opacity-60" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Monitoring status */}
      <div className="mx-3 mb-3 px-3 py-3 rounded-xl bg-[#0f2040] border border-[#1a3050]">
        <div className="flex items-center gap-2 mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-emerald-400">Active Monitoring</span>
        </div>
        <p className="text-xs text-slate-500">3 rules · Last check 2m ago</p>
      </div>

      {/* Extension CTA */}
      <div className="mx-3 mb-3">
        <a
          href="#"
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs text-slate-400 hover:bg-[#141f35] hover:text-slate-300 transition-colors border border-[#1a2740]"
        >
          <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Get Chrome Extension</span>
        </a>
      </div>

      {/* User */}
      <div className="px-3 pb-4 border-t border-[#1a2740] pt-3">
        <div className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#141f35] transition-colors group">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-semibold text-white">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-300 truncate">{user.displayName}</div>
            <div className="text-[10px] text-slate-500 truncate">
              {isSigningOut ? 'Signing out...' : user.email}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-[#1e3a5f] hover:text-slate-300 disabled:cursor-wait disabled:opacity-70 flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
