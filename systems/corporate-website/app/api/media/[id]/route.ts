import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { mediaAssets } from "@/db/schema";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const { id } = await params;
  try {
    const [asset] = await getDb().select().from(mediaAssets).where(eq(mediaAssets.id, id)).limit(1);
    if (!asset) return new Response("Not found", { status: 404 });
    if (asset.publicPath) return Response.redirect(new URL(asset.publicPath, "https://akaiunsan.prismate.vn"), 302);
    const runtime = env as unknown as { MEDIA?: R2Bucket };
    if (!runtime.MEDIA || !asset.objectKey) return new Response("Not found", { status: 404 });
    const object = await runtime.MEDIA.get(asset.objectKey);
    if (!object) return new Response("Not found", { status: 404 });
    return new Response(object.body, { headers: { "content-type": asset.mimeType, "cache-control": "public, max-age=31536000, immutable" } });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
