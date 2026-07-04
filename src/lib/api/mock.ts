// In-memory mock backend for the WyrmKeep dashboard.
//
// Mirrors the WyrmKeep-API response shapes exactly so the UI code is identical whether
// it runs against mock or live. Enabled by lib/api/config.ts (USE_MOCK). Lets the full
// dashboard be built, demoed, and verified without Postgres + Cognee + Slither.

import type {
  AuditEvent,
  AuditReport,
  Contract,
  Finding,
  MemoryMatch,
  MemoryScope,
  Tenant,
} from './types'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback (SSR / older runtimes)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Date.now() + Math.floor(Math.random() * 1e9)) % 16
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function now(): string {
  return new Date().toISOString()
}

const TENANT_ID = '550e8400-e29b-41d4-a716-446655440000'

const REENTRANT_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Vault {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "no balance");
        // external call BEFORE state update -> classic reentrancy
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] = 0;
    }
}`

const ACCESS_SOURCE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Treasury {
    address public owner;
    constructor() { owner = msg.sender; }

    // Missing access control: anyone can drain.
    function setOwner(address newOwner) external {
        owner = newOwner;
    }

    function sweep(address payable to) external {
        to.transfer(address(this).balance);
    }
}`

interface Store {
  tenant: Tenant
  contracts: Array<Contract>
  audits: Map<string, { id: string; contract_id: string; status: string; report?: AuditReport }>
  findings: Array<Finding>
}

function seedStore(): Store {
  const contract: Contract = {
    id: '650e8400-e29b-41d4-a716-446655440000',
    tenant_id: TENANT_ID,
    name: 'Vault',
    source_hash: '5d41402abc4b2a76b9719d911017c592',
    source_code: REENTRANT_SOURCE,
    language: 'solidity',
    uploaded_at: '2026-07-01T09:12:00.000Z',
  }
  const contract2: Contract = {
    id: '650e8400-e29b-41d4-a716-446655440001',
    tenant_id: TENANT_ID,
    name: 'Treasury',
    source_hash: '9e107d9d372bb6826bd81d3542a419d6',
    source_code: ACCESS_SOURCE,
    language: 'solidity',
    uploaded_at: '2026-07-02T14:40:00.000Z',
  }

  const seededAuditId = '750e8400-e29b-41d4-a716-446655440000'

  const finding: Finding = {
    id: '850e8400-e29b-41d4-a716-446655440000',
    audit_id: seededAuditId,
    tenant_id: TENANT_ID,
    vuln_class: 'reentrancy-eth',
    severity: 'High',
    description:
      'Reentrancy in Vault.withdraw(): the external call transfers ETH before balances[msg.sender] is zeroed, allowing a malicious receiver to re-enter and drain the contract.',
    affected_functions: ['Vault.withdraw()'],
    causal_chain: {
      vuln_class: 'reentrancy-eth',
      nodes: [
        { id: 'fn', node_type: 'function', label: 'withdraw()' },
        { id: 'sv', node_type: 'statevar', label: 'balances[msg.sender]' },
        { id: 'call', node_type: 'call', label: 'msg.sender.call{value}()' },
        { id: 'inv', node_type: 'invariant', label: 'balance zeroed before transfer' },
        { id: 'cls', node_type: 'class', label: 'DASP-1 Reentrancy' },
      ],
      edges: [
        { from: 'fn', to: 'sv', label: 'reads' },
        { from: 'fn', to: 'call', label: 'external call' },
        { from: 'call', to: 'inv', label: 'violates' },
        { from: 'inv', to: 'cls', label: 'maps to' },
      ],
    },
    historical_matches: 3,
    created_at: '2026-07-01T09:13:20.000Z',
  }
  const finding2: Finding = {
    id: '850e8400-e29b-41d4-a716-446655440001',
    audit_id: seededAuditId,
    tenant_id: TENANT_ID,
    vuln_class: 'unchecked-lowlevel',
    severity: 'Medium',
    description:
      'Low-level call return value is used but the surrounding pattern leaves the contract in an inconsistent state on partial failure.',
    affected_functions: ['Vault.withdraw()'],
    causal_chain: null,
    historical_matches: 1,
    created_at: '2026-07-01T09:13:21.000Z',
  }

  return {
    tenant: {
      id: TENANT_ID,
      name: 'Acme Security',
      cognee_dataset_private: `wyrmkeep:${TENANT_ID}:private`,
      cognee_dataset_session: `wyrmkeep:${TENANT_ID}:session`,
      created_at: '2026-06-15T08:00:00.000Z',
    },
    contracts: [contract2, contract],
    audits: new Map([
      [seededAuditId, { id: seededAuditId, contract_id: contract.id, status: 'complete', report: { slither_findings_count: 2, memory_matches_count: 3 } }],
    ]),
    findings: [finding, finding2],
  }
}

// Module-level singleton so state persists across navigations within a session.
const store: Store = seedStore()

const SHARED_PATTERNS: Array<MemoryMatch> = [
  {
    id: '950e8400-e29b-41d4-a716-446655440000',
    content:
      'VulnClass: Reentrancy (DASP-1)\nShape: StateVar written AFTER external call in withdraw-style function.\nHistorical: TheDAO (2016) drained 3.6M ETH; same call-before-effects ordering.\nFix: checks-effects-interactions or ReentrancyGuard.',
    score: 0.95,
  },
  {
    id: '950e8400-e29b-41d4-a716-446655440001',
    content:
      'VulnClass: Access Control (SWC-105)\nShape: state-mutating setter with no onlyOwner/require guard.\nHistorical: Parity multisig (2017). Fix: restrict with modifier + two-step ownership.',
    score: 0.88,
  },
  {
    id: '950e8400-e29b-41d4-a716-446655440002',
    content:
      'VulnClass: Unchecked low-level call.\nShape: (bool ok,) = addr.call(...) with weak failure handling.\nFix: bubble up revert; prefer pull-payments.',
    score: 0.81,
  },
]

// ---------------------------------------------------------------------------
// Endpoint mocks (return the same shapes as WyrmKeep-API)
// ---------------------------------------------------------------------------
function rid() {
  return uuid()
}

export const mockApi = {
  health() {
    return { status: 'ok', version: '0.1.0-mock', timestamp: now() }
  },

  getMe() {
    return { data: store.tenant, request_id: rid() }
  },

  listContracts(limit = 20, after?: string | null) {
    let items = store.contracts
    if (after) {
      const idx = items.findIndex((c) => c.id === after)
      items = idx >= 0 ? items.slice(idx + 1) : items
    }
    const page = items.slice(0, limit)
    const has_more = items.length > limit
    return {
      data: page,
      next_cursor: page.length ? page[page.length - 1].id : null,
      has_more,
      request_id: rid(),
    }
  },

  getContract(id: string) {
    const c = store.contracts.find((x) => x.id === id)
    if (!c) throw notFound('Contract not found')
    return { data: c, request_id: rid() }
  },

  uploadContract(input: { name: string; source_code: string; language?: string }) {
    if (!input.name || !input.source_code) {
      throw validation('name and file are required')
    }
    const contract: Contract = {
      id: uuid(),
      tenant_id: TENANT_ID,
      name: input.name,
      source_hash: uuid().replace(/-/g, '').slice(0, 32),
      source_code: input.source_code,
      language: input.language || 'solidity',
      uploaded_at: now(),
    }
    store.contracts = [contract, ...store.contracts]
    return { data: contract, request_id: rid() }
  },

  createAudit(contract_id: string) {
    const contract = store.contracts.find((c) => c.id === contract_id)
    if (!contract) throw notFound('Contract not found')
    const audit_id = uuid()
    store.audits.set(audit_id, { id: audit_id, contract_id, status: 'queued' })
    return { audit_id, status: 'queued', request_id: rid() }
  },

  getReport(id: string) {
    const audit = store.audits.get(id)
    if (!audit) throw notFound('Audit not found')
    if (!audit.report) throw notFound('Report not ready yet')
    return audit.report
  },

  listFindings(limit = 20, after?: string | null) {
    let items = store.findings
    if (after) {
      const idx = items.findIndex((f) => f.id === after)
      items = idx >= 0 ? items.slice(idx + 1) : items
    }
    const page = items.slice(0, limit)
    const has_more = items.length > limit
    return {
      data: page,
      next_cursor: page.length ? page[page.length - 1].id : null,
      has_more,
      request_id: rid(),
    }
  },

  getCausalChain(id: string) {
    const f = store.findings.find((x) => x.id === id)
    if (!f) throw notFound('Finding not found')
    if (!f.causal_chain) throw notFound('No causal chain available for this finding')
    return f.causal_chain
  },

  recall(query: string, top_k: number, _scope: MemoryScope) {
    const q = query.toLowerCase()
    const scored = SHARED_PATTERNS.map((m) => {
      // Nudge score by keyword overlap so search feels responsive.
      const hit = q && m.content.toLowerCase().includes(q.split(' ')[0] ?? '')
      return { ...m, score: hit ? Math.min(0.99, m.score + 0.03) : m.score }
    }).sort((a, b) => b.score - a.score)
    return { data: scored.slice(0, top_k), request_id: rid() }
  },

  memoryStats() {
    return {
      shared_patterns: { name: 'wyrmkeep:shared:patterns', nodes: 1250, edges: 3400 },
      private_dataset: {
        name: `wyrmkeep:${TENANT_ID}:private`,
        nodes: 45,
        edges: 120,
      },
      session_dataset: {
        name: `wyrmkeep:${TENANT_ID}:session`,
        nodes: 12,
        edges: 30,
      },
      request_id: rid(),
    }
  },

  prune() {
    // GDPR wipe of private + session (shared patterns persist forever).
    return
  },

  createTenant(name: string, raw_api_key: string) {
    const id = uuid()
    const tenant: Tenant = {
      id,
      name,
      cognee_dataset_private: `wyrmkeep:${id}:private`,
      cognee_dataset_session: `wyrmkeep:${id}:session`,
      created_at: now(),
    }
    return {
      data: tenant,
      api_key: raw_api_key,
      session_token: `mock.${btoa(id)}.token`,
      request_id: rid(),
    }
  },
}

// ---------------------------------------------------------------------------
// Scripted SSE pipeline for an audit (mirrors services/pipeline.rs stages).
// ---------------------------------------------------------------------------
export async function mockStreamAudit(
  auditId: string,
  onEvent: (e: AuditEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const audit = store.audits.get(auditId)
  const script: Array<[number, AuditEvent]> = [
    [200, { type: 'status_update', stage: 'starting', message: 'Audit initiated' }],
    [600, { type: 'status_update', stage: 'analyzing', message: 'Running Slither in sandbox' }],
    [900, { type: 'slither_complete', finding_count: 2 }],
    [700, { type: 'pattern_extracted', node_count: 12, edge_count: 8 }],
    [600, { type: 'memory_ingested', dataset: 'wyrmkeep:shared:patterns' }],
    [1100, { type: 'cognify_complete', elapsed_ms: 1500 }],
    [800, { type: 'recall_complete', match_count: 3 }],
    [400, { type: 'report_ready', audit_id: auditId }],
  ]

  if (audit) audit.status = 'running'

  for (const [delay, event] of script) {
    if (signal?.aborted) return
    await sleep(delay, signal)
    if (signal?.aborted) return
    onEvent(event)
  }

  // Finalize: attach report + findings for this audit id (so Findings/Report views work).
  if (audit) {
    audit.status = 'complete'
    audit.report = { slither_findings_count: 2, memory_matches_count: 3 }
    if (!store.findings.some((f) => f.audit_id === auditId)) {
      const contract = store.contracts.find((c) => c.id === audit.contract_id)
      store.findings = [
        {
          id: uuid(),
          audit_id: auditId,
          tenant_id: TENANT_ID,
          vuln_class: 'reentrancy-eth',
          severity: 'High',
          description: `Reentrancy detected in ${contract?.name ?? 'contract'} — external call precedes state update.`,
          affected_functions: [`${contract?.name ?? 'C'}.withdraw()`],
          causal_chain: store.findings[0]?.causal_chain ?? null,
          historical_matches: 3,
          created_at: now(),
        },
        ...store.findings,
      ]
    }
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      resolve()
    })
  })
}

// ---------------------------------------------------------------------------
// Error shims — thrown objects the client normalizes into ApiError.
// ---------------------------------------------------------------------------
function notFound(message: string) {
  return { __mockError: true, status: 404, code: 'NOT_FOUND', message }
}
function validation(message: string) {
  return { __mockError: true, status: 400, code: 'VALIDATION_ERROR', message }
}
