import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({ sendMock: vi.fn() }))

vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@aws-sdk/client-s3')>()
  return {
    ...actual,
    S3Client: class {
      send = sendMock
    },
  }
})

import { ensureBuckets } from '../src/storage/minio.js'

describe('ensureBuckets', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('accepts a concurrent create only after the bucket becomes accessible', async () => {
    sendMock
      .mockRejectedValueOnce({ name: 'NotFound', $metadata: { httpStatusCode: 404 } })
      .mockRejectedValueOnce({ name: 'BucketAlreadyOwnedByYou', $metadata: { httpStatusCode: 409 } })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})

    await expect(ensureBuckets()).resolves.toBeUndefined()
    expect(sendMock).toHaveBeenCalledTimes(4)
  })

  it('does not hide an unrelated create conflict', async () => {
    const conflict = { name: 'OperationAborted', $metadata: { httpStatusCode: 409 } }
    sendMock
      .mockRejectedValueOnce({ name: 'NoSuchBucket', $metadata: { httpStatusCode: 404 } })
      .mockRejectedValueOnce(conflict)

    await expect(ensureBuckets()).rejects.toBe(conflict)
  })
})
