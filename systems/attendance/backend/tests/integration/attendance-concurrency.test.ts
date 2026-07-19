import { describe, expect, it } from 'vitest'
import { prisma } from '@ak/shared'
import { createScopeFixture, skipIntegration } from './scope-fixture.js'

describe.skipIf(skipIntegration)('Attendance concurrency (integration)', () => {
  it('rejects inactive check-in and allows only one concurrent checkout',
    { timeout: 60_000 }, async () => {
      const f = await createScopeFixture()
      const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 1, 2, 3, 0xff, 0xd9])
        .toString('base64')
      const headers = { authorization: `Bearer ${f.mobileToken}` }
      const payload = {
        shiftAssignmentId: f.mobileAssignment.id,
        gps: { latitude: 10.7720, longitude: 106.7009, accuracy: 100 },
        photoBase64: jpeg,
      }
      try {
        const nonJpeg = await f.app.inject({
          method: 'POST', url: '/v1/attendance/check-in', headers,
          payload: { ...payload, photoBase64: Buffer.alloc(10).toString('base64') },
        })
        expect(nonJpeg.statusCode).toBe(400)
        expect(nonJpeg.json().error.code).toBe('VALIDATION_ERROR')

        const oversized = await f.app.inject({
          method: 'POST', url: '/v1/attendance/check-in', headers,
          payload: {
            ...payload,
            photoBase64: Buffer.alloc(5 * 1024 * 1024 + 1, 0xff).toString('base64'),
          },
        })
        expect(oversized.statusCode).toBe(422)
        expect(oversized.json().error.code).toBe('BUSINESS_RULE_VIOLATION')

        await prisma.employee.update({
          where: { id: f.mobileMember.employee.id }, data: { status: 'inactive' },
        })
        expect((await f.app.inject({
          method: 'POST', url: '/v1/attendance/check-in', headers, payload,
        })).statusCode).toBe(403)
        await prisma.employee.update({
          where: { id: f.mobileMember.employee.id }, data: { status: 'active' },
        })
        const checkIn = await f.app.inject({
          method: 'POST', url: '/v1/attendance/check-in', headers, payload,
        })
        expect(checkIn.statusCode).toBe(200)
        expect(checkIn.json()).not.toHaveProperty('checkInPhotoKey')
        expect(checkIn.json()).not.toHaveProperty('checkOutPhotoKey')
        expect(await fetch(checkIn.json().checkInPhotoUrl)).toMatchObject({ status: 200 })
        const checkedInRecord = await prisma.attendanceRecord.findUniqueOrThrow({
          where: { shiftAssignmentId: f.mobileAssignment.id },
        })
        f.photoKeys.push(checkedInRecord.checkInPhotoKey!)

        const myToday = await f.app.inject({
          method: 'GET', url: '/v1/attendance/my-today', headers,
        })
        expect(myToday.statusCode).toBe(200)
        expect(myToday.json()).toHaveProperty('attendanceRecord')
        expect(myToday.json().attendanceRecord).not.toHaveProperty('checkInPhotoKey')
        expect(myToday.json().attendanceRecord.checkInPhotoUrl).toEqual(expect.any(String))

        const checkout = () => f.app.inject({
          method: 'POST', url: '/v1/attendance/check-out', headers, payload,
        })
        const responses = await Promise.all([checkout(), checkout()])
        expect(responses.filter((response) => response.statusCode === 200)).toHaveLength(1)
        expect(responses.filter((response) => [409, 422].includes(response.statusCode)))
          .toHaveLength(1)
        const successfulCheckout = responses.find((response) => response.statusCode === 200)!
        expect(successfulCheckout.json()).not.toHaveProperty('checkInPhotoKey')
        expect(successfulCheckout.json()).not.toHaveProperty('checkOutPhotoKey')
        expect((await fetch(successfulCheckout.json().checkOutPhotoUrl)).status).toBe(200)
        const persistedRecord = await prisma.attendanceRecord.findUniqueOrThrow({
          where: { shiftAssignmentId: f.mobileAssignment.id },
        })
        expect(persistedRecord)
          .toMatchObject({ checkOutAt: expect.any(Date), totalMinutesWorked: expect.any(Number) })
        f.photoKeys.push(persistedRecord.checkOutPhotoKey!)

        const supervisorList = await f.app.inject({
          method: 'GET',
          url: `/v1/attendance/records?projectId=${f.teamProject.id}`,
          headers: { authorization: `Bearer ${f.supervisorToken}` },
        })
        const publicRecord = supervisorList.json().data.find(
          (record: { id: string }) => record.id === persistedRecord.id,
        )
        expect(publicRecord).not.toHaveProperty('checkInPhotoKey')
        expect(publicRecord).not.toHaveProperty('checkOutPhotoKey')
        expect(publicRecord).toMatchObject({
          checkInPhotoUrl: expect.any(String),
          checkOutPhotoUrl: expect.any(String),
        })

        const assignmentList = await f.app.inject({
          method: 'GET',
          url: `/v1/shifts/assignments?projectId=${f.teamProject.id}&from=${f.dateKey}&to=${f.dateKey}`,
          headers: { authorization: `Bearer ${f.supervisorToken}` },
        })
        expect(assignmentList.statusCode).toBe(200)
        const publicAssignment = assignmentList.json().data.find(
          (assignment: { id: string }) => assignment.id === f.mobileAssignment.id,
        )
        expect(publicAssignment.attendanceRecord).not.toHaveProperty('checkInPhotoKey')
        expect(publicAssignment.attendanceRecord).not.toHaveProperty('checkOutPhotoKey')
        expect(publicAssignment.attendanceRecord).toMatchObject({
          checkInPhotoUrl: expect.any(String),
          checkOutPhotoUrl: expect.any(String),
        })
        expect(await prisma.shiftAssignment.findUnique({ where: { id: f.mobileAssignment.id } }))
          .toMatchObject({ status: 'checked_out' })
      } finally {
        await f.cleanup()
      }
    })
})
