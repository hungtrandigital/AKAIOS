import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";

type Context = { params: Promise<{ id: string }> };
const statuses = new Set(["new", "contacted", "surveying", "quoted", "won", "closed"]);

export async function PATCH(request: Request, { params }: Context) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const payload = (await request.json()) as { status?: string };
  if (!payload.status || !statuses.has(payload.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  await getDb().update(leads).set({ status: payload.status, updatedAt: new Date().toISOString() }).where(eq(leads.id, id));
  return Response.json({ ok: true });
}
