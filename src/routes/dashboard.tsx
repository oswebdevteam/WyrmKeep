import { createFileRoute, Link } from '@tanstack/react-router'
import { Brain, FileCode2, ShieldAlert } from 'lucide-react'
import { useContracts, useFindings, useMemoryStats } from '../lib/api/hooks'
import {
  Badge,
  Card,
  ErrorState,
  PageHeader,
  SectionTitle,
  SeverityBadge,
  Spinner,
  StatCard,
  formatDate,
} from '../lib/dashboard/ui'

export const Route = createFileRoute('/dashboard')({ component: Overview })

function Overview() {
  const stats = useMemoryStats()
  const contracts = useContracts()
  const findings = useFindings()

  const findingItems = findings.data?.items ?? []
  const highCount = findingItems.filter((f) => f.severity === 'High').length

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Self-improving smart contract audit engine with exploit-pattern memory."
        actions={
          <Link to="/contracts" className="demo-button">
            <FileCode2 size={15} /> New audit
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Contracts"
          value={contracts.isLoading ? '—' : (contracts.data?.items.length ?? 0)}
          hint="Uploaded to this tenant"
        />
        <StatCard
          label="Findings"
          value={findings.isLoading ? '—' : findingItems.length}
          hint={`${highCount} high severity`}
        />
        <StatCard
          label="Shared patterns"
          value={
            stats.isLoading
              ? '—'
              : (stats.data?.shared_patterns.nodes.toLocaleString() ?? 0)
          }
          hint={`${stats.data?.shared_patterns.edges.toLocaleString() ?? 0} edges`}
        />
        <StatCard
          label="Private memory"
          value={stats.isLoading ? '—' : (stats.data?.private_dataset.nodes ?? 0)}
          hint="Tenant-scoped nodes"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Recent findings</SectionTitle>
            <Link
              to="/findings"
              className="text-xs font-semibold text-[var(--lagoon-deep)]"
            >
              View all
            </Link>
          </div>
          {findings.isLoading ? (
            <Spinner />
          ) : findings.error ? (
            <ErrorState error={findings.error} />
          ) : findingItems.length === 0 ? (
            <p className="py-6 text-sm text-[var(--sea-ink-soft)]">
              No findings yet. Run an audit to populate the graph.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-[var(--line)]">
              {findingItems.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  <SeverityBadge severity={f.severity} />
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--sea-ink)]">
                    <code className="text-[0.78rem]">{f.vuln_class}</code>{' '}
                    <span className="text-[var(--sea-ink-soft)]">
                      — {f.description}
                    </span>
                  </span>
                  {f.historical_matches > 0 && (
                    <Badge tone="info">{f.historical_matches} matches</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <SectionTitle>Memory datasets</SectionTitle>
          {stats.isLoading ? (
            <Spinner />
          ) : stats.error ? (
            <ErrorState error={stats.error} />
          ) : stats.data ? (
            <ul className="flex flex-col gap-3">
              {[
                { icon: Brain, label: 'Shared patterns', d: stats.data.shared_patterns, tone: 'good' as const },
                { icon: ShieldAlert, label: 'Private', d: stats.data.private_dataset, tone: 'info' as const },
                { icon: FileCode2, label: 'Session', d: stats.data.session_dataset, tone: 'neutral' as const },
              ].map(({ icon: Icon, label, d, tone }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3"
                >
                  <Icon size={18} className="text-[var(--lagoon-deep)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--sea-ink)]">
                      {label}
                    </p>
                    <p className="truncate text-[0.7rem] text-[var(--sea-ink-soft)]">
                      {d.name}
                    </p>
                  </div>
                  <Badge tone={tone}>
                    {d.nodes}n / {d.edges}e
                  </Badge>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-xs text-[var(--sea-ink-soft)]">
            Last audit findings recorded{' '}
            {findingItems[0] ? formatDate(findingItems[0].created_at) : '—'}.
          </p>
        </Card>
      </div>
    </>
  )
}
