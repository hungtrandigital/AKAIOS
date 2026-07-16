// Calendar utilities — moved out of calculator/holidays for use by seed scripts.

export function isWeekend(date: Date): boolean {
  return date.getDay() === 0 // Sunday only
}

const VIETNAM_HOLIDAYS = [
  '2026-01-01',
  '2026-02-16',
  '2026-02-17',
  '2026-02-18',
  '2026-02-19',
  '2026-04-26',
  '2026-04-30',
  '2026-05-01',
  '2026-09-02',
  '2027-01-01',
  '2027-02-05',
  '2027-02-06',
  '2027-02-07',
  '2027-04-25',
  '2027-04-30',
  '2027-05-01',
  '2027-09-02',
]

export function isHoliday(date: Date): boolean {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return VIETNAM_HOLIDAYS.includes(dateStr)
}
