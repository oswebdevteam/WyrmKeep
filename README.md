# WyrmKeep

WyrmKeep is a memory-augmented smart contract audit console. The frontend is a
TanStack Start app with Clerk authentication, a dark/blue product landing page,
and a dashboard for contracts, audits, findings, memory datasets, and settings.

## Stack

- TanStack Start + TanStack Router
- React 19
- TanStack Query, Form, and Table
- Clerk for identity
- Tailwind CSS plus scoped CSS for custom visual effects
- Vite
- Vitest

## Getting Started

Install dependencies:

```bash
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Start the app:

```bash
pnpm dev
```

The dev server runs on `http://localhost:3000`.

## Environment

Only `VITE_` variables are exposed to the browser.

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WYRMKEEP_USE_MOCK=false
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxx
```

`VITE_API_BASE_URL` points to the running WyrmKeep API. If unset, the app
defaults to `http://localhost:8000`.

`VITE_WYRMKEEP_USE_MOCK` controls backend mode:

- unset or `true`: use the in-memory mock backend
- `false`: call the live API at `VITE_API_BASE_URL`

`VITE_CLERK_PUBLISHABLE_KEY` enables Clerk. When unset, Clerk is bypassed for
local development and the auth pages show a dev continue path.

## Authentication Flow

Clerk controls who can enter the application. After sign-up or sign-in, users
connect a WyrmKeep API credential on `/connect`.

The WyrmKeep API key or session token is what authenticates backend requests.
Clerk identity and backend API credentials are intentionally separate.

## Useful Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm generate-routes
```

## Project Structure

```text
src/
  components/              Shared app components
  integrations/            TanStack Query/devtools integration
  lib/
    api/                   API client, mock data, hooks, SSE helpers
    auth/                  Clerk gate and WyrmKeep credential state
    dashboard/             Dashboard shell and shared UI primitives
  routes/                  File-based TanStack Router routes
  styles.css               Global theme, dashboard, auth, and landing styles
```

## UI Notes

The public landing/auth pages use a black/blue visual system with custom CSS
for the glassy planes, angled ribbon, and Clerk overrides. The dashboard shares
the same blue/neutral brand palette in both light and dark modes.

Tailwind is available and used throughout route/component markup. Scoped CSS is
kept for shared theme variables, dashboard primitives, Clerk selectors, and the
more bespoke landing-page effects.

## Production

Build the client and SSR output:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```
