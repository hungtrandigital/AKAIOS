// PhotoService — uploads check-in photos to MinIO and returns presigned URLs.

import {
  uploadObject,
  deleteObject,
  getPresignedUrl,
  MINIO_BUCKET_NAMES,
  ValidationError,
  BusinessRuleViolationError,
} from '@ak/shared'
import { randomUUID } from 'node:crypto'

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5 MB per BR-ATT-005

/**
 * Validate base64 photo data and convert to Buffer.
 * Throws if invalid or too large.
 */
export function decodePhotoBase64(photoBase64: string): Buffer {
  // Strip data URL prefix if present
  const matches = photoBase64.match(/^data:image\/\w+;base64,(.+)$/)
  const b64 = matches?.[1] ?? photoBase64
  const buffer = Buffer.from(b64, 'base64')
  if (buffer.length === 0) {
    throw new ValidationError('Photo data is empty')
  }
  if (buffer.length > MAX_PHOTO_BYTES) {
    throw new BusinessRuleViolationError(
      `Photo too large (${(buffer.length / 1024 / 1024).toFixed(2)}MB, max 5MB)`,
    )
  }
  // Verify JPEG header (FF D8 FF)
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
    throw new ValidationError('Photo must be JPEG format')
  }
  return buffer
}

/**
 * Upload a check-in/check-out photo. Returns the MinIO object key (NOT a URL).
 */
export async function uploadCheckInPhoto(
  attendanceRecordId: string,
  type: 'in' | 'out',
  photoBase64: string
): Promise<string> {
  const buffer = decodePhotoBase64(photoBase64)
  const key = `${new Date().toISOString().split('T')[0]}/${attendanceRecordId}-${type}-${randomUUID()}.jpg`
  await uploadObject(MINIO_BUCKET_NAMES[0], key, buffer, 'image/jpeg')
  return key
}

/**
 * Generate a presigned URL for viewing a photo. 5-min expiry per BR-X-005.
 */
export async function getPhotoUrl(key: string): Promise<string> {
  return getPresignedUrl(MINIO_BUCKET_NAMES[0], key, 300)
}

type PhotoBackedRecord = {
  checkInPhotoKey: string | null
  checkOutPhotoKey: string | null
}

/** Remove private object keys and expose only short-lived viewing URLs. */
export async function toPublicAttendanceRecord<T extends PhotoBackedRecord>(record: T) {
  const { checkInPhotoKey, checkOutPhotoKey, ...publicRecord } = record
  const [checkInPhotoUrl, checkOutPhotoUrl] = await Promise.all([
    checkInPhotoKey ? getPhotoUrl(checkInPhotoKey) : null,
    checkOutPhotoKey ? getPhotoUrl(checkOutPhotoKey) : null,
  ])
  return { ...publicRecord, checkInPhotoUrl, checkOutPhotoUrl }
}

export async function deletePhoto(key: string): Promise<void> {
  await deleteObject(MINIO_BUCKET_NAMES[0], key)
}
