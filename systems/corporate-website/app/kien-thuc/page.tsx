import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { listPublished } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Kiến thức vệ sinh & vận hành",
  description:
    "Thông tin giúp khách hàng căn hộ, ban quản lý và nhà máy lựa chọn dịch vụ vệ sinh phù hợp.",
  alternates: alternateLanguages("/kien-thuc", "/en/insights"),
};

export default async function KnowledgePage() {
  const articles = await listPublished("article");
  return (
    <main>
      <section className="page-intro">
        <div className="shell" data-reveal="hero-copy">
          <span className="eyebrow">Kiến thức</span>
          <h1>Hiểu rõ trước khi lựa chọn.</h1>
          <p>
            Những câu hỏi thực tế về phạm vi, chi phí, nhân sự và cách kiểm soát
            chất lượng dịch vụ vệ sinh.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell knowledge-grid" data-reveal-stagger>
          {articles.map((article) => (
            <Link href={`/kien-thuc/${article.slug}`} key={article.id}>
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
              <b>Đọc bài viết →</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
