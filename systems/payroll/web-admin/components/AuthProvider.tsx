'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getToken, setToken, clearToken } from '@/lib/api'

export interface AuthUser {
  userId: string
  email?: string
  phone: string
  role: string
  employeeCode?: string
  fullName?: string
}

interface AuthContextValue {
  token: string | null
  user: AuthUser | null
  loading: boolean
  loginSuccess: (accessToken: string, user: AuthUser) => void
  logout: () => void
  // Hydrate from /v1/auth/me
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = getToken()
    if (t) {
      setTokenState(t)
      // Try fetching /me (fire-and-forget)
      fetch('/api/attendance/auth/me', {
        headers: { Authorization: `Bearer ${t}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data) setUser(data)
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const loginSuccess = (accessToken: string, u: AuthUser) => {
    setToken(accessToken)
    setTokenState(accessToken)
    setUser(u)
  }

  const logout = () => {
    clearToken()
    setTokenState(null)
    setUser(null)
  }

  const refresh = async () => {
    const t = getToken()
    if (!t) return
    const r = await fetch('/api/attendance/auth/me', {
      headers: { Authorization: `Bearer ${t}` },
    })
    if (r.ok) {
      const data = await r.json()
      setUser(data)
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, loginSuccess, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
