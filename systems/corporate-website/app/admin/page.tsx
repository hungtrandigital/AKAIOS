import Image from "next/image";
import Link from "next/link";
import { AdminStudio } from "@/components/AdminStudio";
import { requireAdminPage } from "@/lib/admin-auth";
import { getSettings, listAllContent, listLeads, listMedia } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, authorized } = await requireAdminPage("/admin");
  if (!authorized) {
    return <main className="admin-access"><section className="admin-access-shell"><div className="admin-access-brand"><Image alt="AKAIUNSAN" height={737} priority src="/brand-logo.png" unoptimized width={1194} /><span>Content Studio</span><p>Quản trị nội dung với cùng một tiêu chuẩn vận hành của thương hiệu.</p></div><div className="admin-access-card"><span>Admin access</span><h1>Tài khoản chưa được cấp quyền.</h1><p>Thêm email <strong>{user.email}</strong> vào biến môi trường <code>ADMIN_EMAILS</code> của Sites để mở Content Studio.</p><Link className="button" href="/">Về website <b aria-hidden="true">→</b></Link></div></section></main>;
  }
  const [content, media, leadRows, settings] = await Promise.all([listAllContent(), listMedia(), listLeads(), getSettings()]);
  return <AdminStudio initialContent={content} initialLeads={leadRows} initialMedia={media} initialSettings={settings} isLocalDemo={Boolean(user.isLocalDemo)} userEmail={user.email} userName={user.displayName} />;
}
