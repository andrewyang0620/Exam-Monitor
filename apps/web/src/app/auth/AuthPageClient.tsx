'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Activity, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase, isDemoMode } from '@/lib/supabase'

export function AuthPageClient() {
  const searchParams = useSearchParams()
  const defaultMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Demo mode: bypass auth and go to dashboard
    if (isDemoMode || !supabase) {
      await new Promise((r) => setTimeout(r, 800))
      window.location.href = '/dashboard'
      return
    }

    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName.trim() || email.split('@')[0],
            },
          },
        })
        if (err) throw err
      }
      window.location.href = '/dashboard'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex w-[480px] flex-col justify-between p-12 flex-shrink-0"
        style={{ backgroundColor: '#0A1628' }}
      >
        <div>
          <Link href="/" className="flex items-center gap-2.5 mb-12">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">ExamSeat Monitor</span>
          </Link>

          <h2 className="text-3xl font-bold text-white leading-tight mb-4">
            Monitor. Alert. Register.
          </h2>
          <p className="text-slate-400 leading-relaxed mb-8">
            Track TEF & TCF Canada exam seat availability across Alliance Française and university centers in Canada.
          </p>

          <div className="space-y-4">
            {[
              { emoji: '🔍', text: 'Monitors public exam pages every 1–5 min' },
              { emoji: '🔔', text: 'Instant browser + email alerts when seats open' },
              { emoji: '✍️', text: 'Chrome extension autofills your info locally' },
              { emoji: '🔒', text: 'No passwords stored — privacy-first design' },
            ].map((item) => (
              <div key={item.text} className="flex items-start gap-3 text-sm text-slate-400">
                <span className="text-base mt-px">{item.emoji}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-700 pt-6">
            专为加拿大法语考试（TEF / TCF Canada）候选人设计的席位监控工具。
            最终注册和付款始终由您手动完成。
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">ExamSeat Monitor</span>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h1>
            <p className="text-sm text-slate-500">
              {mode === 'signin'
                ? 'Sign in to your monitoring dashboard'
                : 'Start monitoring exam seats for free'}
            </p>
          </div>

          {/* Demo / info notice */}
          {isDemoMode ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-6">
              <p className="text-xs text-blue-700">
                <span className="font-semibold">Demo mode:</span> Enter any email/password to access the dashboard with realistic mock data.
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-6">
              <p className="text-xs text-slate-600">
                {mode === 'signup'
                  ? 'Create a free account to start monitoring exam seat availability.'
                  : 'Sign in to your monitoring dashboard.'}
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Display name
                </label>
                <Input
                  type="text"
                  placeholder="Li Ming / 李明"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signin' && (
              <div className="flex justify-end">
                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 transition-colors">
                  Forgot password?
                </a>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </div>
              ) : (
                mode === 'signin' ? 'Sign in' : 'Create account'
              )}
            </Button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Privacy note */}
          <p className="text-center text-[10px] text-slate-400 mt-4 leading-relaxed">
            By signing up, you agree that final exam registration and payment
            remain your responsibility. We monitor public pages only.
          </p>
        </div>
      </div>
    </div>
  )
}
