import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BrainCircuit,
  ChevronRight,
  DatabaseZap,
  FileSearch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

export const Route = createFileRoute('/')({ component: Landing })

const NAV_ITEMS = [
  ['Home', '#home'],
  ['Platform', '#platform'],
  ['Memory', '#memory'],
  ['Reports', '#reports'],
]

const FEATURES = [
  {
    icon: FileSearch,
    label: 'Analyze',
    title: 'Static findings become graph evidence',
    body: 'Normalize Slither output into functions, state variables, calls, invariants, and exploit clues that can be retrieved later.',
  },
  {
    icon: BrainCircuit,
    label: 'Recall',
    title: 'Every audit strengthens the next one',
    body: 'WyrmKeep remembers abstract exploit patterns and causal chains without carrying client-specific source forward.',
  },
  {
    icon: ShieldCheck,
    label: 'Reason',
    title: 'Surface structural risk, not lookalikes',
    body: 'Graph traversal finds matching call ordering, authorization gaps, and broken assumptions across past engagements.',
  },
]

const STATS = [
  ['4.8k+', 'Pattern nodes'],
  ['91%', 'Recall coverage'],
  ['36ms', 'Graph lookup'],
  ['24/7', 'Audit memory'],
]

const ARTICLES = [
  'Causal-chain search for smart contract review',
  'Turning static analysis into reusable memory',
  'Why graph topology beats flat similarity',
]

function Landing() {
  return (
    <main className="wk-landing" id="home">
      <header className="wk-nav">
        <Link to="/" className="wk-brand" aria-label="WyrmKeep home">
          <span className="wk-brand-mark">W</span>
          <span>WyrmKeep</span>
        </Link>

        <nav className="wk-nav-links" aria-label="Landing navigation">
          {NAV_ITEMS.map(([label, href]) => (
            <a key={label} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="wk-nav-actions">
          <Link to="/sign-in/$" className="wk-text-link">
            Sign in
          </Link>
          <Link to="/sign-up/$" className="wk-nav-button">
            Get started
          </Link>
        </div>
      </header>

      <section className="wk-hero" aria-labelledby="hero-title">
        <div className="wk-hero-copy">
          <span className="wk-kicker">
            <Sparkles size={14} />
            Memory-augmented audits
          </span>
          <h1 id="hero-title">The audit engine that never forgets</h1>
          <p>
            WyrmKeep turns smart contract reviews into compounding intelligence:
            structured static analysis, exploit-pattern graphs, and reasoning
            that improves with every engagement.
          </p>
          <div className="wk-hero-actions">
            <Link to="/sign-up/$" className="wk-primary">
              Start auditing
              <ArrowRight size={17} />
            </Link>
            <a href="#platform" className="wk-secondary">
              Explore platform
            </a>
          </div>
        </div>

        <div className="wk-visual" aria-hidden="true">
          <div className="wk-plane wk-plane-a" />
          <div className="wk-plane wk-plane-b" />
          <div className="wk-plane wk-plane-c" />
          {/* <div className="wk-core-node">
            <Boxes size={38} />
          </div> */}
        </div>
      </section>

      <section className="wk-logo-ribbon" aria-label="Supported chains">
        {['Solidity', 'Move', 'Aiken', 'Slither', 'Cognee', 'DASP10'].map(
          (item) => (
            <span key={item}>{item}</span>
          ),
        )}
      </section>

      <section className="wk-section wk-split" id="platform">
        <div className="wk-visual wk-visual-small" aria-hidden="true">
          <div className="wk-plane wk-plane-a" />
          <div className="wk-plane wk-plane-b" />
        </div>
        <div className="wk-section-copy">
          <span className="wk-kicker">Solving</span>
          <h2>Write audit reports with a memory layer underneath</h2>
          <p>
            Feed source, findings, and reviewer notes into a structured graph.
            WyrmKeep reconstructs how similar vulnerability shapes were
            exploited, patched, or dismissed in prior work.
          </p>
          <Link to="/sign-up/$" className="wk-inline-link">
            Build your first memory graph
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      <section className="wk-section wk-stats" id="memory">
        <div className="wk-stat-grid">
          {STATS.map(([value, label]) => (
            <article key={label} className="wk-stat-card">
              <strong>{value}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
        <div className="wk-section-copy">
          <span className="wk-kicker">Stats</span>
          <h2>Trusted memory for high-stakes review teams</h2>
          <p>
            Preserve institutional knowledge across clients, chains, and staff
            turnover while keeping sensitive contract code out of shared recall.
          </p>
          <a href="#reports" className="wk-primary">
            Learn more
            <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <section className="wk-section" id="reports">
        <div className="wk-section-heading">
          <span className="wk-kicker">Technology</span>
          <h2>Graph-native security intelligence</h2>
        </div>
        <div className="wk-feature-grid">
          {FEATURES.map(({ icon: Icon, label, title, body }) => (
            <article key={title} className="wk-feature-card">
              <div className="wk-feature-art">
                <Icon size={30} />
              </div>
              <span>{label}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wk-section wk-split wk-developers">
        <div className="wk-visual wk-visual-small" aria-hidden="true">
          <div className="wk-plane wk-plane-a" />
          <div className="wk-plane wk-plane-c" />
        </div>
        <div className="wk-section-copy">
          <span className="wk-kicker">Developers</span>
          <h2>Built for auditors who need evidence, not noise</h2>
          <p>
            Connect the WyrmKeep API, stream reasoning into your workflow, and
            keep reports grounded in traceable graph context.
          </p>
          <div className="wk-mini-list">
            <span>
              <LockKeyhole size={16} />
              Tenant-scoped recall
            </span>
            <span>
              <DatabaseZap size={16} />
              Cognify pipeline
            </span>
          </div>
        </div>
      </section>

      <section className="wk-section">
        <div className="wk-section-heading">
          <span className="wk-kicker">Notes</span>
          <h2>Latest thinking from WyrmKeep</h2>
        </div>
        <div className="wk-article-grid">
          {ARTICLES.map((title) => (
            <article key={title} className="wk-article-card">
              <div className="wk-card-planes" aria-hidden="true">
                <span />
                <span />
              </div>
              <time>September 18, 2026</time>
              <h3>{title}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="wk-newsletter">
        <h2>Stay informed and never miss a WyrmKeep update</h2>
        <form>
          <input type="email" placeholder="Your email address" />
          <button type="submit">Subscribe</button>
        </form>
      </section>

      <footer className="wk-footer">
        <div>
          <Link to="/" className="wk-brand" aria-label="WyrmKeep home">
            <span className="wk-brand-mark">W</span>
            <span>WyrmKeep</span>
          </Link>
          <p>
            A memory-augmented smart contract audit engine for teams that want
            every review to make the next one sharper.
          </p>
        </div>
        <div>
          <h3>Quick Links</h3>
          <a href="#platform">Platform</a>
          <a href="#memory">Memory</a>
          <a href="#reports">Reports</a>
        </div>
        <div>
          <h3>Product</h3>
          <Link to="/sign-in/$">Sign in</Link>
          <Link to="/sign-up/$">Get started</Link>
          <Link to="/connect">Connect API</Link>
        </div>
      </footer>
    </main>
  )
}
