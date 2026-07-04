// Dashboard chrome: sidebar navigation + topbar with connection status.
import { Link } from '@tanstack/react-router'
import {
  Boxes,
  Database,
  FileCode2,
  LayoutDashboard,
  ScanSearch,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import type { ReactNode } from 'react'
import ThemeToggle from '../../components/ThemeToggle'
import { useAuth } from '../auth/auth'
import { ClerkUserChip } from '../auth/clerk'
import { useHealth } from '../api/hooks'
import { Badge, shortId } from './ui'

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/contracts', label: 'Contracts', icon: FileCode2 },
  { to: '/audits', label: 'Audits', icon: ScanSearch },
  { to: '/findings', label: 'Findings', icon: ShieldCheck },
  { to: '/memory', label: 'Memory', icon: Database },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

function Sidebar() {
  return (
    <aside className="dash-sidebar">
      <Link to="/dashboard" className="dash-brand">
        <span className="dash-mark">W</span>
        WyrmKeep
      </Link>
      <p className="mt-1 pl-0.5 text-xs text-[var(--sea-ink-soft)]">
        Audit engine console
      </p>

      <nav className="dash-nav">
        <span className="dash-nav-section">Workspace</span>
        {NAV.map((item) => {
          const Icon = item.icon
          const exact = 'exact' in item ? item.exact : false
          return (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={exact ? { exact: true } : undefined}
              className="dash-nav-link"
              activeProps={{ className: 'dash-nav-link is-active' }}
            >
              <Icon size={17} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--sea-ink-soft)]">
          <Boxes size={14} />
          Memory-augmented
        </div>
        <p className="mt-1 text-[0.7rem] leading-relaxed text-[var(--sea-ink-soft)]">
          Every audit enriches a cross-engagement exploit-pattern graph.
        </p>
      </div>
    </aside>
  )
}

function Topbar() {
  const { isMock, isConnected, tenantId, disconnect } = useAuth()
  const health = useHealth()

  const healthy = health.data?.status === 'ok'

  return (
    <div className="dash-topbar">
      <Badge tone={isMock ? 'warn' : 'good'}>
        {isMock ? 'Mock data' : 'Live API'}
      </Badge>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--sea-ink-soft)]">
        <span
          className="dash-status-dot"
          style={{
            background: health.isLoading
              ? 'var(--sea-ink-soft)'
              : healthy
                ? '#22c55e'
                : '#ef4444',
          }}
        />
        {health.isLoading
          ? 'checking…'
          : healthy
            ? `API ${health.data?.version ?? ''}`
            : 'API unreachable'}
      </span>

      <div className="ml-auto flex items-center gap-2">
        {isConnected && tenantId && (
          <span className="hidden text-xs text-[var(--sea-ink-soft)] sm:inline">
            tenant <code className="text-[0.72rem]">{shortId(tenantId, 8)}</code>
          </span>
        )}
        {isConnected && (
          <button
            onClick={disconnect}
            className="rounded-lg border border-[var(--line)] bg-[var(--chip-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:text-[var(--sea-ink)]"
          >
            Disconnect
          </button>
        )}
        <ThemeToggle />
        <ClerkUserChip />
      </div>
    </div>
  )
}

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <Topbar />
        {children}
      </main>
    </div>
  )
}
