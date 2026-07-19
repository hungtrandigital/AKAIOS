// Unit tests for GeoService — BR-ATT-001 (geofence) + BR-ATT-007 + BR-ATT-010 (low accuracy).

import { describe, it, expect } from 'vitest'
import { GPSCoordinate } from '@ak/shared'
import { validateGeofence, assertProjectHasGeofence } from '../../src/services/geo-service.js'

// Vincom Đồng Khởi (Ho Chi Minh City) — example
const project = {
  latitude: 10.7719,
  longitude: 106.7009,
  geofenceRadiusMeters: 100,
}

describe('GeoService', () => {
  describe('validateGeofence (BR-ATT-001)', () => {
    it('passes if well inside geofence', () => {
      const userGps = new GPSCoordinate({
        latitude: 10.77195, // ~5m from project
        longitude: 106.70095,
        accuracy: 10,
      })
      expect(() => validateGeofence(userGps, project)).not.toThrow()
    })

    it('throws if clearly outside geofence (1km)', () => {
      const userGps = new GPSCoordinate({
        latitude: 10.7819, // ~1km from project
        longitude: 106.7009,
        accuracy: 10,
      })
      expect(() => validateGeofence(userGps, project)).toThrow(/Check-in location is/)
    })

    it('passes at 50m distance (well within 100m)', () => {
      const userGps = new GPSCoordinate({
        latitude: 10.77235, // ~50m north
        longitude: 106.7009,
        accuracy: 10,
      })
      expect(() => validateGeofence(userGps, project)).not.toThrow()
    })

    it('throws at 200m distance (clearly over 100m radius)', () => {
      const userGps = new GPSCoordinate({
        latitude: 10.7737, // ~200m north
        longitude: 106.7009,
        accuracy: 10,
      })
      expect(() => validateGeofence(userGps, project)).toThrow(/Check-in location is/)
    })
  })

  describe('validateGeofence (BR-ATT-010 — low accuracy)', () => {
    it('does not allow client-reported poor accuracy to bypass the geofence', () => {
      const userGps = new GPSCoordinate({
        latitude: 10.8000, // far away
        longitude: 106.7000,
        accuracy: 100, // poor GPS
      })
      expect(() => validateGeofence(userGps, project)).toThrow(/Check-in location is/)
    })
  })

  describe('assertProjectHasGeofence (BR-ATT-007)', () => {
    it('throws if project has no GPS', () => {
      expect(() =>
        assertProjectHasGeofence({ latitude: 0, longitude: 0, geofenceRadiusMeters: 100 })
      ).toThrow(/GPS coordinates/)
    })

    it('throws if radius is 0', () => {
      expect(() =>
        assertProjectHasGeofence({ latitude: 10.7, longitude: 106.6, geofenceRadiusMeters: 0 })
      ).toThrow(/geofence radius/)
    })

    it('passes if project has GPS + radius', () => {
      expect(() => assertProjectHasGeofence(project)).not.toThrow()
    })
  })
})
