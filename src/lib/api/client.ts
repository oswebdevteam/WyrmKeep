// Low-level fetch client for WyrmKeep-API.
// Injects auth headers from the stored credential and normalizes errors into ApiError.

import { API_BASE_URL } from './config'
import { authHeaders, loadCredential } from '../auth/credential'
import type { ApiErrorBody } from './types'

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  query?: Record<string, string | number | null | undefined>
  json?: unknown
  formData?: FormData
  /** Skip auth header injection (e.g. health check). */
  anonymous?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(API_BASE_URL + path)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

export async function request<T>(
  method: string,
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (!opts.anonymous) Object.assign(headers, authHeaders(loadCredential()))

  let body: BodyInit | undefined
  if (opts.formData) {
    body = opts.formData // browser sets multipart boundary
  } else if (opts.json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.json)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body })
  } catch (e) {
    throw new ApiError(0, 'NETWORK_ERROR', `Cannot reach API: ${(e as Error).message}`)
  }

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const parsed = text ? safeJson(text) : undefined

  if (!res.ok) {
    const err = parsed as ApiErrorBody | undefined
    throw new ApiError(
      res.status,
      err?.code ?? 'ERROR',
      err?.message ?? res.statusText ?? 'Request failed',
    )
  }

  return parsed as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Convert a thrown mock error object into an ApiError (used by endpoints.ts). */
export function toApiError(e: unknown): never {
  if (e && typeof e === 'object' && '__mockError' in e) {
    const m = e as unknown as { status: number; code: string; message: string }
    throw new ApiError(m.status, m.code, m.message)
  }
  throw e
}
