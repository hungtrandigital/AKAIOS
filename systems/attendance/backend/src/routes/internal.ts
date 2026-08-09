import { timingSafeEqual } from 'node:crypto'
import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { prisma, UnauthorizedError, ValidationError } from '@ak/shared'
import { CalendarDateSchema } from '../schemas/calendar-date.js'

const QuerySchema = z.object({
  tenantId: z.string().uuid(),
  employeeId: z.string().uuid(),
  from: CalendarDateSchema,
  to: CalendarDateSchema,
})
const MAX_INTERNAL_RANGE_DAYS = 366

function validInternalKey(candidate: string | undefined, expected: string): boolean {
  if (!candidate) return false
  const candidateBuffer = Buffer.from(candidate)
  const expectedBuffer = Buffer.from(expected)
  return candidateBuffer.length === expectedBuffer.length
    && timingSafeEqual(candidateBuffer, expectedBuffer)
}

export function internalAttendanceRoutes(internalApiKey: string): FastifyPluginAsync {
  return async (app) => {
    app.get('/attendance', { config: { rateLimit: false } }, async (request) => {
      if (!validInternalKey(request.headers['x-internal-api-key'] as string | undefined, internalApiKey)) {
        throw new UnauthorizedError('Invalid internal API key')
      }
      const parsed = QuerySchema.safeParse(request.query)
      if (!parsed.success) {
        throw new ValidationError('Invalid internal attendance query', {
          issues: parsed.error.issues,
        })
      }
      const query = parsed.data
      const from = new Date(`${query.from}T00:00:00.000Z`)
      const to = new Date(`${query.to}T00:00:00.000Z`)
      if (from > to) {
        throw new ValidationError('from must be on or before to')
      }
      if ((to.getTime() - from.getTime()) / 86_400_000 >= MAX_INTERNAL_RANGE_DAYS) {
        throw new ValidationError(`Attendance range cannot exceed ${MAX_INTERNAL_RANGE_DAYS} days`)
      }

      const records = await prisma.attendanceRecord.findMany({
        where: {
          employeeId: query.employeeId,
          shiftAssignment: { date: { gte: from, lte: to } },
          employee: { tenantId: query.tenantId, deletedAt: null },
          project: { tenantId: query.tenantId, deletedAt: null },
        },
        select: {
          id: true,
          shiftAssignmentId: true,
          employeeId: true,
          checkInAt: true,
          checkOutAt: true,
          totalMinutesWorked: true,
          overtimeMinutes: true,
          lateMinutes: true,
          status: true,
          shiftAssignment: { select: { date: true } },
        },
        orderBy: { shiftAssignment: { date: 'asc' } },
      })
      const data = records.map(({ shiftAssignment, ...record }) => ({
        ...record,
        workDate: shiftAssignment.date.toISOString().slice(0, 10),
      }))
      return { data }
    })
  }
}
