BEGIN;

-- Shift templates used to be global. Scheduling writes must be paused while
-- the catalog is expanded into one copy per tenant and assignments repointed.
LOCK TABLE "shifts" IN ACCESS EXCLUSIVE MODE;
LOCK TABLE "shift_assignments" IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "shifts") AND NOT EXISTS (SELECT 1 FROM "tenants") THEN
    RAISE EXCEPTION 'Cannot tenant-scope shifts without a tenant';
  END IF;

  IF EXISTS (
    SELECT 1 FROM "shifts" GROUP BY "name" HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate global shift names require manual reconciliation before migration';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "shift_assignments" sa
    JOIN "employees" e ON e."id" = sa."employeeId"
    JOIN "projects" p ON p."id" = sa."projectId"
    WHERE e."tenantId" <> p."tenantId"
  ) THEN
    RAISE EXCEPTION 'Cross-tenant employee/project shift assignments require manual reconciliation';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "shift_assignments"
    WHERE "status" <> 'cancelled'
    GROUP BY "employeeId", "date"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Multiple active assignments for one employee/date require audited reconciliation';
  END IF;
END $$;

ALTER TABLE "shifts" ADD COLUMN "tenantId" UUID;

CREATE TEMP TABLE "_shift_tenant_map" (
  "oldShiftId" UUID NOT NULL,
  "tenantId" UUID NOT NULL,
  "newShiftId" UUID NOT NULL,
  PRIMARY KEY ("oldShiftId", "tenantId")
) ON COMMIT DROP;

WITH primary_tenant AS (
  SELECT "id" FROM "tenants" ORDER BY "id" LIMIT 1
)
INSERT INTO "_shift_tenant_map" ("oldShiftId", "tenantId", "newShiftId")
SELECT
  s."id",
  t."id",
  CASE WHEN t."id" = pt."id" THEN s."id" ELSE gen_random_uuid() END
FROM "shifts" s
CROSS JOIN "tenants" t
CROSS JOIN primary_tenant pt;

UPDATE "shifts" s
SET "tenantId" = m."tenantId"
FROM "_shift_tenant_map" m
WHERE m."oldShiftId" = s."id" AND m."newShiftId" = s."id";

INSERT INTO "shifts" (
  "id", "tenantId", "name", "startTime", "endTime", "breakMinutes",
  "lateThresholdMinutes", "isOvernight", "color", "isActive", "createdAt", "updatedAt"
)
SELECT
  m."newShiftId", m."tenantId", s."name", s."startTime", s."endTime", s."breakMinutes",
  s."lateThresholdMinutes", s."isOvernight", s."color", s."isActive", s."createdAt", s."updatedAt"
FROM "_shift_tenant_map" m
JOIN "shifts" s ON s."id" = m."oldShiftId"
WHERE m."newShiftId" <> m."oldShiftId";

UPDATE "shift_assignments" sa
SET "shiftId" = m."newShiftId"
FROM "projects" p, "_shift_tenant_map" m
WHERE p."id" = sa."projectId"
  AND m."oldShiftId" = sa."shiftId"
  AND m."tenantId" = p."tenantId";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "shift_assignments" sa
    JOIN "employees" e ON e."id" = sa."employeeId"
    JOIN "projects" p ON p."id" = sa."projectId"
    JOIN "shifts" s ON s."id" = sa."shiftId"
    WHERE e."tenantId" <> p."tenantId" OR s."tenantId" <> p."tenantId"
  ) THEN
    RAISE EXCEPTION 'Shift tenant backfill verification failed';
  END IF;
END $$;

ALTER TABLE "shifts" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "shifts"
  ADD CONSTRAINT "shifts_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX "shifts_isActive_idx";
CREATE UNIQUE INDEX "shifts_tenantId_name_key" ON "shifts"("tenantId", "name");
CREATE INDEX "shifts_tenantId_isActive_idx" ON "shifts"("tenantId", "isActive");

DROP INDEX "shift_assignments_employeeId_projectId_shiftId_date_key";
CREATE UNIQUE INDEX "shift_assignments_employee_date_active_key"
  ON "shift_assignments"("employeeId", "date")
  WHERE "status" <> 'cancelled';

COMMIT;
