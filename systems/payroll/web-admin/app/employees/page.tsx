'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  baseSalary: string
  salaryType: string
  status: string
  user: { phone: string; email: string | null }
}

const formatVNĐ = (amount: string) => new Intl.NumberFormat('vi-VN').format(parseFloat(amount)) + ' ₫'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')

  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', status],
    queryFn: () =>
      apiFetch<{ data: Employee[] }>('/attendance/employees', {
        query: status === 'all' ? {} : { status },
      }),
  })

  const employees = (data?.data ?? []).filter((e) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      e.employeeCode.toLowerCase().includes(q) ||
      e.fullName.toLowerCase().includes(q) ||
      e.user.phone.includes(q)
    )
  })

  return (
    <>
      <TopNav userEmail={user?.email || user?.phone} userName={user?.fullName} role={user?.role} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">👥 Nhân viên</h1>
            <p className="page-subtitle">Danh sách {data?.data?.length ?? 0} nhân viên</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <input
              type="search"
              placeholder="🔍 Tìm theo mã, tên, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 240 }}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="all">Tất cả</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {isLoading && (
          <div className="card text-center">
            <span className="spinner" /> Đang tải...
          </div>
        )}
        {error && <div className="alert alert-error">⚠️ {String(error)}</div>}

        <div className="page-card">
          <div className="page-card-head">
            <h3 className="page-card-title">{employees.length} nhân viên</h3>
            {search && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>
                Xóa bộ lọc
              </button>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            {employees.length === 0 ? (
              <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--fg-muted)' }}>
                Không có nhân viên nào
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Số điện thoại</th>
                    <th>Lương CB</th>
                    <th>Loại</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td><code>{e.employeeCode}</code></td>
                      <td style={{ fontWeight: 500 }}>{e.fullName}</td>
                      <td><code style={{ fontSize: 12 }}>{e.user.phone}</code></td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatVNĐ(e.baseSalary)}</td>
                      <td>
                        <span className={`badge ${e.salaryType === 'monthly' ? 'badge-info' : 'badge-neutral'}`}>
                          {e.salaryType === 'monthly' ? 'Theo tháng' : 'Theo giờ'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${e.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                          {e.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
