import { useEffect, useMemo, useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Info, ScanSearch } from 'lucide-react'
import { useAuth } from '../../lib/auth/auth'
import { useFindings } from '../../lib/api/hooks'
import { loadTrackedAudits } from '../../lib/api/audit-store'
import type { TrackedAudit } from '../../lib/api/audit-store'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Spinner,
  formatDate,
  shortId,
} from '../../lib/dashboard/ui'

export const Route = createFileRoute('/audits/')({ component: Audits })

interface AuditRow {
  audit_id: string
  contract_name?: string
  status?: string
  created_at?: string
  finding_count: number
  tracked: boolean
}

function statusTone(status?: string): 'good' | 'warn' | 'info' | 'neutral' {
  if (status === 'complete') return 'good'
  if (status === 'failed') return 'warn'
  if (status === 'running' || status === 'queued') return 'info'
  return 'neutral'
}

function Audits() {
  const { isConnected } = useAuth()
  const findings = useFindings()
  const navigate = useNavigate()
  const [tracked, setTracked] = useState<Array<TrackedAudit>>([])

  // localStorage is client-only — read after mount to avoid hydration mismatch.
  useEffect(() => setTracked(loadTrackedAudits()), [])

  const rows = useMemo<Array<AuditRow>>(() => {
    const byId = new Map<string, AuditRow>()
    for (const t of tracked) {
      byId.set(t.audit_id, {
        audit_id: t.audit_id,
        contract_name: t.contract_name,
        status: t.status,
        created_at: t.created_at,
        finding_count: 0,
        tracked: true,
      })
    }
    for (const f of findings.data?.items ?? []) {
      const row = byId.get(f.audit_id)
      if (row) {
        row.finding_count += 1
      } else {
        byId.set(f.audit_id, {
          audit_id: f.audit_id,
          finding_count: 1,
          tracked: false,
        })
      }
    }
    return [...byId.values()].sort((a, b) =>
      (b.created_at ?? '').localeCompare(a.created_at ?? ''),
    )
  }, [tracked, findings.data])

  return (
    <>
      <PageHeader
        title="Audits"
        subtitle="Memory-augmented analysis runs. Open one to watch its live pipeline or read the report."
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 text-xs text-[var(--sea-ink-soft)]">
        <Info size={15} className="mt-0.5 flex-shrink-0" />
        <span>
          The API has no list-audits endpoint. This view merges audits started in
          this browser with audit IDs seen in findings.
        </span>
      </div>

      {!isConnected ? (
        <EmptyState title="Not connected" description="Connect a workspace first." />
      ) : findings.isLoading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title="No audits yet"
          description="Open a contract and start an audit to see it here."
          action={
            <Link to="/contracts" className="demo-button">
              <ScanSearch size={15} /> Go to contracts
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((r) => (
            <Card key={r.audit_id} className="!p-4">
              <button
                type="button"
                className="flex w-full flex-wrap items-center gap-3 text-left"
                onClick={() =>
                  navigate({
                    to: '/audits/$auditId',
                    params: { auditId: r.audit_id },
                  })
                }
              >
                <ScanSearch size={18} className="text-[var(--lagoon-deep)]" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--sea-ink)]">
                    {r.contract_name ?? 'Audit'}{' '}
                    <code className="text-[0.72rem] text-[var(--sea-ink-soft)]">
                      {shortId(r.audit_id, 8)}
                    </code>
                  </p>
                  <p className="text-xs text-[var(--sea-ink-soft)]">
                    {r.created_at ? formatDate(r.created_at) : 'from findings'} ·{' '}
                    {r.finding_count} finding{r.finding_count === 1 ? '' : 's'}
                  </p>
                </div>
                {r.status && <Badge tone={statusTone(r.status)}>{r.status}</Badge>}
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
