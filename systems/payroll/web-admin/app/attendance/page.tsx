'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'
import { AttendanceOverrideModal } from '@/components/AttendanceOverrideModal'

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

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  present: { label: 'Đúng giờ', cls: 'badge-success' },
  late: { label: 'Đi trễ', cls: 'badge-warning' },
  absent: { label: 'Vắng', cls: 'badge-danger' },
  on_leave: { label: 'Nghỉ phép', cls: 'badge-neutral' },
  holiday: { label: 'Lễ', cls: 'badge-info' },
  half_day: { label: 'Nửa ngày', cls: 'badge-warning' },
  early_leave: { label: 'Về sớm', cls: 'badge-warning' },
}

export default function AttendancePage() {
  const { user } = useAuth()
  const today = new Date().toISOString().split('T')[0]
  const [overrideTarget, setOverrideTarget] = useState<AttendanceRecord | null>(null)
  const [filter, setFilter] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['attendance', today],
    queryFn: () =>
      apiFetch<{ data: AttendanceRecord[] }>('/attendance/records', {
        query: { from: today, to: today },
      }),
    refetchInterval: 30_000,
  })

  const groupedByProject = (data?.data ?? []).reduce((acc, r) => {
    const key = r.shiftAssignment.project.code
    if (!acc[key]) acc[key] = { project: r.shiftAssignment.project, records: [] as AttendanceRecord[] }
    ;(acc[key]!.records as AttendanceRecord[]).push(r)
    return acc
  }, {} as Record<string, { project: AttendanceRecord['shiftAssignment']['project']; records: AttendanceRecord[] }>)

  const filteredKeys = Object.entries(groupedByProject).filter(([code, group]) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return code.toLowerCase().includes(q) || group.project.name.toLowerCase().includes(q)
  })

  return (
    <>
      <TopNav
        userEmail={user?.email || user?.phone}
        userName={user?.fullName}
        role={user?.role}
      />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">📍 Chấm công hôm nay</h1>
            <p className="page-subtitle">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' '}· Tự động refresh mỗi 30s
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="search"
              placeholder="Lọc dự án..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
        </div>

        {isLoading && (
          <div className="card text-center">
            <span className="spinner" /> Đang tải dữ liệu...
          </div>
        )}
        {error && <div className="alert alert-error">⚠️ Không thể tải: {String(error)}</div>}

        {!isLoading && Object.keys(filteredKeys).length === 0 && (
          <div className="card text-center text-muted">
            Hôm nay chưa có check-in nào.
          </div>
        )}

        {filteredKeys.map(([code, { project, records }]) => (
          <div key={code} className="page-card">
            <div className="page-card-head">
              <h3 className="page-card-title">
                🏢 {project.name} <span style={{ color: 'var(--fg-muted)', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{project.code}</span>
              </h3>
              <span className="badge badge-neutral">{records.length} records</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Ca</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Tổng giờ</th>
                    <th>Trạng thái</th>
                    <th style={{ width: 1 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td><code>{r.shiftAssignment.employee.employeeCode}</code></td>
                      <td style={{ fontWeight: 500 }}>{r.shiftAssignment.employee.fullName}</td>
                      <td>
                        <div style={{ fontSize: 13 }}>{r.shiftAssignment.shift.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
                          {r.shiftAssignment.shift.startTime}–{r.shiftAssignment.shift.endTime}
                        </div>
                      </td>
                      <td>{r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{r.checkOutAt ? new Date(r.checkInAt!).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }).replace(r.checkInAt!, r.checkOutAt) : '—'}</td>
                      <td>{r.totalMinutesWorked ? `${Math.round(r.totalMinutesWorked / 60 * 10) / 10}h` : '—'}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[r.status]?.cls ?? 'badge-neutral'}`}>
                          {STATUS_BADGE[r.status]?.label ?? r.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setOverrideTarget(r)}
                        >
                          Sửa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {overrideTarget && (
          <AttendanceOverrideModal
            record={overrideTarget}
            onClose={() => setOverrideTarget(null)}
          />
        )}
      </div>
    </>
  )
}
