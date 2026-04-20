import type { PlatformAdapter } from '../types'

/**
 * Alliance Française de Toronto
 * 
 * One of the most popular TEF/TCF Canada exam centers in Ontario.
 * Seat releases happen roughly monthly and sell out within minutes.
 * Public registration page is HTML-based with keyword detection.
 */
const allianceFrancaiseToronto: PlatformAdapter = {
  id: 'af-toronto',
  displayName: 'Alliance Française de Toronto',
  shortName: 'AF Toronto',

  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  region: 'Greater Toronto Area',

  examTypesSupported: ['TEF', 'TEF Canada', 'TCF Canada'],
  entryUrl: 'https://www.alliance-francaise.ca/en/services/french-tests',
  monitoringUrl: 'https://www.alliance-francaise.ca/en/services/french-tests',

  detectionMode: 'html',
  authRequiredForMonitoring: false,

  recommendedPollingIntervalSec: 120,  // 2 min in normal mode
  cooldownSeconds: 600,                // 10 min between alerts

  availabilitySelectors: [
    '.session-available',
    '.booking-open',
    'a[href*="register"]',
    '.exam-sessions',
    '#available-dates',
  ],
  availabilityKeywords: [
    'available',
    'register now',
    'book now',
    's\'inscrire',
    'places disponibles',
    'open',
    'upcoming sessions',
    'new session',
  ],
  soldOutKeywords: [
    'sold out',
    'complet',
    'no availability',
    'fully booked',
    'no upcoming sessions',
    'currently no sessions',
    'liste d\'attente',
  ],

  fixedReleaseWindows: [
    {
      label: 'Monthly release — typically last week of month',
      dayOfWeek: 1, // Monday
      timezone: 'America/Toronto',
      notes: 'Historical pattern: new sessions released last Monday of each month',
      nextExpectedDate: '2026-04-27',
    },
  ],

  confidenceRules: [
    {
      condition: 'Multiple availability keywords found (2+)',
      confidenceBoost: 0.25,
    },
    {
      condition: 'Availability CSS selector matched',
      confidenceBoost: 0.2,
    },
    {
      condition: 'Only single keyword match',
      confidenceBoost: 0.0,
    },
    {
      condition: 'Platform responded within 2s',
      confidenceBoost: 0.05,
    },
    {
      condition: 'Platform response time > 5s',
      confidenceBoost: -0.1,
    },
    {
      condition: 'Platform returned non-200 status',
      confidenceBoost: -0.4,
    },
  ],

  supportsLocalAutofill: true,
  supportsJumpToOfficialPage: true,
  contentScriptUrlPatterns: [
    '*://www.alliance-francaise.ca/en/services/french-tests*',
    '*://www.alliance-francaise.ca/*/register*',
    '*://www.alliancefrancaisetoronto.ca/*',
  ],
  autofillFieldMap: {
    firstName: '#firstName',
    lastName: '#lastName',
    email: '#email',
    phone: '#phone',
    dob: '#dateOfBirth',
    addressLine1: '#address',
    city: '#city',
    province: '#province',
    postalCode: '#postalCode',
    country: '#country',
  },

  riskLevel: 'low',
  notes:
    'Most popular Ontario center for TCF Canada. Sessions typically sell out within 10-30 minutes of release. Autofill is fully mapped as of Q1 2026.',
  lastVerified: '2026-03-15',

  // Demo seed data for V1
  demoCurrentStatus: 'SOLD_OUT',
  demoSeatsText: 'No upcoming sessions available',
}

export default allianceFrancaiseToronto
