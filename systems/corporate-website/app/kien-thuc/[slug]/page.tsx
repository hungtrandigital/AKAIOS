import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublished, getTranslation } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublished("article", slug);
  if (!article) return {};
  const en = await getTranslation("article", article.translationKey, "en");
  const viPath = `/kien-thuc/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: en
      ? alternateLanguages(viPath, `/en/insights/${en.slug}`)
      : { canonical: viPath },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublished("article", slug);
  if (!article) notFound();
  return (
    <main>
      <article className="article-page">
        <header className="article-header shell-narrow" data-reveal="hero-copy">
          <Link className="back-link" href="/kien-thuc">
            ← Kiến thức
          </Link>
          <span className="eyebrow">{article.eyebrow}</span>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
        </header>
        {article.image && (
          <figure className="article-cover shell" data-reveal="media">
            <Image
              alt="Hình ảnh minh họa"
              fill
              priority
              sizes="100vw"
              src={article.image}
              unoptimized
            />
            <figcaption>Hình ảnh minh họa — AI placeholder</figcaption>
          </figure>
        )}
        <div className="article-body shell-narrow">
          {article.body.split("\n\n").map((paragraph) => (
            <p key={paragraph} data-reveal>
              {paragraph}
            </p>
          ))}
          <aside data-reveal>
            <h2>Cần phương án cụ thể?</h2>
            <p>Mỗi công trình có phạm vi và điều kiện vận hành khác nhau.</p>
            <Link className="button" href="/lien-he">
              Yêu cầu tư vấn
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}
