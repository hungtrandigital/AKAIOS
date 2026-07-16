/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      // Proxy API calls to attendance-api and payroll-api
      {
        source: '/api/attendance/:path*',
        destination: process.env.ATTENDANCE_API_URL
          ? `${process.env.ATTENDANCE_API_URL}/api/:path*`
          : 'http://localhost:3000/api/attendance/:path*',
      },
      {
        source: '/api/payroll/:path*',
        destination: process.env.PAYROLL_API_URL
          ? `${process.env.PAYROLL_API_URL}/api/:path*`
          : 'http://localhost:3001/api/payroll/:path*',
      },
    ]
  },
}

module.exports = nextConfig
