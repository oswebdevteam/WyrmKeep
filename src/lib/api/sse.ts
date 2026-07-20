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
  console.log(`[SSE] Connecting to ${auditId}...`)
  const res = await fetch(
    `${API_BASE_URL}${API_PREFIX}/audits/${auditId}/stream`,
    {
      method: 'GET',
      headers: { Accept: 'text/event-stream', ...authHeaders(loadCredential()) },
      signal,
    },
  )

  console.log(`[SSE] Connected. Status: ${res.status}`)
  if (!res.ok || !res.body) {
    throw new Error(`Stream failed: ${res.status} ${res.statusText}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (value) {
      console.log(`[SSE] Received chunk of length ${value.length}`)
      buffer += decoder.decode(value, { stream: !done })
    }

    // SSE frames are separated by a blank line.
    let sepMatch: RegExpMatchArray | null
    while ((sepMatch = buffer.match(/\r?\n\r?\n/)) && sepMatch.index !== undefined) {
      const sepIndex = sepMatch.index
      const sepLength = sepMatch[0].length
      const frame = buffer.slice(0, sepIndex)
      buffer = buffer.slice(sepIndex + sepLength)
      console.log(`[SSE] Parsed frame:`, frame)
      const data = parseFrame(frame)
      if (data) {
        try {
          const evt = JSON.parse(data) as AuditEvent
          console.log(`[SSE] Dispatching event:`, evt)
          handlers.onEvent(evt)
        } catch (e) {
          console.log(`[SSE] Failed to parse JSON:`, e)
        }
      }
    }
    
    if (done) {
      console.log(`[SSE] Stream done.`)
      break
    }
  }
  console.log(`[SSE] Calling onDone.`)
  handlers.onDone?.()
}

/** Extract the concatenated `data:` payload from one SSE frame. */
function parseFrame(frame: string): string | null {
  const lines = frame.split(/\r?\n/)
  const data: Array<string> = []
  for (const line of lines) {
    if (line.startsWith('data:')) data.push(line.slice(5).trimStart())
  }
  return data.length ? data.join('\n') : null
}
