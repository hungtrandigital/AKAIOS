// Money value object — wraps Decimal.js for exact VNĐ arithmetic.
// VN payroll involves Decimal precision (1.5x multiplier × per-minute rate).

import Decimal from 'decimal.js'

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP })

export class Money {
  readonly amount: Decimal

  constructor(value: Decimal.Value) {
    this.amount = new Decimal(value)
  }

  static zero(): Money {
    return new Money(0)
  }

  static fromVNĐ(vnđ: number | string): Money {
    return new Money(vnđ)
  }

  add(other: Money): Money {
    return new Money(this.amount.plus(other.amount))
  }

  subtract(other: Money): Money {
    return new Money(this.amount.minus(other.amount))
  }

  multiply(factor: number | Decimal): Money {
    return new Money(this.amount.times(factor instanceof Decimal ? factor : new Decimal(factor)))
  }

  divide(divisor: number | Decimal): Money {
    return new Money(this.amount.div(divisor instanceof Decimal ? divisor : new Decimal(divisor)))
  }

  isGreaterThan(other: Money): boolean {
    return this.amount.greaterThan(other.amount)
  }

  isLessThan(other: Money): boolean {
    return this.amount.lessThan(other.amount)
  }

  isZero(): boolean {
    return this.amount.isZero()
  }

  /** Return the smaller of two Money values (for cap logic in payroll). */
  static min(a: Money, b: Money): Money {
    return a.isLessThan(b) ? a : b
  }

  /** Return the larger of two Money values. */
  static max(a: Money, b: Money): Money {
    return a.isGreaterThan(b) ? a : b
  }

  /** Round to nearest VNĐ (integer) — for display */
  toVNĐ(): number {
    return this.amount.round().toNumber()
  }

  /** Return string in database format (15,2 precision) */
  toDBString(): string {
    return this.amount.toFixed(2)
  }

  /** Format as Vietnamese currency: 1.234.567 ₫ */
  format(): string {
    const vnđ = this.toVNĐ()
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(vnđ)
  }
}
