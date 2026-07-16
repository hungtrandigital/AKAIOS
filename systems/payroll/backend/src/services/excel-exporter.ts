// Excel export for payroll periods (Vietnamese accounting format).
// Uses ExcelJS — supports .xlsx natively.

import ExcelJS from 'exceljs'
import { prisma } from '@ak/shared'

/**
 * Generate Excel file buffer for a payroll period.
 * Format: Vietnamese accounting table with totals.
 */
export async function generatePayrollExcel(periodId: string): Promise<Buffer> {
  const period = await prisma.payrollPeriod.findUnique({
    where: { id: periodId },
    include: {
      tenant: true,
      lines: {
        include: { employee: true },
        orderBy: { employee: { employeeCode: 'asc' } },
      },
    },
  })
  if (!period) throw new Error(`Period ${periodId} not found`)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'AKAIUNSAN Payroll'
  wb.created = new Date()

  const ws = wb.addWorksheet(`Bảng lương T${period.month}-${period.year}`)

  // Title
  ws.mergeCells('A1:M1')
  ws.getCell('A1').value = {
    richText: [
      { font: { bold: true, size: 16 }, text: 'BẢNG LƯƠNG ' },
      { font: { bold: true, size: 14 }, text: `Tháng ${period.month}/${period.year}` },
    ],
  }
  ws.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  ws.mergeCells('A2:M2')
  ws.getCell('A2').value = `Công ty: ${period.tenant.name}`
  ws.getCell('A2').alignment = { horizontal: 'center' }

  // Headers (row 4) — set via columns array so addRow can use keys
  const headers = [
    { header: 'Mã NV', key: 'employeeCode', width: 10 },
    { header: 'Họ tên', key: 'employeeName', width: 22 },
    { header: 'Ngày công', key: 'daysWorked', width: 9 },
    { header: 'Lương CB', key: 'baseSalary', width: 13 },
    { header: 'Lương linh', key: 'proratedBase', width: 13 },
    { header: 'OT thường', key: 'otWeekday', width: 12 },
    { header: 'OT CN', key: 'otWeekend', width: 11 },
    { header: 'OT lễ', key: 'otHoliday', width: 11 },
    { header: 'Phụ cấp', key: 'allowances', width: 11 },
    { header: 'Gross', key: 'gross', width: 13 },
    { header: 'Tạm ứng', key: 'advance', width: 11 },
    { header: 'Khấu trừ khác', key: 'otherDeductions', width: 13 },
    { header: 'Thực nhận', key: 'net', width: 14 },
  ]
  // Set columns BEFORE writing header (so ExcelJS auto-populates row 4)
  ws.columns = headers
  // Style the header row
  const headerRow = ws.getRow(4)
  headerRow.font = { bold: true }
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
  headerRow.height = 25
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // Number format: VNĐ with thousand separator
  const vnđFormat = '#,##0'

  // Data rows
  let rowIdx = 5
  let totalGross = 0
  let totalNet = 0
  let totalAdvance = 0
  let totalOther = 0
  let totalBase = 0

  for (const line of period.lines) {
    const baseSalary = Number(line.baseSalary)
    const gross = Number(line.gross)
    const net = Number(line.net)
    const advance = Number(line.advance)
    const otherDeductions = Number(line.otherDeductions)

    totalGross += gross
    totalNet += net
    totalAdvance += advance
    totalOther += otherDeductions
    totalBase += Number(line.proratedBase)

    ws.addRow({
      employeeCode: line.employee.employeeCode,
      employeeName: line.employee.fullName,
      daysWorked: line.daysWorked,
      baseSalary,
      proratedBase: Number(line.proratedBase),
      otWeekday: Number(line.overtimeWeekdayAmount),
      otWeekend: Number(line.overtimeWeekendAmount),
      otHoliday: Number(line.overtimeHolidayAmount),
      allowances: Number(line.allowances),
      gross,
      advance,
      otherDeductions,
      net,
    })
    rowIdx++

    // Format each cell
    const r = ws.getRow(rowIdx - 1)
    r.getCell(4).numFmt = vnđFormat // baseSalary
    r.getCell(5).numFmt = vnđFormat // proratedBase
    r.getCell(6).numFmt = vnđFormat // otWeekday
    r.getCell(7).numFmt = vnđFormat // otWeekend
    r.getCell(8).numFmt = vnđFormat // otHoliday
    r.getCell(9).numFmt = vnđFormat // allowances
    r.getCell(10).numFmt = vnđFormat // gross
    r.getCell(11).numFmt = vnđFormat // advance
    r.getCell(12).numFmt = vnđFormat // otherDeductions
    r.getCell(13).numFmt = vnđFormat // net
  }

  // Totals row
  const totalsRow = ws.addRow({
    employeeCode: 'TỔNG',
    employeeName: '',
    daysWorked: '',
    baseSalary: '',
    proratedBase: totalBase,
    otWeekday: period.lines.reduce((s, l) => s + Number(l.overtimeWeekdayAmount), 0),
    otWeekend: period.lines.reduce((s, l) => s + Number(l.overtimeWeekendAmount), 0),
    otHoliday: period.lines.reduce((s, l) => s + Number(l.overtimeHolidayAmount), 0),
    allowances: period.lines.reduce((s, l) => s + Number(l.allowances), 0),
    gross: totalGross,
    advance: totalAdvance,
    otherDeductions: totalOther,
    net: totalNet,
  })
  totalsRow.font = { bold: true }
  totalsRow.getCell(5).numFmt = vnđFormat
  totalsRow.getCell(10).numFmt = vnđFormat
  totalsRow.getCell(11).numFmt = vnđFormat
  totalsRow.getCell(12).numFmt = vnđFormat
  totalsRow.getCell(13).numFmt = vnđFormat

  // Signature row
  rowIdx += 2
  ws.getCell(`A${rowIdx}`).value = 'Người lập bảng'
  ws.getCell(`G${rowIdx}`).value = 'Kế toán trưởng'
  ws.getCell(`K${rowIdx}`).value = 'Giám đốc'
  ws.getRow(rowIdx).font = { bold: true }
  ws.getRow(rowIdx).alignment = { horizontal: 'center' }

  // Footer
  rowIdx += 4
  ws.getCell(`A${rowIdx}`).value = `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`
  ws.getCell(`I${rowIdx}`).value = `Trang 1/1`

  // Generate buffer
  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
