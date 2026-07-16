'use client'

// Top navigation — Prismate-style horizontal menu with brand mark + active states.

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { apiLogout } from '@/lib/api'

interface Props {
  userEmail?: string
  userName?: string
  role?: string
}

const NAV_ITEMS = [
  { href: '/attendance', label: 'Chấm công', icon: '📍' },
  { href: '/executive', label: 'CEO Dashboard', icon: '📊' },
  { href: '/payroll', label: 'Bảng lương', icon: '💰' },
  { href: '/projects', label: 'Dự án', icon: '🏢' },
  { href: '/employees', label: 'Nhân viên', icon: '👥' },
]

export function TopNav({ userEmail, userName, role }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const handleLogout = async () => {
    await apiLogout()
    router.push('/login')
  }

  const initials = (userName || userEmail || '?')
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <header className="topnav">
      <Link href="/attendance" className="topnav-brand">
        <span className="topnav-brand-mark">AK</span>
        <span>AKAIUNSAN</span>
      </Link>

      <nav className="topnav-menu">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`topnav-link ${isActive(item.href) ? 'active' : ''}`}
          >
            <span style={{ marginRight: 6 }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="topnav-spacer" />

      <div className="topnav-user">
        {userEmail && (
          <>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, color: 'var(--fg-default)', fontSize: 13 }}>
                {userName || userEmail.split('@')[0]}
              </div>
              <div style={{ fontSize: 11, color: 'var(--fg-subtle)' }}>
                {role || 'user'}
              </div>
            </div>
            <div className="topnav-avatar">{initials || 'A'}</div>
            <button className="btn-ghost btn-sm" onClick={handleLogout}>
              Đăng xuất
            </button>
          </>
        )}
      </div>
    </header>
  )
}
