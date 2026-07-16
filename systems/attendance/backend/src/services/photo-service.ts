// PhotoService — uploads check-in photos to MinIO and returns presigned URLs.

import { uploadObject, getPresignedUrl, MINIO_BUCKET_NAMES } from '@ak/shared'
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
    throw new Error('Photo data is empty')
  }
  if (buffer.length > MAX_PHOTO_BYTES) {
    throw new Error(`Photo too large (${(buffer.length / 1024 / 1024).toFixed(2)}MB, max 5MB)`)
  }
  // Verify JPEG header (FF D8 FF)
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
    throw new Error('Photo must be JPEG format')
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
