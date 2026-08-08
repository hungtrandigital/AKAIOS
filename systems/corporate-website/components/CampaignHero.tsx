import Image from "next/image";
import Link from "next/link";

type HeroLocale = "vi" | "en";

const campaignContent = {
  vi: {
    eyebrow: "Dịch vụ vệ sinh & vận hành cơ sở chuyên nghiệp",
    lines: [
      "Chuẩn mực quốc tế.",
      "Tận tâm trong từng chi tiết.",
      "Sạch chuẩn mỗi ngày.",
    ],
    copy: "Dịch vụ vệ sinh và vận hành cơ sở được triển khai bởi đội ngũ tại địa phương đã qua đào tạo, cơ chế giám sát bài bản và quy trình kiểm soát chất lượng nhất quán.",
    primaryLabel: "Yêu cầu khảo sát",
    primaryHref: "/lien-he",
    secondaryLabel: "Khám phá dịch vụ",
  },
  en: {
    eyebrow: "Professional Cleaning & Facility Services",
    lines: ["Global Standards.", "Local Care.", "Consistently Clean."],
    copy: "Professional cleaning and facility services delivered through trained local teams, structured supervision, and consistent quality control.",
    primaryLabel: "Request a Site Survey",
    primaryHref: "/en/contact",
    secondaryLabel: "Explore Our Services",
  },
} as const;

export function CampaignHero({ locale = "vi" }: { locale?: HeroLocale }) {
  const content = campaignContent[locale];

  return (
    <section className="premium-hero premium-hero-campaign">
      <div className="premium-hero-media" aria-hidden="true">
        <Image
          alt=""
          fill
          priority
          sizes="100vw"
          src="/images/brand-campaign-background-v6.png"
          unoptimized
        />
      </div>
      <div className="premium-hero-shade" aria-hidden="true" />
      <div className="shell premium-hero-inner">
        <div className="premium-hero-copy">
          <span className="eyebrow eyebrow-light">{content.eyebrow}</span>
          <h1>
            {content.lines.map((line, index) => (
              <span className={index === content.lines.length - 1 ? "hero-line-accent" : undefined} key={line}>
                {line}
              </span>
            ))}
          </h1>
          <p>{content.copy}</p>
          <div className="hero-actions">
            <Link className="button button-accent" href={content.primaryHref}>{content.primaryLabel}</Link>
            <Link className="premium-text-link" href="#services">{content.secondaryLabel} <span>→</span></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
