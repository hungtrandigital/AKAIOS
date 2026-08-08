import type { Metadata } from "next";
import Link from "next/link";
import { alternateLanguages } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Quy trình dịch vụ",
  description:
    "Quy trình tiếp nhận, khảo sát, đề xuất, triển khai và kiểm soát chất lượng của AKAIUNSAN.",
  alternates: alternateLanguages("/quy-trinh", "/en/process"),
};

const steps = [
  [
    "01",
    "Tiếp nhận nhu cầu",
    "Xác nhận loại công trình, vị trí, diện tích, tần suất và thời điểm cần triển khai.",
  ],
  [
    "02",
    "Khảo sát hiện trạng",
    "Đánh giá vật liệu, luồng di chuyển, khu vực ưu tiên, điều kiện an toàn và khả năng tiếp cận.",
  ],
  [
    "03",
    "Xây dựng phương án",
    "Bóc tách phạm vi, lịch làm, nhân sự, máy móc, hóa chất và tiêu chí nghiệm thu.",
  ],
  [
    "04",
    "Thống nhất triển khai",
    "Làm rõ đầu mối, thời gian, quy định công trình và cách xử lý hạng mục phát sinh.",
  ],
  [
    "05",
    "Thực hiện & giám sát",
    "Tổ chức đội ngũ theo checklist, ghi nhận phản hồi và điều chỉnh khi cần.",
  ],
  [
    "06",
    "Nghiệm thu & cải tiến",
    "Kiểm tra kết quả, tổng hợp điểm cần cải thiện và cập nhật phạm vi cho chu kỳ tiếp theo.",
  ],
];

export default function ProcessPage() {
  return (
    <main>
      <section className="page-intro">
        <div className="shell" data-reveal="hero-copy">
          <span className="eyebrow">Quy trình & chất lượng</span>
          <h1>
            Rõ phạm vi trước.
            <br />
            Kiểm soát trong suốt quá trình.
          </h1>
          <p>
            Quy trình được điều chỉnh theo tòa nhà, nhà xưởng hoặc căn hộ, nhưng
            luôn giữ một nguyên tắc: trách nhiệm phải rõ trước khi bắt đầu.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="shell process-page-list" data-reveal>
          {steps.map(([number, title, copy]) => (
            <article key={number}>
              <span>{number}</span>
              <div>
                <h2>{title}</h2>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="cta-band">
        <div className="shell" data-reveal>
          <h2>Áp dụng quy trình vào công trình của bạn.</h2>
          <Link className="button button-light" href="/lien-he">
            Yêu cầu khảo sát
          </Link>
        </div>
      </section>
    </main>
  );
}
