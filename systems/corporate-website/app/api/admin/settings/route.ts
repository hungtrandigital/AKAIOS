import { getDb } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { getSettings } from "@/lib/content";

const allowedKeys = new Set(["siteName", "tagline", "promise", "phone", "email", "address"]);

export async function GET() {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ settings: await getSettings() });
}
export async function PUT(request: Request) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>;
  const db = getDb();
  for (const [key, rawValue] of Object.entries(payload)) {
    if (!allowedKeys.has(key)) continue;
    const value = String(rawValue ?? "").slice(0, 500);
    await db.insert(siteSettings).values({ key, value, updatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: siteSettings.key, set: { value, updatedAt: new Date().toISOString() } });
  }
  return Response.json({ ok: true });
}
