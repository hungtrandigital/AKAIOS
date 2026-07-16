'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'

interface Project {
  id: string
  code: string
  name: string
  clientName: string
  address: string
  status: string
  latitude: string
  longitude: string
  geofenceRadiusMeters: number
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  active: { label: '🟢 Đang chạy', cls: 'badge-success' },
  paused: { label: '⏸️ Tạm dừng', cls: 'badge-warning' },
  ended: { label: '⏹️ Kết thúc', cls: 'badge-neutral' },
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['projects', search],
    queryFn: () => apiFetch<{ data: Project[] }>('/attendance/projects'),
  })

  const projects = (data?.data ?? []).filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || p.clientName.toLowerCase().includes(q)
  })

  return (
    <>
      <TopNav userEmail={user?.email || user?.phone} userName={user?.fullName} role={user?.role} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🏢 Dự án</h1>
            <p className="page-subtitle">Quản lý {data?.data?.length ?? 0} dự án của AKAIUNSAN</p>
          </div>
          <input
            type="search"
            placeholder="🔍 Tìm kiếm dự án..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 240 }}
          />
        </div>

        {isLoading && (
          <div className="card text-center">
            <span className="spinner" /> Đang tải...
          </div>
        )}
        {error && <div className="alert alert-error">⚠️ {String(error)}</div>}

        <div className="page-card">
          {projects.length === 0 ? (
            <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--fg-muted)' }}>
              {search ? `Không có dự án nào khớp "${search}"` : 'Chưa có dự án nào'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên dự án</th>
                    <th>Khách hàng</th>
                    <th>Địa chỉ</th>
                    <th style={{ textAlign: 'right' }}>Geofence</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <code>{p.code}</code>
                      </td>
                      <td style={{ fontWeight: 500 }}>{p.name}</td>
                      <td>
                        <span className="badge badge-info">{p.clientName}</span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--fg-muted)', maxWidth: 240 }}>{p.address}</td>
                      <td style={{ textAlign: 'right' }}>
                        <code style={{ fontSize: 12 }}>{p.geofenceRadiusMeters}m</code>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[p.status]?.cls ?? 'badge-neutral'}`}>
                          {STATUS_BADGE[p.status]?.label ?? p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
