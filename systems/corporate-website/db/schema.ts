import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const contentItems = sqliteTable(
  "content_items",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    locale: text("locale").notNull().default("vi"),
    translationKey: text("translation_key"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    eyebrow: text("eyebrow").notNull().default(""),
    summary: text("summary").notNull().default(""),
    body: text("body").notNull().default(""),
    meta: text("meta").notNull().default("{}"),
    image: text("image"),
    status: text("status").notNull().default("draft"),
    seoTitle: text("seo_title").notNull().default(""),
    seoDescription: text("seo_description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: text("published_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_content_type_locale_slug").on(table.type, table.locale, table.slug),
    uniqueIndex("idx_content_translation_locale").on(table.translationKey, table.locale),
    index("idx_content_type_locale_status_order").on(
      table.type,
      table.locale,
      table.status,
      table.sortOrder,
    ),
  ],
);

export const mediaAssets = sqliteTable(
  "media_assets",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    objectKey: text("object_key"),
    publicPath: text("public_path"),
    altText: text("alt_text").notNull().default(""),
    sourceType: text("source_type").notNull().default("original"),
    sourceReference: text("source_reference").notNull().default(""),
    category: text("category").notNull().default("general"),
    isPlaceholder: integer("is_placeholder", { mode: "boolean" })
      .notNull()
      .default(false),
    mimeType: text("mime_type").notNull().default("image/jpeg"),
    width: integer("width"),
    height: integer("height"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_media_object_key").on(table.objectKey),
    index("idx_media_category_created").on(table.category, table.createdAt),
  ],
);

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    leadType: text("lead_type").notNull(),
    locale: text("locale").notNull().default("vi"),
    name: text("name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    location: text("location").notNull().default(""),
    propertyType: text("property_type").notNull().default(""),
    area: text("area").notNull().default(""),
    frequency: text("frequency").notNull().default(""),
    message: text("message").notNull().default(""),
    status: text("status").notNull().default("new"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_leads_status_created").on(table.status, table.createdAt),
  ],
);

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const contentRevisions = sqliteTable(
  "content_revisions",
  {
    id: text("id").primaryKey(),
    contentId: text("content_id").notNull(),
    snapshot: text("snapshot").notNull(),
    editorEmail: text("editor_email").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_revisions_content_created").on(table.contentId, table.createdAt)],
);
