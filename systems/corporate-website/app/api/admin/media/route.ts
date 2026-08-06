import { env } from "cloudflare:workers";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { ensureBootstrap } from "@/lib/content";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function GET() {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await ensureBootstrap();
  const items = await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  return Response.json({ items });
}
export async function POST(request: Request) {
  const user = await requireAdminApi();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "Chỉ nhận JPG, PNG, WebP hoặc AVIF tối đa 10MB." }, { status: 400 });
  }
  const runtime = env as unknown as { MEDIA?: R2Bucket };
  if (!runtime.MEDIA) return Response.json({ error: "Media storage unavailable." }, { status: 503 });
  await ensureBootstrap();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "image";
  const id = crypto.randomUUID();
  const objectKey = `uploads/${id}-${safeName}`;
  await runtime.MEDIA.put(objectKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  await getDb().insert(mediaAssets).values({
    id,
    title: String(formData.get("title") ?? file.name).slice(0, 160),
    objectKey,
    publicPath: null,
    altText: String(formData.get("altText") ?? "").slice(0, 300),
    sourceType: String(formData.get("sourceType") ?? "original").slice(0, 40),
    sourceReference: String(formData.get("sourceReference") ?? "").slice(0, 300),
    category: String(formData.get("category") ?? "general").slice(0, 80),
    isPlaceholder: formData.get("isPlaceholder") === "true",
    mimeType: file.type,
  });
  return Response.json({ id, url: `/api/media/${id}` }, { status: 201 });
}
