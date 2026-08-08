import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { ensureBootstrap } from "@/lib/content";

const phonePattern = /^[0-9+().\s-]{8,20}$/;

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    if (String(payload.companyWebsite ?? "").trim()) {
      return Response.json({ ok: true }, { status: 201 });
    }
    const name = String(payload.name ?? "").trim().slice(0, 100);
    const phone = String(payload.phone ?? "").trim().slice(0, 30);
    const requestedType = String(payload.leadType ?? "");
    const locale = payload.locale === "en" ? "en" : "vi";
    const leadType = requestedType === "building" || requestedType === "factory" || requestedType === "apartment"
      ? requestedType
      : requestedType === "project" ? "building" : "apartment";
    if (!name || !phonePattern.test(phone)) {
      return Response.json({ error: "Vui lòng nhập tên và số điện thoại hợp lệ." }, { status: 400 });
    }

    await ensureBootstrap();
    const id = crypto.randomUUID();
    await getDb().insert(leads).values({
      id,
      leadType,
      locale,
      name,
      phone,
      email: String(payload.email ?? "").trim().slice(0, 160),
      location: String(payload.location ?? "").trim().slice(0, 200),
      propertyType: String(payload.propertyType ?? "").trim().slice(0, 160),
      area: String(payload.area ?? "").trim().slice(0, 80),
      frequency: String(payload.frequency ?? "").trim().slice(0, 100),
      message: String(payload.message ?? "").trim().slice(0, 2000),
      status: "new",
    });
    return Response.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    console.error("lead-create-failed", error);
    const detail = process.env.NODE_ENV !== "production" && error instanceof Error ? error.message : undefined;
    return Response.json({ error: "Chưa thể tiếp nhận yêu cầu.", detail }, { status: 503 });
  }
}
