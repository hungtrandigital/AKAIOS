import { cookies } from "next/headers";
import {
  ADMIN_PREVIEW_COOKIE,
  ADMIN_PUBLIC_ORIGIN,
  createAdminPreviewSession,
  verifyAdminPreviewPassword,
} from "@/lib/admin-auth";

const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export async function POST(request: Request) {
  const form = await request.formData();
  const action = String(form.get("action") ?? "login");
  const cookieStore = await cookies();

  if (action === "logout") {
    cookieStore.delete(ADMIN_PREVIEW_COOKIE);
    return Response.redirect(new URL("/admin/login", ADMIN_PUBLIC_ORIGIN), 303);
  }

  const password = String(form.get("password") ?? "");
  const session = await createAdminPreviewSession();
  if (!session || !(await verifyAdminPreviewPassword(password))) {
    return Response.redirect(
      new URL("/admin/login?error=invalid", ADMIN_PUBLIC_ORIGIN),
      303,
    );
  }

  cookieStore.set(ADMIN_PREVIEW_COOKIE, session, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return Response.redirect(new URL("/admin", ADMIN_PUBLIC_ORIGIN), 303);
}
