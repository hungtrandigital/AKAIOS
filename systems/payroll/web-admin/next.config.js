/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const attendanceBase = process.env.ATTENDANCE_API_URL ?? 'http://localhost:3000'
    const payrollBase = process.env.PAYROLL_API_URL ?? 'http://localhost:3001'
    return [
      // Proxy /api/attendance/* → attendance-api (without extra /api prefix)
      {
        source: '/api/attendance/:path*',
        destination: `${attendanceBase}/:path*`,
      },
      // Proxy /api/payroll/* → payroll-api (without extra /api prefix)
      {
        source: '/api/payroll/:path*',
        destination: `${payrollBase}/:path*`,
      },
      // Internal API (service-to-service) — direct passthrough
      {
        source: '/api/internal/:path*',
        destination: `${attendanceBase}/internal/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
