import { useState, useEffect, useRef, lazy, Suspense, useCallback } from 'react';

const ConciergeChatPage = lazy(() => import('@/features/concierge/ConciergeChatPage'));

/* ── scroll-reveal hook ──────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────── */
function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

/* ── agent data ──────────────────────────────────────────── */
const AGENTS = [
  { name: "Tomorrow's Game Plan", icon: '\u{1F4CB}', desc: "Pulls tomorrow's tee sheet, weather, staffing, and at-risk members into one prioritized morning briefing.", link: '#/demo/gameplan' },
  { name: 'Member Risk Lifecycle', icon: '\u{1F6E1}\uFE0F', desc: 'Detects declining engagement across golf, dining, and events. Diagnoses cause, proposes intervention, follows up at Day 7/14/30.', link: '#/demo/save-timeline' },
  { name: 'Service Recovery', icon: '\u{1F527}', desc: 'Owns the full resolution lifecycle when a high-value member files a complaint. Routes, alerts, escalates, measures.', link: '#/demo/split-screen' },
  { name: 'Staffing-Demand', icon: '\u{1F4CA}', desc: "Monitors the gap between scheduled staff and forecasted demand. Connects understaffing to dollar risk per outlet.", link: '#/demo/weather-cascade' },
  { name: 'F&B Intelligence', icon: '\u{1F37D}\uFE0F', desc: 'Finds the root cause of margin compression -- food cost, labor, demand, or menu mix -- and proposes conversion strategies.', link: '#/demo/roi' },
  { name: 'Board Report Compiler', icon: '\u{1F4C8}', desc: 'Produces a draft narrative board report with attribution: which actions protected which dollars over the past 30 days.', link: '#/demo/board-report' },
  { name: 'Chief of Staff', icon: '\u2B50', desc: 'The meta-agent. Deduplicates across all agents, resolves conflicts, and ranks 3-5 coordinated recommendations by impact.', link: '#/demo/agents-landing' },
];

const DEMO_LINKS = [
  { label: 'Concierge Chat', href: '#/concierge', desc: 'Text the AI concierge as a real member' },
  { label: 'Weather Cascade', href: '#/demo/weather-cascade', desc: 'Watch agents coordinate around a storm' },
  { label: 'Game Plan', href: '#/demo/gameplan', desc: '30-day re-engagement plan builder' },
  { label: 'Split Screen', href: '#/demo/split-screen', desc: 'Before/after service recovery flow' },
  { label: 'Save Timeline', href: '#/demo/save-timeline', desc: 'Full member-save lifecycle visualization' },
  { label: 'Board Report', href: '#/demo/board-report', desc: 'Auto-generated board retention report' },
  { label: 'Archetype Compare', href: '#/demo/archetype-compare', desc: 'Behavioral archetype clustering' },
  { label: 'Pilot Results', href: '#/demo/pilot-results', desc: 'ROI and pilot club metrics' },
  { label: 'Architecture', href: '#/demo/architecture', desc: 'System architecture deep-dive' },
  { label: 'Technical Deep-Dive', href: '#/demo/technical-deep-dive', desc: 'Agent coordination and MCP tools' },
  { label: 'ROI Slide', href: '#/demo/roi', desc: 'Single-slide investment summary' },
  { label: 'Agent Fleet', href: '#/demo/agents-landing', desc: '7 autonomous agents — the full AI team' },
];

const SUGGESTED_MESSAGES = [
  'Book me a tee time Saturday morning',
  'My last dinner was terrible',
  'What events are coming up?',
  'I want to cancel my membership',
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function InvestorSite() {
  const [chatLoaded, setChatLoaded] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased selection:bg-emerald-500/30">

      {/* ── sticky nav ─── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-800/60 bg-gray-950/80 px-5 py-3 backdrop-blur-xl md:px-12">
        <span className="text-lg font-bold tracking-tight text-white">Swoop Golf</span>
        <div className="hidden gap-5 text-sm text-gray-500 md:flex">
          {['problem', 'demo', 'how', 'numbers', 'agents', 'market', 'moat', 'ask'].map(s => (
            <button key={s} onClick={() => scrollTo(s)} className="capitalize transition-colors hover:text-white">{s}</button>
          ))}
        </div>
        <button
          onClick={() => { scrollTo('demo'); setChatLoaded(true); }}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
        >
          Try Demo
        </button>
      </nav>

      {/* ════════════════ 1. HERO (100vh) ════════════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* animated grid bg */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'linear-gradient(rgba(16,185,129,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,.6) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl">
          <Reveal>
            <h1 className="text-5xl font-extrabold leading-[1.08] tracking-tight text-white md:text-7xl lg:text-8xl">
              The AI Operating System<br className="hidden sm:block" /> for Private Clubs
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-8 max-w-2xl text-lg text-gray-400 md:text-xl">
              <span className="font-semibold text-emerald-400">7 autonomous agents.</span>{' '}
              <span className="font-semibold text-white">$9,377/mo</span> in recoverable revenue per club.{' '}
              <span className="font-semibold text-white">$71/month</span> to run.
            </p>
          </Reveal>
          <Reveal delay={300}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => { scrollTo('demo'); setChatLoaded(true); }}
                className="rounded-xl bg-emerald-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500"
              >
                Try the Live Demo &rarr;
              </button>
              <button
                onClick={() => scrollTo('numbers')}
                className="rounded-xl border border-gray-700 px-8 py-3.5 text-lg font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
              >
                See the Numbers &rarr;
              </button>
            </div>
          </Reveal>
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m0 0l-6-6m6 6l6-6" /></svg>
        </div>
      </section>

      {/* ════════════════ 2. THE PROBLEM ════════════════ */}
      <section id="problem" className="relative overflow-hidden bg-gradient-to-b from-red-950/20 via-amber-950/10 to-gray-950 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="text-6xl font-black text-red-400 md:text-8xl">$2.1B</p>
            <p className="mt-4 text-xl font-semibold text-gray-200 md:text-2xl">in annual member dues lost to preventable churn</p>
          </Reveal>
          <Reveal delay={200}>
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                { stat: '30,000', label: 'private clubs in the US' },
                { stat: '8%', label: 'average annual churn rate' },
                { stat: '$16,400', label: 'average annual dues per member' },
              ].map(s => (
                <div key={s.stat} className="rounded-xl border border-red-900/30 bg-red-950/10 p-6 text-center">
                  <p className="text-3xl font-extrabold text-amber-400">{s.stat}</p>
                  <p className="mt-2 text-sm text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={350}>
            <div className="mt-10 space-y-3 text-lg text-gray-400">
              <p>Every club runs <span className="text-white font-semibold">5-7 disconnected systems</span>. No one connects the signals.</p>
              <p>By the time a GM notices a member disengaging, it's <span className="text-red-400 font-semibold">6-8 weeks too late</span>.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ 3. THE DEMO ════════════════ */}
      <section id="demo" className="border-t border-gray-800/60 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-emerald-400">Live Demo</p>
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Text the AI concierge
            </h2>
            <p className="mt-4 text-gray-400">
              You are <span className="font-semibold text-white">James Whitfield</span>, an $18K/yr member. See how the AI responds in real-time.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-10">
              {chatLoaded ? (
                <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-gray-700 shadow-2xl shadow-emerald-900/10" style={{ maxHeight: 400 }}>
                  <Suspense fallback={<div className="flex h-64 items-center justify-center text-gray-500">Loading Concierge...</div>}>
                    <ConciergeChatPage />
                  </Suspense>
                </div>
              ) : (
                <button
                  onClick={() => setChatLoaded(true)}
                  className="mx-auto flex items-center gap-3 rounded-2xl border border-gray-700 bg-gray-900/80 px-10 py-6 text-lg text-gray-300 shadow-xl transition-all hover:border-emerald-500 hover:shadow-emerald-900/20 hover:text-white"
                >
                  <span className="text-3xl">{'\u{1F4AC}'}</span> Launch Concierge Chat
                </button>
              )}

              {/* suggested messages */}
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {SUGGESTED_MESSAGES.map(m => (
                  <span
                    key={m}
                    className="rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-sm text-gray-400"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ 4. HOW IT WORKS ════════════════ */}
      <section id="how" className="bg-gray-900/40 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">How It Works</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Three steps. Zero IT lift.</h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Import your data',
                desc: 'CSV or API from Jonas, ForeTees, Toast, 7shifts. Health scores computed in minutes.',
                icon: '\u{1F4E5}',
              },
              {
                step: '02',
                title: 'Agents activate',
                desc: '7 AI agents analyze every member across 5 data domains. Risks flagged, plans built.',
                icon: '\u{1F916}',
              },
              {
                step: '03',
                title: 'GM gets the Game Plan',
                desc: 'Today View shows priority items. 8 minutes of GM time drives 30-day save lifecycle.',
                icon: '\u{1F3AF}',
              },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 150}>
                <div className="relative rounded-xl border border-gray-700 bg-gray-800/40 p-8">
                  <span className="text-4xl">{s.icon}</span>
                  <p className="mt-4 text-xs font-bold uppercase tracking-widest text-emerald-500">Step {s.step}</p>
                  <h3 className="mt-2 text-xl font-bold text-white">{s.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 5. THE NUMBERS ════════════════ */}
      <section id="numbers" className="border-t border-gray-800/60 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">The Numbers</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Bottom-up unit economics</h2>
          </Reveal>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { value: '$342K', label: 'Dues protected across 3 pilot clubs in 90 days' },
              { value: '4.2x', label: 'ROI ($133K protected / $32K subscription)' },
              { value: '8 min', label: 'Total GM time for a 30-day save lifecycle' },
              { value: '118', label: 'Automated tests, all passing' },
              { value: '46', label: 'MCP tools on the shared AI server' },
              { value: '$71/mo', label: 'Infrastructure cost for the full agent fleet' },
            ].map((s, i) => (
              <Reveal key={s.value} delay={i * 80}>
                <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-8 text-center">
                  <p className="text-4xl font-black text-emerald-400 md:text-5xl">{s.value}</p>
                  <p className="mt-3 text-sm text-gray-400">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 6. THE AGENTS ════════════════ */}
      <section id="agents" className="bg-gray-900/40 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">The Agents</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">7 AI agents working 24/7</h2>
          </Reveal>
          {/* horizontal scroll on mobile, grid on desktop */}
          <div className="mt-12 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
            {AGENTS.map((a, i) => (
              <Reveal key={a.name} delay={i * 60}>
                <a
                  href={a.link}
                  className="group flex min-w-[220px] shrink-0 snap-start flex-col rounded-xl border border-gray-700 bg-gray-800/40 p-6 transition-all hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/10 md:min-w-0"
                >
                  <span className="text-3xl">{a.icon}</span>
                  <h3 className="mt-3 text-base font-bold text-white transition-colors group-hover:text-emerald-400">{a.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-400">{a.desc}</p>
                  <span className="mt-auto pt-4 text-xs font-semibold text-emerald-500 transition-colors group-hover:text-emerald-400">See it live &rarr;</span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 7. MARKET OPPORTUNITY ════════════════ */}
      <section id="market" className="border-t border-gray-800/60 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">Market Opportunity</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">A $1.5B SaaS opportunity</h2>
          </Reveal>
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            <Reveal delay={100}>
              <div className="space-y-5">
                {[
                  { label: 'TAM', value: '$1.5B', desc: '30K clubs x $500/yr' },
                  { label: 'SAM', value: '$150M', desc: '3K premium clubs x $4K/yr' },
                ].map(m => (
                  <div key={m.label} className="rounded-xl border border-gray-700 bg-gray-800/40 p-6">
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">{m.label}</span>
                      <span className="text-3xl font-black text-white">{m.value}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-400">{m.desc}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={250}>
              <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-8">
                <h3 className="mb-6 text-lg font-bold text-white">Growth Trajectory</h3>
                <div className="space-y-4">
                  {[
                    { year: 'Year 1', clubs: '100 clubs', arr: '$400K ARR', width: '10%' },
                    { year: 'Year 2', clubs: '500 clubs', arr: '$2M ARR', width: '30%' },
                    { year: 'Year 3', clubs: '2,000 clubs', arr: '$10M ARR', width: '100%' },
                  ].map(g => (
                    <div key={g.year}>
                      <div className="mb-1 flex items-baseline justify-between text-sm">
                        <span className="text-gray-400">{g.year}</span>
                        <span className="font-semibold text-white">{g.clubs} &middot; {g.arr}</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-700">
                        <div className="h-full rounded-full bg-emerald-500 transition-all duration-1000" style={{ width: g.width }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ════════════════ 8. COMPETITIVE MOAT ════════════════ */}
      <section id="moat" className="bg-gray-900/40 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">Competitive Moat</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Why no one else can do this</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              { title: 'Layer 3 Intelligence', desc: 'Connects 5+ data domains no competitor touches into a single member risk model.' },
              { title: 'Per-Member AI', desc: '300 personalized concierges per club. Not a chatbot -- a relationship manager.' },
              { title: 'Agent Coordination', desc: 'Chief of Staff deduplicates across all agents. No alert fatigue, no noise.' },
              { title: '$71/month', desc: '10x cheaper than any comparable platform. AI-native architecture, not bolted-on features.' },
            ].map((m, i) => (
              <Reveal key={m.title} delay={i * 100}>
                <div className="rounded-xl border border-gray-700 bg-gray-800/40 p-8">
                  <h3 className="text-lg font-bold text-emerald-400">{m.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-400">{m.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 9. THE ASK ════════════════ */}
      <section id="ask" className="border-t border-gray-800/60 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-3xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">The Ask</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Seed Round</h2>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-12 rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-950/20 to-gray-900/80 p-10 shadow-xl shadow-emerald-900/10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Raising</p>
                  <p className="mt-1 text-4xl font-black text-white">$250K</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Valuation</p>
                  <p className="mt-1 text-4xl font-black text-white">$2.5M</p>
                  <p className="mt-1 text-sm text-gray-400">pre-money</p>
                </div>
              </div>
              <hr className="my-8 border-gray-700" />
              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Use of Funds</p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-300">
                    <li>2 engineers (6 months)</li>
                    <li>5 pilot club onboarding</li>
                    <li>Conference demos and sales</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">6-Month Milestone</p>
                  <p className="mt-3 text-2xl font-bold text-white">10 paying clubs</p>
                </div>
              </div>
              <div className="mt-10 text-center">
                <a
                  href="mailto:hello@swoopgolf.com?subject=Swoop%20Golf%20-%20Investor%20Inquiry"
                  className="inline-block rounded-xl bg-emerald-600 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-500"
                >
                  Schedule a Call &rarr;
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════ 10. LIVE DEMO LINKS ════════════════ */}
      <section className="bg-gray-900/40 px-6 py-24 md:px-16">
        <div className="mx-auto max-w-6xl">
          <Reveal>
            <p className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-emerald-400">Explore</p>
            <h2 className="text-center text-3xl font-bold text-white md:text-4xl">Live Demo Links</h2>
          </Reveal>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEMO_LINKS.map((d, i) => (
              <Reveal key={d.label} delay={i * 50}>
                <a
                  href={d.href}
                  className="group flex items-start gap-4 rounded-xl border border-gray-700 bg-gray-800/40 p-5 transition-all hover:border-emerald-500"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white transition-colors group-hover:text-emerald-400">{d.label}</p>
                    <p className="mt-1 text-sm text-gray-400">{d.desc}</p>
                  </div>
                  <span className="ml-auto mt-1 shrink-0 text-gray-600 transition-colors group-hover:text-emerald-400">&rarr;</span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ 11. FOOTER ════════════════ */}
      <footer className="border-t border-gray-800/60 px-6 py-10 md:px-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-gray-500">
            Built with Anthropic Claude &middot; 46 MCP tools &middot; 118 tests &middot; Open to technical due diligence
          </p>
          <p className="mt-2 text-xs text-gray-700">
            &copy; {new Date().getFullYear()} Swoop Golf. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
