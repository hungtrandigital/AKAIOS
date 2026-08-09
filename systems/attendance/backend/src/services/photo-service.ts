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
import sharp from 'sharp'

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5 MB per BR-ATT-005
export const MIN_PHOTO_SHORT_EDGE = 240
export const MIN_PHOTO_LONG_EDGE = 320
const MAX_PHOTO_PIXELS = 16_000_000

/**
 * Validate base64 photo data and convert to Buffer.
 * Throws if invalid or too large.
 */
export async function decodePhotoBase64(photoBase64: string): Promise<Buffer> {
  const dataUrl = photoBase64.match(/^data:([^;,]+);base64,(.*)$/s)
  if (dataUrl && !['image/jpeg', 'image/jpg'].includes(dataUrl[1]!.toLowerCase())) {
    throw new ValidationError('Photo must be JPEG format')
  }
  const b64 = (dataUrl?.[2] ?? photoBase64).trim()
  if (b64.length === 0 || b64.length % 4 !== 0) {
    throw new ValidationError('Photo data is not valid base64')
  }
  if (b64.length > Math.ceil(MAX_PHOTO_BYTES / 3) * 4) {
    throw new BusinessRuleViolationError('Photo too large (max 5MB)')
  }
  const buffer = Buffer.from(b64, 'base64')
  if (buffer.toString('base64') !== b64) {
    throw new ValidationError('Photo data is not valid base64')
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

  try {
    const image = sharp(buffer, {
      failOn: 'error',
      limitInputPixels: MAX_PHOTO_PIXELS,
      sequentialRead: true,
    })
    const metadata = await image.metadata()
    if (metadata.format !== 'jpeg') {
      throw new ValidationError('Photo must be JPEG format')
    }
    const decoded = await image.raw().toBuffer({ resolveWithObject: true })
    const shortEdge = Math.min(decoded.info.width, decoded.info.height)
    const longEdge = Math.max(decoded.info.width, decoded.info.height)
    if (shortEdge < MIN_PHOTO_SHORT_EDGE || longEdge < MIN_PHOTO_LONG_EDGE) {
      throw new ValidationError(
        `Photo must be at least ${MIN_PHOTO_LONG_EDGE}x${MIN_PHOTO_SHORT_EDGE} pixels`,
      )
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new ValidationError('Photo must be a decodable JPEG image')
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
  const buffer = await decodePhotoBase64(photoBase64)
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
