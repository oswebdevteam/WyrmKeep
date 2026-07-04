// Centered, chrome-light layout for the auth + connect pages (no sidebar).
import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="auth-shell">
      <header className="auth-header">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-mark">W</span>
          <span>WyrmKeep</span>
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>

        <div className="auth-card-shell">{children}</div>

        {footer && <p className="auth-footer-note">{footer}</p>}
      </main>
    </div>
  )
}

/** Shown on /sign-in and /sign-up when Clerk isn't configured (mock/dev). */
export function DevAuthBypass() {
  return (
    <div className="dash-card w-full text-center">
      <p className="text-sm text-[var(--sea-ink-soft)]">
        Clerk isn't configured (no <code className="text-[0.72rem]">VITE_CLERK_PUBLISHABLE_KEY</code>).
        Sign-in is bypassed in dev — continue to connect your workspace.
      </p>
      <Link to="/connect" className="demo-button mt-4 inline-flex">
        Continue <ArrowRight size={15} />
      </Link>
    </div>
  )
}
