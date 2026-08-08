import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentTemplate } from "@/components/ContentTemplate";
import { getPublished, getTranslation } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getPublished("solution", slug);
  if (!item) return {};
  const en = await getTranslation("solution", item.translationKey, "en");
  const viPath = `/giai-phap/${item.slug}`;
  return { title: item.seoTitle.replace(" | AKAIUNSAN", ""), description: item.seoDescription, alternates: en ? alternateLanguages(viPath, `/en/solutions/${en.slug}`) : { canonical: viPath } };
}

export default async function SolutionPage({ params }: Props) {
  const { slug } = await params;
  const item = await getPublished("solution", slug);
  if (!item) notFound();
  return <ContentTemplate item={item} />;
}
