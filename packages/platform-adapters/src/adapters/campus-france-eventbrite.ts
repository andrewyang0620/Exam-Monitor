import type { PlatformAdapter } from '../types'

/**
 * Campus France Canada — Eventbrite-style platform
 * 
 * Some TCF Canada sessions in Montréal and other cities are listed
 * through Eventbrite or similar event ticketing pages. This adapter
 * detects Eventbrite links on the Campus France Canada page.
 * 
 * Autofill support is partial — Eventbrite's own form fields are
 * more easily autofillable than the official AF forms.
 */
const campusFranceEventbrite: PlatformAdapter = {
  id: 'campus-france-eventbrite',
  displayName: 'Campus France Canada (Eventbrite)',
  shortName: 'Campus France',

  city: 'Montréal',
  province: 'QC',
  country: 'CA',
  region: 'Greater Montréal',

  examTypesSupported: ['TCF Canada', 'TCF SO'],
  entryUrl: 'https://www.canada.campusfrance.org/tests-et-examens',

  detectionMode: 'eventbrite-link',
  authRequiredForMonitoring: false,

  recommendedPollingIntervalSec: 300, // 5 min (lower urgency, Eventbrite listings persist longer)
  cooldownSeconds: 1800,              // 30 min

  availabilitySelectors: [
    'a[href*="eventbrite"]',
    'a[href*="eventbrite.ca"]',
    'a[href*="eventbrite.com"]',
    '.event-link',
  ],
  availabilityKeywords: [
    'eventbrite',
    'register',
    'inscrivez-vous',
    'billets',
    'tickets',
    'session tcf',
    'test tcf',
  ],
  soldOutKeywords: [
    'sold out',
    'complet',
    'no events found',
    'aucune session',
    'not available',
  ],

  fixedReleaseWindows: [
    {
      label: 'Session-by-session release',
      notes: 'Sessions announced 2–4 weeks before exam date. No fixed day.',
      nextExpectedDate: '2026-05-15',
    },
  ],

  confidenceRules: [
    {
      condition: 'Eventbrite link found with active session',
      confidenceBoost: 0.35,
    },
    {
      condition: 'Eventbrite link found but status unknown',
      confidenceBoost: 0.1,
    },
    {
      condition: 'No Eventbrite link found but page mentions TCF',
      confidenceBoost: -0.1,
    },
    {
      condition: 'Platform returned error',
      confidenceBoost: -0.4,
    },
  ],

  supportsLocalAutofill: true,
  supportsJumpToOfficialPage: true,
  contentScriptUrlPatterns: [
    '*://www.eventbrite.ca/e/*',
    '*://www.eventbrite.com/e/*',
    '*://www.canada.campusfrance.org/*',
  ],
  autofillFieldMap: {
    // Eventbrite checkout fields
    firstName: '#first-name',
    lastName: '#last-name',
    email: '#email',
    // Note: Eventbrite email is also used for account — mapped carefully
  },

  riskLevel: 'medium',
  notes:
    'Platform health is "degraded" in demo — Eventbrite link detection can break if campus France redesigns its pages. Re-verify selectors monthly.',
  lastVerified: '2026-02-20',

  // Demo seed data for V1
  demoCurrentStatus: 'EXPECTED',
  demoSeatsText: 'Next session expected ~May 15, 2026',
}

export default campusFranceEventbrite
