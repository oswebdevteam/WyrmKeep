// Client-side audit tracker.
//
// API GAP: WyrmKeep-API has no `GET /v1/audits` list endpoint — audits are only
// addressable by id after creation (stream/report). To give the dashboard an "Audits"
// view, we persist the audits this browser has created in localStorage and merge them
// with audit_ids observed in the findings list. This is a UI convenience, not a source
// of truth; clearing storage loses the local history (the findings still remain on the API).

export interface TrackedAudit {
  audit_id: string
  contract_id: string
  contract_name: string
  vuln_class_tags: Array<string>
  status: string
  created_at: string
}

const KEY = 'wyrmkeep.audits'

function isBrowser() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function loadTrackedAudits(): Array<TrackedAudit> {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Array<TrackedAudit>) : []
  } catch {
    return []
  }
}

export function trackAudit(audit: TrackedAudit): void {
  if (!isBrowser()) return
  const all = loadTrackedAudits().filter((a) => a.audit_id !== audit.audit_id)
  all.unshift(audit)
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function updateTrackedAuditStatus(auditId: string, status: string): void {
  if (!isBrowser()) return
  const all = loadTrackedAudits()
  const idx = all.findIndex((a) => a.audit_id === auditId)
  if (idx >= 0) {
    all[idx] = { ...all[idx], status }
    localStorage.setItem(KEY, JSON.stringify(all))
  }
}

export function getTrackedAudit(auditId: string): TrackedAudit | undefined {
  return loadTrackedAudits().find((a) => a.audit_id === auditId)
}
