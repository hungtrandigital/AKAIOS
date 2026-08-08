import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublished, getTranslation } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublished("article", slug, "en");
  if (!article) return {};
  const vi = await getTranslation("article", article.translationKey, "vi");
  const enPath = `/en/insights/${article.slug}`;
  return {
    title: article.title,
    description: article.summary,
    alternates: vi
      ? alternateLanguages(`/kien-thuc/${vi.slug}`, enPath, "en")
      : { canonical: enPath },
  };
}

export default async function EnglishArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getPublished("article", slug, "en");
  if (!article) notFound();
  return (
    <main>
      <article className="article-page">
        <header className="article-header shell-narrow" data-reveal="hero-copy">
          <Link className="back-link" href="/en/insights">
            ← Insights
          </Link>
          <span className="eyebrow">{article.eyebrow}</span>
          <h1>{article.title}</h1>
          <p>{article.summary}</p>
        </header>
        {article.image && (
          <figure className="article-cover shell" data-reveal="media">
            <Image
              alt={`Illustration for ${article.title}`}
              fill
              priority
              sizes="100vw"
              src={article.image}
              unoptimized
            />
            <figcaption>Operational image</figcaption>
          </figure>
        )}
        <div className="article-body shell-narrow">
          {article.body.split("\n\n").map((paragraph) => (
            <p key={paragraph} data-reveal>
              {paragraph}
            </p>
          ))}
          <aside data-reveal>
            <h2>Need a site-specific plan?</h2>
            <p>Every property has a different scope and operating context.</p>
            <Link className="button" href="/en/contact">
              Request a consultation
            </Link>
          </aside>
        </div>
      </article>
    </main>
  );
}
