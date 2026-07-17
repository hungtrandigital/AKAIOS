'use client'

// RBAC management page (system_admin only).
// Lets admin view and modify role → permission mappings.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiFetch } from '@/lib/api'
import { TopNav } from '@/components/TopNav'
import { useAuth } from '@/components/AuthProvider'

interface Permission {
  id: string
  code: string
  module: string
  action: string
  description: string | null
}

interface RoleWithPerms {
  role: string
  permissions: Permission[]
}

const ROLE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  employee:     { label: '👷 Nhân viên',    color: 'badge-neutral', description: 'Chỉ xem chấm công của mình' },
  supervisor:   { label: '👷 Giám sát',     color: 'badge-info',    description: 'Quản lý team + chấm công + báo cáo' },
  bo_admin:     { label: '📋 BO Admin',     color: 'badge-success', description: 'Vận hành + payroll đầy đủ' },
  system_admin: { label: '👑 Sysadmin',     color: 'badge-dark',    description: 'Toàn quyền (CEO + tech admin)' },
}

export default function RbacPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const rolesQuery = useQuery({
    queryKey: ['rbac-roles'],
    queryFn: () => apiFetch<{ data: RoleWithPerms[] }>('/attendance/v1/rbac/roles'),
  })

  const updateMutation = useMutation({
    mutationFn: (vars: { role: string; permissionCodes: string[] }) =>
      apiFetch(`/attendance/v1/rbac/roles/${vars.role}`, {
        method: 'PUT',
        body: JSON.stringify({ permissionCodes: vars.permissionCodes }),
      }),
    onSuccess: (data: any) => {
      setSuccess(`Đã cập nhật role ${data.role} với ${data.count} permissions`)
      setError(null)
      qc.invalidateQueries({ queryKey: ['rbac-roles'] })
      setEditingRole(null)
      setTimeout(() => setSuccess(null), 3000)
    },
    onError: (err) => setError((err as Error).message),
  })

  const startEdit = (role: RoleWithPerms) => {
    setEditingRole(role.role)
    setSelectedPerms(new Set(role.permissions.map((p) => p.code)))
    setError(null)
  }

  const togglePerm = (code: string) => {
    const next = new Set(selectedPerms)
    if (next.has(code)) next.delete(code)
    else next.add(code)
    setSelectedPerms(next)
  }

  // Group permissions by module for display
  const groupedPerms = (perms: Permission[]) => {
    return perms.reduce((acc, p) => {
      if (!acc[p.module]) acc[p.module] = []
      acc[p.module].push(p)
      return acc
    }, {} as Record<string, Permission[]>)
  }

  return (
    <>
      <TopNav userEmail={user?.email || user?.phone} userName={user?.fullName} role={user?.role} />

      <div className="page">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔐 RBAC — Quản lý phân quyền</h1>
            <p className="page-subtitle">Cấu hình role → permission mapping (sysadmin only)</p>
          </div>
        </div>

        {success && <div className="alert alert-success mb-4">✓ {success}</div>}
        {error && <div className="alert alert-error mb-4">⚠️ {error}</div>}

        {user?.role !== 'system_admin' && (
          <div className="alert alert-error">
            ⚠️ Bạn cần role <code>system_admin</code> để truy cập trang này. Hiện tại: <code>{user?.role}</code>
          </div>
        )}

        {rolesQuery.data && user?.role === 'system_admin' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
            {rolesQuery.data.data.map((r) => {
              const meta = ROLE_LABELS[r.role] ?? { label: r.role, color: 'badge-neutral', description: '' }
              const isEditing = editingRole === r.role
              const grouped = groupedPerms(r.permissions)

              return (
                <div key={r.role} className="page-card">
                  <div className="page-card-head">
                    <h3 className="page-card-title">
                      <span className={`badge ${meta.color}`} style={{ marginRight: 8 }}>{meta.label}</span>
                      <code style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{r.role}</code>
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{r.permissions.length} permissions</div>
                  </div>
                  <div className="page-card-body">
                    <p className="muted text-sm mb-3">{meta.description}</p>

                    {Object.entries(grouped).map(([mod, perms]) => (
                      <details key={mod} open style={{ marginBottom: 8 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                          {mod} <span className="muted text-xs">({perms.length})</span>
                        </summary>
                        <div style={{ marginTop: 6, paddingLeft: 12 }}>
                          {isEditing && perms.map((p) => (
                            <label
                              key={p.code}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '2px 0' }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPerms.has(p.code)}
                                onChange={() => togglePerm(p.code)}
                                style={{ width: 'auto' }}
                              />
                              <code style={{ fontSize: 11 }}>{p.code}</code>
                              {p.description && <span className="muted" style={{ fontSize: 11 }}>— {p.description}</span>}
                            </label>
                          ))}
                          {!isEditing && perms.slice(0, 5).map((p) => (
                            <div key={p.code} style={{ fontSize: 11, padding: '1px 0' }}>
                              <code style={{ color: 'var(--fg-muted)' }}>{p.code}</code>
                            </div>
                          ))}
                          {!isEditing && perms.length > 5 && (
                            <div className="muted" style={{ fontSize: 11, padding: '2px 0' }}>
                              +{perms.length - 5} more…
                            </div>
                          )}
                        </div>
                      </details>
                    ))}

                    <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      {isEditing ? (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingRole(null)}>Hủy</button>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={updateMutation.isPending}
                            onClick={() =>
                              updateMutation.mutate({
                                role: r.role,
                                permissionCodes: Array.from(selectedPerms),
                              })
                            }
                          >
                            {updateMutation.isPending ? 'Đang lưu...' : `Lưu (${selectedPerms.size})`}
                          </button>
                        </>
                      ) : (
                        <button className="btn btn-secondary btn-sm" onClick={() => startEdit(r)}>
                          ✏️ Sửa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
