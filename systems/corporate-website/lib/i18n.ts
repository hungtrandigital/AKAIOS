import type { SiteLocale } from "./seed-content";

const exactRoutes: Record<string, string> = {
  "/": "/en",
  "/kien-thuc": "/en/insights",
  "/quy-trinh": "/en/process",
  "/ve-chung-toi": "/en/about",
  "/lien-he": "/en/contact",
};

const slugPairs: Record<string, string> = {
  "ve-sinh-thuong-xuyen": "recurring-cleaning",
  "ve-sinh-dinh-ky": "periodic-cleaning",
  "tong-ve-sinh": "deep-cleaning",
  "ve-sinh-chung-cu": "building-condominium-cleaning",
  "ve-sinh-nha-xuong-khu-cong-nghiep": "factory-industrial-cleaning",
  "ve-sinh-can-ho": "apartment-cleaning",
  "bao-gia-dich-vu-ve-sinh-duoc-tinh-nhu-the-nao": "how-cleaning-service-quotes-are-calculated",
  "checklist-danh-gia-nha-cung-cap-ve-sinh": "cleaning-vendor-evaluation-checklist",
  "thue-dich-vu-hay-tu-to-chuc-nhan-su-ve-sinh": "outsourced-vs-in-house-cleaning",
  "quy-trinh-xu-ly-su-vu-ve-sinh-toa-nha": "building-cleaning-incident-response",
};

const reverseExactRoutes = Object.fromEntries(Object.entries(exactRoutes).map(([vi, en]) => [en, vi]));
const reverseSlugPairs = Object.fromEntries(Object.entries(slugPairs).map(([vi, en]) => [en, vi]));

export function translatedPath(pathname: string, targetLocale: SiteLocale): string {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (targetLocale === "en") {
    if (path === "/en" || path.startsWith("/en/")) return path;
    if (exactRoutes[path]) return exactRoutes[path];
    const match = path.match(/^\/(dich-vu|giai-phap|kien-thuc)\/([^/]+)$/);
    if (!match) return "/en";
    const section = match[1] === "dich-vu" ? "services" : match[1] === "giai-phap" ? "solutions" : "insights";
    return `/en/${section}/${slugPairs[match[2]] ?? match[2]}`;
  }

  if (!path.startsWith("/en")) return path;
  if (reverseExactRoutes[path]) return reverseExactRoutes[path];
  const match = path.match(/^\/en\/(services|solutions|insights)\/([^/]+)$/);
  if (!match) return "/";
  const section = match[1] === "services" ? "dich-vu" : match[1] === "solutions" ? "giai-phap" : "kien-thuc";
  return `/${section}/${reverseSlugPairs[match[2]] ?? match[2]}`;
}

export function alternateLanguages(vi: string, en: string, canonicalLocale: SiteLocale = "vi") {
  return { canonical: canonicalLocale === "en" ? en : vi, languages: { "vi-VN": vi, en, "x-default": vi } };
}
