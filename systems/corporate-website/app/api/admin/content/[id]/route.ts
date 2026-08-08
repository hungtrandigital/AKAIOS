import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { contentItems, contentRevisions } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";

type Context = { params: Promise<{ id: string }> };
const allowedLocales = new Set(["vi", "en"]);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function PATCH(request: Request, { params }: Context) {
  const user = await requireAdminApi();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const [current] = await db.select().from(contentItems).where(eq(contentItems.id, id)).limit(1);
  if (!current) return Response.json({ error: "Not found" }, { status: 404 });
  const payload = (await request.json()) as Record<string, unknown>;
  const locale = String(payload.locale ?? current.locale);
  const slug = String(payload.slug ?? current.slug).trim();
  if (!allowedLocales.has(locale) || !slugPattern.test(slug)) {
    return Response.json({ error: "Locale or slug is invalid." }, { status: 400 });
  }
  await db.insert(contentRevisions).values({
    id: crypto.randomUUID(),
    contentId: id,
    snapshot: JSON.stringify(current),
    editorEmail: user.email,
  });
  const status = payload.status === "published" ? "published" : "draft";
  await db.update(contentItems).set({
    title: String(payload.title ?? current.title).trim(),
    locale,
    translationKey: String(payload.translationKey ?? current.translationKey ?? "").trim() || current.id,
    slug,
    eyebrow: String(payload.eyebrow ?? current.eyebrow).trim(),
    summary: String(payload.summary ?? current.summary).trim(),
    body: String(payload.body ?? current.body).trim(),
    meta: String(payload.meta ?? current.meta),
    image: String(payload.image ?? current.image ?? "").trim() || null,
    status,
    seoTitle: String(payload.seoTitle ?? current.seoTitle).trim(),
    seoDescription: String(payload.seoDescription ?? current.seoDescription).trim(),
    sortOrder: Number(payload.sortOrder ?? current.sortOrder) || 0,
    publishedAt: status === "published" ? current.publishedAt ?? new Date().toISOString() : null,
    updatedAt: new Date().toISOString(),
  }).where(eq(contentItems.id, id));
  revalidatePath("/");
  revalidatePath("/en");
  revalidatePath(`/${current.type === "solution" ? "giai-phap" : current.type === "service" ? "dich-vu" : "kien-thuc"}/${current.slug}`);
  return Response.json({ ok: true });
}
