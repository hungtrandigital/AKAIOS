// Working day calculation utilities.
// Default: Mon-Sat = working days, Sun = off (configurable per tenant).

export function isSunday(date: Date): boolean {
  return date.getDay() === 0
}

/**
 * Count working days in a given month (year, monthIndex).
 * Working days = Mon-Sat minus holiday overlay (caller can adjust).
 */
export function countWorkingDaysInMonth(year: number, monthIndex: number): number {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIndex, d)
    if (!isSunday(date)) count++
  }
  return count
}

/**
 * Count working days between two dates (inclusive), excluding Sundays.
 * Used for prorated base calculation when employee joins mid-month.
 */
export function countWorkingDaysInRange(from: Date, to: Date): number {
  let count = 0
  const cur = new Date(from)
  cur.setHours(0, 0, 0, 0)
  const end = new Date(to)
  end.setHours(0, 0, 0, 0)
  while (cur <= end) {
    if (!isSunday(cur)) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

/** Round minutes to nearest N (e.g. 15). Used for OT rounding per BR-PAY-003. */
export function roundMinutes(minutes: number, roundTo: number): number {
  if (roundTo <= 0) return minutes
  return Math.round(minutes / roundTo) * roundTo
}

/** Get last day of month (1-31). */
export function getLastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate()
}

/** Get all Sundays in a month as an array of day-of-month numbers. */
export function getSundaysInMonth(year: number, monthIndex: number): Set<number> {
  const daysInMonth = getLastDayOfMonth(year, monthIndex)
  const sundays = new Set<number>()
  for (let d = 1; d <= daysInMonth; d++) {
    if (isSunday(new Date(year, monthIndex, d))) sundays.add(d)
  }
  return sundays
}
