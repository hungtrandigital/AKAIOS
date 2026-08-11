"use client";

import Image from "next/image";
import Link from "next/link";
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
type ContentStatusFilter = "all" | ContentRecord["status"];
type MediaFilter = "all" | "placeholder" | "original";
type LeadStatusFilter = "all" | LeadItem["status"];
type NoticeTone = "neutral" | "working" | "success" | "error";

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
  const [notice, setNotice] = useState<{ text: string; tone: NoticeTone }>({ text: "", tone: "neutral" });
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [contentQuery, setContentQuery] = useState("");
  const [contentStatus, setContentStatus] = useState<ContentStatusFilter>("all");
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>("all");
  const [leadQuery, setLeadQuery] = useState("");
  const [leadStatus, setLeadStatus] = useState<LeadStatusFilter>("all");
  const published = content.filter((item) => item.status === "published").length;
  const newLeads = leadRows.filter((lead) => lead.status === "new").length;
  const placeholderMedia = media.filter((item) => item.isPlaceholder).length;

  const nav: Array<[Tab, string, string]> = [
    ["overview", "Tổng quan", "01"],
    ["content", "Nội dung", "02"],
    ["media", "Hình ảnh", "03"],
    ["leads", "Yêu cầu", "04"],
    ["settings", "Cài đặt", "05"],
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
    setBusyAction("content");
    setNotice({ text: "Đang lưu nội dung…", tone: "working" });
    try {
      const isNew = editing.id === "new";
      const response = await fetch(isNew ? "/api/admin/content" : `/api/admin/content/${editing.id}`, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing),
      });
      setNotice(response.ok
        ? { text: "Đã lưu nội dung thành công.", tone: "success" }
        : { text: "Chưa lưu được nội dung. Vui lòng kiểm tra lại.", tone: "error" });
      if (response.ok) await refreshContent();
    } catch {
      setNotice({ text: "Mất kết nối khi lưu nội dung. Vui lòng thử lại.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
  }

  async function uploadMedia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("media");
    setNotice({ text: "Đang tải ảnh…", tone: "working" });
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/admin/media", { method: "POST", body: new FormData(form) });
      if (response.ok) {
        const refreshed = await fetch("/api/admin/media");
        const data = (await refreshed.json()) as { items: MediaItem[] };
        setMedia(data.items);
        form.reset();
        setNotice({ text: "Đã thêm ảnh vào Media Library.", tone: "success" });
      } else {
        setNotice({ text: "Chưa tải được ảnh. Kiểm tra định dạng và dung lượng.", tone: "error" });
      }
    } catch {
      setNotice({ text: "Mất kết nối khi tải ảnh. Vui lòng thử lại.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
  }

  async function updateLeadStatus(id: string, status: string) {
    setBusyAction(`lead:${id}`);
    setNotice({ text: "Đang cập nhật yêu cầu…", tone: "working" });
    try {
      const response = await fetch(`/api/admin/leads/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setLeadRows((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
        setNotice({ text: "Đã cập nhật trạng thái yêu cầu.", tone: "success" });
      } else {
        setNotice({ text: "Chưa cập nhật được yêu cầu.", tone: "error" });
      }
    } catch {
      setNotice({ text: "Mất kết nối khi cập nhật yêu cầu.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyAction("settings");
    setNotice({ text: "Đang lưu cài đặt…", tone: "working" });
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      setNotice(response.ok
        ? { text: "Đã lưu cài đặt website.", tone: "success" }
        : { text: "Chưa lưu được cài đặt.", tone: "error" });
    } catch {
      setNotice({ text: "Mất kết nối khi lưu cài đặt.", tone: "error" });
    } finally {
      setBusyAction(null);
    }
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

  const filteredContent = useMemo(() => {
    const query = contentQuery.trim().toLocaleLowerCase("vi");
    return content.filter((item) => {
      const matchesStatus = contentStatus === "all" || item.status === contentStatus;
      const matchesQuery = !query || [item.title, item.slug, item.eyebrow, item.type]
        .some((value) => value.toLocaleLowerCase("vi").includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [content, contentQuery, contentStatus]);

  const groupedContent = useMemo(() => {
    return filteredContent.reduce<Record<string, ContentRecord[]>>((groups, item) => {
      (groups[`${item.locale}:${item.type}`] ??= []).push(item);
      return groups;
    }, {});
  }, [filteredContent]);

  const filteredMedia = useMemo(() => {
    const query = mediaQuery.trim().toLocaleLowerCase("vi");
    return media.filter((item) => {
      const matchesFilter = mediaFilter === "all"
        || (mediaFilter === "placeholder" && item.isPlaceholder)
        || (mediaFilter === "original" && !item.isPlaceholder);
      const matchesQuery = !query || [item.title, item.altText, item.category, item.sourceType]
        .some((value) => value.toLocaleLowerCase("vi").includes(query));
      return matchesFilter && matchesQuery;
    });
  }, [media, mediaFilter, mediaQuery]);

  const filteredLeads = useMemo(() => {
    const query = leadQuery.trim().toLocaleLowerCase("vi");
    return leadRows.filter((lead) => {
      const matchesStatus = leadStatus === "all" || lead.status === leadStatus;
      const matchesQuery = !query || [lead.name, lead.phone, lead.email, lead.location, lead.message]
        .some((value) => value.toLocaleLowerCase("vi").includes(query));
      return matchesStatus && matchesQuery;
    });
  }, [leadQuery, leadRows, leadStatus]);

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand-lockup">
          <Link aria-label="AKAIUNSAN — Trang chủ" href="/">
            <Image alt="" className="admin-brand-logo" height={737} priority src="/brand-logo.png" unoptimized width={1194} />
          </Link>
          <span>Content Studio</span>
        </div>
        <div className="admin-sidebar-note">
          <small>Operations system</small>
          <p>Một nơi để kiểm soát nội dung, hình ảnh và yêu cầu khách hàng.</p>
        </div>
        <nav aria-label="Điều hướng Content Studio">
          {nav.map(([key, label, index]) => (
            <button aria-pressed={tab === key} className={tab === key ? "active" : ""} key={key} onClick={() => setTab(key)} type="button"><span>{index}</span><strong>{label}</strong>{key === "leads" && newLeads > 0 ? <b>{newLeads}</b> : null}</button>
          ))}
        </nav>
        <Link className="admin-view-site" href="/" rel="noreferrer" target="_blank"><span>Xem website</span><b aria-hidden="true">↗</b></Link>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-environment" data-tone={notice.tone}><span><i aria-hidden="true" />{isLocalDemo ? "Local demo" : "Review environment"}</span><strong aria-live="polite" role="status">{notice.text || "Mọi thay đổi được lưu vào CMS."}</strong></div>
          <div className="admin-user"><span aria-hidden="true">{userName.slice(0, 1).toUpperCase()}</span><div><strong>{userName}</strong><small>{userEmail}</small></div>{!isLocalDemo ? <form action="/api/admin/session" method="post"><input name="action" type="hidden" value="logout" /><button type="submit">Đăng xuất</button></form> : null}</div>
        </header>

        <div className="admin-content">
          {tab === "overview" && (
            <div className="admin-view">
              <div className="admin-heading admin-heading-hero"><div><span>01 — Dashboard</span><h1>Chào buổi làm việc.</h1><p>Kiểm tra nội dung, ảnh placeholder và yêu cầu mới từ website.</p></div><small>AKAIUNSAN<br />Content operations</small></div>
              <div className="admin-stats">
                <button onClick={() => setTab("content")} type="button"><span>Nội dung đã xuất bản</span><strong>{published}</strong><small>{content.length - published} bản nháp · Mở nội dung →</small></button>
                <button onClick={() => setTab("leads")} type="button"><span>Yêu cầu mới</span><strong>{newLeads}</strong><small>{leadRows.length} tổng yêu cầu · Mở hộp thư →</small></button>
                <button onClick={() => { setMediaFilter("placeholder"); setTab("media"); }} type="button"><span>Ảnh cần thay</span><strong>{placeholderMedia}</strong><small>{media.length} tài sản media · Rà soát ảnh →</small></button>
              </div>
              <div className="admin-panel"><div className="panel-title"><div><span>Việc nên làm tiếp theo</span><h2>Sẵn sàng thay dữ liệu demo</h2></div></div><div className="readiness-list"><button onClick={() => setTab("settings")} type="button"><b>01</b><span><strong>Cập nhật hotline và email</strong><small>Cài đặt → Thông tin liên hệ</small></span><i aria-hidden="true">→</i></button><button onClick={() => { setMediaFilter("placeholder"); setTab("media"); }} type="button"><b>02</b><span><strong>Thay ảnh dự án thật</strong><small>Hình ảnh → lọc Placeholder</small></span><i aria-hidden="true">→</i></button><button onClick={() => { setContentStatus("draft"); setTab("content"); }} type="button"><b>03</b><span><strong>Kiểm tra bài viết trước khi publish</strong><small>Nội dung → lọc Bản nháp</small></span><i aria-hidden="true">→</i></button></div></div>
            </div>
          )}

          {tab === "content" && (
            <div className="admin-view">
              <div className="admin-heading admin-heading-row"><div><span>02 — CMS</span><h1>Nội dung</h1><p>Quản lý dịch vụ, giải pháp, xử lý sự vụ, bài viết và FAQ.</p></div><button className="admin-primary" onClick={() => setEditing({ ...emptyContent })} type="button">+ Tạo nội dung</button></div>
              <div className="content-studio">
                <aside className="content-index">
                  <div className="admin-list-tools">
                    <label className="admin-search"><span className="sr-only">Tìm nội dung</span><input onChange={(event) => setContentQuery(event.target.value)} placeholder="Tìm tiêu đề hoặc slug…" type="search" value={contentQuery} /></label>
                    <div className="admin-segments" aria-label="Lọc trạng thái nội dung">
                      {(["all", "draft", "published"] as const).map((status) => <button aria-pressed={contentStatus === status} className={contentStatus === status ? "active" : ""} key={status} onClick={() => setContentStatus(status)} type="button">{status === "all" ? "Tất cả" : status === "draft" ? "Bản nháp" : "Đã đăng"}</button>)}
                    </div>
                    <small>{filteredContent.length}/{content.length} nội dung</small>
                  </div>
                  {Object.entries(groupedContent).map(([group, items]) => <div className="content-group" key={group}><h2>{group.replace(":", " · ").toUpperCase()}</h2>{items.map((item) => <button className={editing.id === item.id ? "active" : ""} key={item.id} onClick={() => setEditing(item)} type="button"><span>{item.status === "published" ? "●" : "○"}</span><div><strong>{item.title}</strong><small>{item.locale.toUpperCase()} · /{item.slug}</small></div></button>)}</div>)}
                  {!filteredContent.length ? <div className="admin-filter-empty"><strong>Không tìm thấy nội dung</strong><span>Thử từ khóa hoặc bộ lọc khác.</span></div> : null}
                </aside>
                <form className="content-editor" onSubmit={saveContent}>
                  <div className="editor-context"><div><span>{editing.id === "new" ? "Nội dung mới" : "Đang chỉnh sửa"}</span><strong>{editing.title || "Chưa đặt tiêu đề"}</strong></div><small>{editing.status === "published" ? "Đang hiển thị công khai" : "Chưa xuất bản"}</small></div>
                  <div className="editor-toolbar"><select aria-label="Ngôn ngữ" value={editing.locale} onChange={(event) => setEditing({ ...editing, locale: event.target.value as ContentRecord["locale"] })}><option value="vi">VI</option><option value="en">EN</option></select><select aria-label="Loại nội dung" value={editing.type} onChange={(event) => setEditing({ ...editing, type: event.target.value as ContentRecord["type"] })}><option value="article">Bài viết</option><option value="service">Dịch vụ</option><option value="solution">Giải pháp</option><option value="incident">Xử lý sự vụ</option><option value="faq">FAQ</option></select><select aria-label="Trạng thái nội dung" value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value as ContentRecord["status"] })}><option value="draft">Bản nháp</option><option value="published">Xuất bản</option></select>{editing.id !== "new" && <button className="admin-secondary" onClick={beginTranslation} type="button">{editing.locale === "vi" ? "Mở / tạo bản EN" : "Mở / tạo bản VI"}</button>}<button className="admin-primary" disabled={busyAction === "content"} type="submit">{busyAction === "content" ? "Đang lưu…" : "Lưu thay đổi"}</button></div>
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
            <div className="admin-view">
              <div className="admin-heading admin-heading-row"><div><span>03 — Media Library</span><h1>Hình ảnh</h1><p>Ảnh AI/stock được đánh dấu để thay bằng ảnh dự án thật sau này.</p></div><div className="admin-heading-metric"><strong>{media.length}</strong><span>tài sản</span></div></div>
              <details className="admin-disclosure"><summary>+ Tải ảnh mới</summary><form className="media-upload" onSubmit={uploadMedia}><label>Chọn ảnh<input accept="image/jpeg,image/png,image/webp,image/avif" name="file" required type="file" /></label><label>Tên ảnh<input name="title" required placeholder="Ví dụ: Sảnh chung cư dự án A" /></label><label>Alt text<input name="altText" required placeholder="Mô tả nội dung ảnh" /></label><div className="editor-row"><label>Category<select name="category"><option value="condominium">Tòa nhà / Chung cư</option><option value="factory">Nhà xưởng</option><option value="apartment">Căn hộ</option><option value="general">Khác</option></select></label><label>Nguồn<select name="sourceType"><option value="original">Ảnh thật</option><option value="stock">Stock</option><option value="ai-generated">AI-generated</option></select></label></div><label>Nguồn / license<input name="sourceReference" placeholder="Mã license hoặc nguồn ảnh" /></label><label className="checkbox-label"><input name="isPlaceholder" type="checkbox" value="true" /> Đây là ảnh placeholder</label><button className="admin-primary" disabled={busyAction === "media"} type="submit">{busyAction === "media" ? "Đang tải…" : "Tải lên Media Library"}</button></form></details>
              <div className="admin-filterbar">
                <label className="admin-search"><span className="sr-only">Tìm hình ảnh</span><input onChange={(event) => setMediaQuery(event.target.value)} placeholder="Tìm theo tên, alt text…" type="search" value={mediaQuery} /></label>
                <div className="admin-segments" aria-label="Lọc hình ảnh">{(["all", "placeholder", "original"] as const).map((filter) => <button aria-pressed={mediaFilter === filter} className={mediaFilter === filter ? "active" : ""} key={filter} onClick={() => setMediaFilter(filter)} type="button">{filter === "all" ? "Tất cả" : filter === "placeholder" ? `Cần thay (${placeholderMedia})` : "Ảnh chính thức"}</button>)}</div>
                <small>{filteredMedia.length} kết quả</small>
              </div>
              {filteredMedia.length ? <div className="media-grid">{filteredMedia.map((item) => <article key={item.id}><div className="media-thumb"><Image alt={item.altText} fill sizes="(max-width: 760px) 100vw, (max-width: 1060px) 50vw, 25vw" src={item.publicPath ?? `/api/media/${item.id}`} unoptimized />{item.isPlaceholder && <span>Placeholder</span>}</div><h2>{item.title}</h2><p>{item.category} • {item.sourceType}</p><small>{item.altText}</small></article>)}</div> : <div className="admin-filter-empty admin-filter-empty-wide"><strong>Không tìm thấy hình ảnh</strong><span>Thử từ khóa hoặc bộ lọc khác.</span></div>}
            </div>
          )}

          {tab === "leads" && (
            <div className="admin-view">
              <div className="admin-heading admin-heading-row"><div><span>04 — Lead inbox</span><h1>Yêu cầu từ website</h1><p>Theo dõi từ lúc tiếp nhận đến khảo sát, báo giá và hoàn tất.</p></div><div className="admin-heading-metric"><strong>{newLeads}</strong><span>yêu cầu mới</span></div></div>
              <div className="admin-filterbar admin-filterbar-leads">
                <label className="admin-search"><span className="sr-only">Tìm yêu cầu khách hàng</span><input onChange={(event) => setLeadQuery(event.target.value)} placeholder="Tìm tên, số điện thoại, khu vực…" type="search" value={leadQuery} /></label>
                <label className="admin-select-filter"><span>Trạng thái</span><select onChange={(event) => setLeadStatus(event.target.value as LeadStatusFilter)} value={leadStatus}><option value="all">Tất cả</option><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="surveying">Đang khảo sát</option><option value="quoted">Đã báo giá</option><option value="won">Thành công</option><option value="closed">Đóng</option></select></label>
                <small>{filteredLeads.length}/{leadRows.length} yêu cầu</small>
              </div>
              <div className="lead-table"><div className="lead-table-head"><span>Khách hàng</span><span>Nhu cầu</span><span>Liên hệ</span><span>Trạng thái</span></div>{filteredLeads.length ? filteredLeads.map((lead) => <article key={lead.id}><div><strong>{lead.name}</strong><small>{lead.locale?.toUpperCase() || "VI"} · {lead.location || "Chưa có khu vực"}</small></div><div><strong>{lead.leadType === "apartment" ? "Căn hộ" : lead.leadType === "factory" ? "Nhà xưởng" : lead.leadType === "building" ? "Tòa nhà" : "Dự án"}</strong><small>{[lead.propertyType, lead.area, lead.frequency].filter(Boolean).join(" • ")}</small></div><div><strong>{lead.phone}</strong><small>{lead.email}</small></div><select aria-label={`Trạng thái yêu cầu của ${lead.name}`} disabled={busyAction === `lead:${lead.id}`} value={lead.status} onChange={(event) => updateLeadStatus(lead.id, event.target.value)}><option value="new">Mới</option><option value="contacted">Đã liên hệ</option><option value="surveying">Đang khảo sát</option><option value="quoted">Đã báo giá</option><option value="won">Thành công</option><option value="closed">Đóng</option></select>{lead.message && <p>{lead.message}</p>}</article>) : <div className="empty-state">Không có yêu cầu phù hợp. Thử từ khóa hoặc trạng thái khác.</div>}</div>
            </div>
          )}

          {tab === "settings" && (
            <div className="admin-view">
              <div className="admin-heading"><div><span>05 — Website settings</span><h1>Cài đặt</h1><p>Thông tin dùng chung trên public website.</p></div></div>
              <form className="settings-form" onSubmit={saveSettings}>{[["siteName","Tên thương hiệu"],["tagline","Tagline"],["promise","Lời hứa thương hiệu"],["phone","Hotline"],["email","Email"],["address","Địa chỉ"]].map(([key,label]) => <label key={key}>{label}<input value={settings[key] ?? ""} onChange={(event) => setSettings({ ...settings, [key]: event.target.value })} /></label>)}<button className="admin-primary" disabled={busyAction === "settings"} type="submit">{busyAction === "settings" ? "Đang lưu…" : "Lưu cài đặt"}</button></form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
