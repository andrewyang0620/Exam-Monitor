import { describe, expect, it, vi } from 'vitest'
import {
  parseAllianceFrancaiseToronto,
  parseAllianceFrancaiseTorontoHtml,
} from '../app/api/monitor/af-toronto-parser'

const TORONTO_NOT_OPEN_HTML = `
  <html>
    <body>
      <h1>TCF Canada</h1>
      <p>Registration for 2026 will open at 10:00 a.m. on the following dates:</p>
      <p>Q1 (Jan-Mar): December 2, 2025</p>
      <p>Q2 (Apr-Jun): March 2, 2026</p>
      <p>Q3 (Jul-Sep): May 20, 2026 (date has changed)</p>
      <p>Q4 (Oct-Dec): August 15, 2026</p>
      <h2>Registrations</h2>
      <h2>E-TCF Canada</h2>
      <h3>Dates &amp; Times</h3>
      <p>No sessions currently available</p>
      <h2>P-TCF Canada</h2>
      <h3>Dates &amp; Times</h3>
      <p>No sessions currently available</p>
      <p>If a session is not listed, it is full.</p>
    </body>
  </html>
`

const TORONTO_OPEN_HTML = `
  <html>
    <body>
      <h1>TCF Canada</h1>
      <p>Q3 (Jul-Sep) opens on Wednesday, May 20th 2026 at 10:00 a.m.</p>
      <h2>Registrations</h2>
      <h2>E-TCF Canada</h2>
      <h3>Dates &amp; Times</h3>
      <p>Wednesday July 8, 2026 - 10:00 AM</p>
      <p>Friday July 10, 2026 - 1:00 PM</p>
      <a href="https://anc.ca.apm.activecommunities.com/">Book your test</a>
    </body>
  </html>
`

describe('parseAllianceFrancaiseTorontoHtml', () => {
  it('returns NOT_OPEN with next window information when no session is listed', () => {
    const parsed = parseAllianceFrancaiseTorontoHtml({
      tcfPageHtml: TORONTO_NOT_OPEN_HTML,
      faqPageHtml: '<p>Registration for TCF Canada exams is entirely online.</p>',
      now: new Date('2026-04-23T12:00:00-07:00'),
    })

    expect(parsed.availabilityStatus).toBe('NOT_OPEN')
    expect(parsed.nextWindowText).toContain('May 20, 2026 at 10:00 AM')
    expect(parsed.upcomingSessionLabels).toContain('Q3 (Jul-Sep)')
    expect(parsed.seatsText).toContain('No sessions currently available')
  })

  it('returns OPEN when the Dates & Times section contains real session entries', () => {
    const parsed = parseAllianceFrancaiseTorontoHtml({
      tcfPageHtml: TORONTO_OPEN_HTML,
      now: new Date('2026-05-21T12:00:00-07:00'),
    })

    expect(parsed.availabilityStatus).toBe('OPEN')
    expect(parsed.seatsText).toContain('July 8, 2026')
    expect(parsed.seatsText).toContain('July 10, 2026')
    expect(parsed.confidence).toBeGreaterThan(0.8)
  })

  it('does not treat a plain Dates & Times heading as OPEN without new session text', () => {
    const parsed = parseAllianceFrancaiseTorontoHtml({
      tcfPageHtml: `
        <html>
          <body>
            <h1>TCF Canada</h1>
            <p>Q3 (Jul-Sep) opens on Wednesday, May 20th 2026 at 10:00 a.m.</p>
            <h2>Registrations</h2>
            <h2>E-TCF Canada</h2>
            <h3>Dates &amp; Times</h3>
            <p>No sessions currently available</p>
          </body>
        </html>
      `,
      now: new Date('2026-05-21T12:00:00-07:00'),
    })

    expect(parsed.availabilityStatus).toBe('NOT_OPEN')
    expect(parsed.seatsText).toBe('No sessions currently available')
  })
})

describe('parseAllianceFrancaiseToronto', () => {
  it('does not use the info page as a fallback status source when the main page is unavailable', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => `
          <html>
            <body>
              <a href="/en/exams/tests/informations-about-tcf-canada/tcf-canada">Register now</a>
              <p>Registration for TCF Canada exams is entirely online.</p>
            </body>
          </html>
        `,
      })

    vi.stubGlobal('fetch', fetchMock)

    const parsed = await parseAllianceFrancaiseToronto()

    expect(parsed.availabilityStatus).toBe('MONITORING')
    expect(parsed.seatsText).toContain('info page fetched for reference only')
    expect(parsed.detectedText).toContain('Register now')

    vi.unstubAllGlobals()
  })
})
