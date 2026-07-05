import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import {
  ChevronDown,
  ChevronUp,
  KeyRound,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/tanstack-react-start'
import { useAuth } from '../lib/auth/auth'
import { isClerkEnabled, RequireSignedIn } from '../lib/auth/clerk'
import { USE_MOCK } from '../lib/api/config'
import { provisionTenant } from '../lib/api/provision-tenant'
import type { CredentialKind } from '../lib/auth/credential'
import { AuthShell } from '../lib/dashboard/AuthShell'
import { Card, Field } from '../lib/dashboard/ui'

export const Route = createFileRoute('/connect')({ component: ConnectPage })

function ConnectPage() {
  return (
    <RequireSignedIn>
      <Connect />
    </RequireSignedIn>
  )
}

type ProvisionState =
  | { status: 'idle' }
  | { status: 'provisioning' }
  | { status: 'success' }
  | { status: 'error'; message: string }

function Connect() {
  const { connect, isConnected } = useAuth()
  const navigate = useNavigate()
  const [provisionState, setProvisionState] = useState<ProvisionState>({
    status: 'idle',
  })
  const [manualOpen, setManualOpen] = useState(false)
  const attemptedRef = useRef(false)

  // Get Clerk user info for tenant naming (null when Clerk is off)
  const clerkUser = isClerkEnabled ? useClerkUser() : null

  // If already connected (returning user or mock mode), go straight to dashboard.
  useEffect(() => {
    if (isConnected) {
      navigate({ to: '/dashboard' })
    }
  }, [isConnected, navigate])

  // Auto-provision on mount (once) when not already connected and not in mock mode.
  const doProvision = useCallback(async () => {
    if (attemptedRef.current) return
    attemptedRef.current = true
    setProvisionState({ status: 'provisioning' })

    try {
      // Generate a cryptographically random API key
      const rawKey = generateApiKey()

      // Derive the tenant name from the Clerk user profile
      const tenantName =
        clerkUser?.fullName ??
        clerkUser?.email ??
        'Workspace'

      const result = await provisionTenant({
        data: { name: tenantName, rawApiKey: rawKey },
      })

      // Auto-connect with the returned API key
      connect({
        kind: 'apiKey',
        value: `${result.tenantId}.${result.apiKey}`,
        label: result.tenantName,
        tenantId: result.tenantId,
      })

      setProvisionState({ status: 'success' })

      // Brief pause so the user sees "Connected!" before redirect
      setTimeout(() => navigate({ to: '/dashboard' }), 600)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Provisioning failed'
      setProvisionState({ status: 'error', message })
    }
  }, [clerkUser, connect, navigate])

  // Trigger auto-provisioning once when the component mounts (skip in mock mode
  // and when already connected — those cases redirect above).
  useEffect(() => {
    if (!isConnected && !USE_MOCK && provisionState.status === 'idle') {
      doProvision()
    }
  }, [isConnected, provisionState.status, doProvision])

  // --- Provisioning UI ---
  if (provisionState.status === 'provisioning') {
    return (
      <AuthShell
        title="Setting up your workspace"
        subtitle="Creating your WyrmKeep workspace — this only takes a moment."
      >
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2
              size={28}
              className="spin text-[var(--lagoon-deep)]"
            />
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Provisioning tenant…
            </p>
          </div>
        </Card>
      </AuthShell>
    )
  }

  if (provisionState.status === 'success') {
    return (
      <AuthShell title="Connected!" subtitle="Redirecting to your dashboard…">
        <Card>
          <div className="flex flex-col items-center gap-3 py-6">
            <Zap size={28} className="text-[var(--lagoon-deep)]" />
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Workspace ready — redirecting…
            </p>
          </div>
        </Card>
      </AuthShell>
    )
  }

  if (provisionState.status === 'error') {
    return (
      <AuthShell
        title="Workspace setup"
        subtitle="We couldn't auto-provision your workspace. You can retry or connect manually."
      >
        <div className="grid w-full gap-4">
          {/* Error + retry */}
          <Card>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#b42318]">
                {provisionState.message}
              </p>
              <button
                type="button"
                className="demo-button"
                onClick={() => {
                  attemptedRef.current = false
                  setProvisionState({ status: 'idle' })
                }}
              >
                <Zap size={15} /> Retry
              </button>
            </div>
          </Card>

          {/* Collapsible manual fallback */}
          <ManualConnectSection
            open={manualOpen}
            onToggle={() => setManualOpen((o) => !o)}
          />

          {USE_MOCK && <MockModeCard />}
        </div>
      </AuthShell>
    )
  }

  // status === 'idle' — should be brief; auto-provision fires immediately.
  // Show a loading state or the manual form if mock mode.
  if (USE_MOCK) {
    return (
      <AuthShell
        title="Connect your workspace"
        subtitle="You're signed in. Now connect to your WyrmKeep backend."
      >
        <div className="grid w-full gap-4">
          <MockModeCard />
          <ManualConnectSection
            open={manualOpen}
            onToggle={() => setManualOpen((o) => !o)}
          />
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Setting up your workspace"
      subtitle="Preparing your workspace…"
    >
      <Card>
        <div className="flex flex-col items-center gap-3 py-6">
          <Loader2 size={28} className="spin text-[var(--lagoon-deep)]" />
        </div>
      </Card>
    </AuthShell>
  )
}

function useClerkUser() {
  const { user } = useUser()
  return user
    ? {
        fullName: user.fullName ?? undefined,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
      }
    : null
}

function ManualConnectSection({
  open,
  onToggle,
}: {
  open: boolean
  onToggle: () => void
}) {
  const { connect, isConnected, disconnect } = useAuth()
  const navigate = useNavigate()

  const form = useForm({
    defaultValues: { kind: 'apiKey' as CredentialKind, value: '' },
    onSubmit: async ({ value }) => {
      connect({
        kind: value.kind,
        value: value.value.trim(),
        label: value.kind === 'apiKey' ? 'API key' : 'Session token',
      })
      navigate({ to: '/dashboard' })
    },
  })

  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-sm font-semibold text-[var(--sea-ink)]"
      >
        <span className="inline-flex items-center gap-1.5">
          <KeyRound size={14} /> Advanced: connect manually
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="mt-4 flex flex-col gap-4"
        >
          <form.Field name="kind">
            {(field) => (
              <Field label="Credential type">
                <select
                  className="demo-select"
                  value={field.state.value}
                  onChange={(e) =>
                    field.handleChange(e.target.value as CredentialKind)
                  }
                >
                  <option value="apiKey">API key (X-API-Key)</option>
                  <option value="jwt">Session token (Bearer JWT)</option>
                </select>
              </Field>
            )}
          </form.Field>

          <form.Field
            name="value"
            validators={{
              onChange: ({ value }) =>
                value.trim().length < 8 ? 'Enter a valid credential' : undefined,
            }}
          >
            {(field) => (
              <Field
                label={
                  form.state.values.kind === 'apiKey'
                    ? 'API key'
                    : 'Session token'
                }
                hint={
                  form.state.values.kind === 'apiKey'
                    ? 'Format: <tenant_id>.<raw_key>'
                    : 'A JWT signed with the API JWT_SECRET (from POST /v1/tenants).'
                }
              >
                <input
                  className="demo-input"
                  placeholder={
                    form.state.values.kind === 'apiKey'
                      ? '550e8400-…..your-secret-key'
                      : 'eyJhbGciOiJIUzI1NiIs…'
                  }
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.length > 0 && (
                  <span className="mt-1 block text-xs text-[#b42318]">
                    {String(field.state.meta.errors[0])}
                  </span>
                )}
              </Field>
            )}
          </form.Field>

          <div className="flex items-center gap-2">
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <button
                  type="submit"
                  className="demo-button"
                  disabled={!canSubmit || isSubmitting}
                >
                  <KeyRound size={15} /> Connect
                </button>
              )}
            </form.Subscribe>
            {isConnected && (
              <button
                type="button"
                className="demo-button demo-button-secondary"
                onClick={disconnect}
              >
                Disconnect
              </button>
            )}
          </div>
        </form>
      )}
    </Card>
  )
}


function MockModeCard() {
  const { connect } = useAuth()
  const navigate = useNavigate()

  return (
    <Card>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--sea-ink)]">
        <Sparkles size={16} className="text-[var(--lagoon-deep)]" />
        Mock mode is active
      </h2>
      <>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          No backend required — explore the dashboard against an in-memory mock.
        </p>
        <button
          type="button"
          className="demo-button demo-button-secondary mt-4"
          onClick={() => {
            connect({ kind: 'mock', value: 'mock', label: 'Mock workspace' })
            navigate({ to: '/dashboard' })
          }}
        >
          Use mock workspace
        </button>
        <p className="mt-4 text-xs text-[var(--sea-ink-soft)]">
          Go live with <code className="text-[0.72rem]">VITE_API_BASE_URL</code> +{' '}
          <code className="text-[0.72rem]">VITE_WYRMKEEP_USE_MOCK=false</code>.
        </p>
      </>
    </Card>
  )
}

function generateApiKey(): string {
  // 32 bytes → 64 hex chars, cryptographically random
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback (shouldn't happen in modern browsers)
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('')
}
