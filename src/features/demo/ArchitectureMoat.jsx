/**
 * ArchitectureMoat — Technical architecture + moat evidence.
 * Route: #/demo/architecture
 * Target: Investor 3 (Technical CTO, needs moat proof)
 */
import { useState } from 'react';

const AGENTS = [
  { id: 'concierge', label: 'Concierge Agent', desc: 'Member-facing conversational AI', color: '#10b981' },
  { id: 'bridge', label: 'Bridge Agent', desc: 'Cross-system data orchestration', color: '#3b82f6' },
  { id: 'retention', label: 'Retention Agent', desc: 'Churn prediction + intervention', color: '#f59e0b' },
  { id: 'onboarding', label: 'Onboarding Agent', desc: 'New member activation flows', color: '#8b5cf6' },
  { id: 'revenue', label: 'Revenue Agent', desc: 'Spend pattern + upsell signals', color: '#ec4899' },
  { id: 'service', label: 'Service Agent', desc: 'Issue detection + resolution', color: '#06b6d4' },
  { id: 'engagement', label: 'Engagement Agent', desc: 'Activity scoring + nudges', color: '#84cc16' },
  { id: 'cos', label: 'Chief of Staff', desc: 'Agent-to-agent coordination', color: '#f97316' },
];

const TOOLS = [
  'analyzeMemberRisk', 'generateOutreach', 'classifyFeedback', 'predictChurn',
  'scoreMemberHealth', 'detectUsageAnomaly', 'suggestIntervention', 'buildBoardReport',
  'forecastRetention', 'segmentMembers', 'rankAtRiskMembers', 'generateGamePlan',
  'analyzeWeatherImpact', 'optimizeTeeSheet', 'matchMemberArchetype', 'triggerPlaybook',
  'syncCRM', 'importCSV', 'mapIntegration', 'validateData',
  'composeSMS', 'composeEmail', 'scheduleFollowUp', 'logInteraction',
  'calculateROI', 'benchmarkClub', 'trendAnalysis', 'cohortAnalysis',
  'getMemberProfile', 'getMemberHistory', 'getClubMetrics', 'getRevenueSummary',
  'getTeeSheetData', 'getFeedbackLog', 'getServiceQueue', 'getPlaybooks',
  'updateMemberNote', 'createTask', 'assignAction', 'escalateIssue',
  'generateReport', 'exportData', 'auditTrail', 'healthCheck',
  'configureAlerts', 'managePermissions',
];

const TEST_COVERAGE = {
  unit: 118,
  integration: 13,
  conversation: 10,
  total: 141,
};

const REPLICATION_PHASES = [
  { phase: 'MCP Server + Tool Layer', months: '0-3', effort: '3 months', bar: 17 },
  { phase: 'Agent System Prompts (8 agents, ~2,500 tokens each)', months: '3-6', effort: '3 months', bar: 33 },
  { phase: 'Agent Coordination Protocol', months: '6-9', effort: '3 months', bar: 50 },
  { phase: 'Club Domain Training Data', months: '9-13', effort: '4 months', bar: 72 },
  { phase: 'Integration Layer (POS, CRM, Tee Sheet)', months: '13-16', effort: '3 months', bar: 89 },
  { phase: 'Testing + Production Hardening', months: '16-18+', effort: '2+ months', bar: 100 },
];

function Section({ title, children }) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 sm:p-6 space-y-4">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function ArchitectureMoat() {
  const [showAllTools, setShowAllTools] = useState(false);
  const visibleTools = showAllTools ? TOOLS : TOOLS.slice(0, 20);

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 40%, #1a1a2e 100%)' }}
    >
      <button
        type="button"
        onClick={() => { window.location.hash = '#/demo/mobile-showcase'; }}
        className="absolute top-4 left-4 text-sm text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer"
      >
        &larr; Back
      </button>

      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-3 pt-8">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">Swoop Golf</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Technical Architecture &amp; Moat</h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            Multi-agent AI system purpose-built for private club operations. 18+ months to replicate.
          </p>
        </div>

        {/* Complexity KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'MCP Tools', value: '46', color: 'text-emerald-400' },
            { label: 'AI Agents', value: '8', color: 'text-blue-400' },
            { label: 'Avg Prompt Size', value: '2,500 tok', color: 'text-amber-400' },
            { label: 'Test Coverage', value: `${TEST_COVERAGE.total} tests`, color: 'text-white' },
          ].map((kpi, i) => (
            <div key={i} className="bg-gray-900/60 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500 mb-2">{kpi.label}</div>
              <div className={`text-xl sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Architecture Diagram */}
        <Section title="System Architecture">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] space-y-4">
              {/* MCP Server layer */}
              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">MCP Server</div>
                <div className="text-sm text-white font-semibold">Model Context Protocol — Tool Orchestration Layer</div>
              </div>

              <div className="flex justify-center">
                <div className="w-px h-6 bg-gray-700" />
              </div>

              {/* Agent grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AGENTS.map(agent => (
                  <div key={agent.id} className="rounded-lg p-3 border" style={{ borderColor: agent.color + '40', backgroundColor: agent.color + '10' }}>
                    <div className="text-xs font-bold" style={{ color: agent.color }}>{agent.label}</div>
                    <div className="text-[11px] text-gray-400 mt-1">{agent.desc}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="w-px h-6 bg-gray-700" />
              </div>

              {/* Tool layer */}
              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tool Layer</div>
                <div className="text-sm text-white font-semibold">46 MCP Tools</div>
              </div>

              <div className="flex justify-center">
                <div className="w-px h-6 bg-gray-700" />
              </div>

              {/* Database */}
              <div className="bg-gray-800/60 rounded-lg p-4 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Data Layer</div>
                <div className="text-sm text-white font-semibold">PostgreSQL + Vector Store + Integration APIs</div>
              </div>
            </div>
          </div>
        </Section>

        {/* Agent Coordination */}
        <Section title="Agent-to-Agent Coordination">
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              <svg viewBox="0 0 500 200" className="w-full">
                {/* Concierge */}
                <rect x="180" y="10" width="140" height="36" rx="8" fill="#10b98120" stroke="#10b981" strokeWidth="1.5" />
                <text x="250" y="33" textAnchor="middle" className="text-[11px] fill-emerald-400 font-semibold">Concierge Agent</text>

                {/* Arrow down */}
                <line x1="250" y1="46" x2="250" y2="70" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* Bridge */}
                <rect x="180" y="70" width="140" height="36" rx="8" fill="#3b82f620" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="250" y="93" textAnchor="middle" className="text-[11px] fill-blue-400 font-semibold">Bridge Agent</text>

                {/* Arrows to club agents */}
                <line x1="200" y1="106" x2="90" y2="140" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <line x1="250" y1="106" x2="250" y2="140" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <line x1="300" y1="106" x2="410" y2="140" stroke="#4b5563" strokeWidth="1.5" markerEnd="url(#arrow)" />

                {/* Club agents */}
                <rect x="20" y="140" width="140" height="36" rx="8" fill="#f59e0b20" stroke="#f59e0b" strokeWidth="1.5" />
                <text x="90" y="163" textAnchor="middle" className="text-[11px] fill-amber-400 font-semibold">Retention Agent</text>

                <rect x="180" y="140" width="140" height="36" rx="8" fill="#8b5cf620" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="250" y="163" textAnchor="middle" className="text-[11px] fill-purple-400 font-semibold">Service Agent</text>

                <rect x="340" y="140" width="140" height="36" rx="8" fill="#ec489920" stroke="#ec4899" strokeWidth="1.5" />
                <text x="410" y="163" textAnchor="middle" className="text-[11px] fill-pink-400 font-semibold">Revenue Agent</text>

                {/* Chief of Staff - oversight line */}
                <rect x="340" y="10" width="130" height="36" rx="8" fill="#f9731620" stroke="#f97316" strokeWidth="1.5" />
                <text x="405" y="33" textAnchor="middle" className="text-[11px] fill-orange-400 font-semibold">Chief of Staff</text>
                <line x1="340" y1="28" x2="320" y2="28" stroke="#f97316" strokeWidth="1" strokeDasharray="4 3" />
                <line x1="340" y1="28" x2="340" y2="88" stroke="#f97316" strokeWidth="1" strokeDasharray="4 3" />

                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#4b5563" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
          <p className="text-sm text-gray-400">
            The Chief of Staff agent monitors all inter-agent communication, resolves conflicts,
            and ensures coordinated member outreach. No single agent acts in isolation.
          </p>
        </Section>

        {/* Tool inventory */}
        <Section title="MCP Tool Inventory (46 tools)">
          <div className="flex flex-wrap gap-2">
            {visibleTools.map(tool => (
              <span key={tool} className="px-2.5 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 font-mono">
                {tool}
              </span>
            ))}
          </div>
          {!showAllTools && (
            <button
              onClick={() => setShowAllTools(true)}
              className="text-sm text-emerald-400 hover:text-emerald-300 bg-transparent border-none cursor-pointer p-0"
            >
              Show all 46 tools
            </button>
          )}
        </Section>

        {/* Test coverage */}
        <Section title="Test Coverage">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Unit Tests', count: TEST_COVERAGE.unit, color: '#10b981' },
              { label: 'Integration Tests', count: TEST_COVERAGE.integration, color: '#3b82f6' },
              { label: 'Conversation Cycles', count: TEST_COVERAGE.conversation, color: '#f59e0b' },
            ].map(t => (
              <div key={t.label} className="bg-gray-800/60 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">{t.label}</span>
                  <span className="text-lg font-bold text-white">{t.count}</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(t.count / TEST_COVERAGE.unit) * 100}%`, backgroundColor: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Competitor replication timeline */}
        <Section title="Competitor Replication Timeline">
          <p className="text-sm text-gray-400 mb-4">
            Estimated time for a well-funded competitor to rebuild Swoop's system from scratch,
            assuming a 4-person senior engineering team with AI/ML experience.
          </p>
          <div className="space-y-3">
            {REPLICATION_PHASES.map((phase, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-300">{phase.phase}</span>
                  <span className="text-gray-500">{phase.effort}</span>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                    style={{ width: `${phase.bar}%` }}
                  />
                </div>
                <div className="text-[10px] text-gray-600">Months {phase.months}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">18+ months</div>
            <div className="text-sm text-gray-400">minimum replication time, assuming no domain expertise</div>
          </div>
        </Section>

        <div className="text-center text-xs text-gray-600 pb-8">
          Confidential — Swoop Golf Inc. Technical Due Diligence
        </div>
      </div>
    </div>
  );
}
