// Shared presentational primitives for the dashboard.
import { useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AlertTriangle, Check, Copy, Loader2 } from 'lucide-react'
import type { FindingSeverity } from '../api/types'

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--sea-ink)]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 max-w-2xl text-sm text-[var(--sea-ink-soft)]">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={`dash-card ${className}`}>{children}</section>
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
      {children}
    </h2>
  )
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="dash-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        {label}
      </p>
      <p className="stat-value mt-2">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{hint}</p>}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'danger'

export function Button({
  variant = 'primary',
  loading = false,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  loading?: boolean
}) {
  const base =
    variant === 'secondary'
      ? 'demo-button demo-button-secondary'
      : variant === 'danger'
        ? 'demo-button demo-button-danger'
        : 'demo-button'
  return (
    <button
      className={`${base} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={15} className="spin" />}
      {children}
    </button>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'good' | 'warn' | 'info'
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] border-[var(--line)]',
    good: 'bg-[rgba(47,134,255,0.12)] text-[var(--lagoon-deep)] border-[rgba(47,134,255,0.28)]',
    warn: 'bg-[rgba(245,158,11,0.14)] text-[#b54708] border-[rgba(245,158,11,0.32)]',
    info: 'bg-[rgba(47,134,255,0.12)] text-[var(--lagoon-deep)] border-[rgba(47,134,255,0.28)]',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: FindingSeverity }) {
  return <span className={`sev-badge sev-${severity}`}>{severity}</span>
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-[var(--sea-ink-soft)]">
      <Loader2 size={16} className="spin" />
      {label ?? 'Loading…'}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="dash-card flex flex-col items-center gap-2 py-12 text-center">
      <p className="text-base font-semibold text-[var(--sea-ink)]">{title}</p>
      {description && (
        <p className="max-w-md text-sm text-[var(--sea-ink-soft)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function ErrorState({ error }: { error: unknown }) {
  const message =
    error instanceof Error ? error.message : 'Something went wrong.'
  return (
    <div className="demo-alert demo-alert-danger flex items-start gap-2">
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-1 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : (label ?? 'Copy')}
    </button>
  )
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return <pre className="dash-code">{children}</pre>
}

export function JsonView({ value }: { value: unknown }) {
  return <CodeBlock>{JSON.stringify(value, null, 2)}</CodeBlock>
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint?: ReactNode
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <label className="block" htmlFor={htmlFor}>
      <span className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-[var(--sea-ink-soft)]">{hint}</span>}
    </label>
  )
}

export function shortId(id: string, n = 8): string {
  return id.length > n ? `${id.slice(0, n)}…` : id
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
