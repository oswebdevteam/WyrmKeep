// Renders a vulnerability causal chain as a layered SVG graph:
//   function → statevar → external call → invariant → exploit class
// Works for the linear chains WyrmKeep emits and degrades gracefully for arbitrary graphs.

import type { CausalChain, ChainNode } from '../api/types'

const NODE_W = 240
const NODE_H = 52
const V_GAP = 40
const PAD_X = 90
const PAD_Y = 20

const TYPE_COLOR: Record<string, string> = {
  function: 'var(--lagoon-deep)',
  statevar: 'var(--palm)',
  call: '#b54708',
  invariant: '#b42318',
  class: 'var(--sea-ink)',
}

function nodeColor(type: string): string {
  return TYPE_COLOR[type.toLowerCase()] ?? 'var(--sea-ink-soft)'
}

export function CausalChainGraph({ chain }: { chain: CausalChain }) {
  const nodes = chain.nodes ?? []
  if (nodes.length === 0) {
    return (
      <p className="text-sm text-[var(--sea-ink-soft)]">No nodes in this chain.</p>
    )
  }

  const index = new Map<string, number>()
  nodes.forEach((n, i) => index.set(n.id, i))

  const centerX = PAD_X + NODE_W / 2
  const svgWidth = NODE_W + PAD_X * 2
  const svgHeight = nodes.length * (NODE_H + V_GAP) - V_GAP + PAD_Y * 2

  const yOf = (i: number) => PAD_Y + i * (NODE_H + V_GAP) + NODE_H / 2

  const edges = (chain.edges ?? []).filter(
    (e) => index.has(e.from) && index.has(e.to),
  )

  return (
    <div className="overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        role="img"
        aria-label="Causal chain graph"
        className="max-w-full"
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="var(--sea-ink-soft)" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const fi = index.get(e.from)!
          const ti = index.get(e.to)!
          const y1 = yOf(fi) + NODE_H / 2
          const y2 = yOf(ti) - NODE_H / 2
          const midY = (y1 + y2) / 2
          return (
            <g key={`e-${i}`}>
              <line
                x1={centerX}
                y1={y1}
                x2={centerX}
                y2={y2}
                stroke="var(--sea-ink-soft)"
                strokeWidth={1.5}
                markerEnd="url(#arrow)"
                opacity={0.55}
              />
              {e.label && (
                <text
                  x={centerX + 12}
                  y={midY}
                  fontSize={11}
                  fill="var(--sea-ink-soft)"
                  dominantBaseline="middle"
                >
                  {e.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Fallback linear connectors when no edges are provided */}
        {edges.length === 0 &&
          nodes.slice(1).map((_, i) => (
            <line
              key={`l-${i}`}
              x1={centerX}
              y1={yOf(i) + NODE_H / 2}
              x2={centerX}
              y2={yOf(i + 1) - NODE_H / 2}
              stroke="var(--sea-ink-soft)"
              strokeWidth={1.5}
              markerEnd="url(#arrow)"
              opacity={0.5}
            />
          ))}

        {/* Nodes */}
        {nodes.map((n: ChainNode, i) => {
          const y = yOf(i) - NODE_H / 2
          const color = nodeColor(n.node_type)
          return (
            <g key={n.id}>
              <rect
                x={PAD_X}
                y={y}
                width={NODE_W}
                height={NODE_H}
                rx={12}
                fill="var(--surface-strong)"
                stroke={color}
                strokeWidth={1.5}
              />
              <circle cx={PAD_X + 18} cy={y + NODE_H / 2} r={5} fill={color} />
              <text
                x={PAD_X + 34}
                y={y + 20}
                fontSize={10}
                fill={color}
                fontWeight={700}
                style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}
              >
                {n.node_type}
              </text>
              <text
                x={PAD_X + 34}
                y={y + 37}
                fontSize={13}
                fill="var(--sea-ink)"
                fontWeight={600}
              >
                {truncate(n.label, 26)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}
