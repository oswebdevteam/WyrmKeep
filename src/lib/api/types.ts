// TypeScript mirror of the WyrmKeep-API data contracts.
// Source of truth: WyrmKeep-API/src/models/*.rs and src/routes/*.rs
// Keep these in sync with the Rust structs — field names match serde output.

export type Uuid = string
export type IsoDateTime = string

/** Every JSON response from the API carries a request_id for tracing. */
export interface Envelope {
  request_id: string
}

/** Standard error body: { code, message } with an HTTP status code. */
export interface ApiErrorBody {
  code: string
  message: string
}

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------
export interface HealthResponse {
  status: string
  version: string
  timestamp: IsoDateTime
}

// ---------------------------------------------------------------------------
// Tenant
// ---------------------------------------------------------------------------
export interface Tenant {
  id: Uuid
  name: string
  // api_key_hash is #[serde(skip_serializing)] on the backend — never sent.
  cognee_dataset_private: string
  cognee_dataset_session: string
  created_at: IsoDateTime
}

export interface TenantResponse extends Envelope {
  data: Tenant
}

export interface CreateTenantRequest {
  name: string
  raw_api_key: string
}

export interface CreateTenantResponse extends Envelope {
  data: Tenant
  api_key: string
  session_token: string
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------
export interface Contract {
  id: Uuid
  tenant_id: Uuid
  name: string
  source_hash: string
  source_code: string
  language: string
  uploaded_at: IsoDateTime
}

export interface ContractResponse extends Envelope {
  data: Contract
}

export interface ContractListResponse extends Envelope {
  data: Array<Contract>
  next_cursor: Uuid | null
  has_more: boolean
}

export interface UploadContractInput {
  name: string
  source_code: string
  language?: string
}

// ---------------------------------------------------------------------------
// Audit
// ---------------------------------------------------------------------------
export type AuditStatus = 'queued' | 'running' | 'complete' | 'failed'

export interface CreateAuditInput {
  contract_id: Uuid
  vuln_class_tags: Array<string>
}

export interface CreateAuditResponse extends Envelope {
  audit_id: Uuid
  status: string
}

export interface Audit {
  id: Uuid
  contract_id: Uuid
  contract_name: string
  status: string
  created_at: IsoDateTime
}

export interface AuditListResponse extends Envelope {
  data: Array<Audit>
  next_cursor: Uuid | null
  has_more: boolean
}

/** The persisted report JSONB. Matches AuditReport in models/audit.rs. */
export interface AuditReport {
  slither_findings_count: number
  memory_matches_count: number
}

// SSE event stream — serde tag = "type", snake_case (routes/audits.rs::AuditEvent)
export type AuditEvent =
  | { type: 'status_update'; stage: string; message: string }
  | { type: 'slither_complete'; finding_count: number }
  | { type: 'pattern_extracted'; node_count: number; edge_count: number }
  | { type: 'memory_ingested'; dataset: string }
  | { type: 'cognify_complete'; elapsed_ms: number }
  | { type: 'recall_complete'; match_count: number }
  | { type: 'report_ready'; audit_id: Uuid }
  | { type: 'error'; message: string }

export type AuditEventType = AuditEvent['type']

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------
export type FindingSeverity = 'High' | 'Medium' | 'Low' | 'Informational'

export interface Finding {
  id: Uuid
  audit_id: Uuid
  tenant_id: Uuid
  vuln_class: string
  severity: FindingSeverity
  description: string
  // JSONB array — shape is analyzer-defined; commonly function names/signatures.
  affected_functions: unknown
  causal_chain: CausalChain | null
  historical_matches: number
  created_at: IsoDateTime
}

export interface FindingListResponse extends Envelope {
  data: Array<Finding>
  next_cursor: Uuid | null
  has_more: boolean
}

/** Causal-chain graph payload from GET /findings/:id/chain. */
export interface CausalChain {
  nodes: Array<ChainNode>
  edges?: Array<ChainEdge>
  vuln_class?: string
}

export interface ChainNode {
  id: string
  // e.g. "function" | "statevar" | "call" | "invariant" | "class"
  node_type: string
  label: string
}

export interface ChainEdge {
  from: string
  to: string
  label?: string
}

// ---------------------------------------------------------------------------
// Memory
// ---------------------------------------------------------------------------
export type MemoryScope = 'shared' | 'private' | 'session'

export interface RecallRequest {
  query: string
  top_k?: number
  scope?: MemoryScope
}

export interface MemoryMatch {
  id: Uuid
  content: string
  score: number
}

export interface RecallResponse extends Envelope {
  data: Array<MemoryMatch>
}

export interface DatasetStats {
  name: string
  nodes: number
  edges: number
}

export interface MemoryStatsResponse extends Envelope {
  shared_patterns: DatasetStats
  private_dataset: DatasetStats
  session_dataset: DatasetStats
}

// ---------------------------------------------------------------------------
// Pagination helper shared by list endpoints
// ---------------------------------------------------------------------------
export interface PageParams {
  limit?: number
  after?: Uuid | null
}
