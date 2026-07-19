'use client'

// Prismate-style login — page-card with brand mark + email/password fields
// with leading icons + show/hide toggle + error inline.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiLogin } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@ak.local')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await apiLogin(email, password)
      router.push('/login/2fa')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã có lỗi xảy ra')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">AK</div>
          <h1 className="login-brand-title">AKAIUNSAN</h1>
          <p className="login-brand-sub">Đăng nhập BO Admin</p>
        </div>
        <div className="login-body">
          <form onSubmit={submit} className="form">
            <div className="form-group">
              <label className="form-label" htmlFor="login_email">Email</label>
              <div className="form-field has-icon">
                <svg className="form-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path fillRule="evenodd" clipRule="evenodd" d="M2 4.5A1.5 1.5 0 0 1 3.5 3h9A1.5 1.5 0 0 1 14 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 11.5v-7Z" />
                  <path d="M2.5 4l5.5 3.5L13.5 4" />
                </svg>
                <input
                  id="login_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                  placeholder="you@ak.local"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="login_password">Mật khẩu</label>
              <div className="form-field has-icon" style={{ position: 'relative' }}>
                <svg className="form-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="7" width="10" height="6" rx="1" />
                  <path d="M5 7V5a3 3 0 0 1 6 0v2" />
                </svg>
                <input
                  id="login_password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="form-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </button>
              </div>
            </div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <>
                  <span className="spinner" /> Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <Link href="#" style={{ fontSize: 'var(--font-size-sm)' }}>
              Quên mật khẩu?
            </Link>
          </div>

          <div style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-3)',
            background: 'var(--bg-muted)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--fg-muted)',
          }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Demo accounts (pwd: Demo@2026):</div>
            <div>👑 <code>ceo@ak.local</code> &nbsp; 📋 <code>ops@ak.local</code></div>
            <div>👷 <code>sup-vincom@ak.local</code> &nbsp; 👷 <code>sup-bitexco@ak.local</code></div>
          </div>
        </div>
      </div>
    </div>
  )
}
