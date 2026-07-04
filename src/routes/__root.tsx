import {
  HeadContent,
  Navigate,
  Scripts,
  createRootRouteWithContext,
  useRouterState,
} from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { AuthProvider, useAuth } from '../lib/auth/auth'
import { ClerkGate, RequireSignedIn } from '../lib/auth/clerk'
import { DashboardShell } from '../lib/dashboard/Shell'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'WyrmKeep — Audit Console',
      },
      {
        name: 'description',
        content:
          'WyrmKeep dashboard — memory-augmented smart contract audit engine.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(47,134,255,0.22)]">
        <ClerkGate>
          <AuthProvider>
            <AppFrame>{children}</AppFrame>
          </AuthProvider>
        </ClerkGate>
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

// Routes that render without the dashboard chrome (their own full-page layouts).
const BARE_PREFIXES = ['/sign-in', '/sign-up', '/connect']

/**
 * Chooses the frame for the current route:
 *  - Landing / auth / connect  → rendered bare (they bring their own layout)
 *  - Everything else (the app) → Clerk sign-in guard + API-key guard + sidebar shell
 */
function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isBare =
    pathname === '/' || BARE_PREFIXES.some((p) => pathname.startsWith(p))

  if (isBare) return <>{children}</>

  return (
    <RequireSignedIn>
      <RequireConnected>
        <DashboardShell>{children}</DashboardShell>
      </RequireConnected>
    </RequireSignedIn>
  )
}

/** Redirects to /connect when no WyrmKeep credential is present (once hydrated). */
function RequireConnected({ children }: { children: React.ReactNode }) {
  const { isConnected, hydrated } = useAuth()
  if (isConnected) return <>{children}</>
  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 size={18} className="spin text-[var(--sea-ink-soft)]" />
      </div>
    )
  }
  return <Navigate to="/connect" />
}
