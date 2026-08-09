// Generate historical demo attendance_records through yesterday.
// Run: `ALLOW_DEMO_SEED=true pnpm --filter @ak/shared db:seed:attendance`
//
// Realistic distribution:
//   - 85% present (full day, on time)
//   - 10% late (10-45 min late)
//   - 5% absent (no check-in)
//
// Skips Sundays. For each Mon-Sat:
//   - For each active shift_assignment of the day:
//     - 85%: create present attendance_record (checkIn at shift start ± 5 min, checkOut at shift end)
//     - 10%: create late (checkIn 10-45 min after shift start)
//     - 5%: skip (no record, counts as absent)

import { createHash } from 'node:crypto'
import {
  Prisma,
  PrismaClient,
  AttendanceStatus,
  ShiftAssignmentStatus,
  UserRole,
} from '@prisma/client'

const prisma = new PrismaClient()
const AK_TENANT_ID = 'c0ffee00-0000-4000-8000-000000000001'
const MONTHS_BACK = 3  // Cover 3 full months (e.g. May + Jun + partial Jul)
const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function isSundayDateOnly(date: Date): boolean {
  return date.getUTCDay() === 0
}

function assertDemoSeedAllowed(): void {
  if (process.env.ALLOW_DEMO_SEED !== 'true') {
    throw new Error('Refusing demo seed: set ALLOW_DEMO_SEED=true only for disposable development or controlled-UAT data')
  }
}

function deterministicFraction(seed: string): number {
  return createHash('sha256').update(seed).digest().readUInt32BE(0) / 0x1_0000_0000
}

function deterministicBetween(seed: string, min: number, max: number): number {
  return Math.floor(deterministicFraction(seed) * (max - min + 1)) + min
}

function buildVietnamShiftDateTime(date: Date, time: string, isNextDay = false): Date {
  const [hoursText, minutesText] = time.split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)
  if (!Number.isInteger(hours) || hours < 0 || hours > 23
    || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid shift time format: ${time}`)
  }
  const dateKey = date.toISOString().slice(0, 10)
  const result = new Date(
    `${dateKey}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00.000+07:00`,
  )
  if (isNextDay) result.setUTCDate(result.getUTCDate() + 1)
  return result
}

function currentVietnamDateOnly(): Date {
  const vietnamNow = new Date(Date.now() + VIETNAM_UTC_OFFSET_MS)
  return new Date(Date.UTC(
    vietnamNow.getUTCFullYear(),
    vietnamNow.getUTCMonth(),
    vietnamNow.getUTCDate(),
  ))
}

async function main() {
  assertDemoSeedAllowed()
  const today = currentVietnamDateOnly()
  const historyEnd = new Date(today)
  historyEnd.setUTCDate(historyEnd.getUTCDate() - 1)
  // Start: first day of (current_month - MONTHS_BACK + 1)
  // e.g. today=2026-07-17, MONTHS_BACK=3 → start=2026-05-01
  const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (MONTHS_BACK - 1), 1))

  console.log(`Generating historical attendance from ${startDate.toISOString().slice(0, 10)} to ${historyEnd.toISOString().slice(0, 10)}; today remains open for UAT\n`)

  const records: Prisma.AttendanceRecordUncheckedCreateInput[] = []

  // Load all shift assignments in window
  let assignments = await prisma.shiftAssignment.findMany({
    where: {
      date: { gte: startDate, lte: historyEnd },
      employee: { tenantId: AK_TENANT_ID },
      project: { tenantId: AK_TENANT_ID },
      shift: { tenantId: AK_TENANT_ID },
      status: { not: ShiftAssignmentStatus.cancelled },
    },
    include: { shift: true, project: true },
  })

  // Find dates in window with NO shift_assignment — generate them so
  // every Mon-Sat has a shift_assignment for every active employee.
  const datesWithAssignments = new Set(assignments.map((a) => a.date.toISOString().slice(0, 10)))
  const missing: Date[] = []
  for (let d = new Date(startDate); d <= historyEnd; d.setUTCDate(d.getUTCDate() + 1)) {
    if (isSundayDateOnly(d)) continue
    if (!datesWithAssignments.has(d.toISOString().slice(0, 10))) {
      missing.push(new Date(d))
    }
  }

  if (missing.length > 0) {
    console.log(`  Missing ${missing.length} Mon-Sat dates (no shift_assignment) — creating…`)
    const employees = await prisma.employee.findMany({
      where: { tenantId: AK_TENANT_ID, status: 'active' },
    })
    const projects = await prisma.project.findMany({
      where: { tenantId: AK_TENANT_ID, status: 'active' },
    })
    const assignmentOwner = await prisma.user.findFirst({
      where: { tenantId: AK_TENANT_ID, role: UserRole.system_admin },
      select: { id: true },
    })
    const morningShift = await prisma.shift.findFirst({ where: { tenantId: AK_TENANT_ID, name: 'Ca sáng' } })
    const afternoonShift = await prisma.shift.findFirst({ where: { tenantId: AK_TENANT_ID, name: 'Ca chiều' } })
    if (!assignmentOwner) throw new Error('Missing system admin — run dev-seed first')
    if (!morningShift || !afternoonShift) throw new Error('Missing default shifts — run dev-seed first')

    const newAssignments: Prisma.ShiftAssignmentCreateManyInput[] = []
    for (const date of missing) {
      for (let i = 0; i < employees.length; i++) {
        const shift = i % 2 === 0 ? morningShift : afternoonShift
        newAssignments.push({
          employeeId: employees[i]!.id,
          projectId: projects[i % projects.length]!.id,
          shiftId: shift.id,
          date: new Date(date),
          assignedById: assignmentOwner.id,
          status: 'scheduled',
        })
      }
    }
    // Bulk create in chunks
    const CHUNK = 1000
    for (let i = 0; i < newAssignments.length; i += CHUNK) {
      await prisma.shiftAssignment.createMany({ data: newAssignments.slice(i, i + CHUNK) })
    }
    console.log(`    → Created ${newAssignments.length} shift_assignments`)
    // Re-load once so existing assignments are not processed twice.
    assignments = await prisma.shiftAssignment.findMany({
      where: {
        date: { gte: startDate, lte: historyEnd },
        employee: { tenantId: AK_TENANT_ID },
        project: { tenantId: AK_TENANT_ID },
        shift: { tenantId: AK_TENANT_ID },
        status: { not: ShiftAssignmentStatus.cancelled },
      },
      include: { shift: true, project: true },
    })
  }

  console.log(`  Found ${assignments.length} shift assignments in window`)

  const existingAttendance = await prisma.attendanceRecord.findMany({
    where: {
      shiftAssignment: {
        date: { gte: startDate, lte: historyEnd },
        employee: { tenantId: AK_TENANT_ID },
        project: { tenantId: AK_TENANT_ID },
        shift: { tenantId: AK_TENANT_ID },
        status: { not: ShiftAssignmentStatus.cancelled },
      },
    },
    select: { shiftAssignmentId: true },
  })
  const assignmentIdsWithAttendance = new Set(
    existingAttendance.map((record) => record.shiftAssignmentId),
  )

  let presentCount = 0
  let lateCount = 0
  let absentCount = 0
  let preservedCount = 0
  let preservedAssignmentStateCount = 0
  let weekendCount = 0
  const missedAssignmentIds: string[] = []

  for (const a of assignments) {
    // Skip Sundays
    if (isSundayDateOnly(a.date)) {
      weekendCount++
      continue
    }

    // An existing row may contain real UAT data. Preserve it byte-for-byte on
    // every rerun, including after the tested day moves into history.
    if (assignmentIdsWithAttendance.has(a.id)) {
      preservedCount++
      continue
    }
    if (a.status !== ShiftAssignmentStatus.scheduled) {
      preservedAssignmentStateCount++
      continue
    }

    // Deterministic outcome: 85% present, 10% late, 5% absent.
    const roll = deterministicFraction(`${a.id}:outcome`)
    let status: 'present' | 'late' | 'absent'
    let lateMinutes = 0
    if (roll < 0.85) {
      status = 'present'
      presentCount++
    } else if (roll < 0.95) {
      status = 'late'
      lateMinutes = deterministicBetween(`${a.id}:late`, 10, 45)
      lateCount++
    } else {
      status = 'absent'
      absentCount++
      missedAssignmentIds.push(a.id)
      continue // Skip — no attendance record
    }

    const scheduledStart = buildVietnamShiftDateTime(a.date, a.shift.startTime)
    const scheduledEnd = buildVietnamShiftDateTime(
      a.date,
      a.shift.endTime,
      a.shift.isOvernight,
    )

    const checkInAt = addMinutes(
      scheduledStart,
      lateMinutes + deterministicBetween(`${a.id}:arrival`, -2, 5),
    )
    const checkOutAt = addMinutes(
      scheduledEnd,
      deterministicBetween(`${a.id}:checkout`, -10, 5),
    )

    // Total minutes worked (rough)
    const totalMinutes = Math.max(0, Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000) - (a.shift.breakMinutes ?? 60))
    const overtimeMinutes = Math.max(0, totalMinutes - (a.shift.breakMinutes ? 480 : 480))

    records.push({
      shiftAssignmentId: a.id,
      employeeId: a.employeeId,
      projectId: a.projectId,
      checkInAt,
      checkOutAt,
      checkInGps: { latitude: Number(a.project.latitude), longitude: Number(a.project.longitude), accuracy: 10 },
      checkOutGps: { latitude: Number(a.project.latitude), longitude: Number(a.project.longitude), accuracy: 10 },
      checkInPhotoKey: null, // Skip photo upload in seed
      checkOutPhotoKey: null,
      status: status as AttendanceStatus,
      totalMinutesWorked: totalMinutes,
      overtimeMinutes,
      lateMinutes,
    })
  }

  console.log(`  Distribution: ${presentCount} present, ${lateCount} late, ${absentCount} absent, ${preservedCount} existing records preserved, ${preservedAssignmentStateCount} existing assignment states preserved, ${weekendCount} Sundays skipped`)

  console.log(`\n  Creating up to ${records.length} missing attendance records...`)
  const CHUNK = 1000
  let created = 0
  for (let index = 0; index < records.length; index += CHUNK) {
    const chunk = records.slice(index, index + CHUNK)
    created += await prisma.$transaction(async (tx) => {
      const result = await tx.attendanceRecord.createMany({ data: chunk, skipDuplicates: true })
      await tx.shiftAssignment.updateMany({
        where: {
          id: { in: chunk.map((record) => record.shiftAssignmentId) },
          status: ShiftAssignmentStatus.scheduled,
        },
        data: { status: ShiftAssignmentStatus.checked_out },
      })
      return result.count
    })
  }

  let markedMissed = 0
  for (let index = 0; index < missedAssignmentIds.length; index += CHUNK) {
    const result = await prisma.shiftAssignment.updateMany({
      where: {
        id: { in: missedAssignmentIds.slice(index, index + CHUNK) },
        status: ShiftAssignmentStatus.scheduled,
      },
      data: { status: ShiftAssignmentStatus.missed },
    })
    markedMissed += result.count
  }
  console.log(`  ✓ ${created} attendance records created; ${markedMissed} absent assignments marked missed; existing records unchanged\n`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Attendance demo seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
