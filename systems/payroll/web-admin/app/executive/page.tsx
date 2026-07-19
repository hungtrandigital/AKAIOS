'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'
import { formatVietnamLongDate, getVietnamDateKey } from '@/lib/vietnam-date'

interface Employee { id: string; status: string }
interface Project { id: string; status: string; name: string; clientName: string }
interface PayrollPeriod {
  id: string
  year: number
  month: number
  status: string
  totalGross: string | null
  totalNet: string | null
  totalEmployees: number | null
}
interface CustomerReport { generatedAt: string; project: { code: string; name: string } }

const PERIOD_STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: '📂 Mới mở', cls: 'badge-info' },
  calculating: { label: '⏳ Đang tính', cls: 'badge-neutral' },
  calculated: { label: '✅ Đã tính', cls: 'badge-info' },
  approved: { label: '👍 Đã duyệt', cls: 'badge-success' },
  paid: { label: '💸 Đã trả', cls: 'badge-success' },
  locked: { label: '🔒 Đã khóa', cls: 'badge-dark' },
}

export default function ExecutivePage() {
  const { user } = useAuth()
  const today = getVietnamDateKey()
  const [yearText, monthText] = today.split('-')
  const month = Number(monthText)
  const year = Number(yearText)

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
    queryFn: () => apiFetch<{ data: any[] }>('/attendance/records', { query: { from: today, to: today } }),
  })
  const periodsQuery = useQuery({
    queryKey: ['payroll-periods-current'],
    queryFn: () => apiFetch<{ data: PayrollPeriod[] }>('/payroll/periods'),
  })
  const reportsQuery = useQuery({
    queryKey: ['recent-reports'],
    queryFn: () => apiFetch<{ data: CustomerReport[] }>('/attendance/reports/customer'),
  })

  const employees = employeesQuery.data?.data ?? []
  const projects = projectsQuery.data?.data ?? []
  const activeEmployees = employees.filter((e) => e.status === 'active').length
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const todayRecords = todayAttendanceQuery.data?.data ?? []
  const checkedIn = todayRecords.filter((r) => r.checkInAt !== null).length
  const lateToday = todayRecords.filter((r) => r.status === 'late').length
  const attendanceRate = activeEmployees > 0 ? Math.round((checkedIn / activeEmployees) * 100) : 0
  const currentPeriod = (periodsQuery.data?.data ?? []).find((p) => p.year === year && p.month === month)
  const formatVNĐ = (amount: number | null) =>
    amount == null ? '—' : new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'

  return (
    <>
      <TopNav userEmail={user?.email || user?.phone} userName={user?.fullName} role={user?.role} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 CEO Dashboard</h1>
            <p className="page-subtitle">
              Tổng quan toàn hệ thống · {formatVietnamLongDate()}
            </p>
          </div>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card kpi-accent">
            <div className="kpi-card-head">
              <div className="kpi-card-icon">👥</div>
              <div>Nhân viên active</div>
            </div>
            <div className="kpi-card-value">{activeEmployees}</div>
            <div className="kpi-card-sub">Tổng {employees.length} (gồm inactive)</div>
          </div>

          <div className="kpi-card kpi-success">
            <div className="kpi-card-head">
              <div className="kpi-card-icon">🏢</div>
              <div>Dự án active</div>
            </div>
            <div className="kpi-card-value">{activeProjects}</div>
            <div className="kpi-card-sub">Trên tổng {projects.length} dự án</div>
          </div>

          <div className="kpi-card kpi-success">
            <div className="kpi-card-head">
              <div className="kpi-card-icon">📱</div>
              <div>Check-in hôm nay</div>
            </div>
            <div className="kpi-card-value">{checkedIn}</div>
            <div className="kpi-card-sub">{attendanceRate}% tỷ lệ điểm danh</div>
          </div>

          <div className={`kpi-card ${lateToday > 0 ? 'kpi-warning' : 'kpi-success'}`}>
            <div className="kpi-card-head">
              <div className="kpi-card-icon">{lateToday > 0 ? '⚠️' : '✓'}</div>
              <div>Đi trễ hôm nay</div>
            </div>
            <div className="kpi-card-value">{lateToday}</div>
            <div className="kpi-card-sub">{lateToday > 0 ? 'Cần theo dõi' : 'Tốt'}</div>
          </div>
        </div>

        {/* Payroll */}
        <div className="page-card">
          <div className="page-card-head">
            <h3 className="page-card-title">💰 Bảng lương tháng {month}/{year}</h3>
            {currentPeriod && (
              <span className={`badge ${PERIOD_STATUS[currentPeriod.status]?.cls ?? 'badge-neutral'}`}>
                {PERIOD_STATUS[currentPeriod.status]?.label ?? currentPeriod.status}
              </span>
            )}
          </div>
          <div className="page-card-body">
            {currentPeriod ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-4)' }}>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Tổng gross
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--fg-default)', marginTop: 4 }}>
                    {formatVNĐ(currentPeriod.totalGross ? parseFloat(currentPeriod.totalGross) : null)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Thực nhận (net)
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--success)', marginTop: 4 }}>
                    {formatVNĐ(currentPeriod.totalNet ? parseFloat(currentPeriod.totalNet) : null)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Nhân viên
                  </div>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--fg-default)', marginTop: 4 }}>
                    {currentPeriod.totalEmployees ?? '—'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted">Chưa mở kỳ lương cho tháng này.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
          <div className="page-card">
            <div className="page-card-head">
              <h3 className="page-card-title">📋 Báo cáo khách hàng</h3>
            </div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Dự án</th>
                  </tr>
                </thead>
                <tbody>
                  {((reportsQuery.data?.data ?? []).slice(0, 5).length === 0) ? (
                    <tr><td colSpan={2} className="table-empty">Chưa có báo cáo</td></tr>
                  ) : (
                    (reportsQuery.data?.data ?? []).slice(0, 5).map((r, idx) => (
                      <tr key={idx}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                          {new Date(r.generatedAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{r.project.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                            <code>{r.project.code}</code>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="page-card">
            <div className="page-card-head">
              <h3 className="page-card-title">🚀 Quick actions</h3>
            </div>
            <div className="page-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <a href="/projects" className="btn btn-secondary btn-block">📋 Xem danh sách dự án</a>
              <a href="/employees" className="btn btn-secondary btn-block">👥 Xem danh sách nhân viên</a>
              <a href="/payroll" className="btn btn-primary btn-block">💰 Mở kỳ lương</a>
              <a href="/attendance" className="btn btn-ghost btn-block">📍 Xem chấm công realtime</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
