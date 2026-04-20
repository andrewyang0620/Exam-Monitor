import type { PlatformAdapter } from '../types'

/**
 * Université Laval — CLIC (Centre de langues)
 * 
 * University-style independent event page with a JSON/XHR endpoint
 * that provides session data. This is a demo adapter showing the
 * 'json-xhr' detection mode.
 */
const universiteLavalClic: PlatformAdapter = {
  id: 'universite-laval-clic',
  displayName: 'Université Laval — CLIC',
  shortName: 'ULaval CLIC',

  city: 'Québec',
  province: 'QC',
  country: 'CA',
  region: 'Quebec City',

  examTypesSupported: ['TEF', 'TEF Canada', 'TCF Canada', 'DELF', 'DALF'],
  entryUrl: 'https://www.clic.ulaval.ca/tests-et-certifications',
  monitoringUrl: 'https://www.clic.ulaval.ca/api/sessions', // Demo endpoint

  detectionMode: 'json-xhr',
  authRequiredForMonitoring: false,

  recommendedPollingIntervalSec: 240, // 4 min
  cooldownSeconds: 1200,              // 20 min

  availabilitySelectors: [],          // Not used for json-xhr mode
  availabilityKeywords: [
    'available',
    'open',
    'inscription_ouverte',
    'places_disponibles',
  ],
  soldOutKeywords: [
    'complet',
    'closed',
    'inscription_fermee',
    'full',
  ],

  fixedReleaseWindows: [
    {
      label: 'Semester-based — new sessions each semester',
      notes: 'New sessions announced at start of each semester. Spring: Feb. Fall: Aug.',
      nextExpectedDate: '2026-08-15',
    },
  ],

  confidenceRules: [
    {
      condition: 'JSON endpoint returns valid session array',
      confidenceBoost: 0.3,
    },
    {
      condition: 'Session status field is "open"',
      confidenceBoost: 0.25,
    },
    {
      condition: 'JSON malformed or empty',
      confidenceBoost: -0.4,
    },
    {
      condition: 'HTTP 200 with expected shape',
      confidenceBoost: 0.15,
    },
  ],

  supportsLocalAutofill: false,
  supportsJumpToOfficialPage: true,
  contentScriptUrlPatterns: [
    '*://www.clic.ulaval.ca/*',
    '*://clic.ulaval.ca/*',
  ],
  autofillFieldMap: undefined, // Not yet mapped

  riskLevel: 'low',
  notes:
    'Semester-based releases. Lower urgency than AF centers. JSON endpoint is unofficial and may change — re-verify at each semester boundary.',
  lastVerified: '2026-01-10',

  // Demo seed data for V1
  demoCurrentStatus: 'MONITORING',
  demoSeatsText: 'Monitoring — next release expected August 2026',
}

export default universiteLavalClic
