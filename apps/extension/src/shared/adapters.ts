import type { PlatformUrlPattern } from './types'

// URL patterns for each supported platform — used in content script
// to detect which platform is being visited and whether autofill applies.
// Inline here (not imported from adapters package) so the content script
// has no async fetch dependency.
export const PLATFORM_PATTERNS: PlatformUrlPattern[] = [
  {
    platformId: 'af-toronto',
    displayName: 'Alliance Française Toronto',
    patterns: [
      /alliancefrancaise\.ca/i,
      /af-toronto\.ca/i,
    ],
    registrationUrls: [
      /alliancefrancaise\.ca\/.*(register|inscription|booking|checkout)/i,
      /af-toronto\.ca\/.*(register|inscription|booking|checkout)/i,
    ],
    autofillSupported: true,
  },
  {
    platformId: 'af-vancouver',
    displayName: 'Alliance Française Vancouver',
    patterns: [
      /afvancouver\.com/i,
    ],
    registrationUrls: [
      /afvancouver\.com\/.*(register|inscription|booking|enroll)/i,
    ],
    autofillSupported: true,
  },
  {
    platformId: 'campus-france-eventbrite',
    displayName: 'Campus France (Eventbrite)',
    patterns: [
      /eventbrite\.(ca|com)\/e\//i,
    ],
    registrationUrls: [
      /eventbrite\.(ca|com)\/e\/.*(checkout|register)/i,
      /eventbrite\.(ca|com)\/checkout/i,
    ],
    autofillSupported: true,
  },
  {
    platformId: 'universite-laval-clic',
    displayName: 'Université Laval (CLIC)',
    patterns: [
      /clic\.ulaval\.ca/i,
    ],
    registrationUrls: [],
    autofillSupported: false,
  },
]

export function detectPlatform(url: string): PlatformUrlPattern | null {
  return PLATFORM_PATTERNS.find((p) => p.patterns.some((re) => re.test(url))) ?? null
}

export function isRegistrationPage(platform: PlatformUrlPattern, url: string): boolean {
  return platform.registrationUrls.some((re) => re.test(url))
}
