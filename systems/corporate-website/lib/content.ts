import { and, asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contentItems, leads, mediaAssets, siteSettings } from "@/db/schema";
import {
  seedContent,
  seedMedia,
  seedSettings,
  type ContentRecord,
  type SiteLocale,
  type ContentType,
} from "./seed-content";

let bootstrapAttempted = false;

export async function ensureBootstrap() {
  if (bootstrapAttempted) return;
  const db = getDb();
  for (const item of seedContent) {
    await db.insert(contentItems).values(item).onConflictDoNothing();
  }
  for (const asset of seedMedia) {
    await db.insert(mediaAssets).values(asset).onConflictDoNothing();
  }
  for (const [key, value] of Object.entries(seedSettings)) {
    await db.insert(siteSettings).values({ key, value }).onConflictDoNothing();
  }
  bootstrapAttempted = true;
}

export type ContentMeta = {
  highlights?: string[];
  cta?: string;
  leadType?: "building" | "factory" | "apartment" | "project";
};

export function parseMeta(value: string): ContentMeta {
  try {
    return JSON.parse(value) as ContentMeta;
  } catch {
    return {};
  }
}

function fallbackByType(type: ContentType, locale: SiteLocale) {
  return seedContent
    .filter((item) => item.type === type && item.locale === locale && item.status === "published")
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listPublished(type: ContentType, locale: SiteLocale = "vi"): Promise<ContentRecord[]> {
  try {
    await ensureBootstrap();
    const rows = await getDb()
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.type, type), eq(contentItems.locale, locale), eq(contentItems.status, "published")))
      .orderBy(asc(contentItems.sortOrder), desc(contentItems.updatedAt));
    return rows.length ? (rows as ContentRecord[]) : fallbackByType(type, locale);
  } catch {
    return fallbackByType(type, locale);
  }
}

export async function getPublished(
  type: ContentType,
  slug: string,
  locale: SiteLocale = "vi",
): Promise<ContentRecord | null> {
  try {
    await ensureBootstrap();
    const [row] = await getDb()
      .select()
      .from(contentItems)
      .where(
        and(
          eq(contentItems.type, type),
          eq(contentItems.locale, locale),
          eq(contentItems.slug, slug),
          eq(contentItems.status, "published"),
        ),
      )
      .limit(1);
    if (row) return row as ContentRecord;
  } catch {
    // Local preview and first-run fallback intentionally use the safe seed.
  }
  return seedContent.find((item) => item.type === type && item.locale === locale && item.slug === slug) ?? null;
}

export async function getTranslation(
  type: ContentType,
  translationKey: string,
  locale: SiteLocale,
): Promise<ContentRecord | null> {
  try {
    await ensureBootstrap();
    const [row] = await getDb()
      .select()
      .from(contentItems)
      .where(and(
        eq(contentItems.type, type),
        eq(contentItems.translationKey, translationKey),
        eq(contentItems.locale, locale),
        eq(contentItems.status, "published"),
      ))
      .limit(1);
    if (row) return row as ContentRecord;
  } catch {
    // Seed fallback keeps translated public pages available during first run.
  }
  return seedContent.find((item) => item.type === type && item.translationKey === translationKey && item.locale === locale) ?? null;
}

export async function listAllContent(): Promise<ContentRecord[]> {
  try {
    await ensureBootstrap();
    const rows = await getDb()
      .select()
      .from(contentItems)
      .orderBy(asc(contentItems.type), asc(contentItems.sortOrder));
    return rows.length ? (rows as ContentRecord[]) : seedContent;
  } catch {
    return seedContent;
  }
}

export async function listMedia() {
  try {
    await ensureBootstrap();
    return await getDb().select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt));
  } catch {
    return seedMedia;
  }
}

export async function listLeads() {
  try {
    await ensureBootstrap();
    return await getDb().select().from(leads).orderBy(desc(leads.createdAt));
  } catch {
    return [];
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  try {
    await ensureBootstrap();
    const rows = await getDb().select().from(siteSettings);
    if (!rows.length) return seedSettings;
    return { ...seedSettings, ...Object.fromEntries(rows.map((row) => [row.key, row.value])) };
  } catch {
    return seedSettings;
  }
}
