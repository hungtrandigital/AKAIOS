'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

interface AttendanceRecord {
  id: string
  status: string
  shiftAssignment: {
    employee: { employeeCode: string; fullName: string }
    project: { name: string }
  }
}

interface Props {
  record: AttendanceRecord | null
  onClose: () => void
}

const STATUS_OPTIONS = [
  { value: 'present', label: 'Đúng giờ' },
  { value: 'late', label: 'Đi trễ' },
  { value: 'early_leave', label: 'Về sớm' },
  { value: 'half_day', label: 'Nửa ngày' },
  { value: 'absent', label: 'Vắng' },
  { value: 'on_leave', label: 'Nghỉ phép' },
  { value: 'holiday', label: 'Lễ' },
]

export function AttendanceOverrideModal({ record, onClose }: Props) {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')
  const [newStatus, setNewStatus] = useState('present')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/attendance/records/${record!.id}/override`, {
        method: 'POST',
        body: JSON.stringify({ reason, newStatus }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      onClose()
    },
    onError: (err) => setError((err as Error).message),
  })

  if (!record) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (reason.length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự')
      return
    }
    mutation.mutate()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">Sửa trạng thái chấm công</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--bg-muted)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontWeight: 600 }}>{record.shiftAssignment.employee.fullName}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--fg-muted)' }}>
                <code>{record.shiftAssignment.employee.employeeCode}</code> · {record.shiftAssignment.project.name}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Trạng thái mới</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Lý do <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="VD: NV báo check-in trễ do kẹt xe, supervisor xác nhận..."
                required
                minLength={10}
                style={{ resize: 'vertical' }}
              />
              <div className="form-help">Bắt buộc, tối thiểu 10 ký tự (sẽ ghi vào audit log)</div>
            </div>

            {error && <div className="alert alert-error">⚠️ {error}</div>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Xác nhận sửa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
