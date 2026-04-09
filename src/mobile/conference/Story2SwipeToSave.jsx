// Story2SwipeToSave.jsx — Conference demo: Tinder-style pending-action stack.
// Gesture-native version of Storyboard Story 1 Step 5 + Story 2 Step 4
// ("Daniel approves both with one tap each" / "GM approves it").
// Swipe right = approve (logs activity + fires onActionApproved callback with
// parsed dollar impact). Swipe left = dismiss (local only).

import { useMemo, useState, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { getMemberProfile } from '@/services/memberService';
import { trackAction } from '@/services/activityService';
import SourceBadge from '@/components/ui/SourceBadge';
import useSwipeGesture from '@/mobile/hooks/useSwipeGesture';

const BG = '#0A0A0A';
const CARD = '#1A1A1A';
const TEXT = '#FFFFFF';
const MUTED = '#9CA3AF';
const BORDER = '#262626';
const RED = '#F87171';
const GREEN = '#4ADE80';

// Parse dollar amounts out of an impactMetric string.
// "$22K dues at risk" -> 22000, "$2.1K F&B revenue protected" -> 2100,
// "$1.2M" -> 1200000, "$500" -> 500. Returns 0 if nothing matches.
function parseImpactDollars(impactMetric) {
  if (!impactMetric || typeof impactMetric !== 'string') return 0;
  const match = impactMetric.match(/\$\s*([\d,]+(?:\.\d+)?)\s*([KMkm])?/);
  if (!match) return 0;
  const base = parseFloat(match[1].replace(/,/g, ''));
  if (Number.isNaN(base)) return 0;
  const suffix = (match[2] || '').toLowerCase();
  if (suffix === 'k') return Math.round(base * 1000);
  if (suffix === 'm') return Math.round(base * 1_000_000);
  return Math.round(base);
}

// Positive vs negative framing drives the impact color.
const NEGATIVE_TERMS = /(at risk|risk|leak|loss|overdue|gap|decline|churn|resignation|unresolved)/i;
function isImpactNegative(impactMetric) {
  if (!impactMetric) return false;
  return NEGATIVE_TERMS.test(impactMetric);
}

// First-letter avatar chip.
function MemberAvatar({ name }) {
  const letter = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex h-10 w-10 items-center justify-center rounded-full font-semibold"
      style={{ background: '#2A2A2A', color: TEXT, fontSize: 16 }}
    >
      {letter}
    </div>
  );
}

// The topmost (interactive) card. Owns the swipe gesture.
function TopCard({ action, onApprove, onDismiss }) {
  const { elRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeRight: () => onApprove(action),
    onSwipeLeft: () => onDismiss(action),
    threshold: 80,
  });

  const member = action.memberId ? getMemberProfile(action.memberId) : null;
  const memberName = member?.name || action.memberName || null;
  const negative = isImpactNegative(action.impactMetric);
  const impactColor = negative ? RED : GREEN;

  return (
    <div
      ref={elRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="absolute inset-0 flex flex-col rounded-2xl p-5 shadow-2xl"
      style={{
        background: CARD,
        color: TEXT,
        border: `1px solid ${BORDER}`,
        touchAction: 'pan-y',
        willChange: 'transform, opacity',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <SourceBadge system={action.source || 'Agent'} />
        <span className="text-[10px] uppercase tracking-wider" style={{ color: MUTED }}>
          {action.actionType?.replace(/_/g, ' ')}
        </span>
      </div>

      <p className="mb-5 text-xl font-semibold leading-snug" style={{ color: TEXT }}>
        {action.description}
      </p>

      {memberName ? (
        <div className="mb-5 flex items-center gap-3">
          <MemberAvatar name={memberName} />
          <div className="flex flex-col">
            <span className="text-sm font-medium" style={{ color: TEXT }}>{memberName}</span>
            {member?.tier ? (
              <span className="text-[11px]" style={{ color: MUTED }}>{member.tier}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-auto">
        <p className="mb-4 text-lg font-bold" style={{ color: impactColor }}>
          {action.impactMetric}
        </p>
        <div
          className="flex items-center justify-between border-t pt-3 text-xs"
          style={{ borderColor: BORDER, color: MUTED }}
        >
          <span>&larr; Dismiss</span>
          <span>Approve &rarr;</span>
        </div>
      </div>
    </div>
  );
}

// Decorative peek-card rendered behind the top card.
function PeekCard({ depth }) {
  // depth 1 or 2 — smaller scale, lower opacity, offset down
  const scale = 1 - depth * 0.04;
  const translateY = depth * 10;
  const opacity = 1 - depth * 0.3;
  return (
    <div
      className="absolute inset-0 rounded-2xl"
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        transform: `translateY(${translateY}px) scale(${scale})`,
        opacity,
        zIndex: -depth,
      }}
    />
  );
}

export default function Story2SwipeToSave({ onActionApproved }) {
  const { inbox = [], approveAction, dismissAction } = useApp();

  // Local "already handled in this session" tracker so cards fly out
  // immediately regardless of context-state propagation timing.
  const [handledIds, setHandledIds] = useState(() => new Set());
  const [savedThisSession, setSavedThisSession] = useState(0);

  const pending = useMemo(
    () => inbox.filter((a) => a.status === 'pending' && !handledIds.has(a.id)),
    [inbox, handledIds]
  );

  const handleApprove = useCallback(
    (action) => {
      const dollars = parseImpactDollars(action.impactMetric);
      setHandledIds((prev) => {
        const next = new Set(prev);
        next.add(action.id);
        return next;
      });
      setSavedThisSession((prev) => prev + dollars);

      // 2026-04-09 wave 12 mobile audit fix: in demo mode, useApp().approveAction
      // POSTs to a backend that 404s and shows a red "Action may not have been
      // delivered" toast after every swipe. The conference demo doesn't need
      // server persistence — local state + trackAction (which is fail-soft)
      // are sufficient. Skip the network call.
      // Detect conference route by checking the location hash.
      const onConferenceRoute = typeof window !== 'undefined'
        && window.location.hash.startsWith('#/m/conference');
      if (!onConferenceRoute) {
        approveAction?.(action.id);
      }
      trackAction({
        actionType: 'approve',
        actionSubtype: 'conference_swipe_save',
        memberId: action.memberId ?? null,
        agentId: action.agentId ?? null,
        referenceId: action.id,
        referenceType: 'agent_action',
        description: action.description,
        meta: { impactMetric: action.impactMetric, parsedDollars: dollars },
      });

      onActionApproved?.(dollars);
    },
    [approveAction, onActionApproved]
  );

  const handleDismiss = useCallback(
    (action) => {
      setHandledIds((prev) => {
        const next = new Set(prev);
        next.add(action.id);
        return next;
      });
      dismissAction?.(action.id);
    },
    [dismissAction]
  );

  const visible = pending.slice(0, 3);

  return (
    <div
      className="flex h-full w-full flex-col items-center"
      style={{ background: BG, color: TEXT }}
    >
      <div className="w-full px-5 pt-5 pb-3">
        <h2 className="text-xl font-semibold" style={{ color: TEXT }}>Swipe to save</h2>
        <p className="text-xs" style={{ color: MUTED }}>
          {pending.length} pending &middot; human in the loop
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-sm flex-1 px-5 pb-8">
        <div className="relative mx-auto h-[480px] w-full">
          {visible.length === 0 ? (
            <EmptyCelebration savedThisSession={savedThisSession} />
          ) : (
            <>
              {visible[2] ? <PeekCard key={`peek-${visible[2].id}`} depth={2} /> : null}
              {visible[1] ? <PeekCard key={`peek-${visible[1].id}`} depth={1} /> : null}
              <TopCard
                key={visible[0].id}
                action={visible[0]}
                onApprove={handleApprove}
                onDismiss={handleDismiss}
              />
            </>
          )}
        </div>

        {visible.length > 0 ? (
          <p className="mt-4 text-center text-[11px]" style={{ color: MUTED }}>
            Saved this session: <span style={{ color: GREEN, fontWeight: 600 }}>
              ${savedThisSession.toLocaleString()}
            </span>
          </p>
        ) : null}
      </div>
    </div>
  );
}

function EmptyCelebration({ savedThisSession }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 text-center"
      style={{ background: CARD, border: `1px solid ${BORDER}`, color: TEXT }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: '#064E3B', color: GREEN, fontSize: 32 }}
      >
        &#10003;
      </div>
      <h3 className="mb-2 text-xl font-semibold">All caught up</h3>
      <p className="mb-4 text-sm" style={{ color: MUTED }}>0 pending actions</p>
      <p className="text-sm" style={{ color: MUTED }}>
        Saved&nbsp;
        <span style={{ color: GREEN, fontWeight: 700 }}>
          ${savedThisSession.toLocaleString()}
        </span>
        &nbsp;this session
      </p>
    </div>
  );
}
