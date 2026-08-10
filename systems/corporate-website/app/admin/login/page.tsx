import Image from "next/image";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="admin-login-page">
      <section className="admin-login-story" aria-label="AKAIUNSAN Content Studio">
        <Image src="/brand-logo.png" alt="AKAIUNSAN" width={1194} height={737} priority unoptimized />
        <div>
          <span>Content operations — 2026</span>
          <h1>Thương hiệu nhất quán bắt đầu từ cách nội dung được vận hành.</h1>
          <p>Kiểm soát nội dung, hình ảnh và yêu cầu khách hàng trong cùng một không gian làm việc.</p>
        </div>
        <ol>
          <li><b>01</b><span>Nội dung song ngữ</span></li>
          <li><b>02</b><span>Media có truy vết</span></li>
          <li><b>03</b><span>Lead theo trạng thái</span></li>
        </ol>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card" aria-labelledby="admin-login-title">
          <span>Content Studio</span>
          <h2 id="admin-login-title">Review access</h2>
          <p>Nhập mật khẩu review để tiếp tục vào không gian quản trị.</p>
          <form action="/api/admin/session" method="post">
            <label htmlFor="admin-preview-password">Mật khẩu</label>
            <input
              id="admin-preview-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              autoFocus
            />
            {error ? <small role="alert">Mật khẩu chưa đúng. Vui lòng thử lại.</small> : null}
            <button type="submit">Mở Content Studio <b aria-hidden="true">→</b></button>
          </form>
          <Link href="/">← Về website</Link>
        </div>
      </section>
    </main>
  );
}
