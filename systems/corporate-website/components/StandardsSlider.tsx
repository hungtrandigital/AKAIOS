"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SliderLocale = "vi" | "en";

const standardContent = {
  vi: {
    regionLabel: "Ba lớp kiểm soát chất lượng",
    tabsLabel: "Chọn nội dung",
    linkLabel: "Cách tiêu chuẩn được vận hành",
    linkHref: "/ve-chung-toi",
    slides: [
      {
        index: "01",
        label: "Chuẩn mực trong thực tế",
        title: "Chuẩn mực quốc tế phải hiện diện trong từng ca làm, không chỉ ở bước nghiệm thu.",
        copy: "Đào tạo, SOP và checklist theo khu vực biến cam kết dịch vụ thành tiêu chí có thể quan sát, đo lường và duy trì mỗi ngày.",
      },
      {
        index: "02",
        label: "Giám sát có trách nhiệm",
        title: "Chất lượng ổn định khi mỗi hiện trường luôn có một đầu mối chịu trách nhiệm.",
        copy: "Giám sát tại chỗ, cơ chế thay ca và luồng phản hồi rõ ràng giúp vấn đề được tiếp nhận đúng người, xử lý đúng mức ưu tiên.",
      },
      {
        index: "03",
        label: "Cải tiến có dữ liệu",
        title: "Mỗi lần bàn giao là một điểm dữ liệu để ca làm tiếp theo tốt hơn.",
        copy: "Kết quả nghiệm thu, phản hồi và sự vụ được ghi nhận để điều chỉnh tần suất, vật tư, hướng dẫn và tiêu chuẩn thực hiện.",
      },
    ],
  },
  en: {
    regionLabel: "Three layers of quality control",
    tabsLabel: "Choose a standard",
    linkLabel: "How our standards work",
    linkHref: "/en/about",
    slides: [
      {
        index: "01",
        label: "Standards in practice",
        title: "Global standards must be present in every shift—not added at final inspection.",
        copy: "Training, SOPs, and area-based checklists turn a service promise into criteria that can be observed, measured, and maintained every day.",
      },
      {
        index: "02",
        label: "Accountable supervision",
        title: "Quality stays consistent when every site has one clearly accountable service lead.",
        copy: "On-site supervision, shift coverage, and a clear feedback flow ensure every issue reaches the right owner at the right priority.",
      },
      {
        index: "03",
        label: "Data-led improvement",
        title: "Every handover creates evidence that makes the next shift better.",
        copy: "Acceptance results, feedback, and incidents inform adjustments to frequency, materials, instructions, and delivery standards.",
      },
    ],
  },
} as const;

export function StandardsSlider({ locale = "vi" }: { locale?: SliderLocale }) {
  const content = standardContent[locale];
  const standards = content.slides;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % standards.length);
    }, 7200);
    return () => window.clearInterval(timer);
  }, [paused, standards.length]);

  const selectSlide = (index: number) => {
    setActive(index);
    regionRef.current?.focus({ preventScroll: true });
  };

  return (
    <section
      aria-label={content.regionLabel}
      className="standards-slider"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="shell standards-slider-shell">
        <div className="standards-slider-rail" aria-label={content.tabsLabel} role="tablist">
          {standards.map((standard, index) => (
            <button
              aria-controls={`${locale}-standard-panel-${index}`}
              aria-selected={active === index}
              className={active === index ? "is-active" : ""}
              id={`${locale}-standard-tab-${index}`}
              key={standard.index}
              onClick={() => selectSlide(index)}
              role="tab"
              tabIndex={active === index ? 0 : -1}
              type="button"
            >
              <span>{standard.index}</span>
              <small>{standard.label}</small>
            </button>
          ))}
        </div>

        <div aria-live="polite" className="standards-slider-stage" ref={regionRef} tabIndex={-1}>
          {standards.map((standard, index) => (
            <article
              aria-hidden={active !== index}
              aria-labelledby={`${locale}-standard-tab-${index}`}
              className={active === index ? "is-active" : ""}
              id={`${locale}-standard-panel-${index}`}
              key={standard.index}
              role="tabpanel"
            >
              <div className="standards-slider-index" aria-hidden="true">{standard.index}</div>
              <div className="standards-slider-copy">
                <span className="section-index">{standard.index} — {standard.label}</span>
                <h2>{standard.title}</h2>
              </div>
              <div className="standards-slider-note">
                <p>{standard.copy}</p>
                <Link className="line-link" href={content.linkHref}>
                  {content.linkLabel} <span>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="standards-slider-status" aria-hidden="true">
          <span>0{active + 1}</span>
          <i><b style={{ width: `${((active + 1) / standards.length) * 100}%` }} /></i>
          <span>0{standards.length}</span>
        </div>
      </div>
    </section>
  );
}
