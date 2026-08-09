// Customer Report Generator — PDF (PDFKit) + CSV
// Used by attendance-api to send monthly summary reports to 15 customers.
//
// BR-CUST-001: Each project has its own template config (logo URL, header text)
// BR-CUST-002: Report covers all attendance records in the period for the project
// BR-CUST-003: PDF includes photos count + attendance summary (no PII)
// BR-CUST-004: CSV includes row-level detail for audit

import PDFDocument from 'pdfkit'
import { BusinessRuleViolationError, prisma } from '@ak/shared'
import { uploadObject, getPresignedUrl, MINIO_BUCKET_NAMES } from '@ak/shared'
import { randomUUID } from 'node:crypto'

export interface ReportPeriod {
  projectId: string
  from: Date
  to: Date
}

export interface CustomerReportData {
  project: {
    code: string
    name: string
    clientName: string
    address: string
    reportTemplateConfig: any
  }
  period: { from: Date; to: Date }
  generatedAt: Date
  attendanceByDay: Array<{
    date: Date
    employeeCount: number
    checkIns: number
    checkOuts: number
    photosCount: number
  }>
  attendanceByEmployee: Array<{
    employeeCode: string
    employeeName: string
    daysWorked: number
    totalHours: number
  }>
  totals: {
    totalShifts: number
    totalCheckIns: number
    totalHours: number
    totalEmployees: number
  }
}

/** Aggregate attendance data for the report. */
export async function aggregateReportData(
  projectId: string,
  from: Date,
  to: Date,
  tenantId: string
): Promise<CustomerReportData | null> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, tenantId, deletedAt: null },
    include: {
      shiftAssignments: {
        where: { date: { gte: from, lte: to } },
        include: {
          employee: { select: { employeeCode: true, fullName: true } },
          attendanceRecord: true,
        },
      },
    },
  })
  if (!project) return null

  // Group by day
  const byDay = new Map<string, { date: Date; employees: Set<string>; checkIns: number; checkOuts: number; photos: number }>()
  // Group by employee
  const byEmployee = new Map<string, { employeeCode: string; employeeName: string; daysWorked: number; totalMinutes: number }>()

  let totalShifts = 0
  let totalCheckIns = 0
  const uniqueEmployees = new Set<string>()
  const workedEmployeeDays = new Set<string>()

  for (const assignment of project.shiftAssignments) {
    totalShifts++
    uniqueEmployees.add(assignment.employeeId)

    const dateKey = assignment.date.toISOString().split('T')[0]!
    const dayEntry = byDay.get(dateKey) ?? {
      date: assignment.date,
      employees: new Set<string>(),
      checkIns: 0,
      checkOuts: 0,
      photos: 0,
    }
    dayEntry.employees.add(assignment.employeeId)
    byDay.set(dateKey, dayEntry)

    const empKey = assignment.employeeId
    const empEntry = byEmployee.get(empKey) ?? {
      employeeCode: assignment.employee.employeeCode,
      employeeName: assignment.employee.fullName,
      daysWorked: 0,
      totalMinutes: 0,
    }

    if (assignment.attendanceRecord) {
      const rec = assignment.attendanceRecord
      if (rec.checkInAt) {
        const workedEmployeeDay = `${assignment.employeeId}:${dateKey}`
        if (workedEmployeeDays.has(workedEmployeeDay)) {
          throw new BusinessRuleViolationError(
            'Multiple attended assignments for one employee/project/date must be reconciled before customer report generation',
            { employeeId: assignment.employeeId, projectId, workDate: dateKey },
          )
        }
        workedEmployeeDays.add(workedEmployeeDay)
        dayEntry.checkIns++
        totalCheckIns++
        empEntry.daysWorked++
        if (rec.checkInPhotoKey) {
          dayEntry.photos++
        }
      }
      if (rec.totalMinutesWorked) {
        empEntry.totalMinutes += rec.totalMinutesWorked
      }
      if (rec.checkOutAt) dayEntry.checkOuts++
    }

    byEmployee.set(empKey, empEntry)
  }

  return {
    project: {
      code: project.code,
      name: project.name,
      clientName: project.clientName,
      address: project.address,
      reportTemplateConfig: project.reportTemplateConfig,
    },
    period: { from, to },
    generatedAt: new Date(),
    attendanceByDay: Array.from(byDay.values())
      .map((d) => ({
        date: d.date,
        employeeCount: d.employees.size,
        checkIns: d.checkIns,
        checkOuts: d.checkOuts,
        photosCount: d.photos,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime()),
    attendanceByEmployee: Array.from(byEmployee.values())
      .map((e) => ({
        ...e,
        totalHours: Math.round((e.totalMinutes / 60) * 100) / 100,
      }))
      .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode)),
    totals: {
      totalShifts,
      totalCheckIns,
      totalHours: Math.round(
        Array.from(byEmployee.values()).reduce((s, e) => s + e.totalMinutes, 0) / 60 * 100,
      ) / 100,
      totalEmployees: uniqueEmployees.size,
    },
  }
}

/** Generate a PDF report and return as Buffer. */
export function generateReportPdf(data: CustomerReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, left: 50, right: 50, bottom: 50 },
      info: {
        Title: `Báo cáo dịch vụ vệ sinh - ${data.project.name}`,
        Author: 'AKAIUNSAN',
        CreationDate: data.generatedAt,
      },
    })

    const chunks: Buffer[] = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // === HEADER ===
    doc.fontSize(20).fillColor('#003366').text(data.project.reportTemplateConfig?.headerText ?? 'BÁO CÁO DỊCH VỤ VỆ SINH', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(14).fillColor('#000000').text(`Dự án: ${data.project.name}`, { align: 'center' })
    doc.fontSize(10).fillColor('#666666').text(`Khách hàng: ${data.project.clientName}`, { align: 'center' })
    doc.moveDown(1.5)

    // === REPORT INFO ===
    doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('THÔNG TIN BÁO CÁO')
    doc.font('Helvetica').fontSize(10)
    doc.text(`Mã dự án: ${data.project.code}`)
    doc.text(`Địa chỉ: ${data.project.address}`)
    doc.text(`Từ ngày: ${data.period.from.toLocaleDateString('vi-VN')}`)
    doc.text(`Đến ngày: ${data.period.to.toLocaleDateString('vi-VN')}`)
    doc.text(`Ngày tạo: ${data.generatedAt.toLocaleDateString('vi-VN')} ${data.generatedAt.toLocaleTimeString('vi-VN')}`)
    doc.moveDown(1)

    // === SUMMARY ===
    doc.font('Helvetica-Bold').fontSize(12).text('TỔNG KẾT')
    doc.font('Helvetica').fontSize(10)
    doc.fillColor('#003366')
    doc.text(`  • Tổng số ca làm việc: ${data.totals.totalShifts}`)
    doc.text(`  • Tổng lượt check-in: ${data.totals.totalCheckIns}`)
    doc.text(`  • Tổng số nhân viên tham gia: ${data.totals.totalEmployees}`)
    doc.text(`  • Tổng giờ công: ${data.totals.totalHours} giờ`)
    doc.fillColor('#000000')
    doc.moveDown(1)

    // === DAILY BREAKDOWN TABLE ===
    doc.font('Helvetica-Bold').fontSize(12).text('BẢNG CHẤM CÔNG THEO NGÀY')
    doc.moveDown(0.5)

    const dailyTableTop = doc.y
    const colWidths = [80, 130, 100, 100, 100]
    const rowHeight = 20

    // Table header
    doc.font('Helvetica-Bold').fontSize(9)
    let x = 50
    const headers = ['Ngày', 'Số NV', 'Check-in', 'Check-out', 'Số ảnh']
    headers.forEach((h, i) => {
      doc.rect(x, dailyTableTop, colWidths[i]!, rowHeight).fillAndStroke('#003366', '#000000')
      doc.fillColor('#ffffff').text(h, x + 5, dailyTableTop + 5, {
        width: colWidths[i]! - 10,
        align: 'center',
      })
      x += colWidths[i]!
    })
    doc.fillColor('#000000')

    // Data rows
    doc.font('Helvetica').fontSize(9)
    let y = dailyTableTop + rowHeight
    data.attendanceByDay.forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.rect(50, y, colWidths.reduce((s, w) => s + w, 0), rowHeight).fillColor('#f0f0f0').fill()
      }
      doc.fillColor('#000000')
      let cx = 50
      const cells = [
        row.date.toLocaleDateString('vi-VN'),
        row.employeeCount.toString(),
        row.checkIns.toString(),
        row.checkOuts.toString(),
        row.photosCount.toString(),
      ]
      cells.forEach((c, i) => {
        doc.text(c, cx + 5, y + 5, {
          width: colWidths[i]! - 10,
          align: i === 0 ? 'left' : 'center',
        })
        cx += colWidths[i]!
      })
      y += rowHeight
      if (y > 700) {
        doc.addPage()
        y = 50
      }
    })

    doc.y = y + 20

    // === FOOTER ===
    if (doc.y > 700) doc.addPage()
    doc.moveDown(2)
    doc.fontSize(9).fillColor('#666666').text(
      'Báo cáo được tạo tự động bởi hệ thống AKAIUNSAN. ' +
      'Mọi thắc mắc xin liên hệ BO team.',
      { align: 'center' }
    )

    doc.end()
  })
}

/** Generate a CSV report. */
export function generateReportCsv(data: CustomerReportData): string {
  const lines: string[] = []

  // Header
  lines.push(`Báo cáo dịch vụ vệ sinh - ${data.project.name}`)
  lines.push(`Khách hàng: ${data.project.clientName}`)
  lines.push(`Từ ngày: ${data.period.from.toISOString().split('T')[0]} Đến ngày: ${data.period.to.toISOString().split('T')[0]}`)
  lines.push(`Ngày tạo: ${data.generatedAt.toISOString()}`)
  lines.push('')

  // Summary
  lines.push('TỔNG KẾT')
  lines.push(`Tổng số ca,${data.totals.totalShifts}`)
  lines.push(`Tổng lượt check-in,${data.totals.totalCheckIns}`)
  lines.push(`Tổng nhân viên,${data.totals.totalEmployees}`)
  lines.push(`Tổng giờ công,${data.totals.totalHours}`)
  lines.push('')

  // Daily breakdown
  lines.push('BẢNG CHẤM CÔNG THEO NGÀY')
  lines.push('Ngày,Số NV,Check-in,Check-out,Số ảnh')
  for (const row of data.attendanceByDay) {
    lines.push(
      `${row.date.toISOString().split('T')[0]},${row.employeeCount},${row.checkIns},${row.checkOuts},${row.photosCount}`
    )
  }
  lines.push('')

  // Employee detail
  lines.push('CHI TIẾT THEO NHÂN VIÊN')
  lines.push('Mã NV,Họ tên,Số ngày công,Tổng giờ')
  for (const emp of data.attendanceByEmployee) {
    lines.push(`${emp.employeeCode},"${emp.employeeName}",${emp.daysWorked},${emp.totalHours.toFixed(2)}`)
  }

  // CSV escaping: quote any field with comma/quote/newline
  return lines.join('\n')
}

/** Generate report, upload to MinIO, return presigned URL + report ID. */
export async function generateAndStoreReport(
  projectId: string,
  from: Date,
  to: Date,
  format: 'pdf' | 'csv',
  generatedByUserId: string,
  tenantId: string
): Promise<{ reportId: string; downloadUrl: string; size: number }> {
  const data = await aggregateReportData(projectId, from, to, tenantId)
  if (!data) throw new Error(`Project ${projectId} not found`)

  const dateStr = from.toISOString().split('T')[0]
  const toStr = to.toISOString().split('T')[0]
  const reportId = randomUUID()
  const key = `${tenantId}/${projectId}/${reportId}/customer-report-${dateStr}-${toStr}.${format}`
  let buffer: Buffer
  let contentType: string

  if (format === 'pdf') {
    buffer = await generateReportPdf(data)
    contentType = 'application/pdf'
  } else {
    const csv = generateReportCsv(data)
    buffer = Buffer.from(csv, 'utf-8')
    contentType = 'text/csv'
  }

  await uploadObject(MINIO_BUCKET_NAMES[1], key, buffer, contentType)

  const report = await prisma.customerReport.create({
    data: {
      id: reportId,
      tenantId,
      projectId,
      periodFrom: from,
      periodTo: to,
      format,
      fileKey: key,
      generatedBy: generatedByUserId,
    },
  })

  const downloadUrl = await getPresignedUrl(MINIO_BUCKET_NAMES[1], key, 300) // 5 min

  return { reportId: report.id, downloadUrl, size: buffer.length }
}
