import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { Database, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/auth/auth'
import {
  useMemoryStats,
  usePruneMemory,
  useRecallMemory,
} from '../lib/api/hooks'
import type { MemoryMatch, MemoryScope } from '../lib/api/types'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  PageHeader,
  SectionTitle,
  Spinner,
  StatCard,
} from '../lib/dashboard/ui'

export const Route = createFileRoute('/memory')({ component: Memory })

function Memory() {
  const { isConnected } = useAuth()
  const stats = useMemoryStats()
  const recall = useRecallMemory()
  const prune = usePruneMemory()
  const [results, setResults] = useState<Array<MemoryMatch> | null>(null)
  const [confirmPrune, setConfirmPrune] = useState(false)

  const form = useForm({
    defaultValues: {
      query: '',
      top_k: 5,
      scope: 'shared' as MemoryScope,
    },
    onSubmit: async ({ value }) => {
      const res = await recall.mutateAsync({
        query: value.query.trim(),
        top_k: Number(value.top_k),
        scope: value.scope,
      })
      setResults(res.data)
    },
  })

  if (!isConnected) {
    return (
      <>
        <PageHeader title="Memory" />
        <EmptyState title="Not connected" description="Connect a workspace first." />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Memory"
        subtitle="Query and manage the exploit-pattern knowledge graph across shared, private, and session datasets."
      />

      {/* Stats */}
      {stats.isLoading ? (
        <Spinner />
      ) : stats.error ? (
        <ErrorState error={stats.error} />
      ) : stats.data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Shared patterns"
            value={stats.data.shared_patterns.nodes.toLocaleString()}
            hint={`${stats.data.shared_patterns.edges.toLocaleString()} edges · persists forever`}
          />
          <StatCard
            label="Private"
            value={stats.data.private_dataset.nodes.toLocaleString()}
            hint={`${stats.data.private_dataset.edges.toLocaleString()} edges · tenant-scoped`}
          />
          <StatCard
            label="Session"
            value={stats.data.session_dataset.nodes.toLocaleString()}
            hint={`${stats.data.session_dataset.edges.toLocaleString()} edges`}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* Recall */}
        <Card>
          <SectionTitle>
            <span className="inline-flex items-center gap-1.5">
              <Search size={14} /> Recall patterns
            </span>
          </SectionTitle>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="flex flex-col gap-4"
          >
            <form.Field
              name="query"
              validators={{
                onChange: ({ value }) =>
                  value.trim() ? undefined : 'Enter a query',
              }}
            >
              {(field) => (
                <Field label="Query">
                  <input
                    className="demo-input"
                    placeholder="reentrancy pattern in withdraw function"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors[0] && (
                    <span className="mt-1 block text-xs text-[#b42318]">
                      {String(field.state.meta.errors[0])}
                    </span>
                  )}
                </Field>
              )}
            </form.Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <form.Field name="scope">
                {(field) => (
                  <Field label="Scope">
                    <select
                      className="demo-select"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(e.target.value as MemoryScope)
                      }
                    >
                      <option value="shared">Shared patterns</option>
                      <option value="private">Private (tenant)</option>
                      <option value="session">Session</option>
                    </select>
                  </Field>
                )}
              </form.Field>

              <form.Field name="top_k">
                {(field) => (
                  <Field label="Top K">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="demo-input"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                  </Field>
                )}
              </form.Field>
            </div>

            {recall.error && <ErrorState error={recall.error} />}

            <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" loading={isSubmitting} disabled={!canSubmit}>
                  <Search size={15} /> Recall
                </Button>
              )}
            </form.Subscribe>
          </form>

          {results && (
            <div className="mt-5">
              <SectionTitle>{results.length} matches</SectionTitle>
              {results.length === 0 ? (
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  No matches for that query.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {results.map((m) => (
                    <li
                      key={m.id}
                      className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3"
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <code className="text-[0.68rem] text-[var(--sea-ink-soft)]">
                          {m.id.slice(0, 8)}…
                        </code>
                        <Badge tone="good">score {m.score.toFixed(2)}</Badge>
                      </div>
                      <pre className="whitespace-pre-wrap text-[0.8rem] text-[var(--sea-ink)]">
                        {m.content}
                      </pre>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Card>

        {/* Prune / lifecycle */}
        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <Database size={14} /> Lifecycle
              </span>
            </SectionTitle>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Cognee's memory lifecycle lets you <strong>forget the
              client-specific code</strong> while the abstracted exploit-pattern
              layer persists. Pruning wipes this tenant's private + session
              datasets (GDPR); shared patterns are untouched.
            </p>
          </Card>

          <Card className="border-[rgba(220,38,38,0.3)]">
            <SectionTitle>Danger zone</SectionTitle>
            {prune.isSuccess ? (
              <p className="text-sm text-[var(--palm)]">
                Private + session memory pruned.
              </p>
            ) : (
              <>
                <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
                  Permanently delete private and session memory for this tenant.
                </p>
                {prune.error && <ErrorState error={prune.error} />}
                {!confirmPrune ? (
                  <Button variant="danger" onClick={() => setConfirmPrune(true)}>
                    <Trash2 size={15} /> Prune memory
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      loading={prune.isPending}
                      onClick={() => prune.mutate()}
                    >
                      Confirm prune
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setConfirmPrune(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
