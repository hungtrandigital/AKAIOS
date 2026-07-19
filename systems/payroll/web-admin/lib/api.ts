// API client — fetch with auth header.

const TOKEN_KEY = 'ak_access_token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

interface FetchOptions extends RequestInit {
  query?: Record<string, string | number | undefined>
}

export async function apiFetch<T = any>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { query, headers, ...rest } = options
  let url = path.startsWith('/api/') ? path : `/api${path.startsWith('/') ? path : '/' + path}`

  if (query) {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) params.set(k, String(v))
    }
    const qs = params.toString()
    if (qs) url += (url.includes('?') ? '&' : '?') + qs
  }

  const token = getToken()
  const response = await fetch(url, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    credentials: 'include', // send refresh cookie
  })

  if (response.status === 401) {
    // Try refresh
    const refreshed = await tryRefresh()
    if (refreshed) {
      return apiFetch<T>(path, options)
    }
    clearToken()
    if (typeof window !== 'undefined') window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    return response.json()
  }
  return response.blob() as any
}

async function tryRefresh(): Promise<boolean> {
  try {
    const response = await fetch('/api/attendance/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    })
    if (!response.ok) return false
    const data = await response.json()
    if (data.accessToken) {
      setToken(data.accessToken)
      return true
    }
  } catch {
    return false
  }
  return false
}

export async function apiLogin(email: string, password: string) {
  const response = await fetch('/api/attendance/auth/admin-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data?.error?.message ?? 'Login failed')
  }
  return response.json()
}

export async function apiVerifyTwoFactor(totpCode: string) {
  const response = await fetch('/api/attendance/auth/verify-2fa', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ totpCode }),
    credentials: 'include',
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data?.error?.message ?? 'Two-factor verification failed')
  }
  return response.json()
}

export async function apiLogout() {
  await fetch('/api/attendance/auth/logout', { method: 'POST', credentials: 'include' })
  clearToken()
}
