import { useEffect, useRef, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  CircleDot,
  Database,
  FileSearch,
  Loader2,
  Radio,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { useAuth } from '../../lib/auth/auth'
import { streamAudit } from '../../lib/api/sse'
import { useReport } from '../../lib/api/hooks'
import { queryKeys } from '../../lib/api/hooks'
import { updateTrackedAuditStatus } from '../../lib/api/audit-store'
import type { AuditEvent } from '../../lib/api/types'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
  StatCard,
  shortId,
} from '../../lib/dashboard/ui'

export const Route = createFileRoute('/audits/$auditId')({ component: AuditDetail })

interface TimelineItem {
  event: AuditEvent
  at: number
}

function eventMeta(e: AuditEvent): { icon: typeof CircleDot; label: string; detail: string } {
  switch (e.type) {
    case 'status_update':
      return { icon: CircleDot, label: e.stage, detail: e.message }
    case 'slither_complete':
      return { icon: FileSearch, label: 'Slither complete', detail: `${e.finding_count} findings` }
    case 'pattern_extracted':
      return {
        icon: Boxes,
        label: 'Pattern extracted',
        detail: `${e.node_count} nodes / ${e.edge_count} edges`,
      }
    case 'memory_ingested':
      return { icon: Database, label: 'Memory ingested', detail: e.dataset }
    case 'cognify_complete':
      return { icon: BrainCircuit, label: 'Cognify complete', detail: `${e.elapsed_ms} ms` }
    case 'recall_complete':
      return { icon: ShieldCheck, label: 'Recall complete', detail: `${e.match_count} historical matches` }
    case 'report_ready':
      return { icon: CheckCircle2, label: 'Report ready', detail: 'Audit finished' }
    case 'error':
      return { icon: XCircle, label: 'Error', detail: e.message }
  }
}

function AuditDetail() {
  const { auditId } = Route.useParams()
  const { isConnected, tenantId } = useAuth()
  const qc = useQueryClient()
  const [items, setItems] = useState<Array<TimelineItem>>([])
  const [state, setState] = useState<'streaming' | 'done' | 'error'>('streaming')
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isConnected || startedRef.current) return
    startedRef.current = true

    const stop = streamAudit(auditId, {
      onEvent: (event) => {
        setItems((prev) => [...prev, { event, at: Date.now() }])
        if (event.type === 'error') {
          setState('error')
          updateTrackedAuditStatus(auditId, 'failed')
        }
        if (event.type === 'report_ready') {
          setState('done')
          updateTrackedAuditStatus(auditId, 'complete')
        }
      },
      onError: () => setState('error'),
      onDone: () => {
        setState((s) => (s === 'error' ? s : 'done'))
        // Report + findings are now available on the API.
        qc.invalidateQueries({ queryKey: queryKeys.findings(tenantId) })
      },
    })
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditId, isConnected])

  const report = useReport(auditId, state === 'done')

  if (!isConnected) {
    return <EmptyState title="Not connected" description="Connect a workspace first." />
  }

  return (
    <>
      <Link
        to="/audits"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--sea-ink-soft)]"
      >
        <ArrowLeft size={15} /> Audits
      </Link>

      <PageHeader
        title="Audit run"
        subtitle={
          <code className="text-[0.75rem]">{shortId(auditId, 14)}</code>
        }
        actions={
          state === 'streaming' ? (
            <Badge tone="info">
              <Radio size={12} className="spin" /> streaming
            </Badge>
          ) : state === 'done' ? (
            <Badge tone="good">complete</Badge>
          ) : (
            <Badge tone="warn">error</Badge>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle>Pipeline</SectionTitle>
          <ol className="relative flex flex-col">
            {items.length === 0 && (
              <li className="flex items-center gap-2 py-3 text-sm text-[var(--sea-ink-soft)]">
                <Loader2 size={15} className="spin" /> Waiting for the first
                event…
              </li>
            )}
            {items.map((item, i) => {
              const meta = eventMeta(item.event)
              const Icon = meta.icon
              const isError = item.event.type === 'error'
              return (
                <li key={i} className="flex gap-3 py-2.5">
                  <div className="flex flex-col items-center">
                    <span
                      className="grid h-7 w-7 place-items-center rounded-full border"
                      style={{
                        borderColor: isError ? '#ef4444' : 'var(--lagoon-deep)',
                        color: isError ? '#ef4444' : 'var(--lagoon-deep)',
                        background: 'var(--surface-strong)',
                      }}
                    >
                      <Icon size={15} />
                    </span>
                    {i < items.length - 1 && (
                      <span className="my-1 w-px flex-1 bg-[var(--line)]" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-semibold capitalize text-[var(--sea-ink)]">
                      {meta.label}
                    </p>
                    <p className="text-xs text-[var(--sea-ink-soft)]">
                      {meta.detail}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle>Report</SectionTitle>
            {state === 'streaming' ? (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                The report is generated when the pipeline completes.
              </p>
            ) : report.isLoading ? (
              <p className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
                <Loader2 size={15} className="spin" /> Loading report…
              </p>
            ) : report.error ? (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Report not available yet.
              </p>
            ) : report.data ? (
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  label="Slither findings"
                  value={report.data.slither_findings_count}
                />
                <StatCard
                  label="Memory matches"
                  value={report.data.memory_matches_count}
                />
              </div>
            ) : null}
          </Card>

          <Card>
            <SectionTitle>Next</SectionTitle>
            <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
              Findings from this audit appear in the findings view with their
              causal chains.
            </p>
            <Link to="/findings" className="demo-button demo-button-secondary">
              <ShieldCheck size={15} /> View findings
            </Link>
          </Card>
        </div>
      </div>
    </>
  )
}
