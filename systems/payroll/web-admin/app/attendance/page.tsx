'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { apiFetch, apiLogout } from '@/lib/api'
import { useRouter } from 'next/navigation'

interface AttendanceRecord {
  id: string
  status: string
  checkInAt: string | null
  checkOutAt: string | null
  totalMinutesWorked: number | null
  overtimeMinutes: number | null
  shiftAssignment: {
    employee: { employeeCode: string; fullName: string }
    project: { code: string; name: string }
    shift: { name: string; startTime: string; endTime: string }
    date: string
  }
}

export default function AttendancePage() {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]

  const { data, isLoading, error } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () => apiFetch<{ data: AttendanceRecord[] }>('/attendance/records', {
      query: { from: today, to: today },
    }),
    refetchInterval: 30_000, // realtime — refresh every 30s
  })

  const logout = async () => {
    await apiLogout()
    router.push('/login')
  }

  const groupedByProject = data?.data?.reduce((acc, r) => {
    const key = r.shiftAssignment.project.code
    if (!acc[key]) acc[key] = { project: r.shiftAssignment.project, records: [] }
    acc[key].records.push(r)
    return acc
  }, {} as Record<string, { project: AttendanceRecord['shiftAssignment']['project']; records: AttendanceRecord[] }>) ?? {}

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0 }}>Chấm công hôm nay</h1>
          <p className="muted">{new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <div className="flex">
          <Link href="/payroll">Bảng lương</Link>
          <Link href="/projects">Dự án</Link>
          <Link href="/employees">Nhân viên</Link>
          <button className="danger" onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      {isLoading && <p>Đang tải...</p>}
      {error && <div className="error">{String(error)}</div>}

      {Object.entries(groupedByProject).map(([code, { project, records }]) => (
        <div key={code} className="card">
          <h3 style={{ marginTop: 0 }}>{project.name}</h3>
          <p className="muted">{project.code} · {records.length} records</p>
          <table>
            <thead>
              <tr>
                <th>Mã NV</th>
                <th>Họ tên</th>
                <th>Ca</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Tổng giờ</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.shiftAssignment.employee.employeeCode}</td>
                  <td>{r.shiftAssignment.employee.fullName}</td>
                  <td>{r.shiftAssignment.shift.name} ({r.shiftAssignment.shift.startTime}-{r.shiftAssignment.shift.endTime})</td>
                  <td>{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString('vi-VN') : '—'}</td>
                  <td>{r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString('vi-VN') : '—'}</td>
                  <td>{r.totalMinutesWorked ? `${Math.round(r.totalMinutesWorked / 60 * 10) / 10}h` : '—'}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    present: '#28a745',
    late: '#ffc107',
    absent: '#dc3545',
    on_leave: '#6c757d',
    holiday: '#17a2b8',
    half_day: '#fd7e14',
    early_leave: '#e83e8c',
  }
  return (
    <span style={{ background: colors[status] ?? '#888', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
      {status}
    </span>
  )
}
