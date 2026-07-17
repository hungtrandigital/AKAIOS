// Generate demo attendance_records for the last 3 full months.
// Run: `pnpm db:seed:attendance`
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

import { PrismaClient, AttendanceStatus, UserRole } from '@prisma/client'
import { isWeekend } from '../../engine/calendar.js'

const prisma = new PrismaClient()
const AK_TENANT_ID = 'c0ffee00-0000-4000-8000-000000000001'
const MONTHS_BACK = 3  // Cover 3 full months (e.g. May + Jun + partial Jul)

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  // Start: first day of (current_month - MONTHS_BACK + 1)
  // e.g. today=2026-07-17, MONTHS_BACK=3 → start=2026-05-01
  const startDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (MONTHS_BACK - 1), 1))

  console.log(`Generating demo attendance from ${startDate.toISOString().slice(0, 10)} to ${today.toISOString().slice(0, 10)} (${MONTHS_BACK} months back)\n`)

  const records: any[] = []

  // Load all shift assignments in window
  let assignments = await prisma.shiftAssignment.findMany({
    where: { date: { gte: startDate, lte: today } },
    include: { shift: true, project: true },
  })

  // Find dates in window with NO shift_assignment — generate them so
  // every Mon-Sat has a shift_assignment for every active employee.
  const datesWithAssignments = new Set(assignments.map((a) => a.date.toISOString().slice(0, 10)))
  const missing: Date[] = []
  for (let d = new Date(startDate); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    if (isWeekend(d)) continue
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
    const morningShift = await prisma.shift.findFirst({ where: { name: 'Ca sáng' } })
    const afternoonShift = await prisma.shift.findFirst({ where: { name: 'Ca chiều' } })
    if (!assignmentOwner) throw new Error('Missing system admin — run dev-seed first')
    if (!morningShift || !afternoonShift) throw new Error('Missing default shifts — run dev-seed first')

    const newAssignments: any[] = []
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
      where: { date: { gte: startDate, lte: today } },
      include: { shift: true, project: true },
    })
  }

  console.log(`  Found ${assignments.length} shift assignments in window`)

  let presentCount = 0
  let lateCount = 0
  let absentCount = 0
  let weekendCount = 0

  for (const a of assignments) {
    // Skip Sundays
    if (isWeekend(a.date)) {
      weekendCount++
      continue
    }

    // Random outcome: 85% present, 10% late, 5% absent
    const roll = Math.random()
    let status: 'present' | 'late' | 'absent'
    let lateMinutes = 0
    if (roll < 0.85) {
      status = 'present'
      presentCount++
    } else if (roll < 0.95) {
      status = 'late'
      lateMinutes = randomBetween(10, 45)
      lateCount++
    } else {
      status = 'absent'
      absentCount++
      continue // Skip — no attendance record
    }

    // Parse shift start/end "HH:mm"
    const [sh, sm] = a.shift.startTime.split(':').map(Number) ?? [8, 0]
    const [eh, em] = a.shift.endTime.split(':').map(Number) ?? [17, 0]

    // Date for check-in: assignment date at shift start (UTC)
    const scheduledStart = new Date(a.date)
    scheduledStart.setUTCHours(sh ?? 8, sm ?? 0, 0, 0)
    const scheduledEnd = new Date(a.date)
    scheduledEnd.setUTCHours(eh ?? 17, em ?? 0, 0, 0)
    // For overnight shifts (e.g. 22:00 → 06:00), end time is next day
    if ((eh ?? 17) < (sh ?? 8)) {
      scheduledEnd.setUTCDate(scheduledEnd.getUTCDate() + 1)
    }

    const checkInAt = addMinutes(scheduledStart, lateMinutes + randomBetween(-2, 5))
    const checkOutAt = addMinutes(scheduledEnd, randomBetween(-10, 5))

    // Convert to ISO strings
    const checkInStr = checkInAt.toISOString()
    const checkOutStr = checkOutAt.toISOString()

    // Total minutes worked (rough)
    const totalMinutes = Math.max(0, Math.round((checkOutAt.getTime() - checkInAt.getTime()) / 60000) - (a.shift.breakMinutes ?? 60))
    const overtimeMinutes = Math.max(0, totalMinutes - (a.shift.breakMinutes ? 480 : 480))

    records.push({
      shiftAssignmentId: a.id,
      employeeId: a.employeeId,
      projectId: a.projectId,
      checkInAt: checkInStr,
      checkOutAt: checkOutStr,
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

  console.log(`  Distribution: ${presentCount} present, ${lateCount} late, ${absentCount} absent, ${weekendCount} Sundays skipped`)

  // Bulk insert via createMany (skipDuplicates for re-runs)
  console.log(`\n  Upserting ${records.length} attendance records...`)
  // Note: createMany with skipDuplicates requires unique constraint on shiftAssignmentId (which we have)
  let created = 0
  for (const r of records) {
    try {
      await prisma.attendanceRecord.upsert({
        where: { shiftAssignmentId: r.shiftAssignmentId },
        update: {
          checkInAt: new Date(r.checkInAt),
          checkOutAt: new Date(r.checkOutAt),
          totalMinutesWorked: r.totalMinutesWorked,
          overtimeMinutes: r.overtimeMinutes,
          lateMinutes: r.lateMinutes,
          status: r.status,
        },
        create: r,
      })
      created++
    } catch {
      // Skip duplicates
    }
  }
  console.log(`  ✓ ${created} attendance records upserted\n`)
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Attendance demo seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
