'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

interface AttendanceRecord {
  id: string
  status: string
  checkInAt: string | null
  checkOutAt: string | null
  shiftAssignment: {
    employee: { employeeCode: string; fullName: string }
    project: { code: string; name: string }
  }
}

interface Props {
  record: AttendanceRecord | null
  onClose: () => void
}

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
    if (reason.length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự')
      return
    }
    mutation.mutate()
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{ maxWidth: 480, width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0 }}>Override chấm công</h3>
        <p className="muted">
          {record.shiftAssignment.employee.fullName} ({record.shiftAssignment.employee.employeeCode}) ·{' '}
          {record.shiftAssignment.project.name} ·{' '}
          Hiện tại: <strong>{record.status}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label>Trạng thái mới</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="present">Present (đúng giờ)</option>
              <option value="late">Late (đi trễ)</option>
              <option value="early_leave">Early leave (về sớm)</option>
              <option value="half_day">Half day (nửa ngày)</option>
              <option value="absent">Absent (vắng)</option>
              <option value="on_leave">On leave (nghỉ phép)</option>
              <option value="holiday">Holiday (nghỉ lễ)</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label>Lý do override (bắt buộc, ≥ 10 ký tự)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="VD: NV báo check-in trễ do kẹt xe, supervisor xác nhận..."
              required
              minLength={10}
            />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="flex" style={{ justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="danger" disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
