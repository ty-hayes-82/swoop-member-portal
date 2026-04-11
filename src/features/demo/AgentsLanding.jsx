/**
 * AgentsLanding — "Seven agents. One team. Working while you sleep."
 * Route: #/demo/agents-landing
 *
 * Standalone dark-themed page showcasing the AI Agent Fleet.
 * Matches the swoop-agents-landing design from the conference deck.
 */

const AGENTS = [
  {
    name: "Tomorrow's Game Plan",
    frequency: 'RUNS DAILY AT 5 AM',
    freqColor: 'amber',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center text-lg">
        📋
      </div>
    ),
    description:
      "Pulls tomorrow's tee sheet, weather, staffing, reservations, and at-risk members. Produces one prioritized briefing: where will today break, and what should you do about it?",
    tags: ['Tee Sheet', 'Weather', 'Staffing', 'F&B', 'Member Risk'],
  },
  {
    name: 'Member Risk Lifecycle',
    frequency: 'ALWAYS MONITORING',
    freqColor: 'red',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center text-lg">
        🛡️
      </div>
    ),
    description:
      "Detects when a member's engagement is declining across golf, dining, email, and events. Diagnoses the cause, proposes the right intervention for their archetype, and follows up at Day 7, 14, and 30.",
    tags: ['CRM', 'Tee Sheet', 'POS', 'Email', 'Events'],
  },
  {
    name: 'Service Recovery',
    frequency: 'EVENT-TRIGGERED',
    freqColor: 'red',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center text-lg">
        🔧
      </div>
    ),
    description:
      'When a high-value member files a complaint, this agent owns the full resolution lifecycle. Routes to the right department, alerts the GM with talking points, escalates if unresolved, and measures the outcome.',
    tags: ['Complaints', 'CRM', 'POS', 'Staff'],
  },
  {
    name: 'Staffing-Demand Alignment',
    frequency: 'EVERY 6 HOURS',
    freqColor: 'blue',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-lg">
        📊
      </div>
    ),
    description:
      "Monitors the gap between scheduled staff and forecasted demand across every outlet. Doesn't just say \"understaffed.\" Says \"understaffed + weather shift + high-value member dining = $2,800 at risk.\"",
    tags: ['Scheduling', 'Tee Sheet', 'Weather', 'POS'],
  },
  {
    name: 'F&B Intelligence',
    frequency: 'DAILY ANALYSIS',
    freqColor: 'emerald',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-emerald-500/15 flex items-center justify-center text-lg">
        🍽️
      </div>
    ),
    description:
      'Finds the root cause of margin compression: is it food cost, labor, demand, or menu mix? Identifies golfers who never dine and proposes conversion strategies that have worked before.',
    tags: ['POS', 'Staffing', 'Weather', 'Tee Sheet'],
  },
  {
    name: 'Board Report Compiler',
    frequency: 'MONTHLY',
    freqColor: 'violet',
    icon: (
      <div className="w-10 h-10 rounded-lg bg-violet-500/15 flex items-center justify-center text-lg">
        📈
      </div>
    ),
    description:
      'Pulls every intervention, staffing adjustment, and revenue outcome from the past 30 days. Produces a draft narrative board report with attribution: which actions protected which dollars. You edit and send.',
    tags: ['All Sources', 'Intervention Log', 'Revenue Attribution'],
  },
];

const FREQ_COLORS = {
  amber: 'text-amber-400',
  red: 'text-red-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  violet: 'text-violet-400',
};

const TAG_STYLES = 'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide bg-white/[0.06] text-gray-400 border border-white/[0.08]';

function AgentCard({ agent }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start gap-3.5 mb-3">
        {agent.icon}
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-bold text-white leading-tight">{agent.name}</div>
          <div className={`text-[10px] font-bold uppercase tracking-[0.15em] mt-0.5 ${FREQ_COLORS[agent.freqColor]}`}>
            {agent.frequency}
          </div>
        </div>
      </div>
      <p className="text-[13px] text-gray-400 leading-relaxed mb-4">
        {agent.description}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {agent.tags.map(tag => (
          <span key={tag} className={TAG_STYLES}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

export default function AgentsLanding() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #111318 50%, #0d0d12 100%)' }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 md:px-8">
        <div className="text-lg font-bold text-white tracking-tight">swoop.</div>
        <a
          href="#/concierge"
          className="px-4 py-1.5 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-400 transition-colors no-underline"
        >
          Book a Demo
        </a>
      </header>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-10 md:pt-20 md:pb-14 text-center">
        <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-4">
          AI Agent Fleet
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-[1.15] mb-5">
          Seven agents. One team.<br />
          Working while you sleep.
        </h1>
        <p className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
          Each agent monitors a different dimension of your club operation. They share data,
          resolve conflicts, and present a single coordinated action plan every morning. You
          approve. They execute.
        </p>
      </div>

      {/* Agent Cards */}
      <div className="max-w-2xl mx-auto px-5 pb-8 space-y-4">
        {AGENTS.map(agent => (
          <AgentCard key={agent.name} agent={agent} />
        ))}
      </div>

      {/* Chief of Staff — special treatment */}
      <div className="max-w-2xl mx-auto px-5 pb-16">
        <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/40 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <span className="text-amber-400 text-lg">⭐</span>
            </div>
            <div>
              <div className="text-[15px] font-bold text-white">Chief of Staff</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400 mt-0.5">
                Orchestrator · Runs After All Agents
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-[13px] text-gray-400 leading-relaxed">
                The meta-agent. Reviews all pending actions from all agents, detects
                conflicts, deduplicates, and ranks by impact. Instead of 12
                disconnected alerts, your GM gets 3–5 coordinated recommendations
                with clear provenance: which agents contributed, what data they used,
                and why this action matters now.
              </p>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Deduplicates', desc: 'Merges overlapping recommendations into one action' },
                { label: 'Resolves', desc: 'When two agents disagree, picks the higher-impact option' },
                { label: 'Prioritizes', desc: 'Ranks by dollar risk, time sensitivity, and confidence' },
                { label: 'Attributes', desc: 'Every recommendation shows which agents and data contributed' },
              ].map(item => (
                <div key={item.label} className="flex gap-2">
                  <span className="text-amber-400 text-[12px] font-bold shrink-0 w-24">{item.label}</span>
                  <span className="text-[12px] text-gray-500 leading-snug">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-10 text-xs text-gray-600">
        Swoop Golf · AI Agent Platform
      </div>
    </div>
  );
}
