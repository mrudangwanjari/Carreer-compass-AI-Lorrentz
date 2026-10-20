/**
 * AuthContext
 * ───────────
 * Wraps JWT auth state. Persists token in localStorage.
 * Exposes: user, isAuthenticated, login(), register(), demoLogin(), logout()
 *
 * Falls back gracefully to mock mode when the backend is unreachable —
 * this keeps the demo working even without the Python server running.
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import {
  apiLogin, apiRegister, apiDemoLogin, apiLogout,
  getToken, type UserOut, type ApiError,
} from '../lib/api'

interface AuthState {
  user:            UserOut | null
  isAuthenticated: boolean
  loading:         boolean
  error:           string | null
}

interface AuthContextValue extends AuthState {
  login:      (email: string, password: string) => Promise<void>
  register:   (name: string, email: string, password: string) => Promise<void>
  demoLogin:  () => Promise<void>
  logout:     () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/* ── Mock fallback user (used when backend is offline) ───────────────────── */
const DEMO_USER: UserOut = {
  id:        'demo',
  full_name: 'Demo User',
  email:     'demo@careercompass.ai',
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,    setUser]    = useState<UserOut | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  /* Restore session from localStorage on mount */
  useEffect(() => {
    const token = getToken()
    if (token) {
      // Lightweight: just mark as logged in with stored token
      // Full validation happens on first protected API call
      const stored = localStorage.getItem('cc_user')
      if (stored) {
        try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
      }
    }
  }, [])

  const _saveUser = (u: UserOut) => {
    setUser(u)
    localStorage.setItem('cc_user', JSON.stringify(u))
  }

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true); setError(null)
    try {
      const r = await apiLogin(email, password)
      _saveUser(r.user)
    } catch (e: unknown) {
      const msg = (e as ApiError).message ?? 'Login failed'
      // Fallback mock for demo
      if (email === 'demo@careercompass.ai') { _saveUser(DEMO_USER); return }
      setError(msg)
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true); setError(null)
    try {
      const r = await apiRegister(name, email, password)
      _saveUser(r.user)
    } catch (e: unknown) {
      setError((e as ApiError).message ?? 'Registration failed')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const demoLogin = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const r = await apiDemoLogin()
      _saveUser(r.user)
    } catch {
      // Backend offline — use mock demo user
      _saveUser(DEMO_USER)
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    apiLogout()
    localStorage.removeItem('cc_user')
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      error,
      login,
      register,
      demoLogin,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
