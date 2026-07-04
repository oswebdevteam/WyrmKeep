// Credential storage for talking to WyrmKeep-API.
//
// IMPORTANT — auth reality of the WyrmKeep API (verified against the Rust source):
//  - The API accepts EITHER an `Authorization: Bearer <jwt>` (HS256, signed with the
//    API's JWT_SECRET) OR an `X-API-Key: <tenant_id>.<raw_key>` header.
//  - There is NO signup/login endpoint for regular users. The only credential-issuing
//    route is `POST /v1/tenants`, which is admin-only and returns a session_token +
//    api_key. So a dashboard user connects by pasting an EXISTING credential.
//  - Clerk (RS256) / Supabase tokens will NOT validate against the API unless the API
//    is reconfigured to trust them (its `decode_token` uses the shared HS256 secret and
//    requires claims sub=<tenant_uuid>, role="tenant"|"admin"). This module is the single
//    boundary where such a provider would later be swapped in.

export type CredentialKind = 'apiKey' | 'jwt' | 'mock'

export interface Credential {
  kind: CredentialKind
  /** For apiKey: "<tenant_id>.<raw_key>". For jwt: the raw token. For mock: "mock". */
  value: string
  /** Best-effort tenant id (parsed from apiKey prefix or jwt sub) for display. */
  tenantId?: string
  /** Human label shown in the UI. */
  label?: string
}

const STORAGE_KEY = 'wyrmkeep.credential'

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function loadCredential(): Credential | null {
  if (!isBrowser()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Credential
    if (parsed && typeof parsed.value === 'string' && parsed.kind) return parsed
    return null
  } catch {
    return null
  }
}

export function saveCredential(cred: Credential): void {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cred))
}

export function clearCredential(): void {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEY)
}

/** Decode the tenant id from a credential without verifying signatures. */
export function deriveTenantId(cred: Credential): string | undefined {
  if (cred.tenantId) return cred.tenantId
  if (cred.kind === 'apiKey') {
    const [tid] = cred.value.split('.')
    return tid || undefined
  }
  if (cred.kind === 'jwt') {
    return decodeJwtSub(cred.value)
  }
  return undefined
}

/** Best-effort, unverified decode of a JWT payload's `sub` claim. */
export function decodeJwtSub(token: string): string | undefined {
  try {
    const payload = token.split('.')[1]
    if (!payload) return undefined
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const claims = JSON.parse(json) as { sub?: string }
    return claims.sub
  } catch {
    return undefined
  }
}

/** Build the auth headers a request should carry for a given credential. */
export function authHeaders(cred: Credential | null): Record<string, string> {
  if (!cred) return {}
  if (cred.kind === 'jwt') return { Authorization: `Bearer ${cred.value}` }
  if (cred.kind === 'apiKey') return { 'X-API-Key': cred.value }
  return {} // mock: no headers needed
}
