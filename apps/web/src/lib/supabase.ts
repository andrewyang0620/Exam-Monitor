import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// In demo mode (no Supabase credentials), the client will not connect.
// All data is served from mock-data.ts.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isDemoMode =
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || !supabaseUrl || !supabaseAnonKey
