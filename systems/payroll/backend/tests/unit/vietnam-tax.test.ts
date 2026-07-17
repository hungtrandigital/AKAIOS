// Vietnam tax/insurance calculator tests — BR-VN-TAX-001..005.
// Covers PIT progressive brackets, BHXH ceiling, custom rates, edge cases.

import { describe, it, expect } from 'vitest'
import { Money } from '@ak/shared'
import {
  computeVietnamTax,
  computePIT,
  PIT_BRACKETS_DEFAULT,
  VN_RATES_DEFAULT,
} from '../../src/engine/vietnam-tax.js'

describe('Vietnam Tax — BR-VN-TAX-001..005', () => {
  describe('PIT progressive brackets (BR-VN-TAX-003)', () => {
    it('bracket 1: 0-5M @ 5%', () => {
      // Taxable = 3,000,000 → PIT = 3,000,000 * 0.05 - 0 = 150,000
      expect(computePIT(3_000_000)).toBe(150_000)
    })

    it('bracket 2: 5-10M @ 10% with quick-deduct 250K', () => {
      // Taxable = 7,000,000 → PIT = 7M * 0.10 - 250K = 450,000
      expect(computePIT(7_000_000)).toBe(450_000)
    })

    it('bracket 3: 10-18M @ 15% with quick-deduct 750K', () => {
      // Taxable = 15,000,000 → 15M * 0.15 - 750K = 1,500,000
      expect(computePIT(15_000_000)).toBe(1_500_000)
    })

    it('bracket 4: 18-32M @ 20% with quick-deduct 1.65M', () => {
      // Taxable = 25,000,000 → 25M * 0.20 - 1.65M = 3,350,000
      expect(computePIT(25_000_000)).toBe(3_350_000)
    })

    it('bracket 5: 32-52M @ 25% with quick-deduct 3.25M', () => {
      // Taxable = 40,000,000 → 40M * 0.25 - 3.25M = 6,750,000
      expect(computePIT(40_000_000)).toBe(6_750_000)
    })

    it('bracket 6: 52-80M @ 30% with quick-deduct 5.85M', () => {
      // Taxable = 60,000,000 → 60M * 0.30 - 5.85M = 12,150,000
      expect(computePIT(60_000_000)).toBe(12_150_000)
    })

    it('bracket 7: >80M @ 35% with quick-deduct 9.85M', () => {
      // Taxable = 100,000,000 → 100M * 0.35 - 9.85M = 25,150,000
      expect(computePIT(100_000_000)).toBe(25_150_000)
    })

    it('returns 0 for taxable income <= 0', () => {
      expect(computePIT(0)).toBe(0)
      expect(computePIT(-1_000_000)).toBe(0)
    })
  })

  describe('BHXH ceiling (BR-VN-TAX-001)', () => {
    it('caps BHXH base at 29.4M (20x base salary)', () => {
      // Gross = 50M (above ceiling) → BHXH_NV = 29.4M * 0.08 = 2,352,000
      const result = computeVietnamTax(Money.fromVNĐ(50_000_000), 'full')
      expect(result.bhxhNhanVien.toVNĐ()).toBe(2_352_000)
      // BHXH_DN = 29.4M * 0.175 = 5,145,000
      expect(result.bhxhDoanhNghiep.toVNĐ()).toBe(5_145_000)
    })

    it('uses full gross for BHXH when below ceiling', () => {
      // Gross = 10M (below ceiling) → BHXH_NV = 10M * 0.08 = 800,000
      const result = computeVietnamTax(Money.fromVNĐ(10_000_000), 'full')
      expect(result.bhxhNhanVien.toVNĐ()).toBe(800_000)
    })
  })

  describe('Tax modes (BR-VN-TAX-004)', () => {
    it("'none' mode: no deductions (gross = net, no tax applied)", () => {
      const result = computeVietnamTax(Money.fromVNĐ(20_000_000), 'none')
      expect(result.bhxhNhanVien.toVNĐ()).toBe(0)
      expect(result.thueTNCN.toVNĐ()).toBe(0)
      expect(result.tongKhauTru.toVNĐ()).toBe(0)
    })

    it("'tncn_only' mode: only PIT, no BHXH/BHYT/BHTN", () => {
      // Gross = 20M, taxable = 20M - 11M (personal) = 9M → PIT bracket 2
      // PIT = 9M * 0.10 - 250K = 650,000
      const result = computeVietnamTax(Money.fromVNĐ(20_000_000), 'tncn_only')
      expect(result.bhxhNhanVien.toVNĐ()).toBe(0)
      expect(result.thueTNCN.toVNĐ()).toBe(650_000)
    })

    it("'full' mode: BHXH + BHYT + BHTN + PIT all applied", () => {
      // Gross = 15M, BHXH base = 15M
      // BHXH_NV = 15M * 0.08 = 1,200,000
      // BHYT_NV = 15M * 0.015 = 225,000
      // BHTN_NV = 15M * 0.01 = 150,000
      // Taxable = 15M - 1.575M (insurance) - 11M (personal) = 2,425,000 → PIT bracket 1
      // PIT = 2,425,000 * 0.05 = 121,250
      const result = computeVietnamTax(Money.fromVNĐ(15_000_000), 'full')
      expect(result.bhxhNhanVien.toVNĐ()).toBe(1_200_000)
      expect(result.bhytNhanVien.toVNĐ()).toBe(225_000)
      expect(result.bhtnNhanVien.toVNĐ()).toBe(150_000)
      expect(result.thueTNCN.toVNĐ()).toBe(121_250)
      expect(result.tongKhauTru.toVNĐ()).toBe(1_200_000 + 225_000 + 150_000 + 121_250)
    })
  })

  describe('Personal + dependent deduction', () => {
    it('PIT base subtracts 11M personal deduction', () => {
      // Gross = 12M, taxable = 12M - 11M = 1M → bracket 1
      // PIT = 1M * 0.05 = 50,000
      const result = computeVietnamTax(Money.fromVNĐ(12_000_000), 'tncn_only')
      expect(result.thueTNCN.toVNĐ()).toBe(50_000)
    })

    it('PIT base subtracts dependent deduction (4.4M each)', () => {
      // Gross = 20M, 2 dependents
      // Taxable = 20M - 11M - 2*4.4M = 200,000 → bracket 1
      // PIT = 200,000 * 0.05 = 10,000
      const result = computeVietnamTax(Money.fromVNĐ(20_000_000), 'tncn_only', {
        dependentCount: 2,
      })
      expect(result.thueTNCN.toVNĐ()).toBe(10_000)
    })
  })

  describe('Default rates (VN 2024+ statutory)', () => {
    it('exports expected rate constants', () => {
      expect(VN_RATES_DEFAULT.bhxhNv).toBe(0.08)
      expect(VN_RATES_DEFAULT.bhxhDn).toBe(0.175)
      expect(VN_RATES_DEFAULT.bhytNv).toBe(0.015)
      expect(VN_RATES_DEFAULT.bhytDn).toBe(0.03)
      expect(VN_RATES_DEFAULT.bhtnNv).toBe(0.01)
      expect(VN_RATES_DEFAULT.bhtnDn).toBe(0.01)
      expect(VN_RATES_DEFAULT.personalDeduction).toBe(11_000_000)
      expect(VN_RATES_DEFAULT.dependentDeduction).toBe(4_400_000)
      expect(VN_RATES_DEFAULT.bhxhCeiling).toBe(29_400_000)
    })

    it('exports 7 PIT brackets', () => {
      expect(PIT_BRACKETS_DEFAULT.length).toBe(7)
      expect(PIT_BRACKETS_DEFAULT[0]!.rate).toBe(0.05)
      expect(PIT_BRACKETS_DEFAULT[6]!.rate).toBe(0.35)
      expect(PIT_BRACKETS_DEFAULT[6]!.to).toBeNull()
    })
  })
})
