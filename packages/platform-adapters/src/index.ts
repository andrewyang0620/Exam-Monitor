// Platform Adapter Registry — ExamSeat Monitor
// All supported platforms are registered here.
// Adding a new platform = create adapter file + add to registry below.

import type { AdapterRegistry, PlatformAdapter } from './types'

import allianceFrancaiseToronto from './adapters/alliance-francaise-toronto'
import allianceFrancaiseVancouver from './adapters/alliance-francaise-vancouver'
import campusFranceEventbrite from './adapters/campus-france-eventbrite'
import universiteLavalClic from './adapters/universite-laval-clic'

// ----------------------------
// Registry
// ----------------------------

const adapters: PlatformAdapter[] = [
  allianceFrancaiseToronto,
  allianceFrancaiseVancouver,
  campusFranceEventbrite,
  universiteLavalClic,
]

export const adapterRegistry: AdapterRegistry = Object.fromEntries(
  adapters.map((a) => [a.id, a])
)

// ----------------------------
// Lookup helpers
// ----------------------------

export function getAdapter(id: string): PlatformAdapter | undefined {
  return adapterRegistry[id]
}

export function getAllAdapters(): PlatformAdapter[] {
  return adapters
}

export function getAdaptersByCity(city: string): PlatformAdapter[] {
  return adapters.filter((a) => a.city.toLowerCase() === city.toLowerCase())
}

export function getAdaptersByExamType(examType: string): PlatformAdapter[] {
  return adapters.filter((a) =>
    a.examTypesSupported.some((e) => e.toLowerCase() === examType.toLowerCase())
  )
}

export function getMonitorableAdapters(): PlatformAdapter[] {
  return adapters.filter((a) => !a.authRequiredForMonitoring && a.detectionMode !== 'manual-only')
}

export function getAutofillAdapters(): PlatformAdapter[] {
  return adapters.filter((a) => a.supportsLocalAutofill)
}

// ----------------------------
// Re-exports
// ----------------------------

export type { PlatformAdapter, AdapterRegistry } from './types'
export { default as allianceFrancaiseToronto } from './adapters/alliance-francaise-toronto'
export { default as allianceFrancaiseVancouver } from './adapters/alliance-francaise-vancouver'
export { default as campusFranceEventbrite } from './adapters/campus-france-eventbrite'
export { default as universiteLavalClic } from './adapters/universite-laval-clic'
