import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentTemplate } from "@/components/ContentTemplate";
import { getPublished, getTranslation } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublished("service", slug, "en");
  if (!item) return {};
  const vi = await getTranslation("service", item.translationKey, "vi");
  const enPath = `/en/services/${item.slug}`;
  return { title: item.seoTitle.replace(" | AKAIUNSAN", ""), description: item.seoDescription, alternates: vi ? alternateLanguages(`/dich-vu/${vi.slug}`, enPath, "en") : { canonical: enPath } };
}

export default async function EnglishServicePage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublished("service", slug, "en");
  if (!item) notFound();
  return <ContentTemplate item={item} locale="en" />;
}
