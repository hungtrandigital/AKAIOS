import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";

export async function GET() {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const items = await getDb().select().from(leads).orderBy(desc(leads.createdAt));
  return Response.json({ items });
}
