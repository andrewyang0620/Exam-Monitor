/**
 * POST /api/monitor
 *
 * Triggers the monitoring pipeline for supported real platforms.
 * Protected by MONITOR_API_SECRET header.
 *
 * Flow:
 *  1. Fetch + parse each supported platform
 *  2. Insert seat_observation
 *  3. Compare with last observation; if status changed, insert change_event
 *  4. Fan out notification_deliveries to all matching active rules
 *  5. Send emails for rules with 'email' channel
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import {
  parseAllianceFrancaiseVancouver,
  AF_VANCOUVER_REGISTRATION_URL,
} from './af-vancouver-parser'
import {
  parseAllianceFrancaiseToronto,
  AF_TORONTO_ID,
  AF_TORONTO_TCF_PAGE_URL,
} from './af-toronto-parser'
import { sendEmail, buildSeatOpenedEmail } from '@/lib/email'

interface ParsedObservationLike {
  platformId: string
  centerName: string
  city: string
  province: string
  examType: string
  sessionLabel: string
  availabilityStatus: string
  seatsText: string
  sourceUrl: string
  sourceHash: string
  confidence: number
  detectedText: string
  nextWindowText?: string
  upcomingSessionLabels?: string[]
  soldOutSessionLabels?: string[]
}

interface PlatformMonitorConfig {
  platformId: string
  registrationUrl: string
  parse: () => Promise<ParsedObservationLike>
}

const MONITORED_PLATFORMS: PlatformMonitorConfig[] = [
  {
    platformId: 'af-vancouver',
    registrationUrl: AF_VANCOUVER_REGISTRATION_URL,
    parse: parseAllianceFrancaiseVancouver,
  },
  {
    platformId: AF_TORONTO_ID,
    registrationUrl: AF_TORONTO_TCF_PAGE_URL,
    parse: parseAllianceFrancaiseToronto,
  },
]

function verifySecret(req: NextRequest): boolean {
  const secret = process.env.MONITOR_API_SECRET
  if (!secret) {
    return process.env.NODE_ENV !== 'production'
  }
  if (req.headers.get('x-monitor-secret') === secret) return true
  const authHeader = req.headers.get('authorization') ?? ''
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true
  return false
}

function deriveEventType(previousStatus: string | null, newStatus: string): string {
  if (newStatus === 'OPEN') return 'OPENED'
  if (newStatus === 'NOT_OPEN' && previousStatus === 'OPEN') return 'SOLD_OUT'
  if (
    newStatus === 'NOT_OPEN' &&
    (!previousStatus || previousStatus === 'MONITORING' || previousStatus === 'UNKNOWN')
  ) {
    return 'DATE_ADDED'
  }
  return 'STATUS_CHANGED'
}

async function recordSuccess(
  db: ReturnType<typeof createServiceClient>,
  platformId: string,
  now: string,
  latestObservedAt: string,
) {
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
    .eq('id', platformId)
}

async function recordFailure(
  db: ReturnType<typeof createServiceClient>,
  platformId: string,
  now: string,
  message: string,
) {
  const { data: row } = await db
    .from('platforms')
    .select('consecutive_failures')
    .eq('id', platformId)
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
    .eq('id', platformId)
}

async function processPlatformMonitor(
  db: ReturnType<typeof createServiceClient>,
  config: PlatformMonitorConfig,
  now: string,
) {
  let parsed: ParsedObservationLike
  try {
    parsed = await config.parse()
    console.log(
      '[monitor] parsed:',
      config.platformId,
      parsed.availabilityStatus,
      parsed.sessionLabel,
      parsed.confidence,
    )
  } catch (fetchErr) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
    console.error('[monitor] parse/fetch failed:', config.platformId, msg)
    await recordFailure(db, config.platformId, now, `Fetch/parse failed: ${msg}`)
    return {
      platformId: config.platformId,
      ok: false,
      error: 'fetch_failed',
      detail: msg,
    }
  }

  try {
    const { data: lastObs } = await db
      .from('seat_observations')
      .select('id, availability_status, source_hash')
      .eq('platform_id', config.platformId)
      .order('observed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastObs?.source_hash === parsed.sourceHash) {
      console.log('[monitor] hash unchanged - skipping DB write:', config.platformId)
      await db
        .from('platforms')
        .update({
          last_success_at: now,
          consecutive_failures: 0,
          last_error_message: null,
          health_status: 'operational',
          updated_at: now,
        })
        .eq('id', config.platformId)

      return {
        platformId: config.platformId,
        ok: true,
        changed: false,
        status: parsed.availabilityStatus,
        reason: 'hash_unchanged',
      }
    }

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
        metadata: {
          nextWindowText: parsed.nextWindowText ?? null,
          upcomingSessionLabels: parsed.upcomingSessionLabels ?? null,
          soldOutSessionLabels: parsed.soldOutSessionLabels ?? null,
        },
      })
      .select('id')
      .single()

    if (obsErr || !newObs) {
      throw new Error(`observation insert failed: ${obsErr?.message}`)
    }

    await recordSuccess(db, config.platformId, now, now)

    const previousStatus = lastObs?.availability_status ?? null
    if (previousStatus === parsed.availabilityStatus) {
      console.log('[monitor] status unchanged:', config.platformId, parsed.availabilityStatus)
      return {
        platformId: config.platformId,
        ok: true,
        changed: false,
        status: parsed.availabilityStatus,
        observationId: newObs.id,
        reason: 'status_unchanged',
      }
    }

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
        official_url: config.registrationUrl,
      })
      .select('id')
      .single()

    if (evtErr || !changeEvent) {
      throw new Error(`change_event insert failed: ${evtErr?.message}`)
    }

    console.log(
      `[monitor] change event created for ${config.platformId}: ${previousStatus} -> ${parsed.availabilityStatus} (${eventType})`,
    )

    const { data: matchingRules } = await db
      .from('monitoring_rules')
      .select('id, user_id, channels')
      .eq('platform_id', config.platformId)
      .eq('is_active', true)

    const rules = matchingRules ?? []
    console.log(`[monitor] ${config.platformId} fanout to ${rules.length} rule(s)`)

    for (const rule of rules) {
      const channels = (rule.channels as string[]) ?? []

      if (channels.includes('email')) {
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
            registrationUrl: config.registrationUrl,
            detectedAt: now,
          })
          template.to = profile.email

          const emailResult = await sendEmail(template)
          await db.from('notification_deliveries').insert({
            user_id: rule.user_id,
            change_event_id: changeEvent.id,
            rule_id: rule.id,
            channel: 'email',
            status: emailResult.ok ? 'sent' : 'failed',
            error_message: emailResult.ok ? null : emailResult.errorMessage ?? 'Email delivery failed',
            sent_at: emailResult.ok ? now : null,
          })
        }
      }

      if (channels.includes('sms')) {
        await db.from('notification_deliveries').insert({
          user_id: rule.user_id,
          change_event_id: changeEvent.id,
          rule_id: rule.id,
          channel: 'sms',
          status: 'failed',
          error_message: 'SMS notifications are not implemented yet',
          sent_at: null,
        })
      }
    }

    return {
      platformId: config.platformId,
      ok: true,
      changed: true,
      eventType,
      previousStatus,
      newStatus: parsed.availabilityStatus,
      changeEventId: changeEvent.id,
      observationId: newObs.id,
      notifiedRules: rules.length,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[monitor] pipeline error:', config.platformId, msg)
    await recordFailure(db, config.platformId, now, msg)
    return {
      platformId: config.platformId,
      ok: false,
      error: 'pipeline_error',
      detail: msg,
    }
  }
}

export async function POST(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()
  const results = []

  for (const config of MONITORED_PLATFORMS) {
    results.push(await processPlatformMonitor(db, config, now))
  }

  const okCount = results.filter((result) => result.ok).length
  const changedCount = results.filter((result) => result.ok && result.changed).length
  const status = okCount === 0 ? 502 : 200

  return NextResponse.json(
    {
      ok: okCount > 0,
      checkedAt: now,
      monitoredPlatforms: MONITORED_PLATFORMS.map((platform) => platform.platformId),
      okCount,
      changedCount,
      results,
    },
    { status },
  )
}

export async function GET(req: NextRequest) {
  return POST(req)
}
