-- BR-ATT-006 now allows explicitly confirmed overlapping assignments while
-- retaining a hard invariant against exact active duplicates.
DROP INDEX IF EXISTS "shift_assignments_employee_date_active_key";

CREATE UNIQUE INDEX "shift_assignments_exact_active_key"
  ON "shift_assignments"("employeeId", "projectId", "shiftId", "date")
  WHERE "status" <> 'cancelled';

ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'copy_shift_assignments';
