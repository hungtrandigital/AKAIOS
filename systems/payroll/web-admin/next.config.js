/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const attendanceBase = process.env.ATTENDANCE_API_URL ?? 'http://localhost:3000'
    const payrollBase = process.env.PAYROLL_API_URL ?? 'http://localhost:3001'
    return [
      // === Auth (specific paths first) ===
      { source: '/api/attendance/auth/:path*', destination: `${attendanceBase}/v1/auth/:path*` },
      { source: '/api/payroll/auth/:path*', destination: `${payrollBase}/v1/auth/:path*` },

      // === Business routes (most specific first to avoid catch-all matching) ===
      // Direct paths (preferred, no /attendance prefix)
      { source: '/api/payroll/:path*', destination: `${payrollBase}/v1/payroll/:path*` },
      { source: '/api/employees/:path*', destination: `${attendanceBase}/v1/employees/:path*` },
      { source: '/api/projects/:path*', destination: `${attendanceBase}/v1/projects/:path*` },
      { source: '/api/reports/:path*', destination: `${attendanceBase}/v1/reports/:path*` },

      // Aliases for back-compat (web-admin pages use /api/attendance/X style)
      { source: '/api/attendance/employees/:path*', destination: `${attendanceBase}/v1/employees/:path*` },
      { source: '/api/attendance/projects/:path*', destination: `${attendanceBase}/v1/projects/:path*` },
      { source: '/api/attendance/reports/:path*', destination: `${attendanceBase}/v1/reports/:path*` },
      { source: '/api/attendance/shifts/:path*', destination: `${attendanceBase}/v1/shifts/:path*` },

      // Catch-all for remaining /api/attendance/* (records, check-in, check-out, etc.)
      { source: '/api/attendance/:path*', destination: `${attendanceBase}/v1/attendance/:path*` },

    ]
  },
}

module.exports = nextConfig
