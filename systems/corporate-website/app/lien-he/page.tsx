import type { Metadata } from "next";
import { LeadForm } from "@/components/LeadForm";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Liên hệ & yêu cầu báo giá",
  description:
    "Yêu cầu khảo sát tòa nhà, nhà xưởng hoặc đặt lịch vệ sinh căn hộ với AKAIUNSAN.",
  alternates: alternateLanguages("/lien-he", "/en/contact"),
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <section className="section">
        <div className="shell contact-split">
          <div data-reveal="hero-copy">
            <span className="eyebrow">Liên hệ AKAIUNSAN</span>
            <h1>Cho chúng tôi biết không gian bạn cần làm sạch.</h1>
            <p>
              Với tòa nhà hoặc nhà xưởng, đội ngũ sẽ xác nhận thông tin trước
              khi lên lịch khảo sát. Với căn hộ, hãy cung cấp quy mô và lịch
              mong muốn.
            </p>
            <div className="contact-note">
              <strong>Ba nhu cầu, một đầu mối</strong>
              <span>Tòa nhà: khảo sát và đề xuất vận hành</span>
              <span>Nhà xưởng: khảo sát hiện trường và yêu cầu an toàn</span>
              <span>Căn hộ: đặt lịch nhanh</span>
            </div>
          </div>
          <div data-reveal>
            <LeadForm />
          </div>
        </div>
      </section>
    </main>
  );
}
