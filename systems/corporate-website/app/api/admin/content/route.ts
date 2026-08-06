import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { contentItems } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { ensureBootstrap } from "@/lib/content";

const allowedTypes = new Set(["service", "solution", "incident", "article", "faq"]);
const allowedLocales = new Set(["vi", "en"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function GET() {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureBootstrap();
  const items = await getDb().select().from(contentItems).orderBy(asc(contentItems.type), asc(contentItems.sortOrder));
  return Response.json({ items });
}

export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const payload = (await request.json()) as Record<string, unknown>;
  const type = String(payload.type ?? "article");
  const locale = String(payload.locale ?? "vi");
  const slug = String(payload.slug ?? "").trim();
  const title = String(payload.title ?? "").trim();
  if (!allowedTypes.has(type) || !allowedLocales.has(locale) || !slugPattern.test(slug) || !title) {
    return Response.json({ error: "Locale, type, title, or slug is invalid." }, { status: 400 });
  }
  await ensureBootstrap();
  const id = crypto.randomUUID();
  await getDb().insert(contentItems).values({
    id,
    type,
    locale,
    translationKey: String(payload.translationKey ?? "").trim() || crypto.randomUUID(),
    slug,
    title,
    eyebrow: String(payload.eyebrow ?? "").trim(),
    summary: String(payload.summary ?? "").trim(),
    body: String(payload.body ?? "").trim(),
    meta: String(payload.meta ?? "{}"),
    image: String(payload.image ?? "").trim() || null,
    status: payload.status === "published" ? "published" : "draft",
    seoTitle: String(payload.seoTitle ?? "").trim(),
    seoDescription: String(payload.seoDescription ?? "").trim(),
    sortOrder: Number(payload.sortOrder ?? 0) || 0,
    publishedAt: payload.status === "published" ? new Date().toISOString() : null,
  });
  return Response.json({ id }, { status: 201 });
}
