// Vietnamese holidays configuration (configurable per tenant in future).
// Used to compute OT multiplier (3x on holidays) per BR-PAY-010.

export interface Holiday {
  date: string // "YYYY-MM-DD"
  name: string
}

// Hardcoded for AKAIUNSAN. In production, move to DB table for tenant-specific.
export const VIETNAM_HOLIDAYS: Holiday[] = [
  { date: '2026-01-01', name: 'Tết Dương lịch' },
  { date: '2026-02-16', name: 'Giao thừa Tết Nguyên đán' },
  { date: '2026-02-17', name: 'Mùng 1 Tết Nguyên đán' },
  { date: '2026-02-18', name: 'Mùng 2 Tết Nguyên đán' },
  { date: '2026-02-19', name: 'Mùng 3 Tết Nguyên đán' },
  { date: '2026-04-26', name: 'Giỗ Tổ Hùng Vương' },
  { date: '2026-04-30', name: 'Thống nhất' },
  { date: '2026-05-01', name: 'Quốc tế lao động' },
  { date: '2026-09-02', name: 'Quốc khánh' },
  { date: '2027-01-01', name: 'Tết Dương lịch' },
  { date: '2027-02-05', name: 'Giao thừa Tết Nguyên đán' },
  { date: '2027-02-06', name: 'Mùng 1 Tết Nguyên đán' },
  { date: '2027-02-07', name: 'Mùng 2 Tết Nguyên đán' },
  { date: '2027-04-25', name: 'Giỗ Tổ Hùng Vương' },
  { date: '2027-04-30', name: 'Thống nhất' },
  { date: '2027-05-01', name: 'Quốc tế lao động' },
  { date: '2027-09-02', name: 'Quốc khánh' },
]

/** O(1) lookup: returns true if date is a VN holiday. */
export function isVietnamHoliday(date: Date | string): boolean {
  const dateStr = typeof date === 'string'
    ? date
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return VIETNAM_HOLIDAYS.some((h) => h.date === dateStr)
}

/** Get name of holiday on date, or null. */
export function getVietnamHolidayName(date: Date | string): string | null {
  const dateStr = typeof date === 'string'
    ? date
    : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const h = VIETNAM_HOLIDAYS.find((x) => x.date === dateStr)
  return h ? h.name : null
}
