import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Về AKAIUNSAN",
  description:
    "AKAIUNSAN cung cấp giải pháp vệ sinh chuyên nghiệp cho tòa nhà, chung cư, môi trường công nghiệp và căn hộ.",
  alternates: alternateLanguages("/ve-chung-toi", "/en/about"),
};

export default function AboutPage() {
  return (
    <main>
      <section className="about-hero">
        <div className="shell about-grid">
          <div data-reveal="hero-copy">
            <span className="eyebrow">Về AKAIUNSAN</span>
            <h1>Chúng tôi nhìn việc làm sạch như một hoạt động vận hành.</h1>
            <p>
              Không chỉ là hoàn thành từng hạng mục, dịch vụ cần được tổ chức để
              duy trì ổn định, phối hợp được với người sử dụng không gian và
              phản hồi rõ khi có thay đổi.
            </p>
            <Link className="button" href="/lien-he">
              Trao đổi nhu cầu
            </Link>
          </div>
          <div className="about-image" data-reveal="media">
            <Image
              alt="Đội ngũ vệ sinh công nghiệp làm việc an toàn"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 50vw"
              src="/images/factory-cleaning.png"
              unoptimized
            />
          </div>
        </div>
      </section>
      <section className="section section-mint">
        <div className="shell values-grid" data-reveal-stagger>
          {[
            [
              "01",
              "Rõ ràng",
              "Phạm vi, lịch làm và tiêu chí bàn giao được thống nhất trước.",
            ],
            [
              "02",
              "Kỷ luật",
              "Công việc được tổ chức theo checklist, khu vực và đầu mối.",
            ],
            [
              "03",
              "Tôn trọng",
              "Tôn trọng không gian sống, quy định công trình và an toàn sản xuất.",
            ],
            [
              "04",
              "Cải tiến",
              "Phản hồi được ghi nhận để điều chỉnh cách vận hành.",
            ],
          ].map(([n, t, c]) => (
            <article key={n}>
              <span>{n}</span>
              <h2>{t}</h2>
              <p>{c}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
