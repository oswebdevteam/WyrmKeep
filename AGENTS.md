<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Project Context

This project was scaffolded as a **blank TanStack Start (React)** starter and has since
been built out into the **WyrmKeep dashboard** — a frontend console for the
`WyrmKeep-API` smart-contract audit engine. It exercises the full requested TanStack
stack in a real app: Start, Router, Query, Table, and Form, wired up via the TanStack
CLI and TanStack Intent. See **[WyrmKeep Dashboard](#wyrmkeep-dashboard)** below for the
app itself; the sections immediately following document how the base project was created.

> The CLI's `demo.*` example routes/files were removed once the dashboard replaced them.

### How this project was created

Scaffolded with the TanStack CLI (exact command used):

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind --add-ons tanstack-query,table,form
```

> **Renamed after scaffolding:** the project was created as `my-tanstack-app` and
> subsequently renamed to **`wyrmkeep`** — the directory, `package.json` `name`, and
> `.cta.json` `projectName` all now read `wyrmkeep`. The command above is preserved
> verbatim as the one that was actually run. To reproduce under the new name directly,
> substitute `wyrmkeep` for `my-tanstack-app` in the command.

Notes on the command:
- `--tailwind` is **deprecated and ignored** by the current CLI — Tailwind is always
  enabled in Start scaffolds. It is harmless to pass but does nothing.
- `--agent` wires up this `AGENTS.md` and the TanStack Intent skill mappings.
- The CLI resolved to `@tanstack/cli@0.69.5` and already ran an initial Intent setup
  ("TanStack Intent configured") during scaffolding.

Follow-up TanStack Intent commands that were run after scaffolding:

```bash
npx @tanstack/intent@latest install   # resolved to @tanstack/intent@0.3.5; wrote the intent-skills block above
npx @tanstack/intent@latest list      # enumerates locally available skills (see below)
```

To load a skill's guidance before making a change, e.g.:

```bash
pnpm dlx @tanstack/intent@latest load @tanstack/router-core#router-core/search-params
```

### Stack & integrations

| Concern            | Library                                                        |
| ------------------ | ------------------------------------------------------------- |
| Framework / SSR    | TanStack Start (`@tanstack/react-start`)                       |
| Routing            | TanStack Router (`@tanstack/react-router`, file-based)         |
| Data fetching      | TanStack Query (`@tanstack/react-query` + SSR integration)    |
| Tables             | TanStack Table (`@tanstack/react-table`)                       |
| Forms              | TanStack Form (`@tanstack/react-form`)                         |
| Agent skills       | TanStack Intent (`@tanstack/intent`)                           |
| Scaffolding        | TanStack CLI (`@tanstack/cli`)                                 |
| Styling            | Tailwind CSS v4 (`@tailwindcss/vite`)                          |
| Validation         | Zod v4                                                        |
| Build / dev server | Vite 8                                                        |
| Tests              | Vitest + Testing Library + jsdom                              |
| Package manager    | **pnpm** (10.x)                                               |

Where each library is demonstrated:
- **Router / Start** — file routes under `src/routes/`, root shell in
  `src/routes/__root.tsx`, router factory in `src/router.tsx`.
- **Query** — `src/integrations/tanstack-query/` (root provider + devtools) and the
  demo route `src/routes/demo/tanstack-query.tsx`. The QueryClient is injected into
  the router context (`MyRouterContext`) and SSR-hydrated via
  `@tanstack/react-router-ssr-query`.
- **Table** — `src/routes/demo/table.tsx` with data in `src/data/demo-table-data.ts`.
- **Form** — `src/routes/demo/form.simple.tsx` and `src/routes/demo/form.address.tsx`,
  with shared form hooks in `src/hooks/demo.form*.ts` and field components in
  `src/components/demo.FormComponents.tsx`.

The `demo.*` / `demo/` files are the CLI's built-in add-on examples. They are safe to
delete once you no longer need the reference — remove the files and let
`tsr generate` regenerate `src/routeTree.gen.ts` (it runs automatically on `dev`/`build`).

### Scripts

```bash
pnpm dev              # start dev server on http://localhost:3000
pnpm build            # production build (also regenerates the route tree)
pnpm preview          # preview the production build
pnpm test             # run Vitest once (blank starter ships no test files yet — exits non-zero until you add some)
pnpm generate-routes  # regenerate src/routeTree.gen.ts via `tsr generate`
```

### Environment variables

The blank starter requires **no environment variables** to run `dev`, `build`, or
`test` — it works out of the box.

When you add your own config, follow TanStack Start's execution-model rules:
- Variables prefixed with `VITE_` are inlined into the **client** bundle — never put
  secrets there.
- Un-prefixed variables (read via `process.env` inside `createServerFn` /
  `.server.ts` code) stay **server-only**.
- Vite auto-loads `.env` / `.env.local` files. The generated `.gitignore` ignores
  `.env` but **not** `.env.local` — add `.env*.local` to `.gitignore` before putting
  secrets in a local env file.
Load the `@tanstack/start-client-core#start-core/execution-model` Intent skill before
introducing env-dependent server code.

### Deployment

- Default target is a Node server build (`vite build` → `dist/`, entry
  `dist/server/server.js`); `pnpm preview` serves it locally.
- TanStack Start supports Cloudflare Workers, Netlify, Vercel, Node/Docker, Bun, and
  Railway, plus SPA mode / static prerendering / per-route SSR toggles. Before wiring
  a specific provider, load
  `@tanstack/start-client-core#start-core/deployment` for the current pattern.

### Key architectural decisions

- Kept the **generated project structure unchanged** — file-based routing under
  `src/routes/`, integrations isolated under `src/integrations/`, the `#/*` import
  alias mapping to `./src/*`.
- QueryClient is provided through **router context** (dependency injection) rather than
  a bare React provider, so loaders and components share one client and SSR hydration
  works. See `src/router.tsx` and `src/integrations/tanstack-query/root-provider.tsx`.
- Devtools (Router + Query) are mounted in `__root.tsx` and **stripped from production
  builds** by `@tanstack/devtools-vite` (confirmed in build logs).

### Known gotchas

- `--tailwind` CLI flag is deprecated/ignored (see above).
- `tanstack intent list` emits two harmless warnings/notices: (1) two installed
  variants of `@tanstack/devtools-event-client` (dedupes to the newer 0.5.0); (2)
  `intent.skills` allowlist is not set, so all discovered skill sources are surfaced —
  a future Intent version may require an explicit allowlist.
- `src/routeTree.gen.ts` is **generated** — do not edit it by hand; run
  `pnpm generate-routes` (or just `dev`/`build`) after adding/removing routes.
- CLI telemetry is on by default; disable with `tanstack telemetry disable` or
  `TANSTACK_CLI_TELEMETRY_DISABLED=1` if desired.

### Next steps

1. `pnpm dev` → the WyrmKeep dashboard (see below). Runs in mock mode out of the box.
2. Before any library-specific change, run `pnpm dlx @tanstack/intent@latest list`
   and load the matching skill (per the Skill Loading section above) instead of
   guessing the current API.
3. Point at the live API and iterate on real data (see the dashboard section).

---

## WyrmKeep Dashboard

A console for **WyrmKeep-API** — a self-improving smart-contract audit engine with
exploit-pattern memory (Rust/Axum + Postgres + Cognee + Slither). This dashboard is the
frontend; the API lives in the sibling `../WyrmKeep-API` repo. The dashboard is verified
end-to-end against an in-memory mock so it runs with zero backend.

### Environment variables (frontend)

Copy `.env.example` → `.env.local`. Only `VITE_`-prefixed vars reach the browser.

| Variable | Default | Meaning |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://localhost:8000` | Base URL of the running WyrmKeep-API |
| `VITE_WYRMKEEP_USE_MOCK` | mock ON when no base URL | `"false"` = hit live API; `"true"`/unset = in-memory mock |
| `VITE_CLERK_PUBLISHABLE_KEY` | unset (Clerk bypassed) | `pk_...` — enables Clerk sign-up/in gate |

> **`VITE_` vars are inlined at BUILD time.** Set them in the deploy platform's build env
> (or `.env` before `pnpm build`); setting them at runtime on a static host has no effect.
> Just setting `VITE_API_BASE_URL` flips to live; `VITE_WYRMKEEP_USE_MOCK=false` is explicit.

**Mock vs live:** with no env config the dashboard runs a full in-memory mock backend
(`src/lib/api/mock.ts`) — seeded contracts, findings, causal chains, memory stats, and a
scripted SSE audit pipeline. To go live: run the API (see its README — needs Postgres,
the Cognee sidecar, Slither, and a seeded tenant), then set `VITE_API_BASE_URL` and
`VITE_WYRMKEEP_USE_MOCK=false`.

### Architecture

```
src/lib/
  api/
    types.ts        # TS mirror of WyrmKeep-API Rust models (source of truth)
    config.ts       # API base URL + USE_MOCK toggle (reads VITE_ env)
    client.ts       # fetch wrapper: auth headers + ApiError normalization
    endpoints.ts    # one typed fn per route; branches live vs mock
    mock.ts         # in-memory backend + scripted SSE pipeline
    sse.ts          # fetch-based SSE reader (see caveat) + mock replay
    hooks.ts        # TanStack Query hooks + queryKeys for every endpoint
    audit-store.ts  # localStorage audit tracker (API has no list-audits endpoint)
  auth/
    credential.ts   # WyrmKeep credential storage + auth header derivation
    auth.tsx        # AuthProvider / useAuth — WyrmKeep API-key boundary
    clerk.tsx       # optional Clerk identity gate (ClerkGate, RequireSignedIn, user chip)
  dashboard/        # Shell (sidebar/topbar), AuthShell, DataTable, CausalChainGraph, ui.tsx
src/routes/
    index.tsx       # PUBLIC marketing landing page (/)
    sign-in.tsx     # Clerk <SignIn> (or dev bypass when Clerk off)
    sign-up.tsx     # Clerk <SignUp>
    connect.tsx     # enter WyrmKeep API key (Clerk-guarded, its own layout)
    dashboard.tsx   # Overview (the app home)
    contracts/ audits/ findings/ memory.tsx settings.tsx   # app pages
```

**Routing & guards.** `__root.tsx` wraps everything in `ClerkGate` + `AuthProvider`, then
`AppFrame` picks the layout by pathname: `/`, `/sign-in`, `/sign-up`, `/connect` render
"bare" (own full-page layouts); every other route goes through `RequireSignedIn` (Clerk)
→ `RequireConnected` (WyrmKeep API key, waits for hydration before redirecting) →
`DashboardShell` (sidebar). Flow: **landing → Clerk sign-up/in → /connect (API key) →
/dashboard**.

Endpoint coverage (every WyrmKeep-API route is wired): health, `tenants/me`,
`tenants` (admin create), contracts (upload/list/detail), audits (create/stream/report),
findings (list + causal chain), memory (recall/stats/prune).

**Fonts:** IBM Plex Sans (UI) + IBM Plex Mono (code/hashes/stat numbers), imported in
`src/styles.css` (replaced Manrope/Fraunces).

### Auth model & caveats (IMPORTANT)

- WyrmKeep-API has **no signup/login for dashboard users**. The only credential-issuing
  route is `POST /v1/tenants` (**admin-only**), which the API itself never mints an admin
  token for. So a user connects on `/connect` by pasting an existing **API key**
  (`<tenant_id>.<raw_key>` → `X-API-Key`) or a **session JWT** (`Authorization: Bearer`).
- **Two-layer auth (decided): Clerk gates identity, the API key authenticates the
  backend.** `clerk.tsx` = *who reaches the app*; `auth.tsx` (the WyrmKeep API key) =
  *what talks to the backend*. This split is deliberate because a Clerk token will **not**
  authenticate to WyrmKeep-API as-is: the API's `decode_token` uses HS256 with the shared
  `JWT_SECRET` and requires claims `sub=<tenant_uuid>`, `role="tenant"|"admin"` (Clerk is
  RS256 with different claims). So after Clerk sign-in the user still pastes a WyrmKeep API
  key on `/connect`. To let a Clerk session call the API directly instead, the backend must
  be reconfigured to trust Clerk (JWT template + issuer), or exchange the Clerk session for
  a WyrmKeep credential server-side — do that in `auth.tsx`/`clerk.tsx` if you go that way.
- **Clerk is optional-by-env.** With `VITE_CLERK_PUBLISHABLE_KEY` set it's active; without
  it, `ClerkGate`/`RequireSignedIn` are pass-throughs and `/sign-in` shows a dev "Continue"
  link — so mock/dev needs no Clerk account. Uses `@clerk/tanstack-react-start` (core-3,
  which drops `<SignedIn>/<SignedOut>` in favor of the `useAuth()` hook).
- **Clerk was set up via the Clerk CLI** (`clerk init --app app_3G3Dunvkwzduxi8M8ISlq8fQH0l`),
  linked to Clerk app **wyrmkeep** (dev instance). The CLI added:
  - `src/start.ts` — `clerkMiddleware()` request middleware (SSR auth).
  - `src/routes/sign-in.$.tsx` / `sign-up.$.tsx` — **catch-all** routes (Clerk needs the
    splat for its multi-step / SSO sub-paths); restyled with our `AuthShell` and
    `forceRedirectUrl="/connect"`. Our old exact `sign-in.tsx`/`sign-up.tsx` were removed.
    Internal `<Link>`s use `to="/sign-in/$"`.
  - `.env.local` (gitignored) — `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and
    `VITE_CLERK_SIGN_{IN,UP}_URL` / fallback-redirect vars.
  - Reconciled `__root.tsx`: the CLI wrapped the body in `<ClerkProvider>`; we kept our
    single `<ClerkGate>` (conditional provider) instead to preserve optional-by-env.
  - **Known gotcha:** in a sandboxed/headless env the dev server logs a Clerk "infinite
    redirect loop / keys do not match" — that's the dev-instance handshake failing because
    the server can't reach Clerk's Frontend API (blocked egress), NOT a key mismatch
    (`clerk doctor` validates the keys). It resolves in a real browser with open network.
    Verify by signing up at `pnpm dev` → localhost:3000. First `pnpm dev` after install
    may emit a one-time console flood during dependency re-optimization.
- **SSE needs fetch, not `EventSource`.** `GET /audits/:id/stream` requires an auth
  header and the browser's native `EventSource` can't send headers, so `sse.ts` streams
  via `fetch()` + a `ReadableStream` reader and parses frames by hand.

### API gaps represented in the UI

- **No `GET /v1/audits` list endpoint.** The Audits page merges audits created in this
  browser (`audit-store.ts`, localStorage) with `audit_id`s seen in the findings list.
  Clearing storage loses local audit history (findings on the API are unaffected).
- `GET /audits/:id/report` returns `{slither_findings_count, memory_matches_count}` — the
  UI shows exactly that; richer reports would need backend changes.
- `GET /audits/:id/stream` only works while the audit's in-memory broadcast channel is
  live on the API (i.e. right after creation) — reconnecting to an old audit 404s the
  stream. The report/findings remain fetchable afterward.

### Verification done

`pnpm build` and `tsc --noEmit` both green. All 9 routes SSR 200. Headless-Chrome render
of the production preview confirmed client-side mock data loads (contracts, findings,
overview stats) and the **full SSE audit pipeline** streams all 8 stages → report.

### Next steps for the dashboard

1. Stand up WyrmKeep-API and flip `VITE_WYRMKEEP_USE_MOCK=false` to validate against real
   Slither/Cognee output; adjust `affected_functions`/`causal_chain` rendering to the real
   JSON shape if it differs from the mock.
2. Decide the Clerk/Supabase story and implement it in `auth.tsx` (+ backend trust).
3. Add optimistic/streaming refresh of findings once an audit completes (currently
   invalidates on stream `done`).
