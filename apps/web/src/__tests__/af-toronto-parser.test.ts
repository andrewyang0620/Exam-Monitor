import { describe, expect, it, vi } from 'vitest'
import {
  AF_TORONTO_ACTIVE_LIST_API_URL,
  AF_TORONTO_ACTIVE_SUBS_API_URL,
  parseAllianceFrancaiseToronto,
  parseAllianceFrancaiseTorontoHtml,
} from '../app/api/monitor/af-toronto-parser'

const TORONTO_WINDOWS_HTML = `
  <html>
    <body>
      <h1>TCF Canada</h1>
      <p>Registration for 2026 will open at 10:00 a.m. on the following dates:</p>
      <p>Q1 (Jan-Mar): December 2, 2025</p>
      <p>Q2 (Apr-Jun): March 2, 2026</p>
      <p>Q3 (Jul-Sep): May 20, 2026 (date has changed)</p>
      <p>Q4 (Oct-Dec): August 15, 2026</p>
      <h2>TCF Canada Exam Sessions</h2>
    </body>
  </html>
`

describe('parseAllianceFrancaiseTorontoHtml', () => {
  it('returns NOT_OPEN with next window info when all parent activities have no sub-activities', () => {
    const parsed = parseAllianceFrancaiseTorontoHtml({
      tcfPageHtml: TORONTO_WINDOWS_HTML,
      activityItems: [
        {
          id: 122840,
          name: 'E-TCF CANADA - 4 modules',
          num_of_sub_activities: 0,
          urgent_message: { status_description: 'Full' },
        },
        {
          id: 122846,
          name: 'E-TCF CANADA - 4 modules',
          num_of_sub_activities: 0,
        },
      ],
      subActivitiesByParentId: new Map(),
      now: new Date('2026-04-29T12:00:00-07:00'),
    })

    expect(parsed.availabilityStatus).toBe('NOT_OPEN')
    expect(parsed.seatsText).toContain('No sub-activities currently available')
    expect(parsed.nextWindowText).toContain('May 20, 2026 at 10:00 AM')
    expect(parsed.upcomingSessionLabels).toEqual([
      'May 20, 2026 at 10:00 AM',
      'August 15, 2026 at 10:00 AM',
    ])
  })

  it('returns NOT_OPEN when sub-courses exist but all of them are Full', () => {
    const parsed = parseAllianceFrancaiseTorontoHtml({
      tcfPageHtml: TORONTO_WINDOWS_HTML,
      activityItems: [
        {
          id: 122844,
          name: 'E-TCF CANADA - 4 modules',
          num_of_sub_activities: 1,
          urgent_message: { status_description: 'Full' },
        },
      ],
      subActivitiesByParentId: new Map([
        [
          122844,
          [
            {
              id: 122845,
              name: 'E-TCF CANADA - 4 modules',
              number: 'SCTCFC130526-MS',
              date_range: 'May 13, 2026',
              urgent_message: { status_description: 'Full' },
              enroll_now: {
                href: 'https://anc.ca.apm.activecommunities.com/aftoronto/activity/search/enroll/122845?wishlist_id=0&locale=en-US',
              },
              fee: { label: '$390.00' },
              location: { label: '4261 Sherwoodtowne blvd' },
            },
          ],
        ],
      ]),
      now: new Date('2026-04-29T12:00:00-07:00'),
    })

    expect(parsed.availabilityStatus).toBe('NOT_OPEN')
    expect(parsed.seatsText).toContain('May 13, 2026')
    expect(parsed.seatsText).toContain('Full')
    expect(parsed.soldOutSessionLabels).toContain('May 13, 2026')
  })

  it('returns OPEN when at least one sub-course is not Full', () => {
    const parsed = parseAllianceFrancaiseTorontoHtml({
      tcfPageHtml: TORONTO_WINDOWS_HTML,
      activityItems: [
        {
          id: 122844,
          name: 'E-TCF CANADA - 4 modules',
          num_of_sub_activities: 2,
        },
      ],
      subActivitiesByParentId: new Map([
        [
          122844,
          [
            {
              id: 122845,
              name: 'E-TCF CANADA - 4 modules',
              number: 'SCTCFC130526-MS',
              date_range: 'May 13, 2026',
              urgent_message: { status_description: 'Full' },
              fee: { label: '$390.00' },
              location: { label: '4261 Sherwoodtowne blvd' },
            },
            {
              id: 122846,
              name: 'E-TCF CANADA - 4 modules',
              number: 'SCTCFC200526-MS',
              date_range: 'May 20, 2026',
              urgent_message: { status_description: 'Open' },
              enroll_now: {
                href: 'https://anc.ca.apm.activecommunities.com/aftoronto/activity/search/enroll/122846?wishlist_id=0&locale=en-US',
              },
              fee: { label: '$390.00' },
              location: { label: '4261 Sherwoodtowne blvd' },
            },
          ],
        ],
      ]),
      now: new Date('2026-05-20T12:00:00-04:00'),
    })

    expect(parsed.availabilityStatus).toBe('OPEN')
    expect(parsed.sourceUrl).toContain('/enroll/122846')
    expect(parsed.seatsText).toContain('May 20, 2026')
    expect(parsed.soldOutSessionLabels).toContain('May 13, 2026')
  })
})

describe('parseAllianceFrancaiseToronto', () => {
  it('uses Active Communities as the primary status source and AF Toronto page only for future windows', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url === AF_TORONTO_ACTIVE_LIST_API_URL) {
        return {
          ok: true,
          json: async () => ({
            body: {
              activity_items: [
                {
                  id: 122844,
                  name: 'E-TCF CANADA - 4 modules',
                  num_of_sub_activities: 1,
                },
              ],
            },
          }),
        }
      }

      if (url === `${AF_TORONTO_ACTIVE_SUBS_API_URL}/122844?locale=en-US`) {
        return {
          ok: true,
          json: async () => ({
            body: {
              sub_activities: [
                {
                  id: 122845,
                  name: 'E-TCF CANADA - 4 modules',
                  number: 'SCTCFC130526-MS',
                  date_range: 'May 13, 2026',
                  urgent_message: { status_description: 'Full' },
                  enroll_now: {
                    href: 'https://anc.ca.apm.activecommunities.com/aftoronto/activity/search/enroll/122845?wishlist_id=0&locale=en-US',
                  },
                  fee: { label: '$390.00' },
                  location: { label: '4261 Sherwoodtowne blvd' },
                },
              ],
            },
          }),
        }
      }

      return {
        ok: true,
        text: async () => TORONTO_WINDOWS_HTML,
      }
    })

    vi.stubGlobal('fetch', fetchMock)

    const parsed = await parseAllianceFrancaiseToronto()

    expect(parsed.availabilityStatus).toBe('NOT_OPEN')
    expect(parsed.nextWindowText).toContain('May 20, 2026 at 10:00 AM')
    expect(parsed.seatsText).toContain('May 13, 2026')

    vi.unstubAllGlobals()
  })
})
