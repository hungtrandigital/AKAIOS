// GeoService — GPS geofence validation per BR-ATT-001
// Attendance backend: validates if check-in GPS is within project's geofence.

import { GPSCoordinate, BusinessRuleViolationError } from '@ak/shared'

export interface ProjectLocation {
  latitude: number
  longitude: number
  geofenceRadiusMeters: number
}

/**
 * BR-ATT-001: Check if user's GPS is within project's geofence.
 * Throws BusinessRuleViolationError with reason if outside.
 */
export function validateGeofence(
  userGps: GPSCoordinate,
  project: ProjectLocation
): void {
  const projectCenter = new GPSCoordinate({
    latitude: project.latitude,
    longitude: project.longitude,
    accuracy: 0, // project center has no GPS accuracy concept
  })

  const distance = userGps.distanceTo(projectCenter)

  // Accuracy is client-supplied telemetry. It may inform review UX, but it must
  // never expand or bypass the authoritative project geofence.
  if (distance > project.geofenceRadiusMeters) {
    throw new BusinessRuleViolationError(
      `Check-in location is ${Math.round(distance)}m from project (max ${project.geofenceRadiusMeters}m)`,
      {
        distanceMeters: Math.round(distance),
        allowedRadiusMeters: project.geofenceRadiusMeters,
        userGps: userGps.toJSON(),
      }
    )
  }
}

/**
 * BR-ATT-007: Project must have GPS configured before any check-in.
 */
export function assertProjectHasGeofence(project: { latitude: unknown; longitude: unknown; geofenceRadiusMeters: unknown }): void {
  const lat = Number(project.latitude)
  const lng = Number(project.longitude)
  const r = Number(project.geofenceRadiusMeters)

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
    throw new BusinessRuleViolationError('Project does not have GPS coordinates configured')
  }
  if (!Number.isFinite(r) || r <= 0) {
    throw new BusinessRuleViolationError('Project does not have geofence radius configured')
  }
}
