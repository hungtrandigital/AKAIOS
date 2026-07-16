'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  useEffect(() => {
    if (!getToken()) {
      router.replace('/login')
      return
    }
    // Try to detect role from JWT to redirect appropriately
    // For MVP, all roles land on /attendance (realtime view)
    router.replace('/attendance')
  }, [router])
  return null
}
