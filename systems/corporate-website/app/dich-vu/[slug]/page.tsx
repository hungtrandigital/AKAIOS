import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentTemplate } from "@/components/ContentTemplate";
import { getPublished, getTranslation } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublished("service", slug);
  if (!item) return {};
  const en = await getTranslation("service", item.translationKey, "en");
  const viPath = `/dich-vu/${item.slug}`;
  return { title: item.seoTitle.replace(" | AKAIUNSAN", ""), description: item.seoDescription, alternates: en ? alternateLanguages(viPath, `/en/services/${en.slug}`) : { canonical: viPath } };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublished("service", slug);
  if (!item) notFound();
  return <ContentTemplate item={item} />;
}
