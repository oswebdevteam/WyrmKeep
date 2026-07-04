// Runtime configuration for the WyrmKeep dashboard.
//
// Two env vars control how the dashboard talks to WyrmKeep-API:
//   VITE_API_BASE_URL   — base URL of the running API (e.g. http://localhost:8000)
//   VITE_WYRMKEEP_USE_MOCK — "true" | "false" to force mock mode on/off
//
// Default behaviour: if no API base URL is configured, we run in MOCK mode so the
// dashboard is fully demoable without the Rust backend + Postgres + Cognee + Slither.
// Set VITE_API_BASE_URL and VITE_WYRMKEEP_USE_MOCK=false to hit the real API.

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined
const mockFlag = import.meta.env.VITE_WYRMKEEP_USE_MOCK as string | undefined

export const API_BASE_URL = (rawBaseUrl ?? 'http://localhost:8000').replace(
  /\/+$/,
  '',
)

/**
 * Mock mode is ON when explicitly requested, OR when no API base URL was provided.
 * It is OFF only when a base URL exists and the flag is not "true".
 */
export const USE_MOCK: boolean =
  mockFlag === 'true' || (mockFlag !== 'false' && rawBaseUrl == null)

/** API version prefix — every non-health route lives under /v1. */
export const API_PREFIX = '/v1'
