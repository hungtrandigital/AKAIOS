// GPSCoordinate value object.
// Used in attendance check-in/out validation (BR-ATT-001).

import { BusinessRuleViolationError } from './errors.js'

export interface GPSCoordinateInput {
  latitude: number
  longitude: number
  accuracy: number
}

const EARTH_RADIUS_METERS = 6_371_000

export class GPSCoordinate {
  readonly latitude: number
  readonly longitude: number
  readonly accuracy: number

  constructor(input: GPSCoordinateInput) {
    if (input.latitude < -90 || input.latitude > 90) {
      throw new BusinessRuleViolationError('Invalid latitude', { lat: input.latitude })
    }
    if (input.longitude < -180 || input.longitude > 180) {
      throw new BusinessRuleViolationError('Invalid longitude', { lng: input.longitude })
    }
    this.latitude = input.latitude
    this.longitude = input.longitude
    this.accuracy = input.accuracy
  }

  /** Haversine distance to another coordinate in meters */
  distanceTo(other: GPSCoordinate): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const lat1 = toRad(this.latitude)
    const lat2 = toRad(other.latitude)
    const dLat = toRad(other.latitude - this.latitude)
    const dLon = toRad(other.longitude - this.longitude)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return EARTH_RADIUS_METERS * c
  }

  /** BR-ATT-001: Is this coordinate within `radiusMeters` of `center`? */
  isWithinRadius(center: GPSCoordinate, radiusMeters: number): boolean {
    return this.distanceTo(center) <= radiusMeters
  }

  toJSON(): GPSCoordinateInput {
    return { latitude: this.latitude, longitude: this.longitude, accuracy: this.accuracy }
  }
}
