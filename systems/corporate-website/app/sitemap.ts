import type { MetadataRoute } from "next";
import { listPublished } from "@/lib/content";
import type { ContentRecord } from "@/lib/seed-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://akaiunsan.prismate.vn";
  const [viServices, viSolutions, viArticles, enServices, enSolutions, enArticles] = await Promise.all([
    listPublished("service", "vi"),
    listPublished("solution", "vi"),
    listPublished("article", "vi"),
    listPublished("service", "en"),
    listPublished("solution", "en"),
    listPublished("article", "en"),
  ]);
  const staticPairs = [["", "/en"], ["/kien-thuc", "/en/insights"], ["/quy-trinh", "/en/process"], ["/ve-chung-toi", "/en/about"], ["/lien-he", "/en/contact"]];
  const staticEntries = staticPairs.flatMap(([vi, en]) => {
    const languages = { vi: `${base}${vi}`, en: `${base}${en}` };
    return [
      { url: languages.vi, lastModified: new Date("2026-08-05"), alternates: { languages } },
      { url: languages.en, lastModified: new Date("2026-08-05"), alternates: { languages } },
    ];
  });
  const translatedEntries = (viItems: ContentRecord[], enItems: ContentRecord[], viPrefix: string, enPrefix: string) => viItems.flatMap((vi) => {
    const en = enItems.find((item) => item.translationKey === vi.translationKey);
    const viUrl = `${base}${viPrefix}/${vi.slug}`;
    if (!en) return [{ url: viUrl, lastModified: new Date(vi.updatedAt) }];
    const enUrl = `${base}${enPrefix}/${en.slug}`;
    const languages = { vi: viUrl, en: enUrl };
    return [
      { url: viUrl, lastModified: new Date(vi.updatedAt), alternates: { languages } },
      { url: enUrl, lastModified: new Date(en.updatedAt), alternates: { languages } },
    ];
  });
  return [
    ...staticEntries,
    ...translatedEntries(viServices, enServices, "/dich-vu", "/en/services"),
    ...translatedEntries(viSolutions, enSolutions, "/giai-phap", "/en/solutions"),
    ...translatedEntries(viArticles, enArticles, "/kien-thuc", "/en/insights"),
  ];
}
