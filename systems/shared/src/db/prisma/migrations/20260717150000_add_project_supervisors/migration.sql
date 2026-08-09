-- Explicit supervisor-to-project authorization. Never infer this boundary from shifts.
ALTER TYPE "AuditAction" ADD VALUE 'grant_project_supervisor';
ALTER TYPE "AuditAction" ADD VALUE 'revoke_project_supervisor';

CREATE TABLE "project_supervisors" (
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "assignedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_supervisors_pkey" PRIMARY KEY ("projectId", "userId")
);

CREATE INDEX "project_supervisors_userId_projectId_idx"
ON "project_supervisors"("userId", "projectId");

CREATE INDEX "project_supervisors_assignedById_idx"
ON "project_supervisors"("assignedById");

ALTER TABLE "project_supervisors"
ADD CONSTRAINT "project_supervisors_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_supervisors"
ADD CONSTRAINT "project_supervisors_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_supervisors"
ADD CONSTRAINT "project_supervisors_assignedById_fkey"
FOREIGN KEY ("assignedById") REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
