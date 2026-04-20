import type { PlatformAdapter } from '../types'

/**
 * Alliance Française de Vancouver
 * 
 * Main TEF/TCF Canada exam center for BC candidates.
 * Higher demand from Pacific Rim applicants.
 * Seat releases are irregular but public page is HTML-detectable.
 */
const allianceFranaiseVancouver: PlatformAdapter = {
  id: 'af-vancouver',
  displayName: 'Alliance Française de Vancouver',
  shortName: 'AF Vancouver',

  city: 'Vancouver',
  province: 'BC',
  country: 'CA',
  region: 'Greater Vancouver',

  examTypesSupported: ['TEF', 'TEF Canada', 'TCF Canada'],
  entryUrl: 'https://www.afvancouver.com/exams',
  monitoringUrl: 'https://www.afvancouver.com/exams',

  detectionMode: 'html',
  authRequiredForMonitoring: false,

  recommendedPollingIntervalSec: 150, // 2.5 min
  cooldownSeconds: 900,               // 15 min between alerts

  availabilitySelectors: [
    '.exam-availability',
    '.session-list li',
    'table.sessions tr',
    'a[href*="inscription"]',
    '.register-btn',
  ],
  availabilityKeywords: [
    'available',
    'register',
    'inscrivez-vous',
    'session ouverte',
    'places disponibles',
    'new dates',
    'upcoming',
    'open for registration',
  ],
  soldOutKeywords: [
    'sold out',
    'complet',
    'fully booked',
    'no availability',
    'liste d\'attente',
    'no sessions',
    'currently full',
    'waitlist only',
  ],

  fixedReleaseWindows: [
    {
      label: 'Irregular — typically announced by email to waitlist',
      timezone: 'America/Vancouver',
      notes: 'No fixed pattern. Monitor continuously recommended.',
      nextExpectedDate: '2026-05-10',
    },
  ],

  confidenceRules: [
    {
      condition: 'Availability selector matched with keyword',
      confidenceBoost: 0.3,
    },
    {
      condition: 'Keyword found in session list element',
      confidenceBoost: 0.2,
    },
    {
      condition: 'No selector matched, keyword in body',
      confidenceBoost: 0.0,
    },
    {
      condition: 'Response time < 1s',
      confidenceBoost: 0.05,
    },
    {
      condition: 'Platform recently returned 503',
      confidenceBoost: -0.3,
    },
  ],

  supportsLocalAutofill: true,
  supportsJumpToOfficialPage: true,
  contentScriptUrlPatterns: [
    '*://www.afvancouver.com/*',
    '*://afvancouver.com/*',
  ],
  autofillFieldMap: {
    firstName: 'input[name="first_name"]',
    lastName: 'input[name="last_name"]',
    email: 'input[name="email"]',
    phone: 'input[name="phone"]',
    dob: 'input[name="date_of_birth"]',
    addressLine1: 'input[name="address"]',
    city: 'input[name="city"]',
    province: 'select[name="province"]',
    postalCode: 'input[name="postal_code"]',
    country: 'select[name="country"]',
    idNumber: 'input[name="passport_number"]',
  },

  riskLevel: 'low',
  notes:
    'BC\'s primary exam center. High competition especially for spring/summer sessions. Release patterns are irregular — continuous monitoring is recommended.',
  lastVerified: '2026-04-01',

  // Demo seed data for V1 — OPEN alert scenario
  demoCurrentStatus: 'OPEN',
  demoSeatsText: 'Seats available — register now',
}

export default allianceFranaiseVancouver
