'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

interface PayrollPeriod {
  id: string
  year: number
  month: number
  status: 'open' | 'calculating' | 'calculated' | 'approved' | 'paid' | 'locked'
  totalGross: string | null
  totalNet: string | null
  totalEmployees: number | null
}

export default function PayrollPage() {
  const qc = useQueryClient()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // current month

  const periodsQuery = useQuery({
    queryKey: ['payroll-periods'],
    queryFn: () => apiFetch<{ data: PayrollPeriod[] }>('/payroll/periods'),
  })

  const openMutation = useMutation({
    mutationFn: () => apiFetch('/payroll/periods', { method: 'POST', body: JSON.stringify({ year, month }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payroll-periods'] }),
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
    // blob — trigger download
    const blob = data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bang-luong-${id}.xlsx`
    a.click()
  }

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Bảng lương</h1>
        <a href="/attendance">← Quay lại chấm công</a>
      </header>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Mở kỳ lương mới</h3>
        <div className="flex">
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>Tháng {m}</option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>
            {openMutation.isPending ? 'Đang tạo...' : 'Mở kỳ'}
          </button>
        </div>
        {openMutation.error && <div className="error">{(openMutation.error as Error).message}</div>}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Kỳ lương đã mở</h3>
        {periodsQuery.isLoading && <p>Đang tải...</p>}
        {periodsQuery.data && periodsQuery.data.data.length === 0 && (
          <p className="muted">Chưa có kỳ lương nào</p>
        )}
        {periodsQuery.data && periodsQuery.data.data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Kỳ</th>
                <th>Trạng thái</th>
                <th>NV</th>
                <th>Gross</th>
                <th>Net</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {periodsQuery.data.data.map((p) => (
                <tr key={p.id}>
                  <td>T{p.month}/{p.year}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{p.totalEmployees ?? '—'}</td>
                  <td>{p.totalGross ?? '—'}</td>
                  <td>{p.totalNet ?? '—'}</td>
                  <td className="flex">
                    {p.status === 'open' && (
                      <button onClick={() => calculateMutation.mutate(p.id)}>
                        Tính lương
                      </button>
                    )}
                    {p.status === 'calculated' && (
                      <button onClick={() => approveMutation.mutate(p.id)}>
                        Duyệt
                      </button>
                    )}
                    {(p.status === 'approved' || p.status === 'paid') && (
                      <button onClick={() => exportPeriod(p.id)}>
                        Xuất Excel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    open: '#17a2b8',
    calculating: '#6c757d',
    calculated: '#007bff',
    approved: '#28a745',
    paid: '#20c997',
    locked: '#343a40',
  }
  return (
    <span style={{ background: colors[status] ?? '#888', color: 'white', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
      {status}
    </span>
  )
}
