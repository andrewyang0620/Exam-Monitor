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
  // Manual trigger via x-monitor-secret header
  if (req.headers.get('x-monitor-secret') === secret) return true
  // Vercel Cron sends: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  return false
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

// ─── Health helpers ───────────────────────────────────────────────────────────

async function recordSuccess(db: ReturnType<typeof createServiceClient>, now: string, latestObservedAt: string) {
  await db
    .from('platforms')
    .update({
      last_success_at: now,
      consecutive_failures: 0,
      last_error_message: null,
      latest_observed_at: latestObservedAt,
      health_status: 'operational',
      updated_at: now,
    })
    .eq('id', 'af-vancouver')
}

async function recordFailure(db: ReturnType<typeof createServiceClient>, now: string, message: string) {
  // Read current consecutive_failures then increment
  const { data: row } = await db
    .from('platforms')
    .select('consecutive_failures')
    .eq('id', 'af-vancouver')
    .single()

  const newCount = (row?.consecutive_failures ?? 0) + 1

  await db
    .from('platforms')
    .update({
      last_failure_at: now,
      consecutive_failures: newCount,
      last_error_message: message.slice(0, 500),
      health_status: newCount >= 3 ? 'degraded' : 'operational',
      updated_at: now,
    })
    .eq('id', 'af-vancouver')
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()

  let parsed: Awaited<ReturnType<typeof parseAllianceFrancaiseVancouver>>
  try {
    // 1. Fetch and parse
    parsed = await parseAllianceFrancaiseVancouver()
    console.log('[monitor] parsed:', parsed.availabilityStatus, parsed.sessionLabel, parsed.confidence)
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
    console.error('[monitor] parse/fetch failed:', msg)
    await recordFailure(db, now, `Fetch/parse failed: ${msg}`)
    return NextResponse.json({ error: 'fetch_failed', detail: msg }, { status: 502 })
  }

  try {
    // 2. Get last observation to compare hash + status
    const { data: lastObs } = await db
      .from('seat_observations')
      .select('id, availability_status, source_hash')
      .eq('platform_id', 'af-vancouver')
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Skip if hash identical (page hasn't changed at all)
    if (lastObs?.source_hash === parsed.sourceHash) {
      console.log('[monitor] hash unchanged — skipping DB write')
      await recordSuccess(db, now, now)
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
      throw new Error(`observation insert failed: ${obsErr?.message}`)
    }

    // Always record success + latest observation time
    await recordSuccess(db, now, now)

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
      throw new Error(`change_event insert failed: ${evtErr?.message}`)
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
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[monitor] pipeline error:', msg)
    await recordFailure(db, now, msg)
    return NextResponse.json({ error: 'pipeline_error', detail: msg }, { status: 500 })
  }
}

// Also support GET — used by Vercel Cron (which sends GET with Authorization: Bearer <CRON_SECRET>)
// Falls through to the same pipeline as POST.
export async function GET(req: NextRequest) {
  return POST(req)
}
