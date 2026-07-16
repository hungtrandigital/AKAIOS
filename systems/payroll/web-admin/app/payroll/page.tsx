'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'

interface PayrollPeriod {
  id: string
  year: number
  month: number
  status: 'open' | 'calculating' | 'calculated' | 'approved' | 'paid' | 'locked'
  totalGross: string | null
  totalNet: string | null
  totalEmployees: number | null
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  open: { label: '📂 Mở', cls: 'badge-info' },
  calculating: { label: '⏳ Tính', cls: 'badge-neutral' },
  calculated: { label: '✅ Tính xong', cls: 'badge-info' },
  approved: { label: '👍 Duyệt', cls: 'badge-success' },
  paid: { label: '💸 Đã trả', cls: 'badge-success' },
  locked: { label: '🔒 Khóa', cls: 'badge-dark' },
}

const formatVNĐ = (amount: string | null) =>
  amount == null ? '—' : new Intl.NumberFormat('vi-VN').format(parseFloat(amount)) + ' ₫'

export default function PayrollPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [error, setError] = useState<string | null>(null)

  const periodsQuery = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => apiFetch<{ data: PayrollPeriod[] }>('/payroll/periods'),
  })

  const openMutation = useMutation({
    mutationFn: () =>
      apiFetch('/payroll/periods', { method: 'POST', body: JSON.stringify({ year, month }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-periods'] })
      setError(null)
    },
    onError: (err) => setError((err as Error).message),
  })

  const calculateMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/payroll/periods/${id}/calculate`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-periods'] }),
  })

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/payroll/periods/${id}/approve`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-periods'] }),
  })

  const exportPeriod = async (id: string) => {
    const data = await apiFetch(`/payroll/periods/${id}/export`)
    const blob = data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bang-luong-${id}.xlsx`
    a.click()
  }

  return (
    <>
      <TopNav userEmail={user?.email || user?.phone} userName={user?.fullName} role={user?.role} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">💰 Bảng lương</h1>
            <p className="page-subtitle">Quản lý kỳ lương tháng, duyệt và xuất Excel</p>
          </div>
        </div>

        <div className="page-card">
          <div className="page-card-head">
            <h3 className="page-card-title">Mở kỳ lương mới</h3>
          </div>
          <div className="page-card-body">
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ minWidth: 140 }}>
                <label className="form-label">Tháng</label>
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>Tháng {m}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ minWidth: 120 }}>
                <label className="form-label">Năm</label>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
                  {[2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => openMutation.mutate()}
                disabled={openMutation.isPending}
              >
                {openMutation.isPending ? 'Đang tạo...' : '📂 Mở kỳ'}
              </button>
            </div>
            {error && <div className="alert alert-error mt-4">⚠️ {error}</div>}
          </div>
        </div>

        <div className="page-card">
          <div className="page-card-head">
            <h3 className="page-card-title">Danh sách kỳ lương</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {periodsQuery.isLoading && (
              <div style={{ padding: 'var(--space-5)', textAlign: 'center' }}>
                <span className="spinner" /> Đang tải...
              </div>
            )}
            {periodsQuery.data && periodsQuery.data.data.length === 0 && (
              <div style={{ padding: 'var(--space-7)', textAlign: 'center', color: 'var(--fg-muted)' }}>
                Chưa có kỳ lương nào. Mở kỳ mới ở trên.
              </div>
            )}
            {periodsQuery.data && periodsQuery.data.data.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Kỳ</th>
                    <th>Trạng thái</th>
                    <th>NV</th>
                    <th style={{ textAlign: 'right' }}>Gross</th>
                    <th style={{ textAlign: 'right' }}>Net</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {periodsQuery.data.data.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>T{p.month}/{p.year}</div>
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[p.status]?.cls ?? 'badge-neutral'}`}>
                          {STATUS_BADGE[p.status]?.label ?? p.status}
                        </span>
                      </td>
                      <td>{p.totalEmployees ?? '—'}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatVNĐ(p.totalGross)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 500, color: 'var(--success)' }}>
                        {formatVNĐ(p.totalNet)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {p.status === 'open' && (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => calculateMutation.mutate(p.id)}
                              disabled={calculateMutation.isPending}
                            >
                              Tính lương
                            </button>
                          )}
                          {p.status === 'calculated' && (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => approveMutation.mutate(p.id)}
                              disabled={approveMutation.isPending}
                            >
                              Duyệt
                            </button>
                          )}
                          {(p.status === 'approved' || p.status === 'paid') && (
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => exportPeriod(p.id)}
                            >
                              📥 Excel
                            </button>
                          )}
                        </div>
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
