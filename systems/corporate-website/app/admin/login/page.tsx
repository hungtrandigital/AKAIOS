import Image from "next/image";
import Link from "next/link";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="admin-login-page">
      <section className="admin-login-card" aria-labelledby="admin-login-title">
        <Image
          src="/brand-logo.png"
          alt="AKAIUNSAN"
          width={220}
          height={112}
          priority
          unoptimized
        />
        <span>Content Studio</span>
        <h1 id="admin-login-title">Review access</h1>
        <p>Nhập mật khẩu review để quản lý nội dung, hình ảnh và yêu cầu khách hàng.</p>
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
          <button type="submit">Mở Content Studio</button>
        </form>
        <Link href="/">← Về website</Link>
      </section>
    </main>
  );
}
