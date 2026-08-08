import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CampaignHero } from "@/components/CampaignHero";
import { LeadForm } from "@/components/LeadForm";
import { StandardsSlider } from "@/components/StandardsSlider";
import { listPublished } from "@/lib/content";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  alternates: alternateLanguages("/", "/en"),
};

export default async function Home() {
  const [services, solutions, incidents, articles, faqs] = await Promise.all([
    listPublished("service"),
    listPublished("solution"),
    listPublished("incident"),
    listPublished("article"),
    listPublished("faq"),
  ]);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AKAIUNSAN",
    description: "Professional Cleaning Solutions",
    url: "https://akaiunsan.prismate.vn",
  };

  const [featuredArticle, ...moreArticles] = articles;
  const publicFaqs = faqs.filter((faq) => faq.id !== "faq-image");
  const solutionPriority = [
    "ve-sinh-chung-cu",
    "ve-sinh-nha-xuong-khu-cong-nghiep",
    "ve-sinh-can-ho",
  ];
  const solutionRank = (slug: string) => {
    const rank = solutionPriority.indexOf(slug);
    return rank === -1 ? solutionPriority.length : rank;
  };
  const orderedSolutions = [...solutions].sort(
    (a, b) => solutionRank(a.slug) - solutionRank(b.slug) || a.sortOrder - b.sortOrder,
  );

  return (
    <main>
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} type="application/ld+json" />

      <CampaignHero />

      <StandardsSlider />

      <div className="premium-marquee" aria-label="Dịch vụ trọng tâm của AKAIUNSAN">
        <div className="premium-marquee-track">
          <span>Building care</span><i>•</i><span>Industrial</span><i>•</i><span>Apartment</span><i>•</i><span>Daily operations</span><i>•</i><span>Responsible operations</span><i>•</i>
          <span aria-hidden="true">Building care</span><i aria-hidden="true">•</i><span aria-hidden="true">Industrial</span><i aria-hidden="true">•</i><span aria-hidden="true">Apartment</span><i aria-hidden="true">•</i><span aria-hidden="true">Daily operations</span><i aria-hidden="true">•</i><span aria-hidden="true">Responsible operations</span><i aria-hidden="true">•</i>
        </div>
      </div>

      <section className="premium-solutions" id="solutions">
        <div className="shell">
          <div className="premium-section-heading" data-reveal>
            <div>
              <span className="section-index section-index-light">02 — Giải pháp theo không gian</span>
              <h2>Mỗi môi trường cần một cách tổ chức riêng.</h2>
            </div>
            <p>
              Không đóng gói mọi nhu cầu vào cùng một quy trình. Phương án được thiết kế
              theo loại công trình, tần suất và yêu cầu vận hành thực tế.
            </p>
          </div>
          <div className="solution-canvas" data-reveal-stagger>
            {orderedSolutions.map((item, index) => (
              <Link
                className={`solution-tile ${index === 0 ? "solution-tile-featured" : ""}`}
                href={`/giai-phap/${item.slug}`}
                key={item.id}
              >
                <Image
                  alt={`Hình ảnh minh họa ${item.title}`}
                  fill
                  sizes={index === 0 ? "(max-width: 860px) 100vw, 60vw" : "(max-width: 860px) 100vw, 40vw"}
                  src={item.image ?? "/images/apartment-cleaning.png"}
                  unoptimized
                />
                <span className="solution-tile-shade" aria-hidden="true" />
                <span className="solution-number">0{index + 1}</span>
                <div>
                  <span>{item.eyebrow}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <b>Xem phương án <span>→</span></b>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section premium-services" id="services">
        <div className="shell service-layout">
          <div className="section-heading sticky-heading" data-reveal>
            <span className="section-index">03 — Hình thức dịch vụ</span>
            <h2>Từ một buổi làm đến đội ngũ thường trực.</h2>
            <p>Mỗi hình thức đều bắt đầu bằng phạm vi, lịch làm và tiêu chí bàn giao được hai bên thống nhất.</p>
            <Link className="line-link" href="/lien-he">Trao đổi nhu cầu <span>→</span></Link>
          </div>
          <div className="service-list premium-service-list" data-reveal-stagger>
            {services.map((item, index) => (
              <Link href={`/dich-vu/${item.slug}`} key={item.id}>
                <span>0{index + 1}</span>
                <div><h3>{item.title}</h3><p>{item.summary}</p></div>
                <b aria-hidden="true">→</b>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="incident-section" id="xu-ly-su-vu">
        <div className="shell">
          <div className="incident-heading" data-reveal>
            <div>
              <span className="section-index">04 — Xử lý sự vụ</span>
              <h2>Khi vấn đề phát sinh, tốc độ phản hồi mới cho thấy chất lượng vận hành.</h2>
            </div>
            <p>
              Vệ sinh theo lịch tạo ra trạng thái sạch. Một cơ chế xử lý sự vụ rõ ràng
              mới giúp trạng thái đó được duy trì khi hiện trường thay đổi.
            </p>
          </div>
          <div className="incident-board">
            <div className="incident-control" data-reveal>
              <span className="incident-status"><i /> Service control</span>
              <h3>Một đầu mối. Một luồng xử lý. Một kết quả có thể xác nhận.</h3>
              <p>
                Không để phản ánh nằm giữa ca trực, nhóm chat và nhiều đầu mối.
                Mỗi sự vụ cần có mức ưu tiên, người phụ trách và trạng thái rõ ràng.
              </p>
              <ul>
                <li><span>An toàn & gián đoạn</span><b>Ưu tiên trước</b></li>
                <li><span>Chất lượng khu vực</span><b>Theo mức ảnh hưởng</b></li>
                <li><span>Vấn đề tái diễn</span><b>Rà nguyên nhân</b></li>
              </ul>
            </div>
            <ol className="incident-flow" data-reveal-stagger>
              {incidents.map((incident, index) => (
                <li key={incident.id}>
                  <span>0{index + 1}</span>
                  <div>
                    <small>{incident.eyebrow}</small>
                    <h3>{incident.title}</h3>
                    <p>{incident.summary}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="esg-section" id="esg">
        <div className="esg-monogram" aria-hidden="true">ESG<span>.</span></div>
        <div className="shell esg-inner">
          <div className="esg-intro" data-reveal>
            <span className="section-index">05 — Responsible operations</span>
            <p className="esg-kicker">Clean spaces. Lighter footprint.</p>
            <h2>Sạch hơn cho không gian. Nhẹ hơn cho môi trường.</h2>
            <p>
              Dịch vụ vệ sinh có thể tạo ra giá trị rộng hơn một bề mặt sạch:
              sử dụng tài nguyên có trách nhiệm, bảo vệ con người và giúp việc vận hành minh bạch hơn.
            </p>
            <Link className="line-link" href="/ve-chung-toi">Định hướng vận hành có trách nhiệm <span>→</span></Link>
          </div>
          <div className="esg-pillars" data-reveal-stagger>
            <article>
              <span>E</span>
              <div>
                <small>Environment</small>
                <h3>Tối ưu tài nguyên</h3>
                <p>Kiểm soát nước và hóa chất, ưu tiên vật tư tái sử dụng, hỗ trợ phân loại rác tại nguồn.</p>
              </div>
            </article>
            <article>
              <span>S</span>
              <div>
                <small>Social</small>
                <h3>An toàn và phẩm giá công việc</h3>
                <p>Đào tạo, PPE, ca làm an toàn và trải nghiệm tôn trọng cho nhân sự lẫn người sử dụng không gian.</p>
              </div>
            </article>
            <article>
              <span>G</span>
              <div>
                <small>Governance</small>
                <h3>Vận hành minh bạch</h3>
                <p>SOP, tiêu chí nghiệm thu, nhật ký phản hồi và báo cáo giúp trách nhiệm luôn có thể truy vết.</p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="process-band premium-process">
        <div className="shell">
          <div className="premium-section-heading premium-process-heading" data-reveal>
            <div>
              <span className="section-index section-index-light">06 — Cách bắt đầu</span>
              <h2>Đủ rõ để cùng kiểm soát.</h2>
            </div>
            <p>Một chu trình ngắn gọn, minh bạch từ yêu cầu ban đầu đến vận hành và phản hồi.</p>
          </div>
          <ol className="process-steps premium-process-steps" data-reveal-stagger>
            {[
              ["01", "Tiếp nhận", "Xác nhận loại công trình, khu vực và kỳ vọng."],
              ["02", "Khảo sát", "Đánh giá hiện trạng, luồng vận hành và yêu cầu an toàn."],
              ["03", "Đề xuất", "Làm rõ phạm vi, tần suất, nhân sự và cách nghiệm thu."],
              ["04", "Triển khai", "Tổ chức thực hiện, giám sát và tiếp nhận phản hồi."],
            ].map(([number, title, copy]) => (
              <li key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></li>
            ))}
          </ol>
          <Link className="premium-text-link" href="/quy-trinh">Xem quy trình chi tiết <span>→</span></Link>
        </div>
      </section>

      {featuredArticle ? (
        <section className="section premium-journal">
          <div className="shell">
            <div className="premium-section-heading journal-heading" data-reveal>
              <div>
                <span className="section-index">07 — Góc vận hành</span>
                <h2>Kiến thức cho quyết định vận hành.</h2>
              </div>
              <Link className="line-link" href="/kien-thuc">Xem tất cả bài viết <span>→</span></Link>
            </div>
            <div className="journal-grid" data-reveal-stagger>
              <Link className="journal-feature" href={`/kien-thuc/${featuredArticle.slug}`}>
                <div className="journal-image">
                  <Image
                    alt={`Hình ảnh minh họa ${featuredArticle.title}`}
                    fill
                    sizes="(max-width: 860px) 100vw, 58vw"
                    src={featuredArticle.image ?? "/images/condominium-cleaning.png"}
                    unoptimized
                  />
                </div>
                <span>{featuredArticle.eyebrow}</span>
                <h3>{featuredArticle.title}</h3>
                <p>{featuredArticle.summary}</p>
              </Link>
              <div className="journal-list">
                {moreArticles.slice(0, 2).map((article, index) => (
                  <Link href={`/kien-thuc/${article.slug}`} key={article.id}>
                    <span>0{index + 2} · {article.eyebrow}</span>
                    <h3>{article.title}</h3>
                    <p>{article.summary}</p>
                    <b>Đọc bài viết →</b>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="section premium-faq">
        <div className="shell faq-layout">
          <div className="section-heading" data-reveal>
            <span className="section-index">08 — Trước khi bắt đầu</span>
            <h2>Những điều nên rõ ngay từ đầu.</h2>
          </div>
          <div className="faq-list" data-reveal-stagger>
            {publicFaqs.map((faq, index) => (
              <details key={faq.id} open={index === 0}>
                <summary>{faq.title}<span>+</span></summary>
                <p>{faq.summary}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section premium-contact">
        <div className="shell contact-split">
          <div data-reveal>
            <span className="section-index section-index-light">Bắt đầu một cuộc trao đổi</span>
            <h2>Cho chúng tôi biết không gian cần được chăm sóc.</h2>
            <p>
              Chọn tòa nhà, nhà xưởng hoặc căn hộ. AKAIUNSAN sẽ tiếp nhận thông tin để chuẩn bị
              câu hỏi phù hợp trước khi trao đổi.
            </p>
          </div>
          <div data-reveal><LeadForm /></div>
        </div>
      </section>
    </main>
  );
}
