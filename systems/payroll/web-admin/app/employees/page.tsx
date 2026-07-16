'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'

interface Employee {
  id: string
  employeeCode: string
  fullName: string
  baseSalary: string
  salaryType: string
  status: string
  user: { phone: string }
}

export default function EmployeesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: () => apiFetch<{ data: Employee[] }>('/attendance/employees'),
  })

  return (
    <div className="container">
      <header className="flex-between" style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Nhân viên</h1>
        <Link href="/attendance">← Quay lại</Link>
      </header>
      {isLoading && <p>Đang tải...</p>}
      {error && <div className="error">{String(error)}</div>}
      {data && (
        <table>
          <thead>
            <tr>
              <th>Mã NV</th>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Lương CB</th>
              <th>Loại</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((e) => (
              <tr key={e.id}>
                <td>{e.employeeCode}</td>
                <td>{e.fullName}</td>
                <td>{e.user.phone}</td>
                <td>{e.baseSalary} ₫</td>
                <td>{e.salaryType}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
