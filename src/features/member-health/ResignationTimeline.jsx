import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { getResignationScenarios } from '@/services/memberService';
import { useNavigation } from '@/context/NavigationContext';
import { SourceBadgeRow } from '@/components/ui/SourceBadge.jsx';

// Map domain labels to source-system names so the timeline carries source-attribution badges.
const DOMAIN_TO_SYSTEM = {
  Golf: 'Tee Sheet',
  'F&B': 'POS',
  Email: 'Email',
  Feedback: 'Complaint Log',
  Membership: 'Member CRM',
};
const DOMAIN_COLORS = {
  Golf: '#12b76a',
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

// Map a scenario pattern to a symptom filter chip
function patternToSymptom(pattern = '') {
  const p = pattern.toLowerCase();
  if (p.includes('multi') || p.includes('all domain') || p.includes('cross-domain')) return 'multi';
  if (p.includes('email')) return 'email';
  if (p.includes('golf') || p.includes('round')) return 'golf';
  if (p.includes('dining') || p.includes('f&b') || p.includes('food')) return 'dining';
  return 'multi';
}

export default function ResignationTimeline() {
  const scenarios = getResignationScenarios();
  const [expanded, setExpanded] = useState(null);
  const { navigate } = useNavigation();

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
                <div className="flex items-center justify-between flex-wrap gap-2 py-2 mb-2">
                  <div className="text-xs text-gray-400">
                    Pattern: {scenario.pattern}
                  </div>
                  {/* Source attribution — every timeline entry below is sourced
                      from one of these systems. Pillar 1 (Show your sources). */}
                  {(() => {
                    const systems = Array.from(
                      new Set(
                        (scenario.timeline || [])
                          .map((p) => DOMAIN_TO_SYSTEM[p.domain])
                          .filter(Boolean)
                      )
                    );
                    return systems.length > 0 ? (
                      <SourceBadgeRow systems={systems} size="xs" />
                    ) : null;
                  })()}
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

                {/* Phase H4 — search current members for this pattern */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[11px] text-gray-500 italic leading-snug">
                    This pattern may be repeating in current members.
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('members', { tab: 'all-members', symptom: patternToSymptom(scenario.pattern) })}
                    className="px-3 py-1 rounded-md bg-brand-500 text-white text-[10px] font-bold cursor-pointer border-none hover:bg-brand-600"
                  >
                    Find current members with this pattern →
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
