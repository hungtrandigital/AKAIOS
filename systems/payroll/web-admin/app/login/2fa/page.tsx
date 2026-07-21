'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { apiVerifyTwoFactor } from '@/lib/api'

export default function TwoFactorPage() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const router = useRouter()
  const { loginSuccess } = useAuth()
  const [totpCode, setTotpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const validCodeLength = totpCode.length === 6 || (isDevelopment && totpCode.length === 4)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const data = await apiVerifyTwoFactor(totpCode)
      loginSuccess(data.accessToken, data.user)
      router.replace('/attendance')
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Không thể xác minh mã')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-mark">2FA</div>
          <h1 className="login-brand-title">Xác minh đăng nhập</h1>
          <p className="login-brand-sub">
            {isDevelopment
              ? 'Nhập mã test local 4 số hoặc mã xác thực 6 số'
              : 'Nhập mã 6 số từ ứng dụng xác thực'}
          </p>
        </div>
        <div className="login-body">
          <form onSubmit={submit} className="form">
            <div className="form-group">
              <label className="form-label" htmlFor="totp_code">Mã xác thực</label>
              <input
                id="totp_code"
                name="totpCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={isDevelopment ? '(?:[0-9]{4}|[0-9]{6})' : '[0-9]{6}'}
                maxLength={6}
                value={totpCode}
                onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder={isDevelopment ? '0000' : '000000'}
                required
                autoFocus
              />
            </div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !validCodeLength}
            >
              {loading ? <><span className="spinner" /> Đang xác minh...</> : 'Xác minh'}
            </button>
          </form>

          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <Link href="/login" style={{ fontSize: 'var(--font-size-sm)' }}>
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
