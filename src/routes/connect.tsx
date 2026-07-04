import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { KeyRound, Sparkles } from 'lucide-react'
import { useAuth } from '../lib/auth/auth'
import { RequireSignedIn } from '../lib/auth/clerk'
import { USE_MOCK } from '../lib/api/config'
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

function Connect() {
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
    <AuthShell
      title="Connect your workspace"
      subtitle="You're signed in. Now paste your WyrmKeep API credential to reach the backend."
    >
      <div className="grid w-full gap-4">
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4"
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
        </Card>

        {USE_MOCK && (
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
        )}
      </div>
    </AuthShell>
  )
}
