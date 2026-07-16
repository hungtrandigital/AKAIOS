'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Employee {
  id: string
  status: string
}

interface Project {
  id: string
  status: string
}

interface CustomerReport {
  generatedAt: string
  project: { code: string; name: string }
}

interface PayrollPeriod {
  id: string
  year: number
  month: number
  status: string
  totalGross: string | null
  totalNet: string | null
  totalEmployees: number | null
}

export default function ExecutivePage() {
  const today = new Date().toISOString().split('T')[0]
  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  // Parallel queries for all key metrics
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<{ data: Employee[] }>('/attendance/employees'),
  })

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<{ data: Project[] }>('/attendance/projects'),
  })

  const todayAttendanceQuery = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () =>
      apiFetch<{ data: any[] }>('/attendance/records', {
        query: { from: today, to: today },
      }),
  })

  const currentPeriodQuery = useQuery({
    queryKey: ['payroll-periods-current'],
    queryFn: () => apiFetch<{ data: PayrollPeriod[] }>('/payroll/periods'),
  })

  const recentReportsQuery = useQuery({
    queryKey: ['recent-reports'],
    queryFn: () =>
      apiFetch<{ data: CustomerReport[] }>('/attendance/reports/customer', {
        query: { limit: 5 },
      }),
  })

  // Derived metrics
  const activeEmployees = (employeesQuery.data?.data ?? []).filter((e) => e.status === 'active').length
  const totalEmployees = employeesQuery.data?.data?.length ?? 0
  const activeProjects = (projectsQuery.data?.data ?? []).filter((p) => p.status === 'active').length

  const todayAttendance = todayAttendanceQuery.data?.data ?? []
  const checkedInToday = todayAttendance.filter((r) => r.checkInAt !== null).length
  const lateToday = todayAttendance.filter((r) => r.status === 'late').length
  const attendanceRate = activeEmployees > 0 ? Math.round((checkedInToday / activeEmployees) * 100) : 0

  const currentPeriod = (currentPeriodQuery.data?.data ?? []).find(
    (p) => p.year === year && p.month === month
  )

  const totalMonthlyGross = currentPeriod?.totalGross
    ? parseFloat(currentPeriod.totalGross)
    : 0
  const totalMonthlyNet = currentPeriod?.totalNet
    ? parseFloat(currentPeriod.totalNet)
    : 0
  const totalMonthlyEmployees = currentPeriod?.totalEmployees ?? 0

  const formatVNĐ = (amount: number) =>
    new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>📊 Báo cáo Ban Giám Đốc</h1>
          <p className="muted">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex">
          <Link href="/attendance">Chấm công</Link>
          <Link href="/payroll">Bảng lương</Link>
          <Link href="/projects">Dự án</Link>
        </div>
      </header>

      {/* KPI Cards - Top Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KpiCard
          icon="👥"
          label="Nhân viên active"
          value={activeEmployees.toString()}
          sub={`Tổng ${totalEmployees} (gồm inactive)`}
          color="#0066cc"
        />
        <KpiCard
          icon="🏢"
          label="Dự án active"
          value={activeProjects.toString()}
          sub={`Trên tổng ${projectsQuery.data?.data?.length ?? 0} dự án`}
          color="#28a745"
        />
        <KpiCard
          icon="📱"
          label="Check-in hôm nay"
          value={checkedInToday.toString()}
          sub={`${attendanceRate}% tỷ lệ điểm danh`}
          color="#17a2b8"
        />
        <KpiCard
          icon="⚠️"
          label="Đi trễ hôm nay"
          value={lateToday.toString()}
          sub={lateToday > 0 ? 'Cần theo dõi' : 'Tốt'}
          color={lateToday > 0 ? '#dc3545' : '#28a745'}
        />
      </div>

      {/* Monthly Payroll KPI */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>💰 Bảng lương tháng {month}/{year}</h2>
        {currentPeriod ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 16 }}>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Trạng thái</div>
                <PeriodStatusBadge status={currentPeriod.status} />
              </div>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Tổng gross</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{formatVNĐ(totalMonthlyGross)}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Tổng thực nhận (net)</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#28a745' }}>
                  {formatVNĐ(totalMonthlyNet)}
                </div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 13 }}>Nhân viên</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{totalMonthlyEmployees}</div>
              </div>
            </div>
            {currentPeriod.status === 'open' && (
              <div className="muted" style={{ marginTop: 16 }}>
                ⚠️ Kỳ lương chưa được tính. <Link href="/payroll">Vào BO →</Link>
              </div>
            )}
          </>
        ) : (
          <div className="muted">
            Chưa mở kỳ lương cho tháng {month}/{year}.{' '}
            <Link href="/payroll">Mở kỳ →</Link>
          </div>
        )}
      </div>

      {/* Two-column layout: Recent reports + Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>📋 Báo cáo khách hàng gần đây</h3>
          {(recentReportsQuery.data?.data ?? []).length === 0 ? (
            <p className="muted">Chưa có báo cáo nào được tạo.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Dự án</th>
                  <th>Mã</th>
                </tr>
              </thead>
              <tbody>
                {(recentReportsQuery.data?.data ?? []).slice(0, 5).map((r, idx) => (
                  <tr key={idx}>
                    <td>{new Date(r.generatedAt).toLocaleDateString('vi-VN')}</td>
                    <td>{r.project.name}</td>
                    <td><code style={{ fontSize: 11 }}>{r.project.code}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>🚀 Tình trạng hệ thống</h3>
          <SystemHealth />
          <div style={{ marginTop: 16 }}>
            <Link href="/projects">
              <button style={{ width: '100%' }}>Xem danh sách dự án</button>
            </Link>
          </div>
          <div style={{ marginTop: 8 }}>
            <Link href="/employees">
              <button style={{ width: '100%', background: '#6c757d' }}>Xem danh sách nhân viên</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className="card" style={{ padding: 16, borderLeft: `4px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 28 }}>{icon}</span>
        <span style={{ color: '#666', fontSize: 13, fontWeight: 600, textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function PeriodStatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; label: string }> = {
    open: { bg: '#17a2b8', label: '📂 Mới mở' },
    calculating: { bg: '#6c757d', label: '⏳ Đang tính' },
    calculated: { bg: '#007bff', label: '✅ Đã tính' },
    approved: { bg: '#28a745', label: '👍 Đã duyệt' },
    paid: { bg: '#20c997', label: '💸 Đã trả' },
    locked: { bg: '#343a40', label: '🔒 Đã khóa' },
  }
  const c = config[status] ?? { bg: '#888', label: status }
  return (
    <span
      style={{
        background: c.bg,
        color: 'white',
        padding: '4px 10px',
        borderRadius: 4,
        fontSize: 13,
        fontWeight: 600,
        display: 'inline-block',
        marginTop: 4,
      }}
    >
      {c.label}
    </span>
  )
}

function SystemHealth() {
  const [health, setHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/payroll/health/live')
      .then((r) => r.json())
      .then((data) => {
        setHealth(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <p className="muted">Đang kiểm tra...</p>
  if (!health) return <p className="error">Không thể kiểm tra trạng thái</p>

  return (
    <div style={{ padding: '8px 0' }}>
      <div className="flex-between">
        <span>API Payroll:</span>
        <span style={{ color: '#28a745', fontWeight: 600 }}>🟢 Online</span>
      </div>
      <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
        Last check: {new Date(health.timestamp).toLocaleTimeString('vi-VN')}
      </div>
    </div>
  )
}

// Need to import useEffect
import { useEffect, useState } from 'react'
