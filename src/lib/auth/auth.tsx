// Provider-agnostic auth boundary for the dashboard.
//
// Today this holds the WyrmKeep-API credential (API key / session JWT / mock). It is
// deliberately the ONLY place that knows how the user is authenticated, so a Clerk or
// Supabase gate can later wrap or replace it without touching the rest of the app.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { USE_MOCK } from '../api/config'
import {
  clearCredential,
  deriveTenantId,
  loadCredential,
  saveCredential,
} from './credential'
import type { Credential } from './credential'

interface AuthContextValue {
  credential: Credential | null
  isConnected: boolean
  /** True once the stored credential has been read from localStorage on the client. */
  hydrated: boolean
  isMock: boolean
  tenantId?: string
  connect: (cred: Credential) => void
  disconnect: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_CREDENTIAL: Credential = {
  kind: 'mock',
  value: 'mock',
  label: 'Mock workspace',
  tenantId: '550e8400-e29b-41d4-a716-446655440000',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed with the mock credential in mock mode so the initial (server + client) render
  // is already connected — no "Not connected" flash and no hydration mismatch. In live
  // mode we start null and hydrate from localStorage after mount.
  const [credential, setCredential] = useState<Credential | null>(
    USE_MOCK ? MOCK_CREDENTIAL : null,
  )
  const [hydrated, setHydrated] = useState(false)

  // Hydrate the real stored credential on the client (persist mock on first visit).
  useEffect(() => {
    const stored = loadCredential()
    if (stored) {
      setCredential(stored)
    } else if (USE_MOCK) {
      saveCredential(MOCK_CREDENTIAL)
    }
    setHydrated(true)
  }, [])

  const connect = useCallback((cred: Credential) => {
    const withTenant: Credential = { ...cred, tenantId: deriveTenantId(cred) }
    saveCredential(withTenant)
    setCredential(withTenant)
  }, [])

  const disconnect = useCallback(() => {
    clearCredential()
    setCredential(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      credential,
      isConnected: credential != null,
      hydrated,
      isMock: USE_MOCK,
      tenantId: credential ? deriveTenantId(credential) : undefined,
      connect,
      disconnect,
    }),
    [credential, hydrated, connect, disconnect],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
