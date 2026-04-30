/**
 * Email provider wrapper - V1 scaffold
 *
 * Currently wired to Resend (https://resend.com).
 * Set RESEND_API_KEY + EMAIL_FROM in env to activate real sends.
 * Without those vars, emails are logged to console and skipped.
 *
 * To swap provider: replace the fetch block below with your provider's SDK call.
 */

export interface EmailPayload {
  to: string
  subject: string
  html: string
}

export interface EmailSendResult {
  ok: boolean
  errorMessage?: string
}

export async function sendEmail(payload: EmailPayload): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM ?? 'ExamSeat Monitor <noreply@examseats.app>'

  if (!apiKey) {
    console.log('[email] RESEND_API_KEY not set - skipping send:', payload.subject, '->', payload.to)
    return { ok: false, errorMessage: 'RESEND_API_KEY is not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error('[email] Resend error', res.status, body)
      const compactBody = body.replace(/\s+/g, ' ').trim().slice(0, 300)
      return {
        ok: false,
        errorMessage: compactBody ? `Resend ${res.status}: ${compactBody}` : `Resend ${res.status}`,
      }
    }

    return { ok: true }
  } catch (err) {
    console.error('[email] send failed', err)
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message.slice(0, 300) : 'Email send failed',
    }
  }
}

export function buildSeatOpenedEmail(params: {
  displayName: string
  centerName: string
  examType: string
  city: string
  registrationUrl: string
  detectedAt: string
}): EmailPayload {
  const { centerName, examType, city, registrationUrl, detectedAt } = params
  const time = new Date(detectedAt).toLocaleString('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Vancouver',
  })

  return {
    to: '',
    subject: `Seats available - ${examType} at ${centerName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
        <div style="background:#0A1628;padding:24px 28px;border-radius:12px 12px 0 0">
          <span style="color:#fff;font-size:16px;font-weight:700">ExamSeat Monitor</span>
        </div>
        <div style="padding:28px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px">
          <h2 style="margin:0 0 8px;font-size:20px;color:#059669">Seats are open</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px">Detected at ${time} (Pacific)</p>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;border-bottom:1px solid #f1f5f9">Exam center</td>
                <td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9">${centerName}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px;border-bottom:1px solid #f1f5f9">Exam type</td>
                <td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #f1f5f9">${examType}</td></tr>
            <tr><td style="padding:8px 0;color:#94a3b8;font-size:13px">City</td>
                <td style="padding:8px 0;font-size:13px;font-weight:600;text-align:right">${city}</td></tr>
          </table>

          <a href="${registrationUrl}"
             style="display:block;text-align:center;background:#2563EB;color:#fff;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:20px">
            Open official page
          </a>

          <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.5">
            Final registration and payment remain your responsibility.
            This notification was triggered by a public page change only.
          </p>
        </div>
      </div>
    `,
  }
}
