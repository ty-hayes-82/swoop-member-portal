import React, { useMemo } from 'react';
import { trackAction } from '@/services/activityService';
import SourceBadge from '@/components/ui/SourceBadge';

// MemberDecayChain — shared "First Domino" engagement decay sequence card.
// Used by both MemberProfileDrawer (inside its Section wrapper) and
// MemberProfilePage (as a standalone panel). This is a refactor — the
// drawer's visual treatment must remain pixel-identical to what it had
// when this logic lived inside MemberJourneyTimeline.
//
// Props:
//   member           — the member profile object (same shape as drawer's `profile`)
//   variant          — 'drawer' (default, compact) or 'page' (larger, standalone card)
//   showOuterCard    — when true, renders the red-tinted outer card wrapper.
//                      Drawer sets this true so the visual matches the original
//                      embedded card; page also sets true so it looks like a panel.
//
// Behavior notes preserved from original drawer implementation:
//   - Builds decay chain from profile.activity + profile.riskSignals, falling
//     back to a demo sequence when there are <4 events.
//   - Renders source label under each step (Tee Sheet / POS / Email / Events).
//   - Shows "First signal: X days ago" counter.
//   - Returns null when fewer than 2 decay dominos exist.
//   - Inline "Approve & Log" FIX IT action via trackAction.

const DOMAIN_COLORS = {
  Golf: '#12b76a',
  Dining: '#f59e0b',
  Events: '#ff8b00',
  Email: '#2563eb',
  Risk: '#ef4444',
  Activity: '#9CA3AF',
};

const DOMAIN_TO_SYSTEM = {
  Golf: 'Tee Sheet',
  Dining: 'POS',
  Email: 'Email',
  Events: 'Events',
};

function buildDecayChain(profile) {
  const events = [];

  // Add activity items
  (profile.activity ?? []).forEach((a) => {
    events.push({
      date: a.timestamp ?? a.date ?? '',
      domain: a.type?.includes('Golf') || a.type?.includes('Round') ? 'Golf'
        : a.type?.includes('Dining') || a.type?.includes('F&B') ? 'Dining'
        : a.type?.includes('Event') ? 'Events'
        : a.type?.includes('Email') ? 'Email'
        : 'Activity',
      label: a.detail ?? a.type ?? '',
      type: 'activity',
    });
  });

  // Add risk signal events
  (profile.riskSignals ?? []).forEach((s) => {
    events.push({
      date: s.timestamp ?? '',
      domain: s.source ?? 'Risk',
      label: s.label ?? s.description ?? '',
      type: 'risk',
    });
  });

  // If few events, add demo journey points based on member scenario
  if (events.length < 4) {
    const demoEvents = [
      { date: 'Oct 2025', domain: 'Email', label: 'Newsletter open rate dropped below 20%', type: 'warning', decayOrder: 1 },
      { date: 'Oct 2025', domain: 'Golf', label: 'Regular rounds: 3-4x/month', type: 'positive' },
      { date: 'Nov 2025', domain: 'Golf', label: 'Rounds dropped to 2x/month', type: 'warning', decayOrder: 2 },
      { date: 'Nov 2025', domain: 'Dining', label: 'Post-round dining stopped', type: 'warning', decayOrder: 3 },
      { date: 'Dec 2025', domain: 'Email', label: 'Newsletter open rate below 10%', type: 'risk' },
      { date: 'Dec 2025', domain: 'Golf', label: 'Only 1 round played', type: 'risk' },
      { date: 'Jan 2026', domain: 'Events', label: 'Skipped member-guest invite', type: 'risk', decayOrder: 4 },
      { date: 'Jan 2026', domain: 'Risk', label: 'Resignation risk: high', type: 'risk' },
    ];
    events.push(...demoEvents);
  }

  const decayDomains = [];
  const seen = new Set();
  const decayItems = events
    .filter((e) => (e.type === 'warning' || e.type === 'risk') && e.domain !== 'Risk' && e.domain !== 'Activity')
    .sort((a, b) => (a.decayOrder ?? 99) - (b.decayOrder ?? 99));
  for (const evt of decayItems) {
    if (!seen.has(evt.domain)) {
      seen.add(evt.domain);
      decayDomains.push({ domain: evt.domain, date: evt.date, label: evt.label });
    }
  }
  return { events, decayChain: decayDomains };
}

// DecayChainAction — one-tap approval for the recommended outreach
// Pillar 2: FIX IT — bridges the decay viz to immediate action
function DecayChainAction({ profile }) {
  const [approved, setApproved] = React.useState(false);

  const recommendation = (() => {
    const archetype = profile.archetype || '';
    if (archetype === 'Ghost') return 'GM personal call · re-engagement conversation';
    if (archetype === 'Declining') return 'Membership Director outreach · identify root cause';
    if (archetype === 'Weekend Warrior') return 'Pro shop priority Saturday tee time offer';
    if (archetype === 'Die-Hard Golfer') return 'Pro shop check-in · equipment/injury/schedule';
    if (archetype === 'Social Butterfly') return 'Invite to upcoming wine dinner or social event';
    if (archetype === 'New Member') return 'Membership Director integration check-in';
    if (archetype === 'Snowbird') return 'Welcome-back package + tee time reservation';
    return 'GM personal call · check-in and complimentary round offer';
  })();

  const handleApprove = () => {
    trackAction({
      actionType: 'approve',
      actionSubtype: 'first_domino_outreach',
      memberId: profile.memberId,
      memberName: profile.name,
      referenceType: 'first_domino',
      referenceId: `outreach_${profile.memberId}`,
      description: `First Domino outreach: ${recommendation}`,
    });
    setApproved(true);
  };

  return (
    <div className="mt-3 pt-3 border-t border-red-500/10 flex items-center justify-between gap-2 flex-wrap">
      <div className="flex-1 min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-wider text-success-600">Recommended Outreach</div>
        <div className="text-[11px] text-gray-700 dark:text-gray-300 mt-0.5">{recommendation}</div>
      </div>
      <button
        type="button"
        onClick={handleApprove}
        disabled={approved}
        className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer border-none whitespace-nowrap transition-colors ${
          approved ? 'bg-success-100 text-success-700 cursor-default' : 'bg-success-500 text-white hover:bg-success-600'
        }`}
      >
        {approved ? '\u2713 Approved' : 'Approve & Log \u2192'}
      </button>
    </div>
  );
}

export default function MemberDecayChain({ member, variant = 'drawer' }) {
  const profile = member;
  const { decayChain } = useMemo(() => buildDecayChain(profile), [profile]);

  // Return null when we don't have enough decay signal to tell a story
  if (!decayChain || decayChain.length < 2) return null;

  // Compute days since the first decay signal
  const daysSinceFirstSignal = (() => {
    const firstDateStr = decayChain[0].date;
    if (!firstDateStr) return null;
    const parsed = Date.parse(firstDateStr + ' 1');
    if (Number.isNaN(parsed)) return null;
    const diff = Date.now() - parsed;
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  })();

  const isPage = variant === 'page';
  const outerClass = isPage
    ? 'px-5 py-4 mb-0 bg-red-500/[0.04] border border-red-500/25 rounded-2xl'
    : 'px-3.5 py-3 mb-3.5 bg-red-500/[0.04] border border-red-500/15 rounded-xl';
  const labelClass = isPage
    ? 'text-xs font-bold tracking-wider uppercase text-error-500'
    : 'text-[10px] font-bold tracking-wider uppercase text-error-500';
  const counterClass = isPage
    ? 'text-xs font-mono font-semibold text-error-500 bg-error-500/10 px-2.5 py-1 rounded'
    : 'text-[10px] font-mono font-semibold text-error-500 bg-error-500/10 px-2 py-0.5 rounded';
  const stepPad = isPage ? 'px-3 py-1.5' : 'px-2.5 py-1';
  const stepLabelSize = isPage ? 'text-[11px]' : 'text-[10px]';

  return (
    <div className={outerClass}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <span className={labelClass}>
            First Domino &mdash; Engagement Decay Sequence
          </span>
          {isPage && (
            <div className="text-[11px] text-gray-500 mt-0.5">Cross-domain timeline &middot; Pillar 2: FIX IT</div>
          )}
        </div>
        {daysSinceFirstSignal != null && (
          <span className={counterClass}>
            First signal: {daysSinceFirstSignal} days ago
          </span>
        )}
      </div>
      <div className="flex items-start flex-wrap">
        {decayChain.map((step, i) => {
          const color = DOMAIN_COLORS[step.domain] ?? '#9CA3AF';
          const system = DOMAIN_TO_SYSTEM[step.domain];
          return (
            <div
              key={step.domain}
              className="flex items-start"
              style={{
                // Phase J4 — sequential reveal animation
                animation: `mdcSlideIn 400ms ease-out ${i * 300}ms backwards`,
              }}
            >
              <div className="flex flex-col gap-1">
                <div className={`${stepPad} rounded-md`} style={{ background: color + '16', border: `1px solid ${color}40` }}>
                  <div className={`${stepLabelSize} font-bold uppercase tracking-tight`} style={{ color }}>{step.domain} dropped</div>
                  <div className="text-[10px] text-gray-400">{step.date}</div>
                </div>
                {system && (
                  <div className="px-1">
                    <SourceBadge system={system} size="xs" />
                  </div>
                )}
              </div>
              {i < decayChain.length - 1 && (
                <span
                  className={`${isPage ? 'mx-2 mt-2.5 text-base' : 'mx-1.5 mt-2 text-sm'} text-gray-400 font-bold`}
                  style={{ animation: `mdcSlideIn 200ms ease-out ${(i * 300) + 200}ms backwards` }}
                >
                  &rarr;
                </span>
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes mdcSlideIn {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="mt-2 pt-2 border-t border-red-500/10 text-[10px] text-gray-500 italic leading-snug">
        Cross-domain decay pattern. No single system would have flagged this in time.
      </div>
      {/* Inline Fix It action — Pillar 2 */}
      <DecayChainAction profile={profile} />
    </div>
  );
}

// Named export for the helper in case callers (e.g. MemberJourneyTimeline)
// want the parsed events/chain data without re-rendering the card.
export { buildDecayChain };
