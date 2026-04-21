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
  // Detection URL (public page listing upcoming sessions)
  entryUrl: 'https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/',
  // URL polled by the monitoring pipeline
  monitoringUrl: 'https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/',

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
    '*://www.alliancefrancaise.ca/*',
    '*://alliancefrancaise.ca/*',
  ],
  autofillFieldMap: {
    firstName: 'input[name="first_name"], #FirstName',
    lastName: 'input[name="last_name"], #LastName',
    email: 'input[type="email"], #Email',
    phone: 'input[type="tel"], #Phone',
    dob: 'input[name="date_of_birth"], #DateOfBirth',
    addressLine1: 'input[name="address"], #Address',
    city: 'input[name="city"], #City',
    province: 'select[name="province"], #Province',
    postalCode: 'input[name="postal_code"], #PostalCode',
    country: 'select[name="country"], #Country',
    idNumber: 'input[name="passport_number"], #PassportNumber',
  },

  riskLevel: 'low',
  notes:
    'BC\'s primary exam center. High competition especially for spring/summer sessions. Release patterns are irregular — continuous monitoring is recommended.',
  lastVerified: '2026-04-01',

  // Real detection URL confirmed: https://www.alliancefrancaise.ca/en/language/exams/tcf-canada/
  // Verified 2026-04-20: all current sessions SOLD OUT; Q3/Q4 2026 registration upcoming
}

export default allianceFranaiseVancouver
