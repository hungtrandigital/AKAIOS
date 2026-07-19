// Vietnamese holidays configuration (configurable per tenant in future).
// Used to compute OT multiplier (3x on holidays) per BR-PAY-010.

export interface Holiday {
  date: string // "YYYY-MM-DD"
  name: string
}

/** Vietnam currently uses UTC+07:00 year-round (Asia/Ho_Chi_Minh). */
export const VIETNAM_UTC_OFFSET_MS = 7 * 60 * 60 * 1000

/** Return the Vietnam calendar date containing an absolute instant. */
export function getVietnamCalendarDateKey(date: Date): string {
  const vietnamDate = new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS)
  return [
    vietnamDate.getUTCFullYear(),
    String(vietnamDate.getUTCMonth() + 1).padStart(2, '0'),
    String(vietnamDate.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

/** Sunday in the Vietnam business calendar, independent of the server timezone. */
export function isVietnamSunday(date: Date): boolean {
  return new Date(date.getTime() + VIETNAM_UTC_OFFSET_MS).getUTCDay() === 0
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
    : getVietnamCalendarDateKey(date)
  return VIETNAM_HOLIDAYS.some((h) => h.date === dateStr)
}

/** Get name of holiday on date, or null. */
export function getVietnamHolidayName(date: Date | string): string | null {
  const dateStr = typeof date === 'string'
    ? date
    : getVietnamCalendarDateKey(date)
  const h = VIETNAM_HOLIDAYS.find((x) => x.date === dateStr)
  return h ? h.name : null
}
