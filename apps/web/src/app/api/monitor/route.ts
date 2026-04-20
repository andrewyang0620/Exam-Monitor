/**
 * POST /api/monitor
 *
 * Triggers the monitoring pipeline for Alliance Française Vancouver (TCF Canada).
 * Protected by MONITOR_API_SECRET header.
 *
 * Flow:
 *  1. Fetch + parse the public detection page
 *  2. Insert seat_observation
 *  3. Compare with last observation — if status changed, insert change_event
 *  4. Fan out notification_deliveries to all matching active rules
 *  5. Send emails for rules with 'email' channel (via Resend scaffold)
 *
 * Trigger manually:
 *   curl -X POST https://your-app.com/api/monitor \
 *        -H "x-monitor-secret: <MONITOR_API_SECRET>"
 *
 * For scheduled runs, point a cron service (Vercel Cron, GitHub Actions, etc.)
 * at this endpoint with the secret header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import {
  parseAllianceFrancaiseVancouver,
  AF_VANCOUVER_REGISTRATION_URL,
} from './af-vancouver-parser'
import { sendEmail, buildSeatOpenedEmail } from '@/lib/email'

// ─── Auth guard ───────────────────────────────────────────────────────────────

function verifySecret(req: NextRequest): boolean {
  const secret = process.env.MONITOR_API_SECRET
  if (!secret) {
    // No secret configured — only allow in development
    return process.env.NODE_ENV !== 'production'
  }
  return req.headers.get('x-monitor-secret') === secret
}

// ─── Event type derivation ────────────────────────────────────────────────────

function deriveEventType(
  previousStatus: string | null,
  newStatus: string,
): string {
  if (newStatus === 'OPEN') return 'OPENED'
  if (newStatus === 'SOLD_OUT') return 'SOLD_OUT'
  if (newStatus === 'EXPECTED' && (!previousStatus || previousStatus === 'MONITORING')) {
    return 'DATE_ADDED'
  }
  return 'STATUS_CHANGED'
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()

  // 1. Fetch and parse
  const parsed = await parseAllianceFrancaiseVancouver()
  console.log('[monitor] parsed:', parsed.availabilityStatus, parsed.sessionLabel, parsed.confidence)

  // 2. Get last observation to compare hash + status
  const { data: lastObs } = await db
    .from('seat_observations')
    .select('id, availability_status, source_hash')
    .eq('platform_id', 'af-vancouver')
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Skip if hash identical (page hasn't changed)
  if (lastObs?.source_hash === parsed.sourceHash) {
    console.log('[monitor] hash unchanged — skipping DB write')
    return NextResponse.json({
      changed: false,
      status: parsed.availabilityStatus,
      reason: 'hash_unchanged',
    })
  }

  // 3. Insert new seat_observation
  const { data: newObs, error: obsErr } = await db
    .from('seat_observations')
    .insert({
      platform_id: parsed.platformId,
      center_name: parsed.centerName,
      city: parsed.city,
      province: parsed.province,
      exam_type: parsed.examType,
      session_label: parsed.sessionLabel,
      availability_status: parsed.availabilityStatus,
      seats_text: parsed.seatsText,
      source_url: parsed.sourceUrl,
      source_hash: parsed.sourceHash,
      confidence: parsed.confidence,
      observed_at: now,
    })
    .select('id')
    .single()

  if (obsErr || !newObs) {
    console.error('[monitor] failed to insert observation', obsErr)
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 })
  }

  // 4. No status change — done
  const previousStatus = lastObs?.availability_status ?? null
  if (previousStatus === parsed.availabilityStatus) {
    console.log('[monitor] status unchanged:', parsed.availabilityStatus)
    return NextResponse.json({
      changed: false,
      status: parsed.availabilityStatus,
      observationId: newObs.id,
      reason: 'status_unchanged',
    })
  }

  // 5. Status changed — insert change_event
  const eventType = deriveEventType(previousStatus, parsed.availabilityStatus)

  const { data: changeEvent, error: evtErr } = await db
    .from('change_events')
    .insert({
      platform_id: parsed.platformId,
      exam_type: parsed.examType,
      city: parsed.city,
      center_name: parsed.centerName,
      previous_status: previousStatus,
      new_status: parsed.availabilityStatus,
      event_type: eventType,
      detected_at: now,
      confidence: parsed.confidence,
      raw_observation_id: newObs.id,
      official_url: AF_VANCOUVER_REGISTRATION_URL,
    })
    .select('id')
    .single()

  if (evtErr || !changeEvent) {
    console.error('[monitor] failed to insert change_event', evtErr)
    return NextResponse.json({ error: 'change_event insert failed' }, { status: 500 })
  }

  console.log(
    `[monitor] change event created: ${previousStatus} → ${parsed.availabilityStatus} (${eventType})`,
  )

  // 6. Find all active rules matching this platform
  const { data: matchingRules } = await db
    .from('monitoring_rules')
    .select('id, user_id, channels')
    .eq('platform_id', 'af-vancouver')
    .eq('is_active', true)

  const rules = matchingRules ?? []
  console.log(`[monitor] fanning out to ${rules.length} rule(s)`)

  // 7. For each rule: create notification_deliveries + send email
  for (const rule of rules) {
    // Browser notification delivery
    await db.from('notification_deliveries').insert({
      user_id: rule.user_id,
      change_event_id: changeEvent.id,
      rule_id: rule.id,
      channel: 'browser',
      status: 'sent',
      sent_at: now,
    })

    // Email delivery (if channel includes 'email')
    if ((rule.channels as string[]).includes('email')) {
      // Get user email from profiles
      const { data: profile } = await db
        .from('profiles')
        .select('email, display_name')
        .eq('id', rule.user_id)
        .single()

      if (profile?.email) {
        const template = buildSeatOpenedEmail({
          displayName: profile.display_name ?? profile.email.split('@')[0],
          centerName: parsed.centerName,
          examType: parsed.examType,
          city: parsed.city,
          registrationUrl: AF_VANCOUVER_REGISTRATION_URL,
          detectedAt: now,
        })
        template.to = profile.email

        const sent = await sendEmail(template)
        await db.from('notification_deliveries').insert({
          user_id: rule.user_id,
          change_event_id: changeEvent.id,
          rule_id: rule.id,
          channel: 'email',
          status: sent ? 'sent' : 'failed',
          sent_at: sent ? now : null,
        })
      }
    }
  }

  return NextResponse.json({
    changed: true,
    eventType,
    previousStatus,
    newStatus: parsed.availabilityStatus,
    changeEventId: changeEvent.id,
    observationId: newObs.id,
    notifiedRules: rules.length,
  })
}

// Also support GET for quick status check (no DB writes)
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const parsed = await parseAllianceFrancaiseVancouver()
  return NextResponse.json({
    platformId: parsed.platformId,
    status: parsed.availabilityStatus,
    sessionLabel: parsed.sessionLabel,
    seatsText: parsed.seatsText,
    confidence: parsed.confidence,
    sourceHash: parsed.sourceHash,
  })
}
