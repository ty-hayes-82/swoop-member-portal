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
  Events: '#F3922D',
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

  // Add activity items — services already filter by loaded domains in data-driven mode
  (profile.activity ?? []).forEach((a) => {
    const domain = a.type?.includes('Golf') || a.type?.includes('Round') ? 'Golf'
      : a.type?.includes('Dining') || a.type?.includes('F&B') ? 'Dining'
      : a.type?.includes('Event') ? 'Events'
      : a.type?.includes('Email') ? 'Email'
      : 'Activity';
    events.push({
      date: a.timestamp ?? a.date ?? '',
      domain,
      label: a.detail ?? a.type ?? '',
      type: 'activity',
    });
  });

  // Add risk signal events
  (profile.riskSignals ?? []).forEach((s) => {
    const domain = s.source ?? 'Risk';
    events.push({
      date: s.timestamp ?? '',
      domain,
      label: s.label ?? s.description ?? '',
      type: 'risk',
    });
  });

  // Use relative date labels so demo ages gracefully; `weeksAgo` is carried so the
  // "First signal: N days ago" counter can compute when Date.parse() returns NaN.
  if (events.length < 4) {
    const demoEvents = [
      { date: '~12 weeks ago', weeksAgo: 12, domain: 'Email', label: 'Newsletter open rate dropped below 20%', type: 'warning', decayOrder: 1 },
      { date: '~12 weeks ago', weeksAgo: 12, domain: 'Golf', label: 'Regular rounds: 3-4x/month', type: 'positive' },
      { date: '~8 weeks ago', weeksAgo: 8, domain: 'Golf', label: 'Rounds dropped to 2x/month', type: 'warning', decayOrder: 2 },
      { date: '~8 weeks ago', weeksAgo: 8, domain: 'Dining', label: 'Post-round dining stopped', type: 'warning', decayOrder: 3 },
      { date: '~4 weeks ago', weeksAgo: 4, domain: 'Email', label: 'Newsletter open rate below 10%', type: 'risk' },
      { date: '~4 weeks ago', weeksAgo: 4, domain: 'Golf', label: 'Only 1 round played', type: 'risk' },
      { date: 'this week', weeksAgo: 0, domain: 'Events', label: 'Skipped member-guest invite', type: 'risk', decayOrder: 4 },
      { date: 'this week', weeksAgo: 0, domain: 'Risk', label: 'Resignation risk: high', type: 'risk' },
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
      decayDomains.push({ domain: evt.domain, date: evt.date, label: evt.label, weeksAgo: evt.weeksAgo });
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
        <div className="text-[11px] text-swoop-text-2 mt-0.5">{recommendation}</div>
      </div>
      <button
        type="button"
        onClick={handleApprove}
        disabled={approved}
        className={`px-3 py-1.5 rounded-md text-[11px] font-bold cursor-pointer border-none whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
          approved ? 'bg-success-100 text-success-700 cursor-default' : 'bg-success-500 text-white hover:bg-success-600'
        }`}
      >
        {approved ? '\u2713 Approved' : 'Approve & Log \u2192'}
      </button>
    </div>
  );
}

// RecoveryTimeline — Pillar 2 FIX IT closure.
// Shown BELOW the decay chain on the full member page only.
// Honest linear model: estimates weeks to return from current health score
// toward a "healthy" target (70) assuming engagement trend reverses.
//
// Model assumptions (documented inline for transparency):
//   - Baseline recovery velocity: ~8 health points per week (calibrated so a
//     score-30 member reaches 70 in ~5 weeks — matching the 4-6 week window
//     the product team aligned on in §11.6).
//   - Each additional broken decay domino adds +0.5 weeks of drag
//     (cross-domain re-engagement is harder than single-domain).
//   - Archetype modifier: Ghost / Declining get +1 week (deeper rut);
//     Weekend Warrior / Social Butterfly get -0.5 week (easier wins).
//   - Floor at 2 weeks, ceiling at 12 weeks. Clamped, never promised.
function RecoveryTimeline({ member, decayChainLength }) {
  const [showMath, setShowMath] = React.useState(false);
  const score = Number(member?.healthScore) || 0;
  const archetype = member?.archetype || '';
  const TARGET = 70;
  const { gap, baseWeeks, dominoDrag, archetypeMod, rawWeeks, weeks } =
    computeRecoveryWeeks({ score, archetype, decayChainLength });

  // Pick an archetype-flavored "reversal" phrase
  const reversalPhrase = (() => {
    if (archetype === 'Ghost') return 'member accepts re-engagement outreach';
    if (archetype === 'Declining') return 'root-cause conversation lands';
    if (archetype === 'Weekend Warrior') return 'a Saturday tee time is booked';
    if (archetype === 'Social Butterfly') return 'member RSVPs to the next event';
    if (archetype === 'Die-Hard Golfer') return 'equipment/schedule blocker is cleared';
    if (archetype === 'New Member') return 'onboarding check-in is completed';
    if (archetype === 'Snowbird') return 'welcome-back outreach is accepted';
    return 'recommended outreach is accepted';
  })();

  return (
    <div className="mt-3 pt-3 border-t border-red-500/10">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
        <div className="text-[9px] font-bold uppercase tracking-wider text-success-600">
          Recovery Timeline &middot; Model Estimate
        </div>
        <button
          type="button"
          onClick={() => setShowMath((v) => !v)}
          className="text-[9px] text-swoop-text-muted hover:text-swoop-text-2 underline decoration-dotted bg-transparent border-none cursor-pointer p-0 focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          {showMath ? 'Hide math' : 'How is this computed?'}
        </button>
      </div>
      <div className="text-[12px] text-swoop-text-2 leading-snug">
        If the {reversalPhrase}, health score is modeled to recover from{' '}
        <span className="font-bold text-error-500">{score}</span> toward{' '}
        <span className="font-bold text-success-600">~{TARGET}</span> in{' '}
        <span className="font-bold">~{weeks} weeks</span>.
      </div>
      <div className="text-[10px] text-swoop-text-muted italic mt-0.5">
        Directional forecast, not a promise. Actual recovery depends on member response.
      </div>
      {showMath && (
        <div className="mt-2 p-2 bg-swoop-row border border-swoop-border rounded text-[10px] text-swoop-text-muted font-mono leading-relaxed">
          <div>gap = {TARGET} &minus; {score} = {gap} pts</div>
          <div>base = gap / 8 pts-per-week = {baseWeeks.toFixed(1)}w</div>
          <div>+ domino drag ({decayChainLength} dominoes) = +{dominoDrag.toFixed(1)}w</div>
          <div>+ archetype mod ({archetype || 'n/a'}) = {archetypeMod >= 0 ? '+' : ''}{archetypeMod}w</div>
          <div className="mt-1 pt-1 border-t border-swoop-border">
            total = {rawWeeks.toFixed(1)}w &rarr; clamped [2, 12] = <span className="font-bold">{weeks}w</span>
          </div>
        </div>
      )}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        <span className="text-[9px] uppercase tracking-wider text-swoop-text-label font-semibold">Systems that drive recovery:</span>
        <SourceBadge system="Tee Sheet" size="xs" />
        <SourceBadge system="POS" size="xs" />
        <SourceBadge system="Email" size="xs" />
        <SourceBadge system="Member CRM" size="xs" />
      </div>
    </div>
  );
}

export default function MemberDecayChain({ member, variant = 'drawer' }) {
  const profile = member;
  const { decayChain } = useMemo(() => buildDecayChain(profile), [profile]);

  // Return null when we don't have enough decay signal to tell a story
  if (!decayChain || decayChain.length < 2) return null;

  // Relative date strings like "~12 weeks ago" return NaN from Date.parse — prefer structured weeksAgo.
  const daysSinceFirstSignal = (() => {
    const first = decayChain[0];
    if (!first) return null;
    // Prefer structured weeksAgo (set by the demo-event seeds)
    if (typeof first.weeksAgo === 'number' && first.weeksAgo >= 0) {
      return first.weeksAgo * 7;
    }
    // Fall back to parsing a real date string from real activity
    const firstDateStr = first.date;
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

  const duesAnnual = profile?.duesAnnual ?? profile?.dues_annual ?? profile?.dues ?? profile?.memberValueAnnual ?? null;
  const duesAnchor = (() => {
    if (!duesAnnual || duesAnnual <= 0) return null;
    const k = Math.round(duesAnnual / 1000);
    return `$${k}K/yr at risk`;
  })();

  return (
    <div className={outerClass}>
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div>
          <span className={labelClass}>
            First Domino &mdash; Engagement Decay Sequence
          </span>
          {isPage && (
            <div className="text-[11px] text-swoop-text-muted mt-0.5">Cross-domain timeline &middot; Pillar 2: FIX IT</div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {duesAnchor && (
            <span
              className={isPage
                ? 'text-xs font-bold text-error-600 bg-error-500/[0.12] border border-error-500/30 px-2.5 py-1 rounded-md'
                : 'text-[11px] font-bold text-error-600 bg-error-500/[0.12] border border-error-500/25 px-2 py-0.5 rounded'}
              title="Annual dues exposure if this member resigns"
            >
              {duesAnchor}
            </span>
          )}
          {daysSinceFirstSignal != null && (
            <span className={counterClass}>
              First signal: {daysSinceFirstSignal} days ago
            </span>
          )}
        </div>
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
                animation: `mdcSlideIn 400ms ease-out ${i * 300}ms backwards`,
              }}
            >
              <div className="flex flex-col gap-1">
                <div className={`${stepPad} rounded-md`} style={{ background: color + '16', border: `1px solid ${color}40` }}>
                  <div className={`${stepLabelSize} font-bold uppercase tracking-tight`} style={{ color }}>{step.domain} dropped</div>
                  <div className="text-[10px] text-swoop-text-label">{step.date}</div>
                </div>
                {system && (
                  <div className="px-1">
                    <SourceBadge system={system} size="xs" />
                  </div>
                )}
              </div>
              {i < decayChain.length - 1 && (
                <span
                  className={`${isPage ? 'mx-2 mt-2.5 text-base' : 'mx-1.5 mt-2 text-sm'} text-swoop-text-label font-bold`}
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
      <div className="mt-2 pt-2 border-t border-red-500/10 text-[10px] text-swoop-text-muted italic leading-snug">
        Cross-domain decay pattern. No single system would have flagged this in time.
      </div>
      {/* Inline Fix It action — Pillar 2 */}
      <DecayChainAction profile={profile} />
      {/* Recovery Timeline — full page only; closes the Pillar 2 loop with a forecast */}
      {isPage && (
        <RecoveryTimeline member={profile} decayChainLength={decayChain.length} />
      )}
    </div>
  );
}

// Named export for the helper in case callers (e.g. MemberJourneyTimeline)
// want the parsed events/chain data without re-rendering the card.
export { buildDecayChain };

// Pure helper extracted from <RecoveryTimeline> so the deterministic linear
// model can be unit-tested in isolation. See the component's model-assumption
// comment for the rationale behind each constant.
export function computeRecoveryWeeks({ score, archetype, decayChainLength }) {
  const safeScore = Number(score) || 0;
  const safeLen = Number(decayChainLength) || 0;
  const TARGET = 70;
  const gap = Math.max(0, TARGET - safeScore);
  const baseWeeks = gap / 8;
  const dominoDrag = Math.max(0, safeLen - 2) * 0.5;
  let archetypeMod = 0;
  if (archetype === 'Ghost' || archetype === 'Declining') archetypeMod = 1;
  else if (archetype === 'Weekend Warrior' || archetype === 'Social Butterfly') archetypeMod = -0.5;
  const rawWeeks = baseWeeks + dominoDrag + archetypeMod;
  const weeks = Math.max(2, Math.min(12, Math.round(rawWeeks)));
  return { gap, baseWeeks, dominoDrag, archetypeMod, rawWeeks, weeks };
}
