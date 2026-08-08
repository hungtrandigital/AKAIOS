import { env } from "cloudflare:workers";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getChatGPTUser,
  requireChatGPTUser,
  type ChatGPTUser,
} from "@/app/chatgpt-auth";

export type AdminIdentity = ChatGPTUser & { isLocalDemo?: boolean };

export const ADMIN_PREVIEW_COOKIE = "akaiunsan_admin_preview";
export const ADMIN_PUBLIC_ORIGIN = "https://akaiunsan.prismate.vn";

const localAdmin: AdminIdentity = {
  userId: "local-demo",
  displayName: "Local content editor",
  email: "local@akaiunsan.test",
  fullName: "Local content editor",
  isLocalDemo: true,
};

const reviewAdmin: AdminIdentity = {
  userId: "external-review",
  displayName: "AKAIUNSAN review editor",
  email: "review@akaiunsan.local",
  fullName: "AKAIUNSAN review editor",
};

function runtimeEnv(): Record<string, string | undefined> {
  return env as unknown as Record<string, string | undefined>;
}

function configuredEmails(): string[] {
  return (runtimeEnv().ADMIN_EMAILS ?? process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function configuredPreviewPassword(): string {
  return (
    runtimeEnv().ADMIN_PREVIEW_PASSWORD ??
    process.env.ADMIN_PREVIEW_PASSWORD ??
    ""
  ).trim();
}

function isAllowed(user: ChatGPTUser): boolean {
  return configuredEmails().includes(user.email.toLowerCase());
}

async function isLoopbackRequest(): Promise<boolean> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host")?.trim().toLowerCase() ?? "";
  const hostname = host.startsWith("[")
    ? host.slice(1, host.indexOf("]"))
    : host.split(":", 1)[0];

  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}

async function digest(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createAdminPreviewSession(): Promise<string | null> {
  const password = configuredPreviewPassword();
  return password ? digest(`akaiunsan-admin-preview:${password}`) : null;
}

export async function verifyAdminPreviewPassword(candidate: string): Promise<boolean> {
  const configured = configuredPreviewPassword();
  return Boolean(configured) && constantTimeEqual(candidate, configured);
}

async function hasAdminPreviewSession(): Promise<boolean> {
  const expected = await createAdminPreviewSession();
  if (!expected) return false;
  const cookieStore = await cookies();
  const actual = cookieStore.get(ADMIN_PREVIEW_COOKIE)?.value ?? "";
  return constantTimeEqual(actual, expected);
}

export async function requireAdminPage(
  returnTo: string,
): Promise<{ user: AdminIdentity; authorized: boolean }> {
  if (await isLoopbackRequest()) {
    return { user: localAdmin, authorized: true };
  }

  if (configuredPreviewPassword()) {
    if (await hasAdminPreviewSession()) {
      return { user: reviewAdmin, authorized: true };
    }
    redirect(
      `${ADMIN_PUBLIC_ORIGIN}/admin/login?return_to=${encodeURIComponent(returnTo)}`,
    );
  }

  const user = await requireChatGPTUser(returnTo);
  return { user, authorized: isAllowed(user) };
}

export async function requireAdminApi(): Promise<AdminIdentity | null> {
  if (await isLoopbackRequest()) return localAdmin;
  if (configuredPreviewPassword()) {
    return (await hasAdminPreviewSession()) ? reviewAdmin : null;
  }
  const user = await getChatGPTUser();
  return user && isAllowed(user) ? user : null;
}
