// TanStack Query hooks over the WyrmKeep endpoints.
// Query keys are namespaced by tenant so switching credential re-fetches cleanly.

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useAuth } from '../auth/auth'
import {
  createAudit,
  createTenant,
  getCausalChain,
  getContract,
  getHealth,
  getMemoryStats,
  getMe,
  getReport,
  listContracts,
  listFindings,
  pruneMemory,
  recallMemory,
  uploadContract,
} from './endpoints'
import { trackAudit } from './audit-store'
import type { MemoryScope, Uuid } from './types'

const PAGE_SIZE = 20

export const queryKeys = {
  health: ['health'] as const,
  me: (t?: string) => ['me', t] as const,
  contracts: (t?: string) => ['contracts', t] as const,
  contract: (t: string | undefined, id: string) => ['contract', t, id] as const,
  findings: (t?: string) => ['findings', t] as const,
  chain: (t: string | undefined, id: string) => ['chain', t, id] as const,
  report: (t: string | undefined, id: string) => ['report', t, id] as const,
  memoryStats: (t?: string) => ['memory-stats', t] as const,
}

// --- Health -----------------------------------------------------------------
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: getHealth,
    refetchInterval: 30_000,
  })
}

// --- Tenant -----------------------------------------------------------------
export function useMe() {
  const { tenantId, isConnected } = useAuth()
  return useQuery({
    queryKey: queryKeys.me(tenantId),
    queryFn: getMe,
    enabled: isConnected,
  })
}

export function useCreateTenant() {
  return useMutation({
    mutationFn: (v: { name: string; raw_api_key: string }) =>
      createTenant(v.name, v.raw_api_key),
  })
}

// --- Contracts --------------------------------------------------------------
export function useContracts() {
  const { tenantId, isConnected } = useAuth()
  return useInfiniteQuery({
    queryKey: queryKeys.contracts(tenantId),
    queryFn: ({ pageParam }) => listContracts(PAGE_SIZE, pageParam),
    initialPageParam: null as Uuid | null,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    enabled: isConnected,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.data),
      pages: data.pages,
    }),
  })
}

export function useContract(id: string) {
  const { tenantId, isConnected } = useAuth()
  return useQuery({
    queryKey: queryKeys.contract(tenantId, id),
    queryFn: () => getContract(id),
    enabled: isConnected && !!id,
    select: (r) => r.data,
  })
}

export function useUploadContract() {
  const qc = useQueryClient()
  const { tenantId } = useAuth()
  return useMutation({
    mutationFn: (input: { name: string; source_code: string; language?: string }) =>
      uploadContract(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.contracts(tenantId) })
    },
  })
}

// --- Audits -----------------------------------------------------------------
export function useCreateAudit() {
  return useMutation({
    mutationFn: (v: {
      contract_id: Uuid
      contract_name: string
      vuln_class_tags: Array<string>
    }) => createAudit(v.contract_id, v.vuln_class_tags),
    onSuccess: (res, vars) => {
      trackAudit({
        audit_id: res.audit_id,
        contract_id: vars.contract_id,
        contract_name: vars.contract_name,
        vuln_class_tags: vars.vuln_class_tags,
        status: res.status,
        created_at: new Date().toISOString(),
      })
    },
  })
}

export function useReport(id: string, enabled = true) {
  const { tenantId, isConnected } = useAuth()
  return useQuery({
    queryKey: queryKeys.report(tenantId, id),
    queryFn: () => getReport(id),
    enabled: enabled && isConnected && !!id,
    retry: false,
  })
}

// --- Findings ---------------------------------------------------------------
export function useFindings() {
  const { tenantId, isConnected } = useAuth()
  return useInfiniteQuery({
    queryKey: queryKeys.findings(tenantId),
    queryFn: ({ pageParam }) => listFindings(PAGE_SIZE, pageParam),
    initialPageParam: null as Uuid | null,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    enabled: isConnected,
    select: (data) => ({
      items: data.pages.flatMap((p) => p.data),
      pages: data.pages,
    }),
  })
}

export function useCausalChain(id: string, enabled: boolean) {
  const { tenantId, isConnected } = useAuth()
  return useQuery({
    queryKey: queryKeys.chain(tenantId, id),
    queryFn: () => getCausalChain(id),
    enabled: enabled && isConnected && !!id,
    retry: false,
  })
}

// --- Memory -----------------------------------------------------------------
export function useMemoryStats() {
  const { tenantId, isConnected } = useAuth()
  return useQuery({
    queryKey: queryKeys.memoryStats(tenantId),
    queryFn: getMemoryStats,
    enabled: isConnected,
  })
}

export function useRecallMemory() {
  return useMutation({
    mutationFn: (v: { query: string; top_k: number; scope: MemoryScope }) =>
      recallMemory(v.query, v.top_k, v.scope),
  })
}

export function usePruneMemory() {
  const qc = useQueryClient()
  const { tenantId } = useAuth()
  return useMutation({
    mutationFn: () => pruneMemory(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.memoryStats(tenantId) })
    },
  })
}
