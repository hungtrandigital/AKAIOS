'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Project {
  id: string
  code: string
  name: string
  clientName: string
  status: string
  latitude: number
  longitude: number
  geofenceRadiusMeters: number
}

export default function ProjectsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: () => apiFetch<{ data: Project[] }>('/attendance/projects'),
  })

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Dự án</h1>
        <Link href="/attendance">← Quay lại</Link>
      </header>
      {isLoading && <p>Đang tải...</p>}
      {error && <div className="error">{String(error)}</div>}
      {data && (
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên</th>
              <th>Khách hàng</th>
              <th>Geofence (m)</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((p) => (
              <tr key={p.id}>
                <td>{p.code}</td>
                <td>{p.name}</td>
                <td>{p.clientName}</td>
                <td>{p.geofenceRadiusMeters}</td>
                <td>{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
