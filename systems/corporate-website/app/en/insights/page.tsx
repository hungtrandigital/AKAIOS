import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublished } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Cleaning & operational insights",
  description:
    "Practical guidance for building managers, factories, and apartment customers selecting professional cleaning services.",
  alternates: alternateLanguages("/kien-thuc", "/en/insights", "en"),
};

export default async function EnglishInsightsPage() {
  const articles = await listPublished("article", "en");
  return (
    <main>
      <section className="page-intro">
        <div className="shell" data-reveal="hero-copy">
          <span className="eyebrow">Insights</span>
          <h1>Understand the operation before choosing a provider.</h1>
          <p>
            Practical questions about scope, cost, people, safety, service
            recovery, and quality control.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell knowledge-grid" data-reveal-stagger>
          {articles.map((article) => (
            <Link href={`/en/insights/${article.slug}`} key={article.id}>
              <div className="knowledge-image">
                <Image
                  alt=""
                  fill
                  sizes="(max-width: 700px) 100vw, 33vw"
                  src={article.image ?? "/images/apartment-cleaning.png"}
                  unoptimized
                />
              </div>
              <span>{article.eyebrow}</span>
              <h2>{article.title}</h2>
              <p>{article.summary}</p>
              <b>Read insight →</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
