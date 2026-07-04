import { useState } from 'react'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Play } from 'lucide-react'
import { useAuth } from '../../lib/auth/auth'
import { useContract, useCreateAudit } from '../../lib/api/hooks'
import {
  Badge,
  Button,
  Card,
  CodeBlock,
  CopyButton,
  EmptyState,
  ErrorState,
  PageHeader,
  SectionTitle,
  Spinner,
  formatDate,
} from '../../lib/dashboard/ui'

export const Route = createFileRoute('/contracts/$contractId')({
  component: ContractDetail,
})

const AVAILABLE_TAGS = [
  'reentrancy',
  'access-control',
  'arithmetic',
  'unchecked-calls',
  'front-running',
  'dos',
  'solidity',
]

function ContractDetail() {
  const { contractId } = Route.useParams()
  const { isConnected } = useAuth()
  const contract = useContract(contractId)
  const createAudit = useCreateAudit()
  const navigate = useNavigate()
  const [tags, setTags] = useState<Array<string>>(['reentrancy', 'access-control', 'solidity'])

  if (!isConnected) {
    return <EmptyState title="Not connected" description="Connect a workspace first." />
  }
  if (contract.isLoading) return <Spinner label="Loading contract…" />
  if (contract.error) return <ErrorState error={contract.error} />
  if (!contract.data) return <EmptyState title="Contract not found" />

  const c = contract.data

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const runAudit = async () => {
    const res = await createAudit.mutateAsync({
      contract_id: c.id,
      contract_name: c.name,
      vuln_class_tags: tags,
    })
    navigate({ to: '/audits/$auditId', params: { auditId: res.audit_id } })
  }

  return (
    <>
      <Link
        to="/contracts"
        className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--sea-ink-soft)]"
      >
        <ArrowLeft size={15} /> Contracts
      </Link>

      <PageHeader
        title={c.name}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge>{c.language}</Badge>
            <span className="text-xs">uploaded {formatDate(c.uploaded_at)}</span>
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Source</SectionTitle>
            <CopyButton value={c.source_code} label="Copy source" />
          </div>
          <CodeBlock>{c.source_code}</CodeBlock>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <SectionTitle>Run audit</SectionTitle>
            <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
              Select vulnerability classes to focus the analysis, then start a
              memory-augmented audit.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((t) => {
                const active = tags.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      active
                        ? 'border-[var(--lagoon-deep)] bg-[rgba(47,134,255,0.14)] text-[var(--lagoon-deep)]'
                        : 'border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
            {createAudit.error && <ErrorState error={createAudit.error} />}
            <Button
              onClick={runAudit}
              loading={createAudit.isPending}
              disabled={tags.length === 0}
            >
              <Play size={15} /> Start audit
            </Button>
          </Card>

          <Card>
            <SectionTitle>Metadata</SectionTitle>
            <dl className="flex flex-col gap-2 text-sm">
              <Row label="Contract ID" value={c.id} mono />
              <Row label="Tenant ID" value={c.tenant_id} mono />
              <Row label="Source hash" value={c.source_hash} mono />
            </dl>
          </Card>
        </div>
      </div>
    </>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--sea-ink-soft)]">{label}</dt>
      <dd className={mono ? 'font-mono text-[0.72rem]' : ''}>
        <span className="break-all">{value}</span>
      </dd>
    </div>
  )
}
