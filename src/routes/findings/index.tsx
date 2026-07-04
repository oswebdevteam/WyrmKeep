import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'
import { GitBranch, Loader2, X } from 'lucide-react'
import { useAuth } from '../../lib/auth/auth'
import { useCausalChain, useFindings } from '../../lib/api/hooks'
import type { Finding } from '../../lib/api/types'
import { DataTable } from '../../lib/dashboard/DataTable'
import { CausalChainGraph } from '../../lib/dashboard/CausalChainGraph'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  JsonView,
  PageHeader,
  SectionTitle,
  SeverityBadge,
  Spinner,
  formatDate,
} from '../../lib/dashboard/ui'

export const Route = createFileRoute('/findings/')({ component: Findings })

const col = createColumnHelper<Finding>()
const SEV_ORDER = { High: 0, Medium: 1, Low: 2, Informational: 3 }

function Findings() {
  const { isConnected } = useAuth()
  const findings = useFindings()
  const [selected, setSelected] = useState<Finding | null>(null)

  const columns = useMemo(
    () => [
      col.accessor('severity', {
        header: 'Severity',
        sortingFn: (a, b) =>
          SEV_ORDER[a.original.severity] - SEV_ORDER[b.original.severity],
        cell: (c) => <SeverityBadge severity={c.getValue()} />,
      }),
      col.accessor('vuln_class', {
        header: 'Class',
        cell: (c) => <code className="text-[0.78rem]">{c.getValue()}</code>,
      }),
      col.accessor('description', {
        header: 'Description',
        enableSorting: false,
        cell: (c) => (
          <span className="line-clamp-2 max-w-md text-[var(--sea-ink-soft)]">
            {c.getValue()}
          </span>
        ),
      }),
      col.accessor('historical_matches', {
        header: 'Matches',
        cell: (c) =>
          c.getValue() > 0 ? (
            <Badge tone="info">{c.getValue()}</Badge>
          ) : (
            <span className="text-[var(--sea-ink-soft)]">0</span>
          ),
      }),
      col.accessor('created_at', {
        header: 'Found',
        cell: (c) => (
          <span className="text-[var(--sea-ink-soft)]">
            {formatDate(c.getValue())}
          </span>
        ),
      }),
    ],
    [],
  )

  const items = findings.data?.items ?? []

  return (
    <>
      <PageHeader
        title="Findings"
        subtitle="Vulnerabilities with historical exploit-pattern matches. Open one to trace its causal chain."
      />

      {!isConnected ? (
        <EmptyState title="Not connected" description="Connect a workspace first." />
      ) : findings.isLoading ? (
        <Spinner label="Loading findings…" />
      ) : findings.error ? (
        <ErrorState error={findings.error} />
      ) : items.length === 0 ? (
        <EmptyState
          title="No findings yet"
          description="Run an audit on a contract to generate findings."
        />
      ) : (
        <>
          <DataTable data={items} columns={columns} onRowClick={setSelected} />
          {findings.hasNextPage && (
            <div className="mt-4">
              <Button
                variant="secondary"
                loading={findings.isFetchingNextPage}
                onClick={() => findings.fetchNextPage()}
              >
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {selected && (
        <FindingDetail finding={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function FindingDetail({
  finding,
  onClose,
}: {
  finding: Finding
  onClose: () => void
}) {
  // The list already carries causal_chain inline, but we also demonstrate the
  // dedicated GET /findings/:id/chain endpoint (falls back to the inline chain).
  const chainQuery = useCausalChain(finding.id, finding.causal_chain != null)
  const chain = chainQuery.data ?? finding.causal_chain

  return (
    <div className="mt-6">
      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} />
            <code className="text-sm">{finding.vuln_class}</code>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] p-1.5 text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <p className="mb-4 text-sm text-[var(--sea-ink)]">{finding.description}</p>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionTitle>Affected functions</SectionTitle>
            <JsonView value={finding.affected_functions} />
            <p className="mt-3 text-xs text-[var(--sea-ink-soft)]">
              {finding.historical_matches} structurally similar historical
              audit(s) matched this pattern.
            </p>
          </div>

          <div>
            <SectionTitle>
              <span className="inline-flex items-center gap-1.5">
                <GitBranch size={14} /> Causal chain
              </span>
            </SectionTitle>
            {chainQuery.isLoading ? (
              <p className="flex items-center gap-2 py-4 text-sm text-[var(--sea-ink-soft)]">
                <Loader2 size={14} className="spin" /> Loading chain…
              </p>
            ) : chain ? (
              <CausalChainGraph chain={chain} />
            ) : (
              <p className="py-4 text-sm text-[var(--sea-ink-soft)]">
                No causal chain available for this finding.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
