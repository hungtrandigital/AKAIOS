import Image from "next/image";
import Link from "next/link";
import { parseMeta } from "@/lib/content";
import type { ContentRecord, SiteLocale } from "@/lib/seed-content";
import { LeadForm } from "./LeadForm";

export function ContentTemplate({
  item,
  locale = "vi",
}: {
  item: ContentRecord;
  locale?: SiteLocale;
}) {
  const meta = parseMeta(item.meta);
  const en = locale === "en";
  const contactHref = en ? "/en/contact" : "/lien-he";
  const processHref = en ? "/en/process" : "/quy-trinh";
  return (
    <main>
      <section className="detail-hero">
        <div className="shell detail-hero-grid">
          <div data-reveal="hero-copy">
            <span className="eyebrow">{item.eyebrow}</span>
            <h1>{item.title}</h1>
            <p className="lead-copy">{item.summary}</p>
            <div className="hero-actions">
              <Link className="button" href={contactHref}>
                {meta.cta ?? (en ? "Request a consultation" : "Yêu cầu tư vấn")}
              </Link>
              <Link className="text-link" href={processHref}>
                {en ? "View our process →" : "Xem quy trình →"}
              </Link>
            </div>
          </div>
          {item.image && (
            <figure className="detail-image" data-reveal="media">
              <Image
                alt={
                  en
                    ? `Illustration for ${item.title}`
                    : `Hình ảnh minh họa cho ${item.title}`
                }
                fill
                priority
                sizes="(max-width: 800px) 100vw, 50vw"
                src={item.image}
                unoptimized
              />
              <figcaption>
                {en ? "Operational image" : "Hình ảnh vận hành"}
              </figcaption>
            </figure>
          )}
        </div>
      </section>

      <section className="section">
        <div className="shell content-grid">
          <article className="prose" data-reveal>
            {item.body.split("\n\n").map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </article>
          {meta.highlights?.length ? (
            <aside className="scope-card" data-reveal>
              <span className="eyebrow">
                {en ? "Proposed scope" : "Phạm vi đề xuất"}
              </span>
              <h2>
                {en
                  ? "Every work item is clear before launch"
                  : "Rõ từng hạng mục trước khi triển khai"}
              </h2>
              <ul className="check-list">
                {meta.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </aside>
          ) : null}
        </div>
      </section>

      <section className="section section-mint">
        <div className="shell contact-split">
          <div data-reveal>
            <span className="eyebrow">
              {en
                ? "Start with the real requirement"
                : "Bắt đầu từ nhu cầu thực tế"}
            </span>
            <h2>
              {meta.leadType === "apartment"
                ? en
                  ? "Book cleaning for your apartment"
                  : "Đặt lịch cho căn hộ của bạn"
                : meta.leadType === "factory"
                  ? en
                    ? "Receive a plan for your factory"
                    : "Nhận phương án cho nhà xưởng"
                  : en
                    ? "Receive a plan for your building"
                    : "Nhận phương án cho tòa nhà"}
            </h2>
            <p>
              {en
                ? "Share the essentials. AKAIUNSAN will confirm the scope before proposing how the service should operate."
                : "Chia sẻ thông tin cơ bản. AKAIUNSAN sẽ xác nhận phạm vi trước khi đề xuất cách triển khai."}
            </p>
          </div>
          <div data-reveal>
            <LeadForm
              defaultType={meta.leadType ?? "building"}
              locale={locale}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
