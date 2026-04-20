import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Demo mode: no Supabase credentials → serve from mock-data.ts
export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !supabaseUrl || !supabaseAnonKey

// Browser/client Supabase client (anon key — safe to expose)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null

// Server-only Supabase client (service role key — NEVER import in client components)
// Usage: import { createServiceClient } from '@/lib/supabase' inside API routes only
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    )
  }
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
