// Typed endpoint functions. Each branches between the live API (via client.request)
// and the in-memory mock (lib/api/mock.ts) based on USE_MOCK.

import { USE_MOCK } from './config'
import { API_PREFIX } from './config'
import { request, toApiError } from './client'
import { mockApi } from './mock'
import type {
  Contract,
  ContractListResponse,
  ContractResponse,
  CreateAuditResponse,
  CreateTenantResponse,
  Finding,
  FindingListResponse,
  HealthResponse,
  MemoryScope,
  MemoryStatsResponse,
  RecallResponse,
  TenantResponse,
  Uuid,
  AuditListResponse,
} from './types'
import type { AuditReport, CausalChain, Audit } from './types'

const v1 = (p: string) => `${API_PREFIX}${p}`

async function mock<T>(fn: () => T): Promise<T> {
  try {
    return fn()
  } catch (e) {
    toApiError(e)
  }
}


export function getHealth(): Promise<HealthResponse> {
  if (USE_MOCK) return mock(() => mockApi.health())
  return request<HealthResponse>('GET', '/health', { anonymous: true })
}

export function getMe(): Promise<TenantResponse> {
  if (USE_MOCK) return mock(() => mockApi.getMe())
  return request<TenantResponse>('GET', v1('/tenants/me'))
}

export function createTenant(
  name: string,
  raw_api_key: string,
): Promise<CreateTenantResponse> {
  if (USE_MOCK) return mock(() => mockApi.createTenant(name, raw_api_key))
  return request<CreateTenantResponse>('POST', v1('/tenants'), {
    json: { name, raw_api_key },
  })
}


export function listContracts(
  limit = 20,
  after?: Uuid | null,
): Promise<ContractListResponse> {
  if (USE_MOCK) return mock(() => mockApi.listContracts(limit, after))
  return request<ContractListResponse>('GET', v1('/contracts'), {
    query: { limit, after },
  })
}

export function getContract(id: Uuid): Promise<ContractResponse> {
  if (USE_MOCK) return mock(() => mockApi.getContract(id))
  return request<ContractResponse>('GET', v1(`/contracts/${id}`))
}

export function uploadContract(input: {
  name: string
  source_code: string
  language?: string
}): Promise<ContractResponse> {
  if (USE_MOCK) return mock(() => mockApi.uploadContract(input))
  const fd = new FormData()
  fd.set('name', input.name)
  fd.set('source_code', input.source_code)
  if (input.language) fd.set('language', input.language)
  return request<ContractResponse>('POST', v1('/contracts'), { formData: fd })
}

export function createAudit(
  contract_id: Uuid,
  vuln_class_tags: Array<string>,
): Promise<CreateAuditResponse> {
  if (USE_MOCK) return mock(() => mockApi.createAudit(contract_id))
  return request<CreateAuditResponse>('POST', v1('/audits'), {
    json: { contract_id, vuln_class_tags },
  })
}

export function listAudits(
  limit = 20,
  after?: Uuid | null,
): Promise<AuditListResponse> {
  if (USE_MOCK) return mock(() => mockApi.listAudits(limit, after))
  return request<AuditListResponse>('GET', v1('/audits'), {
    query: { limit, after },
  })
}

export function getReport(id: Uuid): Promise<AuditReport> {
  if (USE_MOCK) return mock(() => mockApi.getReport(id))
  return request<AuditReport>('GET', v1(`/audits/${id}/report`))
}

export function listFindings(
  limit = 20,
  after?: Uuid | null,
): Promise<FindingListResponse> {
  if (USE_MOCK) return mock(() => mockApi.listFindings(limit, after))
  return request<FindingListResponse>('GET', v1('/findings'), {
    query: { limit, after },
  })
}

export function getCausalChain(id: Uuid): Promise<CausalChain> {
  if (USE_MOCK) return mock(() => mockApi.getCausalChain(id))
  return request<CausalChain>('GET', v1(`/findings/${id}/chain`))
}

export function recallMemory(
  query: string,
  top_k = 5,
  scope: MemoryScope = 'shared',
): Promise<RecallResponse> {
  if (USE_MOCK) return mock(() => mockApi.recall(query, top_k, scope))
  return request<RecallResponse>('POST', v1('/memory/recall'), {
    json: { query, top_k, scope },
  })
}

export function pruneMemory(): Promise<void> {
  if (USE_MOCK) return mock(() => mockApi.prune())
  return request<void>('DELETE', v1('/memory/prune'))
}

export function getMemoryStats(): Promise<MemoryStatsResponse> {
  if (USE_MOCK) return mock(() => mockApi.memoryStats())
  return request<MemoryStatsResponse>('GET', v1('/memory/stats'))
}

// Re-exported types used widely by callers.
export type { Contract, Finding, Audit }
