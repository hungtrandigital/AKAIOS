// Vietnam tax/insurance calculator (BR-VN-TAX-001..005)
// Implements the standard statutory rates effective 2024-2026.
// All rates are configurable per PayrollRule for custom scenarios.

import { Money } from '@ak/shared'
import type { TaxMode } from '@prisma/client'

// ============================================================================
// DEFAULT RATES (Vietnam 2024+ statutory)
// ============================================================================
// Source: BHXH Việt Nam 2024 + Thông tư 111/2013 (PIT brackets)

/** BHXH (Social Insurance) — áp dụng trên lương đóng BHXH (max 20× base salary × 0.5M = 29.4M/tháng) */
export const VN_RATES_DEFAULT = {
  bhxhNv: 0.08,    // 8% (NV)
  bhxhDn: 0.175,   // 17.5% (DN)
  bhytNv: 0.015,   // 1.5% (NV)
  bhytDn: 0.03,    // 3% (DN)
  bhtnNv: 0.01,    // 1% (NV)
  bhtnDn: 0.01,    // 1% (DN)
  /** Giảm trừ gia cảnh bản thân (personal deduction) */
  personalDeduction: 11_000_000,
  /** Giảm trừ người phụ thuộc (dependent deduction, per person) */
  dependentDeduction: 4_400_000,
  /** BHXH ceiling (20× base salary × 0.5M) */
  bhxhCeiling: 29_400_000,
} as const

// PIT progressive brackets (from gross income MINUS personal deduction,
// then minus dependent deduction, then look up bracket)
export interface PITBracket {
  from: number
  to: number | null   // null = no upper bound
  rate: number        // e.g. 0.05 = 5%
  quickDeduct: number // Trừ nhanh (Vietnam PIT uses progressive + quick-deduct)
}

/** Default 7-tier PIT brackets (2024+, applied to taxable income) */
export const PIT_BRACKETS_DEFAULT: PITBracket[] = [
  { from: 0,        to: 5_000_000,    rate: 0.05,  quickDeduct: 0 },
  { from: 5_000_000, to: 10_000_000,   rate: 0.10,  quickDeduct: 250_000 },
  { from: 10_000_000, to: 18_000_000,  rate: 0.15,  quickDeduct: 750_000 },
  { from: 18_000_000, to: 32_000_000,  rate: 0.20,  quickDeduct: 1_650_000 },
  { from: 32_000_000, to: 52_000_000,  rate: 0.25,  quickDeduct: 3_250_000 },
  { from: 52_000_000, to: 80_000_000,  rate: 0.30,  quickDeduct: 5_850_000 },
  { from: 80_000_000, to: null,        rate: 0.35,  quickDeduct: 9_850_000 },
]

// ============================================================================
// COMPUTATION
// ============================================================================

export interface TaxBreakdown {
  bhxhNhanVien: Money
  bhxhDoanhNghiep: Money
  bhytNhanVien: Money
  bhytDoanhNghiep: Money
  bhtnNhanVien: Money
  bhtnDoanhNghiep: Money
  thueTNCN: Money
  tongKhauTru: Money
}

/**
 * Compute Vietnam tax/insurance breakdown for a single employee.
 * @param gross Gross salary BEFORE deductions
 * @param taxMode 'none' | 'tncn_only' | 'full' | 'custom'
 * @param options Optional override for BHXH rates + dependents + PIT brackets
 * @returns All deductions per line, plus total
 */
export function computeVietnamTax(
  gross: Money,
  taxMode: TaxMode,
  options: {
    bhxhRateNv?: number
    bhxhRateDn?: number
    bhytRateNv?: number
    bhytRateDn?: number
    bhtnRateNv?: number
    bhtnRateDn?: number
    pitBrackets?: PITBracket[]
    dependentCount?: number  // Số người phụ thuộc
  } = {}
): TaxBreakdown {
  const r = {
    bhxhNv: options.bhxhRateNv ?? VN_RATES_DEFAULT.bhxhNv,
    bhxhDn: options.bhxhRateDn ?? VN_RATES_DEFAULT.bhxhDn,
    bhytNv: options.bhytRateNv ?? VN_RATES_DEFAULT.bhytNv,
    bhytDn: options.bhytRateDn ?? VN_RATES_DEFAULT.bhytDn,
    bhtnNv: options.bhtnRateNv ?? VN_RATES_DEFAULT.bhtnNv,
    bhtnDn: options.bhtnRateDn ?? VN_RATES_DEFAULT.bhtnDn,
  }
  const brackets = options.pitBrackets ?? PIT_BRACKETS_DEFAULT
  const dependents = options.dependentCount ?? 0

  // BHXH base salary has a ceiling (20× base salary × 0.5M = 29.4M VNĐ)
  const grossNum = gross.toVNĐ()
  const bhxhBase = Math.min(grossNum, VN_RATES_DEFAULT.bhxhCeiling)

  // Compute BHXH/BHYT/BHTN (employer + employee portions)
  let bhxhNv = Money.zero()
  let bhxhDn = Money.zero()
  let bhytNv = Money.zero()
  let bhytDn = Money.zero()
  let bhtnNv = Money.zero()
  let bhtnDn = Money.zero()
  let thueTNCN = Money.zero()

  if (taxMode === 'full' || taxMode === 'custom') {
    bhxhNv = Money.fromVNĐ(bhxhBase * r.bhxhNv)
    bhxhDn = Money.fromVNĐ(bhxhBase * r.bhxhDn)
    bhytNv = Money.fromVNĐ(bhxhBase * r.bhytNv)
    bhytDn = Money.fromVNĐ(bhxhBase * r.bhytDn)
    bhtnNv = Money.fromVNĐ(bhxhBase * r.bhtnNv)
    bhtnDn = Money.fromVNĐ(bhxhBase * r.bhtnDn)
  }

  // PIT calculation (applies for 'tncn_only' AND 'full' AND 'custom' if PIT bracket given)
  if (taxMode === 'tncn_only' || taxMode === 'full' || (taxMode === 'custom' && options.pitBrackets)) {
    // Taxable income = gross - BHXH_NV (employee's BHXH portion reduces PIT base)
    // - personal deduction - dependent deduction
    const employeeInsurance = taxMode === 'full' || taxMode === 'custom'
      ? bhxhNv.toVNĐ() + bhytNv.toVNĐ() + bhtnNv.toVNĐ()
      : 0
    const personalDeduct = VN_RATES_DEFAULT.personalDeduction
    const depDeduct = VN_RATES_DEFAULT.dependentDeduction * dependents
    const taxableIncome = Math.max(0, grossNum - employeeInsurance - personalDeduct - depDeduct)
    thueTNCN = Money.fromVNĐ(computePIT(taxableIncome, brackets))
  }

  // Total deductions (employee portion only)
  const tongKhauTru = (taxMode === 'full' || taxMode === 'custom')
    ? bhxhNv.add(bhytNv).add(bhtnNv).add(thueTNCN)
    : (taxMode === 'tncn_only' ? thueTNCN : Money.zero())

  return {
    bhxhNhanVien: bhxhNv,
    bhxhDoanhNghiep: bhxhDn,
    bhytNhanVien: bhytNv,
    bhytDoanhNghiep: bhytDn,
    bhtnNhanVien: bhtnNv,
    bhtnDoanhNghiep: bhtnDn,
    thueTNCN,
    tongKhauTru,
  }
}

/**
 * Compute PIT (personal income tax) using progressive brackets.
 * Returns VNĐ amount to withhold.
 */
export function computePIT(taxableIncome: number, brackets: PITBracket[] = PIT_BRACKETS_DEFAULT): number {
  if (taxableIncome <= 0) return 0
  for (const b of brackets) {
    const upper = b.to ?? Infinity
    if (taxableIncome > b.from && taxableIncome <= upper) {
      return Math.round(taxableIncome * b.rate - b.quickDeduct)
    }
    if (b.to === null) {
      // Top bracket (no upper bound)
      return Math.round(taxableIncome * b.rate - b.quickDeduct)
    }
  }
  return 0
}
