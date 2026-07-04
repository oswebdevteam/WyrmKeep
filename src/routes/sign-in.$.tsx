import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ClerkFailed,
  ClerkLoaded,
  ClerkLoading,
  SignIn,
} from '@clerk/tanstack-react-start'
import { Loader2 } from 'lucide-react'
import { isClerkEnabled } from '../lib/auth/clerk'
import { AuthShell, DevAuthBypass } from '../lib/dashboard/AuthShell'

// Catch-all route (/sign-in/$) so Clerk's multi-step + SSO sub-paths resolve.
export const Route = createFileRoute('/sign-in/$')({ component: SignInPage })

function SignInPage() {
  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your WyrmKeep audit workspace."
      footer={
        <>
          New here?{' '}
          <Link to="/sign-up/$" className="font-semibold text-[var(--lagoon-deep)]">
            Create an account
          </Link>
        </>
      }
    >
      {isClerkEnabled ? (
        <>
          <ClerkLoading>
            <AuthLoading label="Loading sign-in..." />
          </ClerkLoading>
          <ClerkFailed>
            <AuthProblem />
          </ClerkFailed>
          <ClerkLoaded>
            <SignIn
              path="/sign-in"
              signUpUrl="/sign-up"
              forceRedirectUrl="/connect"
              appearance={authAppearance}
            />
          </ClerkLoaded>
        </>
      ) : (
        <DevAuthBypass />
      )}
    </AuthShell>
  )
}

const authAppearance = {
  elements: {
    rootBox: 'auth-clerk-root',
    card: 'auth-clerk-card',
  },
  variables: {
    colorBackground: '#07101b',
    colorInputBackground: '#0d1724',
    colorInputText: '#f7fbff',
    colorPrimary: '#2f86ff',
    colorText: '#f7fbff',
    colorTextSecondary: '#8f9db1',
    borderRadius: '0.9rem',
  },
}

function AuthLoading({ label }: { label: string }) {
  return (
    <div className="auth-status-card">
      <Loader2 size={18} className="spin" />
      <span>{label}</span>
    </div>
  )
}

function AuthProblem() {
  return (
    <div className="auth-status-card auth-status-card-danger">
      <p>
        Clerk could not load the sign-in form. Check that your publishable key is
        available to Vite as <code>VITE_CLERK_PUBLISHABLE_KEY</code>, then reload.
      </p>
    </div>
  )
}
