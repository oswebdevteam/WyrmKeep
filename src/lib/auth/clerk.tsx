// Optional Clerk integration — the identity gate that sits IN FRONT of the WyrmKeep
// API-key connection. Clerk decides *who reaches the app*; the API key (see auth.tsx)
// decides *what talks to the backend*.
//
// Clerk is enabled only when VITE_CLERK_PUBLISHABLE_KEY is set. Without it (mock/dev),
// every export here is a transparent pass-through so the app runs with no Clerk account.
//
// Note: `isClerkEnabled` is a build-time constant, so the conditional early-returns below
// never toggle between renders — hook order stays stable.

import { Navigate } from '@tanstack/react-router'
import {
  ClerkProvider,
  UserButton,
  useAuth as useClerkAuth,
  useUser,
} from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export const CLERK_PUBLISHABLE_KEY = import.meta.env
  .VITE_CLERK_PUBLISHABLE_KEY as string | undefined

export const isClerkEnabled =
  typeof CLERK_PUBLISHABLE_KEY === 'string' && CLERK_PUBLISHABLE_KEY.length > 0

/** Wraps the tree in ClerkProvider when enabled; pass-through otherwise. */
export function ClerkGate({ children }: { children: ReactNode }) {
  if (!isClerkEnabled) return <>{children}</>
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY!}>
      {children}
    </ClerkProvider>
  )
}

/** Renders children only for a signed-in user; redirects to /sign-in otherwise. */
export function RequireSignedIn({ children }: { children: ReactNode }) {
  if (!isClerkEnabled) return <>{children}</>
  return <ClerkSignedInGate>{children}</ClerkSignedInGate>
}

function ClerkSignedInGate({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useClerkAuth()
  if (!isLoaded) return <FullPageLoader />
  if (!isSignedIn) return <Navigate to="/sign-in/$" />
  return <>{children}</>
}

/** Topbar identity chip — email + Clerk UserButton (sign out). Null when Clerk is off. */
export function ClerkUserChip() {
  if (!isClerkEnabled) return null
  return <ClerkUserChipInner />
}

function ClerkUserChipInner() {
  const { user } = useUser()
  return (
    <div className="flex items-center gap-2">
      {user?.primaryEmailAddress?.emailAddress && (
        <span className="hidden text-xs text-[var(--sea-ink-soft)] sm:inline">
          {user.primaryEmailAddress.emailAddress}
        </span>
      )}
      <UserButton
        appearance={{ elements: { avatarBox: { width: 28, height: 28 } } }}
      />
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <div className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
        <Loader2 size={16} className="spin" /> Loading…
      </div>
    </div>
  )
}
