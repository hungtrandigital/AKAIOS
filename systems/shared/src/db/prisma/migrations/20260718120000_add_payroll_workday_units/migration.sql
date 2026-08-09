-- Preserve fractional paid-day units so allowance overrides can be cleared
-- without treating a half-day as a full paid day.
ALTER TABLE "payroll_lines"
ADD COLUMN "workdayUnits" DECIMAL(5,2) NOT NULL DEFAULT 0;
