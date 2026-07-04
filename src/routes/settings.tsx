import { createFileRoute, Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { KeyRound, ShieldPlus } from 'lucide-react'
import { useAuth } from '../lib/auth/auth'
import { USE_MOCK, API_BASE_URL } from '../lib/api/config'
import { useCreateTenant, useMe } from '../lib/api/hooks'
import {
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  SectionTitle,
  Spinner,
  formatDate,
} from '../lib/dashboard/ui'

export const Route = createFileRoute('/settings')({ component: Settings })

function Settings() {
  const { isConnected, isMock, credential, tenantId, disconnect } = useAuth()
  const me = useMe()

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Workspace connection, tenant identity, and admin operations."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Connection */}
        <Card>
          <SectionTitle>Connection</SectionTitle>
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Mode">
              <Badge tone={isMock ? 'warn' : 'good'}>
                {isMock ? 'Mock data' : 'Live API'}
              </Badge>
            </Row>
            <Row label="API base URL">
              <code className="text-[0.72rem]">{API_BASE_URL}</code>
            </Row>
            <Row label="Credential">
              <span className="text-[var(--sea-ink-soft)]">
                {credential?.label ?? credential?.kind ?? 'none'}
              </span>
            </Row>
            <Row label="Tenant ID">
              <code className="break-all text-[0.72rem]">{tenantId ?? '—'}</code>
            </Row>
          </dl>
          <div className="mt-4 flex gap-2">
            <Link to="/connect" className="demo-button demo-button-secondary">
              <KeyRound size={15} /> Manage credential
            </Link>
            {isConnected && (
              <Button variant="secondary" onClick={disconnect}>
                Disconnect
              </Button>
            )}
          </div>
        </Card>

        {/* Tenant identity (GET /v1/tenants/me) */}
        <Card>
          <SectionTitle>Tenant (GET /v1/tenants/me)</SectionTitle>
          {!isConnected ? (
            <EmptyState title="Not connected" />
          ) : me.isLoading ? (
            <Spinner />
          ) : me.error ? (
            <ErrorState error={me.error} />
          ) : me.data ? (
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Name">
                <span className="font-semibold text-[var(--sea-ink)]">
                  {me.data.data.name}
                </span>
              </Row>
              <Row label="Private dataset">
                <code className="break-all text-[0.7rem]">
                  {me.data.data.cognee_dataset_private}
                </code>
              </Row>
              <Row label="Session dataset">
                <code className="break-all text-[0.7rem]">
                  {me.data.data.cognee_dataset_session}
                </code>
              </Row>
              <Row label="Created">
                <span className="text-[var(--sea-ink-soft)]">
                  {formatDate(me.data.data.created_at)}
                </span>
              </Row>
            </dl>
          ) : null}
        </Card>
      </div>

      <div className="mt-4">
        <AdminCreateTenant />
      </div>
    </>
  )
}

function AdminCreateTenant() {
  const createTenant = useCreateTenant()

  const form = useForm({
    defaultValues: { name: '', raw_api_key: '' },
    onSubmit: async ({ value }) => {
      await createTenant.mutateAsync({
        name: value.name.trim(),
        raw_api_key: value.raw_api_key.trim(),
      })
    },
  })

  const created = createTenant.data

  return (
    <Card>
      <SectionTitle>
        <span className="inline-flex items-center gap-1.5">
          <ShieldPlus size={14} /> Create tenant (admin · POST /v1/tenants)
        </span>
      </SectionTitle>
      <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
        This is the only credential-issuing endpoint and requires an{' '}
        <strong>admin</strong> token. It returns a new tenant's API key and
        session token — save them; the raw key is not recoverable.
        {USE_MOCK && ' (Mock mode returns a synthetic credential.)'}
      </p>

      {created ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3">
            <p className="mb-2 text-sm font-semibold text-[var(--sea-ink)]">
              {created.data.name} created
            </p>
            <CredRow label="Tenant ID" value={created.data.id} />
            <CredRow
              label="API key"
              value={`${created.data.id}.${created.api_key}`}
            />
            <CredRow label="Session token" value={created.session_token} />
          </div>
          <Button variant="secondary" onClick={() => createTenant.reset()}>
            Create another
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim() ? undefined : 'Name is required',
            }}
          >
            {(field) => (
              <Field label="Tenant name">
                <input
                  className="demo-input"
                  placeholder="Acme Security"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>
          <form.Field
            name="raw_api_key"
            validators={{
              onChange: ({ value }) =>
                value.trim().length >= 8 ? undefined : 'Min 8 characters',
            }}
          >
            {(field) => (
              <Field label="Raw API key">
                <input
                  className="demo-input"
                  placeholder="a-strong-secret-key"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </Field>
            )}
          </form.Field>

          <div className="sm:col-span-2">
            {createTenant.error && <ErrorState error={createTenant.error} />}
            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  loading={isSubmitting}
                  disabled={!canSubmit}
                  className="mt-1"
                >
                  <ShieldPlus size={15} /> Create tenant
                </Button>
              )}
            </form.Subscribe>
          </div>
        </form>
      )}
    </Card>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--sea-ink-soft)]">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="min-w-0">
        <p className="text-[0.68rem] uppercase tracking-wide text-[var(--sea-ink-soft)]">
          {label}
        </p>
        <code className="block truncate text-[0.72rem]">{value}</code>
      </div>
      <CopyButton value={value} />
    </div>
  )
}
