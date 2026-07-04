// Audit progress streaming.
//
// GET /v1/audits/:id/stream is Server-Sent Events but REQUIRES an auth header, and the
// browser's native EventSource cannot send custom headers. So we stream via fetch() +
// a ReadableStream reader and parse SSE frames by hand. In mock mode we replay a
// scripted event sequence instead.

import { API_BASE_URL, API_PREFIX, USE_MOCK } from './config'
import { authHeaders, loadCredential } from '../auth/credential'
import { mockStreamAudit } from './mock'
import type { AuditEvent } from './types'

export interface StreamHandlers {
  onEvent: (event: AuditEvent) => void
  onError?: (error: Error) => void
  onDone?: () => void
}

/**
 * Subscribe to an audit's SSE stream. Returns a cleanup function that aborts it.
 */
export function streamAudit(auditId: string, handlers: StreamHandlers): () => void {
  const controller = new AbortController()

  if (USE_MOCK) {
    mockStreamAudit(auditId, handlers.onEvent, controller.signal)
      .then(() => handlers.onDone?.())
      .catch((e) => handlers.onError?.(e as Error))
    return () => controller.abort()
  }

  run(auditId, handlers, controller.signal).catch((e) => {
    if (controller.signal.aborted) return
    handlers.onError?.(e as Error)
  })

  return () => controller.abort()
}

async function run(
  auditId: string,
  handlers: StreamHandlers,
  signal: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}${API_PREFIX}/audits/${auditId}/stream`,
    {
      method: 'GET',
      headers: { Accept: 'text/event-stream', ...authHeaders(loadCredential()) },
      signal,
    },
  )

  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    // SSE frames are separated by a blank line.
    let sep: number
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep)
      buffer = buffer.slice(sep + 2)
      const data = parseFrame(frame)
      if (data) {
        try {
          handlers.onEvent(JSON.parse(data) as AuditEvent)
        } catch {
          // ignore keep-alive / non-JSON frames
        }
      }
    }
  }
  handlers.onDone?.()
}

/** Extract the concatenated `data:` payload from one SSE frame. */
function parseFrame(frame: string): string | null {
  const lines = frame.split('\n')
  const data: Array<string> = []
  for (const line of lines) {
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  return data.length ? data.join('\n') : null
}
