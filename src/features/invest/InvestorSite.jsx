import { useState, useEffect, useRef, lazy, Suspense } from 'react';

const ConciergeChatPage = lazy(() => import('@/features/concierge/ConciergeChatPage'));

/* ── tiny helpers ─────────────────────────────────────────── */
function Section({ id, children, className = '' }) {
  return (
    <section id={id} className={`px-6 py-20 md:px-16 lg:px-24 ${className}`}>
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

function SectionLabel({ children }) {
  return <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">{children}</p>;
}

function Heading({ children }) {
  return <h2 className="mb-6 text-3xl font-bold text-white md:text-4xl">{children}</h2>;
}

/* ── agent data ───────────────────────────────────────────── */
const AGENTS = [
  { name: 'Member Risk', icon: '🛡️', desc: 'Identifies at-risk members before they resign using cross-domain health scores.', link: '#/demo/save-timeline' },
  { name: 'Service Recovery', icon: '🔧', desc: 'Detects service failures and orchestrates recovery before the member complains twice.', link: '#/demo/split-screen' },
  { name: 'Game Plan', icon: '📋', desc: 'Builds 30-day personalized re-engagement plans for every flagged member.', link: '#/demo/gameplan' },
  { name: 'Weather Cascade', icon: '⛈️', desc: 'Automatically adjusts tee sheets, F&B prep, and member comms when weather changes.', link: '#/demo/weather-cascade' },
  { name: 'Board Report', icon: '📊', desc: 'Generates board-ready retention reports with traced ROI for every intervention.', link: '#/demo/board-report' },
  { name: 'Concierge', icon: '💬', desc: 'Per-member AI concierge that handles reservations, questions, and proactive outreach.', link: '#/concierge' },
  { name: 'Revenue Intel', icon: '💰', desc: 'Surfaces F&B leakage, spend anomalies, and upsell opportunities per member.', link: '#/demo/roi' },
  { name: 'Archetype Engine', icon: '🧬', desc: 'Clusters members into behavioral archetypes for targeted programming.', link: '#/demo/archetype-compare' },
];

/* ── stat card ────────────────────────────────────────────── */
function Stat({ value, label }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-6 text-center">
      <p className="text-3xl font-extrabold text-emerald-400">{value}</p>
      <p className="mt-2 text-sm text-gray-400">{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function InvestorSite() {
  const [showChat, setShowChat] = useState(false);

  /* smooth-scroll helper */
  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
      {/* ── sticky nav ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800 bg-gray-950/90 px-6 py-3 backdrop-blur md:px-16">
        <span className="text-lg font-bold text-white tracking-tight">Swoop Golf</span>
        <div className="hidden gap-6 text-sm text-gray-400 md:flex">
          {['problem', 'solution', 'demo', 'agents', 'numbers', 'market', 'ask'].map(s => (
            <button key={s} onClick={() => scrollTo(s)} className="hover:text-white transition-colors capitalize">{s}</button>
          ))}
        </div>
        <a href="#/concierge" className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500 transition-colors">
          Try the Demo
        </a>
      </nav>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 via-gray-950 to-gray-950" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
            The AI Operating System<br />for Private Clubs
          </h1>
          <p className="mt-6 text-xl text-gray-300 md:text-2xl">
            <span className="text-emerald-400 font-bold">$71/month.</span>{' '}
            <span className="text-emerald-400 font-bold">8 AI agents.</span>{' '}
            <span className="text-emerald-400 font-bold">873:1 ROI.</span>
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => { scrollTo('demo'); setShowChat(true); }}
              className="rounded-xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
            >
              Watch the Live Demo
            </button>
            <button
              onClick={() => scrollTo('ask')}
              className="rounded-xl border border-gray-600 px-8 py-3 text-lg font-semibold text-gray-300 hover:border-gray-400 hover:text-white transition-colors"
            >
              See the Ask
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════ THE PROBLEM ════════════════ */}
      <Section id="problem" className="border-t border-gray-800">
        <SectionLabel>The Problem</SectionLabel>
        <Heading>$2 Billion walks out the door every year</Heading>
        <p className="max-w-3xl text-lg leading-relaxed text-gray-400">
          30,000 private clubs. $26B in annual dues. 8% average churn rate = <span className="text-white font-semibold">$2B walking out the door every year.</span> No club technology platform connects the signals across golf, dining, email, and service to catch members before they leave.
        </p>
      </Section>

      {/* ════════════════ THE SOLUTION ════════════════ */}
      <Section id="solution" className="bg-gray-900/50">
        <SectionLabel>The Solution</SectionLabel>
        <Heading>See It. Fix It. Prove It.</Heading>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { title: 'See It', desc: 'Cross-domain health scores synthesized from 5 data sources — golf, dining, billing, service, and communications — into a single member risk picture.' },
            { title: 'Fix It', desc: 'AI agents that diagnose root causes and propose personalized interventions — automatically, in minutes, not weeks.' },
            { title: 'Prove It', desc: 'Board reports that trace every member save to a specific action, giving leadership the ROI proof they need.' },
          ].map(c => (
            <div key={c.title} className="rounded-xl border border-gray-700 bg-gray-800/60 p-8">
              <h3 className="mb-3 text-xl font-bold text-emerald-400">{c.title}</h3>
              <p className="text-gray-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════════ LIVE DEMO ════════════════ */}
      <Section id="demo" className="border-t border-gray-800">
        <SectionLabel>Live Demo</SectionLabel>
        <Heading>Try it yourself</Heading>
        <p className="mb-8 max-w-2xl text-gray-400">
          You are <span className="text-white font-semibold">James Whitfield</span>, an $18K/yr member with an unresolved complaint. Text the concierge and see how the AI responds in real-time.
        </p>
        {showChat ? (
          <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-gray-700 shadow-2xl" style={{ height: 560 }}>
            <Suspense fallback={<div className="flex h-full items-center justify-center text-gray-500">Loading Concierge...</div>}>
              <ConciergeChatPage />
            </Suspense>
          </div>
        ) : (
          <button
            onClick={() => setShowChat(true)}
            className="mx-auto flex items-center gap-3 rounded-2xl border border-gray-700 bg-gray-800/80 px-10 py-6 text-lg text-gray-300 shadow-xl hover:border-emerald-500 hover:text-white transition-colors"
          >
            <span className="text-3xl">💬</span> Launch Concierge Chat
          </button>
        )}
      </Section>

      {/* ════════════════ THE AGENTS ════════════════ */}
      <Section id="agents" className="bg-gray-900/50">
        <SectionLabel>The Agents</SectionLabel>
        <Heading>8 AI agents working 24/7</Heading>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {AGENTS.map(a => (
            <a
              key={a.name}
              href={a.link}
              className="group rounded-xl border border-gray-700 bg-gray-800/60 p-6 transition-colors hover:border-emerald-500"
            >
              <span className="text-3xl">{a.icon}</span>
              <h3 className="mt-3 text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">{a.name}</h3>
              <p className="mt-2 text-sm text-gray-400 leading-relaxed">{a.desc}</p>
              <span className="mt-3 inline-block text-xs font-semibold text-emerald-500 group-hover:text-emerald-400">See it work &rarr;</span>
            </a>
          ))}
        </div>
      </Section>

      {/* ════════════════ THE NUMBERS ════════════════ */}
      <Section id="numbers" className="border-t border-gray-800">
        <SectionLabel>The Numbers</SectionLabel>
        <Heading>Bottom-up unit economics</Heading>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <Stat value="$9,377/mo" label="F&B leakage identified per club" />
          <Stat value="3 saves" label="First-month member saves ($54K dues protected)" />
          <Stat value="8 min" label="GM time for a 30-day intervention lifecycle" />
          <Stat value="4.2x ROI" label="On $32K annual subscription" />
          <Stat value="$71/mo" label="Infrastructure cost for full agent fleet" />
        </div>
      </Section>

      {/* ════════════════ MARKET SIZE ════════════════ */}
      <Section id="market" className="bg-gray-900/50">
        <SectionLabel>Market Size</SectionLabel>
        <Heading>A $1.5B SaaS opportunity</Heading>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4 text-gray-400 leading-relaxed">
            <p><span className="text-white font-semibold">30,000</span> private clubs in the US</p>
            <p>Average <span className="text-white font-semibold">300 members</span> x <span className="text-white font-semibold">$16K avg dues</span> = $4.8M per club</p>
            <p><span className="text-emerald-400 font-bold">TAM:</span> $1.5B (30K clubs x $500/yr SaaS)</p>
            <p><span className="text-emerald-400 font-bold">SAM:</span> $150M (top 3,000 clubs, $4K/yr premium tier)</p>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-8">
            <h3 className="mb-4 text-lg font-bold text-white">Growth Targets</h3>
            <div className="space-y-3 text-gray-400">
              <div className="flex items-baseline justify-between border-b border-gray-700 pb-2">
                <span>Year 1</span>
                <span className="text-white font-semibold">100 clubs &middot; $400K ARR</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-gray-700 pb-2">
                <span>Year 2</span>
                <span className="text-white font-semibold">500 clubs &middot; $2M ARR</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span>Year 3</span>
                <span className="text-white font-semibold">2,000 clubs &middot; $10M ARR</span>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ════════════════ THE ASK ════════════════ */}
      <Section id="ask" className="border-t border-gray-800">
        <SectionLabel>The Ask</SectionLabel>
        <Heading>Seed Round: $250,000</Heading>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4 text-gray-400 leading-relaxed">
            <h3 className="text-lg font-bold text-white">Use of Funds</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>2 engineers (6 months)</li>
              <li>5 pilot club onboarding</li>
              <li>Conference demos &amp; sales collateral</li>
            </ul>
          </div>
          <div className="space-y-4 text-gray-400 leading-relaxed">
            <h3 className="text-lg font-bold text-white">Terms</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li><span className="text-white font-semibold">Valuation:</span> $2.5M pre-money</li>
              <li><span className="text-white font-semibold">Offer:</span> 10% equity for $250K</li>
              <li><span className="text-white font-semibold">Milestone — 6 months:</span> 10 paying clubs</li>
              <li><span className="text-white font-semibold">Milestone — 12 months:</span> $500K ARR</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* ════════════════ COMPETITIVE MOAT ════════════════ */}
      <Section id="moat" className="bg-gray-900/50">
        <SectionLabel>Competitive Moat</SectionLabel>
        <Heading>Why no one else can do this</Heading>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            { title: 'Layer 3 Intelligence', desc: 'No competitor connects 5+ data domains into a single member risk model.' },
            { title: 'Per-Member AI Concierge', desc: 'No competitor has a member-facing AI that handles reservations and proactive outreach.' },
            { title: 'Agent-to-Agent Coordination', desc: 'No competitor has multi-agent orchestration where agents hand off context to each other.' },
            { title: '$71/mo Infrastructure', desc: '10x cheaper than any comparable platform. AI-native architecture, not bolted-on features.' },
          ].map(m => (
            <div key={m.title} className="rounded-xl border border-gray-700 bg-gray-800/60 p-6">
              <h3 className="mb-2 text-lg font-bold text-emerald-400">{m.title}</h3>
              <p className="text-gray-400 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ════════════════ FOUNDER ════════════════ */}
      <Section id="founder" className="border-t border-gray-800">
        <SectionLabel>Founder</SectionLabel>
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-800 text-3xl font-bold text-emerald-400 shrink-0">
            S
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Swoop Golf — Founder</h3>
            <p className="mt-2 max-w-xl text-gray-400 leading-relaxed">
              Building the AI operating system for private clubs. Background in club operations, SaaS, and applied AI. Passionate about turning member data into member retention.
            </p>
            <a
              href="mailto:hello@swoopgolf.com"
              className="mt-6 inline-block rounded-xl bg-emerald-600 px-8 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-colors"
            >
              Schedule a Call
            </a>
          </div>
        </div>
      </Section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="border-t border-gray-800 px-6 py-12 md:px-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="text-lg font-bold text-white">Swoop Golf</span>
              <p className="mt-1 text-sm text-gray-500">Integrated Intelligence for Private Clubs</p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <a href="#/demo/save-timeline" className="hover:text-white transition-colors">Save Timeline</a>
              <a href="#/demo/split-screen" className="hover:text-white transition-colors">Split Screen</a>
              <a href="#/demo/gameplan" className="hover:text-white transition-colors">Game Plan</a>
              <a href="#/demo/weather-cascade" className="hover:text-white transition-colors">Weather</a>
              <a href="#/demo/board-report" className="hover:text-white transition-colors">Board Report</a>
              <a href="#/demo/roi" className="hover:text-white transition-colors">ROI</a>
              <a href="#/concierge" className="hover:text-white transition-colors">Concierge</a>
            </div>
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-gray-800 pt-6 text-xs text-gray-600">
            <span>Powered by Anthropic Claude</span>
            <span>&copy; {new Date().getFullYear()} Swoop Golf. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
