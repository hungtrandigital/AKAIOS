// MinIO client (S3-compatible). Used for:
//   - Check-in/out photos
//   - Generated customer report PDFs
//
// Buckets (created on first use):
//   - attendance-photos
//   - reports

import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, CreateBucketCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const MINIO_BUCKETS = ['attendance-photos', 'reports'] as const

let client: S3Client | undefined

export function getMinIOClient(): S3Client {
  if (client) return client

  const endpoint = process.env.MINIO_ENDPOINT ?? 'localhost:9000'
  const useSSL = process.env.MINIO_USE_SSL === 'true'
  const protocol = useSSL ? 'https' : 'http'

  client = new S3Client({
    endpoint: `${protocol}://${endpoint}`,
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ROOT_USER ?? 'ak_admin',
      secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? '',
    },
    forcePathStyle: true,
  })

  return client
}

export async function ensureBuckets(): Promise<void> {
  const c = getMinIOClient()
  for (const bucket of MINIO_BUCKETS) {
    try {
      await c.send(new HeadBucketCommand({ Bucket: bucket }))
    } catch (err: unknown) {
      if (err && typeof err === 'object' && '$metadata' in err) {
        const e = err as { $metadata?: { httpStatusCode?: number }, name?: string }
        if (e.$metadata?.httpStatusCode === 404 || e.name === 'NotFound') {
          await c.send(new CreateBucketCommand({ Bucket: bucket }))
        }
      }
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

/**
 * Generate a presigned URL for downloading/viewing an object.
 * Default expiry: 5 minutes (per [api-contracts BR-X-005])
 */
export async function getPresignedUrl(
  bucket: typeof MINIO_BUCKETS[number],
  key: string,
  expiresInSeconds = 300
): Promise<string> {
  const c = getMinIOClient()
  return getSignedUrl(c, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: expiresInSeconds })
}

export const MINIO_BUCKET_NAMES = MINIO_BUCKETS
