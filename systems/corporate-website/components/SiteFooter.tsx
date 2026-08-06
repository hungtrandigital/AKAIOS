"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";

export function SiteFooter() {
  const locale = usePathname().startsWith("/en") ? "en" : "vi";
  if (locale === "en") {
    return (
      <footer className="site-footer">
        <div className="shell footer-grid">
          <div><Brand inverse href="/en" label="AKAIUNSAN — Home" /><p className="footer-intro">Professional cleaning solutions for buildings, condominium projects, factories, industrial zones, and apartments.</p></div>
          <div><h2>Services</h2><Link href="/en/services/recurring-cleaning">Recurring cleaning</Link><Link href="/en/services/periodic-cleaning">Periodic cleaning</Link><Link href="/en/services/deep-cleaning">Deep cleaning</Link></div>
          <div><h2>Solutions</h2><Link href="/en/solutions/building-condominium-cleaning">Buildings & condominiums</Link><Link href="/en/solutions/factory-industrial-cleaning">Factories & industrial zones</Link><Link href="/en/solutions/apartment-cleaning">Apartments</Link></div>
          <div><h2>Connect</h2><Link href="/en/contact">Book / request a survey</Link><Link href="/en/insights">Operational insights</Link><Link href="/admin">Content Studio</Link></div>
        </div>
        <div className="shell footer-bottom"><span>© 2026 AKAIUNSAN.</span><span>Clean by standard. Operated with commitment.</span></div>
      </footer>
    );
  }

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div><Brand inverse /><p className="footer-intro">Giải pháp vệ sinh chuyên nghiệp cho tòa nhà, dự án chung cư, nhà xưởng, khu công nghiệp và căn hộ.</p></div>
        <div><h2>Dịch vụ</h2><Link href="/dich-vu/ve-sinh-thuong-xuyen">Vệ sinh thường xuyên</Link><Link href="/dich-vu/ve-sinh-dinh-ky">Vệ sinh định kỳ</Link><Link href="/dich-vu/tong-ve-sinh">Tổng vệ sinh</Link></div>
        <div><h2>Giải pháp</h2><Link href="/giai-phap/ve-sinh-chung-cu">Tòa nhà / Chung cư</Link><Link href="/giai-phap/ve-sinh-nha-xuong-khu-cong-nghiep">Nhà xưởng / KCN</Link><Link href="/giai-phap/ve-sinh-can-ho">Căn hộ</Link></div>
        <div><h2>Kết nối</h2><Link href="/lien-he">Đặt lịch / yêu cầu khảo sát</Link><Link href="/kien-thuc">Kiến thức vận hành</Link><Link href="/admin">Quản trị nội dung</Link></div>
      </div>
      <div className="shell footer-bottom"><span>© 2026 AKAIUNSAN.</span><span>Sạch đúng chuẩn. Vận hành đúng cam kết.</span></div>
    </footer>
  );
}
