import { describe, it, expect } from 'vitest'
import {
  getAdapter,
  getAllAdapters,
  getMonitorableAdapters,
  getAutofillAdapters,
} from '../index'

describe('adapter registry', () => {
  it('returns all 4 adapters', () => {
    expect(getAllAdapters()).toHaveLength(4)
  })

  it('looks up af-vancouver by id', () => {
    const adapter = getAdapter('af-vancouver')
    expect(adapter).not.toBeUndefined()
    expect(adapter!.id).toBe('af-vancouver')
  })

  it('returns undefined for unknown platform id', () => {
    expect(getAdapter('does-not-exist')).toBeUndefined()
  })

  it('all adapters have required fields', () => {
    for (const adapter of getAllAdapters()) {
      expect(adapter.id).toBeTruthy()
      expect(adapter.displayName).toBeTruthy()
      expect(adapter.entryUrl).toMatch(/^https?:\/\//)
      expect(adapter.examTypesSupported.length).toBeGreaterThan(0)
    }
  })

  it('monitorable adapters have valid detection modes', () => {
    for (const adapter of getMonitorableAdapters()) {
      expect(adapter.detectionMode).not.toBe('manual-only')
      expect(adapter.authRequiredForMonitoring).toBe(false)
    }
  })

  it('autofill adapters support local autofill', () => {
    for (const adapter of getAutofillAdapters()) {
      expect(adapter.supportsLocalAutofill).toBe(true)
    }
  })

  it('af-vancouver is configured for live public-page monitoring', () => {
    const adapter = getAdapter('af-vancouver')
    expect(adapter?.detectionMode).toBe('html')
    expect(adapter?.monitoringUrl).toMatch(/^https:\/\/www\.alliancefrancaise\.ca\//)
    expect(adapter?.authRequiredForMonitoring).toBe(false)
  })

  it('af-toronto demo status is SOLD_OUT', () => {
    const adapter = getAdapter('af-toronto')
    expect(adapter?.demoCurrentStatus).toBe('SOLD_OUT')
  })

  it('all adapters have polling interval > 0', () => {
    for (const adapter of getAllAdapters()) {
      expect(adapter.recommendedPollingIntervalSec).toBeGreaterThan(0)
    }
  })
})
