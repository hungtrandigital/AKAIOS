"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { ContentRecord } from "@/lib/seed-content";

type MediaItem = {
  id: string;
  title: string;
  objectKey: string | null;
  publicPath: string | null;
  altText: string;
  sourceType: string;
  sourceReference: string;
  category: string;
  isPlaceholder: boolean;
  mimeType: string;
  createdAt: string;
};

type LeadItem = {
  id: string;
  leadType: string;
  locale: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  propertyType: string;
  area: string;
  frequency: string;
  message: string;
  status: string;
  createdAt: string;
};

type Tab = "overview" | "content" | "media" | "leads" | "settings";

const emptyContent: ContentRecord = {
  id: "new",
  type: "article",
  locale: "vi",
  translationKey: "",
  slug: "",
  title: "",
  eyebrow: "",
  summary: "",
  body: "",
  meta: "{}",
  image: null,
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  sortOrder: 0,
  publishedAt: null,
  createdAt: "",
  updatedAt: "",
};

export function AdminStudio({
  initialContent,
  initialMedia,
  initialLeads,
  initialSettings,
  userName,
  userEmail,
  isLocalDemo,
}: {
  initialContent: ContentRecord[];
  initialMedia: MediaItem[];
  initialLeads: LeadItem[];
  initialSettings: Record<string, string>;
  userName: string;
  userEmail: string;
  isLocalDemo: boolean;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const [content, setContent] = useState(initialContent);
  const [media, setMedia] = useState(initialMedia);
  const [leadRows, setLeadRows] = useState(initialLeads);
  const [settings, setSettings] = useState(initialSettings);
  const [editing, setEditing] = useState<ContentRecord>(initialContent[0] ?? emptyContent);
  const [notice, setNotice] = useState("");
  const published = content.filter((item) => item.status === "published").length;
  const newLeads = leadRows.filter((lead) => lead.status === "new").length;
  const placeholderMedia = media.filter((item) => item.isPlaceholder).length;

  const nav: Array<[Tab, string, string]> = [
    ["overview", "Tổng quan", "⌂"],
    ["content", "Nội dung", "Aa"],
    ["media", "Hình ảnh", "▧"],
    ["leads", "Yêu cầu", "◎"],
    ["settings", "Cài đặt", "⚙"],
  ];

  async function refreshContent() {
    const response = await fetch("/api/admin/content");
    if (response.ok) {
      const data = (await response.json()) as { items: ContentRecord[] };
      setContent(data.items);
      const current = data.items.find((item) => item.id === editing.id);
      if (current) setEditing(current);
    }
  }

  async function saveContent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Đang lưu…");
    const isNew = editing.id === "new";
    const response = await fetch(isNew ? "/api/admin/content" : `/api/admin/content/${editing.id}`, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(editing),
    });
    setNotice(response.ok ? "Đã lưu nội dung." : "Chưa lưu được nội dung.");
    if (response.ok) await refreshContent();
  }

  async function uploadMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Đang tải ảnh…");
    const form = event.currentTarget;
    const response = await fetch("/api/admin/media", { method: "POST", body: new FormData(form) });
    if (response.ok) {
      const refreshed = await fetch("/api/admin/media");
      const data = (await refreshed.json()) as { items: MediaItem[] };
      setMedia(data.items);
      form.reset();
      setNotice("Đã thêm ảnh vào Media Library.");
    } else {
      setNotice("Chưa tải được ảnh. Kiểm tra định dạng và dung lượng.");
    }
  }

  async function updateLeadStatus(id: string, status: string) {
    const response = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) setLeadRows((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    setNotice(response.ok ? "Đã lưu cài đặt." : "Chưa lưu được cài đặt.");
  }

  function beginTranslation() {
    if (editing.id === "new") return;
    const locale = editing.locale === "vi" ? "en" : "vi";
    const existing = content.find((item) => item.translationKey === editing.translationKey && item.locale === locale);
    if (existing) {
      setEditing(existing);
      return;
    }
    setEditing({
      ...emptyContent,
      type: editing.type,
      locale,
      translationKey: editing.translationKey || editing.id,
      image: editing.image,
      meta: editing.meta,
      sortOrder: editing.sortOrder,
    });
  }

  const groupedContent = useMemo(() => {
    return content.reduce<Record<string, ContentRecord[]>>((groups, item) => {
      (groups[`${item.locale}:${item.type}`] ??= []).push(item);
      return groups;
    }, {});
  }, [content]);

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span>AK</span><div><strong>AKAIUNSAN</strong><small>Content Studio</small></div></div>
        <nav>
          {nav.map(([key, label, icon]) => (
            <button className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)} type="button"><span>{icon}</span>{label}{key === "leads" && newLeads > 0 ? <b>{newLeads}</b> : null}</button>
          ))}
        </nav>
        <a className="admin-view-site" href="/" target="_blank">Xem website ↗</a>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div><span>{isLocalDemo ? "Local demo" : "Review environment"}</span><strong>{notice || "Mọi thay đổi được lưu vào CMS."}</strong></div>
          <div className="admin-user"><span>{userName.slice(0, 1).toUpperCase()}</span><div><strong>{userName}</strong><small>{userEmail}</small></div>{!isLocalDemo ? <form action="/api/admin/session" method="post"><input name="action" type="hidden" value="logout" /><button type="submit">Đăng xuất</button></form> : null}</div>
        </header>

        <div className="admin-content">
          {tab === "overview" && (
            <div>
              <div className="admin-heading"><div><span>Dashboard</span><h1>Chào buổi làm việc.</h1><p>Kiểm tra nội dung, ảnh placeholder và yêu cầu mới từ website.</p></div></div>
              <div className="admin-stats">
                <article><span>Nội dung đã xuất bản</span><strong>{published}</strong><small>{content.length - published} bản nháp</small></article>
                <article><span>Yêu cầu mới</span><strong>{newLeads}</strong><small>{leadRows.length} tổng yêu cầu</small></article>
                <article><span>Ảnh cần thay</span><strong>{placeholderMedia}</strong><small>{media.length} tài sản media</small></article>
              </div>
              <div className="admin-panel"><div className="panel-title"><div><span>Việc nên làm tiếp theo</span><h2>Sẵn sàng thay dữ liệu demo</h2></div></div><div className="readiness-list"><div><b>01</b><span><strong>Cập nhật hotline và email</strong><small>Cài đặt → Thông tin liên hệ</small></span></div><div><b>02</b><span><strong>Thay ảnh dự án thật</strong><small>Hình ảnh → lọc Placeholder</small></span></div><div><b>03</b><span><strong>Kiểm tra bài viết trước khi publish</strong><small>Nội dung → Bài viết</small></span></div></div></div>
            </div>
          )}

          {tab === "content" && (
            <div>
              <div className="admin-heading admin-heading-row"><div><span>CMS</span><h1>Nội dung</h1><p>Quản lý dịch vụ, giải pháp, xử lý sự vụ, bài viết và FAQ.</p></div><button className="admin-primary" onClick={() => setEditing({ ...emptyContent })} type="button">+ Tạo nội dung</button></div>
              <div className="content-studio">
                <aside className="content-index">
                  {Object.entries(groupedContent).map(([group, items]) => <div key={group}><h2>{group.replace(":", " · ").toUpperCase()}</h2>{items.map((item) => <button className={editing.id === item.id ? "active" : ""} key={item.id} onClick={() => setEditing(item)} type="button"><span>{item.status === "published" ? "●" : "○"}</span><div><strong>{item.title}</strong><small>{item.locale.toUpperCase()} · /{item.slug}</small></div></button>)}</div>)}
                </aside>
                <form className="content-editor" onSubmit={saveContent}>
                  <div className="editor-toolbar"><select aria-label="Ngôn ngữ" value={editing.locale} onChange={(event) => setEditing({ ...editing, locale: event.target.value as ContentRecord["locale"] })}><option value="vi">VI</option><option value="en">EN</option></select><select value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value as ContentRecord["type"] })}><option value="article">Bài viết</option><option value="service">Dịch vụ</option><option value="solution">Giải pháp</option><option value="incident">Xử lý sự vụ</option><option value="faq">FAQ</option></select><select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ContentRecord["status"] })}><option value="draft">Bản nháp</option><option value="published">Xuất bản</option></select>{editing.id !== "new" && <button className="admin-secondary" onClick={beginTranslation} type="button">{editing.locale === "vi" ? "Mở / tạo bản EN" : "Mở / tạo bản VI"}</button>}<button className="admin-primary" type="submit">Lưu thay đổi</button></div>
                  <label>Tiêu đề<input required value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
                  <div className="editor-row"><label>Slug<input required value={editing.slug} onChange={(event) => setEditing({ ...editing, slug: event.target.value })} /></label><label>Nhãn nhỏ<input value={editing.eyebrow} onChange={(event) => setEditing({ ...editing, eyebrow: event.target.value })} /></label></div>
                  <label>Mô tả ngắn<textarea rows={3} value={editing.summary} onChange={(event) => setEditing({ ...editing, summary: event.target.value })} /></label>
                  <label>Nội dung<textarea className="body-editor" rows={12} value={editing.body} onChange={(event) => setEditing({ ...editing, body: event.target.value })} /></label>
                  <div className="editor-row"><label>Đường dẫn ảnh<input value={editing.image ?? ""} onChange={(event) => setEditing({ ...editing, image: event.target.value })} /></label><label>Thứ tự<input min="0" type="number" value={editing.sortOrder} onChange={(event) => setEditing({ ...editing, sortOrder: Number(event.target.value) })} /></label></div>
                  <details className="seo-box"><summary>SEO và dữ liệu mở rộng</summary><label>SEO title<input value={editing.seoTitle} onChange={(event) => setEditing({ ...editing, seoTitle: event.target.value })} /></label><label>Meta description<textarea rows={3} value={editing.seoDescription} onChange={(event) => setEditing({ ...editing, seoDescription: event.target.value })} /></label><label>Meta JSON<textarea rows={5} value={editing.meta} onChange={(event) => setEditing({ ...editing, meta: event.target.value })} /></label></details>
                </form>
              </div>
            </div>
          )}

          {tab === "media" && (
            <div>
              <div className="admin-heading"><div><span>Media Library</span><h1>Hình ảnh</h1><p>Ảnh AI/stock được đánh dấu để thay bằng ảnh dự án thật sau này.</p></div></div>
              <form className="media-upload" onSubmit={uploadMedia}><label>Chọn ảnh<input accept="image/jpeg,image/png,image/webp,image/avif" name="file" required type="file" /></label><label>Tên ảnh<input name="title" required placeholder="Ví dụ: Sảnh chung cư dự án A" /></label><label>Alt text<input name="altText" required placeholder="Mô tả nội dung ảnh" /></label><div className="editor-row"><label>Category<select name="category"><option value="condominium">Tòa nhà / Chung cư</option><option value="factory">Nhà xưởng</option><option value="apartment">Căn hộ</option><option value="general">Khác</option></select></label><label>Nguồn<select name="sourceType"><option value="original">Ảnh thật</option><option value="stock">Stock</option><option value="ai-generated">AI-generated</option></select></label></div><label>Nguồn / license<input name="sourceReference" placeholder="Mã license hoặc nguồn ảnh" /></label><label className="checkbox-label"><input name="isPlaceholder" type="checkbox" value="true" /> Đây là ảnh placeholder</label><button className="admin-primary" type="submit">Tải lên Media Library</button></form>
              <div className="media-grid">{media.map((item) => <article key={item.id}><div className="media-thumb"><img alt={item.altText} src={item.publicPath ?? `/api/media/${item.id}`} />{item.isPlaceholder && <span>Placeholder</span>}</div><h2>{item.title}</h2><p>{item.category} • {item.sourceType}</p><small>{item.altText}</small></article>)}</div>
            </div>
          )}

          {tab === "leads" && (
            <div>
              <div className="admin-heading"><div><span>Lead inbox</span><h1>Yêu cầu từ website</h1><p>Theo dõi từ lúc tiếp nhận đến khảo sát, báo giá và hoàn tất.</p></div></div>
              <div className="lead-table"><div className="lead-table-head"><span>Khách hàng</span><span>Nhu cầu</span><span>Liên hệ</span><span>Trạng thái</span></div>{leadRows.length ? leadRows.map((lead) => <article key={lead.id}><div><strong>{lead.name}</strong><small>{lead.locale?.toUpperCase() || "VI"} · {lead.location || "Chưa có khu vực"}</small></div><div><strong>{lead.leadType === "apartment" ? "Căn hộ" : lead.leadType === "factory" ? "Nhà xưởng" : lead.leadType === "building" ? "Tòa nhà" : "Dự án"}</strong><small>{[lead.propertyType, lead.area, lead.frequency].filter(Boolean).join(" • ")}</small></div><div><strong>{lead.phone}</strong><small>{lead.email}</small></div><select value={lead.status} onChange={(event) => updateLeadStatus(lead.id, event.target.value)}><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="surveying">Đang khảo sát</option><option value="quoted">Đã báo giá</option><option value="won">Thành công</option><option value="closed">Đóng</option></select>{lead.message && <p>{lead.message}</p>}</article>) : <div className="empty-state">Chưa có yêu cầu nào. Chạy demo seed hoặc gửi form trên website để kiểm tra.</div>}</div>
            </div>
          )}

          {tab === "settings" && (
            <div>
              <div className="admin-heading"><div><span>Website settings</span><h1>Cài đặt</h1><p>Thông tin dùng chung trên public website.</p></div></div>
              <form className="settings-form" onSubmit={saveSettings}>{[["siteName","Tên thương hiệu"],["tagline","Tagline"],["promise","Lời hứa thương hiệu"],["phone","Hotline"],["email","Email"],["address","Địa chỉ"]].map(([key,label]) => <label key={key}>{label}<input value={settings[key] ?? ""} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} /></label>)}<button className="admin-primary" type="submit">Lưu cài đặt</button></form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
