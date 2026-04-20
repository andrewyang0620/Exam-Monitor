/**
 * GET /api/latest-event
 *
 * Public endpoint — returns the latest change event for AF Vancouver.
 * Used by the Chrome extension popup to show current status without user auth.
 *
 * Returns:
 *  { event: DbChangeEvent | null, observation: DbObservation | null }
 */

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { AF_VANCOUVER_REGISTRATION_URL } from '../monitor/af-vancouver-parser'

export const revalidate = 60 // Cache for 60 s on Vercel Edge

export async function GET() {
  try {
    const db = createServiceClient()

    // Latest change event for AF Vancouver
    const { data: event } = await db
      .from('change_events')
      .select('*')
      .eq('platform_id', 'af-vancouver')
      .order('detected_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Latest observation for AF Vancouver
    const { data: observation } = await db
      .from('seat_observations')
      .select('*')
      .eq('platform_id', 'af-vancouver')
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      event: event ?? null,
      observation: observation ?? null,
      registrationUrl: AF_VANCOUVER_REGISTRATION_URL,
    })
  } catch (err) {
    console.error('[latest-event] error:', err)
    return NextResponse.json({ event: null, observation: null, registrationUrl: null })
  }
}
