import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { getResignationScenarios } from '@/services/memberService';
const DOMAIN_COLORS = {
  Golf: '#22c55e',
  'F&B': '#f59e0b',
  Email: '#ff8b00',
  Feedback: '#ef4444',
  All: '#9CA3AF',
  Membership: '#ef4444',
};

const AGENT_ANNOTATIONS = {
  mbr_042: { date: 'Jan 5', note: 'Engagement Autopilot flagged multi-domain decay and proposed a re-activation invite. Action dismissed.' },
  mbr_117: { date: 'Jan 12', note: 'Member Pulse flagged complete disengagement and recommended personal GM outreach. Not actioned.' },
  mbr_203: { date: 'Jan 13', note: 'Service Recovery + Member Pulse flagged unresolved complaint with high resignation probability. Not actioned.' },
  mbr_089: { date: 'Jan 14', note: 'Demand Optimizer flagged high-value waitlist priority intervention. Action dismissed.' },
  mbr_271: { date: 'Jan 20', note: 'Engagement Autopilot flagged obligation-only spend pattern and recommended targeted F&B outreach.' },
};

const formatDues = (value) => (Number.isFinite(value) ? `$${(value / 1000).toFixed(0)}K` : '—');

export default function ResignationTimeline() {
  const scenarios = getResignationScenarios();
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-500">
        5 preventable resignations in January — each with a distinct decay pattern.
      </div>
      {scenarios.map((scenario) => {
        const isOpen = expanded === scenario.memberId;
        const annotation = AGENT_ANNOTATIONS[scenario.memberId];
        return (
          <div
            key={scenario.memberId}
            className={`bg-gray-50 rounded-xl overflow-hidden border ${isOpen ? 'border-error-500/30' : 'border-gray-200 dark:border-gray-800'}`}
          >
            <button
              onClick={() => setExpanded(isOpen ? null : scenario.memberId)}
              className="w-full p-4 bg-transparent border-none cursor-pointer flex justify-between items-center text-left"
            >
              <div>
                <MemberLink
                  memberId={scenario.memberId}
                  className="text-base font-semibold"
                >
                  {scenario.name}
                </MemberLink>
                <div className="text-xs text-gray-400 mt-0.5">
                  {scenario.archetype} · Resigned {scenario.resignDate}
                </div>
              </div>
              <span className="text-gray-400">{isOpen ? '▾' : '▸'}</span>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs text-gray-400 py-2 mb-2">
                  Pattern: {scenario.pattern}
                </div>
                <div className="flex flex-col gap-2">
                  {scenario.timeline.map((point, index) => (
                    <div key={index} className="flex gap-4 items-start">
                      <span className="shrink-0 w-[70px] text-xs text-gray-400 font-mono pt-0.5">
                        {point.date}
                      </span>
                      <span className="shrink-0 w-2 h-2 rounded-full mt-1" style={{ background: DOMAIN_COLORS[point.domain] ?? '#9CA3AF' }} />
                      <span className="text-xs text-gray-500 leading-normal">{point.event}</span>
                    </div>
                  ))}

                  {annotation && (
                    <div className="flex gap-4 items-start mt-1.5 pt-2 border-t border-dashed border-cyan-500/20">
                      <span className="shrink-0 w-[70px] text-xs text-cyan-500 font-mono pt-0.5 opacity-80">
                        {annotation.date}
                      </span>
                      <span className="shrink-0 text-[11px] mt-[3px] opacity-70 text-cyan-500">⬡</span>
                      <span className="text-xs text-cyan-500 leading-normal opacity-90">{annotation.note}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
