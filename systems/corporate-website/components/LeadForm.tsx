"use client";

import { useState } from "react";
import type { SiteLocale } from "@/lib/seed-content";

type FormState = "idle" | "sending" | "success" | "error";
type LeadType = "building" | "factory" | "apartment";

export function LeadForm({ defaultType = "building", locale = "vi" }: { defaultType?: LeadType | "project"; locale?: SiteLocale }) {
  const [type, setType] = useState<LeadType>(defaultType === "project" ? "building" : defaultType);
  const [state, setState] = useState<FormState>("idle");
  const en = locale === "en";

  async function submit(formData: FormData) {
    setState("sending");
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, leadType: type, locale }),
      });
      if (!response.ok) throw new Error("request failed");
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="lead-card">
      <div className="lead-tabs" role="group" aria-label={en ? "Request type" : "Loại yêu cầu"}>
        <button className={type === "building" ? "active" : ""} onClick={() => setType("building")} type="button">
          {en ? "Building" : "Tòa nhà"}
        </button>
        <button className={type === "factory" ? "active" : ""} onClick={() => setType("factory")} type="button">
          {en ? "Factory" : "Nhà xưởng"}
        </button>
        <button className={type === "apartment" ? "active" : ""} onClick={() => setType("apartment")} type="button">
          {en ? "Apartment" : "Căn hộ"}
        </button>
      </div>

      {state === "success" ? (
        <div className="form-success" role="status">
          <span>{en ? "Request received" : "Đã tiếp nhận"}</span>
          <h3>{en ? "Thank you for contacting us." : "Cảm ơn bạn đã gửi yêu cầu."}</h3>
          <p>{en ? "The AKAIUNSAN team will review the details and contact you to confirm the requirement." : "Đội ngũ AKAIUNSAN sẽ xem thông tin và liên hệ để xác nhận nhu cầu."}</p>
          <button className="text-link" onClick={() => setState("idle")} type="button">{en ? "Send another request →" : "Gửi yêu cầu khác →"}</button>
        </div>
      ) : (
        <form action={submit} className="lead-form">
          <input aria-hidden="true" autoComplete="off" className="honeypot" name="companyWebsite" tabIndex={-1} />
          <div className="form-row">
            <label>
              {en ? "Full name" : "Họ và tên"}
              <input name="name" required placeholder={en ? "Your name" : "Nguyễn Văn A"} />
            </label>
            <label>
              {en ? "Phone number" : "Số điện thoại"}
              <input name="phone" required inputMode="tel" placeholder={en ? "Contact number" : "Số điện thoại liên hệ"} />
            </label>
          </div>
          <div className="form-row">
            <label>
              {en ? "Location" : "Khu vực"}
              <input name="location" required placeholder={en ? "District, city, or industrial zone" : "Quận/huyện, tỉnh/thành hoặc KCN"} />
            </label>
            <label>
              {type === "apartment" ? (en ? "Apartment size" : "Quy mô căn hộ") : (en ? "Property type" : "Loại công trình")}
              <input
                name="propertyType"
                placeholder={
                  type === "apartment"
                    ? en ? "Example: 2 bedrooms" : "Ví dụ: 2 phòng ngủ"
                    : type === "building"
                      ? en ? "Condominium, office, retail…" : "Chung cư, văn phòng, thương mại…"
                      : en ? "Factory, warehouse, support areas…" : "Nhà xưởng, kho, khu phụ trợ…"
                }
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              {en ? "Estimated area" : "Diện tích dự kiến"}
              <input name="area" placeholder={en ? "Example: 800 m²" : "Ví dụ: 80 m²"} />
            </label>
            <label>
              {en ? "Frequency" : "Tần suất"}
              <select name="frequency" defaultValue="">
                <option value="" disabled>{en ? "Select frequency" : "Chọn tần suất"}</option>
                <option>{en ? "One-off" : "Đặt một buổi"}</option>
                <option>{en ? "Weekly" : "Hằng tuần"}</option>
                <option>{en ? "Daily / by shift" : "Hằng ngày / theo ca"}</option>
                <option>{en ? "Advice needed" : "Cần tư vấn"}</option>
              </select>
            </label>
          </div>
          <label>
            {en ? "Additional information" : "Thông tin thêm"}
            <textarea name="message" rows={4} placeholder={en ? "Preferred timing, work areas, or special requirements" : "Thời gian mong muốn, khu vực cần làm hoặc yêu cầu đặc biệt"} />
          </label>
          <label className="optional-email">
            {en ? "Email (optional)" : "Email (không bắt buộc)"}
            <input name="email" type="email" placeholder="email@congty.vn" />
          </label>
          {state === "error" && <p className="form-error" role="alert">{en ? "We could not send your request. Please try again." : "Chưa gửi được yêu cầu. Vui lòng thử lại."}</p>}
          <button className="button" disabled={state === "sending"} type="submit">
            {state === "sending" ? (en ? "Sending…" : "Đang gửi…") : type === "apartment" ? (en ? "Send booking request" : "Gửi yêu cầu đặt lịch") : (en ? "Request a site survey" : "Gửi yêu cầu khảo sát")}
          </button>
          <p className="form-note">{en ? "Your information is used to contact you and prepare an appropriate plan." : "Thông tin được dùng để liên hệ và chuẩn bị phương án phù hợp."}</p>
        </form>
      )}
    </div>
  );
}
