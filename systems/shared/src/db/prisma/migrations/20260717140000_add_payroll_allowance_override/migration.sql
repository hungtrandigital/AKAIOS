-- Track the exact payroll field overridden so recalculation can refresh
-- rule-derived allowances after advance-only or deduction-only overrides.
ALTER TABLE "payroll_lines"
ADD COLUMN "allowancesOverridden" BOOLEAN NOT NULL DEFAULT false;
