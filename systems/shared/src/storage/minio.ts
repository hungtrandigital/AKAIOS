// MinIO client (S3-compatible). Used for:
//   - Check-in/out photos
//   - Generated customer report PDFs
//
// Buckets (created on first use):
//   - attendance-photos
//   - reports

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const MINIO_BUCKETS = ['attendance-photos', 'reports'] as const

let client: S3Client | undefined
let publicClient: S3Client | undefined

function minioEndpoint(rawEndpoint: string): string {
  if (rawEndpoint.startsWith('http://') || rawEndpoint.startsWith('https://')) return rawEndpoint
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'
  return `${protocol}://${rawEndpoint}`
}

function minioCredentials() {
  return {
    accessKeyId: process.env.MINIO_ROOT_USER ?? 'ak_admin',
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? '',
  }
}

export function getMinIOClient(): S3Client {
  if (client) return client

  const endpoint = process.env.MINIO_ENDPOINT
    ?? (process.env.NODE_ENV === 'production' ? 'minio:9000' : 'localhost:9000')

  client = new S3Client({
    endpoint: minioEndpoint(endpoint),
    region: 'us-east-1',
    credentials: minioCredentials(),
    forcePathStyle: true,
  })

  return client
}

function getPublicMinIOClient(): S3Client {
  if (publicClient) return publicClient
  const endpoint = process.env.MINIO_PUBLIC_ENDPOINT
    ?? process.env.MINIO_ENDPOINT
    ?? (process.env.NODE_ENV === 'production' ? 'minio:9000' : 'localhost:9000')
  publicClient = new S3Client({
    endpoint: minioEndpoint(endpoint),
    region: 'us-east-1',
    credentials: minioCredentials(),
    forcePathStyle: true,
  })
  return publicClient
}

export async function ensureBuckets(): Promise<void> {
  const c = getMinIOClient()
  for (const bucket of MINIO_BUCKETS) {
    try {
      await c.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch (err: unknown) {
      const e = err as { $metadata?: { httpStatusCode?: number }, name?: string }
      if (e?.$metadata?.httpStatusCode === 404
        || e?.name === 'NotFound'
        || e?.name === 'NoSuchBucket') {
        await c.send(new CreateBucketCommand({ Bucket: bucket }))
        continue
      }
      // Authentication, connectivity and server failures must fail startup rather
      // than leaving the application running with unusable storage.
      throw err
    }
  }
}

/**
 * Upload a buffer to MinIO. Returns the object key (NOT a URL).
 * Use getPresignedUrl() to get a time-limited URL for client access.
 */
export async function uploadObject(
  bucket: typeof MINIO_BUCKETS[number],
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const c = getMinIOClient()
  await c.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }))
  return key
}

/** Best-effort compensation for uploads whose database transaction fails. */
export async function deleteObject(
  bucket: typeof MINIO_BUCKETS[number],
  key: string
): Promise<void> {
  await getMinIOClient().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}

/**
 * Generate a presigned URL for downloading/viewing an object.
 * Default expiry: 5 minutes (per [api-contracts BR-X-005])
 */
export async function getPresignedUrl(
  bucket: typeof MINIO_BUCKETS[number],
  key: string,
  expiresInSeconds = 300
): Promise<string> {
  const c = getPublicMinIOClient()
  return getSignedUrl(c, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: expiresInSeconds })
}

export const MINIO_BUCKET_NAMES = MINIO_BUCKETS
