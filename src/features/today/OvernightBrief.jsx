/**
 * OvernightBrief — "what Swoop's agents found while you were away"
 * Sits at the top of Today view, below the greeting bar.
 * Time-stamped, 3-5 bullets, built from live service data.
 */
import { useMemo } from 'react';
import { useNavigation } from '@/context/NavigationContext';
import { getMemberSummary } from '@/services/memberService';
import { getLeakageData } from '@/services/revenueService';
import { useApp } from '@/context/AppContext';
import { getDailyBriefing } from '@/services/briefingService';
import { getTodayTeeSheet } from '@/services/operationsService';

function briefTimestamp() {
  const now = new Date();
  const runHour = 6;
  const runMin = 14;
  const run = new Date(now);
  run.setHours(runHour, runMin, 0, 0);
  // If we're before 06:14 today, show yesterday's run
  if (now < run) run.setDate(run.getDate() - 1);
  return run.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
}

function buildBullets({ memberSummary, leakage, pendingCount, briefing, teeSheet }) {
  const bullets = [];

  // 1. At-risk members + dues exposure
  const riskCount = (memberSummary.atRisk || 0) + (memberSummary.critical || 0);
  const duesAtRisk = memberSummary.potentialDuesAtRisk || 0;
  if (riskCount > 0) {
    const duesText = duesAtRisk > 0
      ? ` — $${Math.round(duesAtRisk / 1000)}K in annual dues at risk`
      : '';
    bullets.push({
      icon: '🔴',
      text: `${riskCount} member${riskCount === 1 ? '' : 's'} flagged as at-risk${duesText}`,
      nav: 'members',
      navOpts: { tab: 'at-risk' },
      urgent: true,
    });
  }

  // 2. Revenue / F&B leakage
  if (leakage?.TOTAL > 0) {
    bullets.push({
      icon: '💸',
      text: `$${leakage.TOTAL.toLocaleString()}/mo in F&B leakage detected — pace, staffing, and weather gaps`,
      nav: 'revenue',
      navOpts: null,
      urgent: riskCount === 0,
    });
  }

  // 3. At-risk members on today's tee sheet
  if (teeSheet.length > 0) {
    const atRiskOnSheet = teeSheet.filter(t => (t.healthScore ?? 100) < 50);
    if (atRiskOnSheet.length > 0) {
      const topMember = atRiskOnSheet.sort((a, b) => (a.healthScore || 100) - (b.healthScore || 100))[0];
      bullets.push({
        icon: '⛳',
        text: `${atRiskOnSheet.length} at-risk member${atRiskOnSheet.length === 1 ? '' : 's'} on today's tee sheet — ${topMember.name || 'a member'} tees off at ${topMember.time || 'soon'}`,
        nav: 'tee-sheet',
        navOpts: null,
        urgent: false,
      });
    }
  }

  // 4. Pending actions
  if (pendingCount > 0) {
    bullets.push({
      icon: '📥',
      text: `${pendingCount} action${pendingCount === 1 ? '' : 's'} ready for your approval`,
      nav: 'automations',
      navOpts: { tab: 'inbox' },
      urgent: false,
    });
  }

  // 5. Watch-list members
  if (memberSummary.watch > 0 && bullets.length < 4) {
    bullets.push({
      icon: '👁️',
      text: `${memberSummary.watch} member${memberSummary.watch === 1 ? '' : 's'} on watch — engagement declining but not yet critical`,
      nav: 'members',
      navOpts: null,
      urgent: false,
    });
  }

  return bullets.slice(0, 5);
}

export default function OvernightBrief() {
  const { navigate } = useNavigation();
  const { pendingAgentCount } = useApp();

  const memberSummary = getMemberSummary();
  const leakage = getLeakageData();
  const briefing = getDailyBriefing();
  const teeSheet = getTodayTeeSheet();

  const bullets = useMemo(() => buildBullets({
    memberSummary,
    leakage,
    pendingCount: pendingAgentCount || 0,
    briefing,
    teeSheet,
  }), [memberSummary, leakage, pendingAgentCount, briefing, teeSheet]);

  // Only render when there's something real to show
  if (bullets.length === 0) return null;

  const hasUrgent = bullets.some(b => b.urgent);

  return (
    <div
      className="fade-in-up rounded-xl border p-4"
      style={{
        background: hasUrgent
          ? 'linear-gradient(135deg, rgba(239,68,68,0.04) 0%, rgba(239,68,68,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(139,92,246,0.02) 100%)',
        borderColor: hasUrgent ? 'rgba(239,68,68,0.18)' : 'rgba(139,92,246,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{
              background: hasUrgent ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.12)',
              color: hasUrgent ? '#ef4444' : '#8b5cf6',
            }}
          >
            Overnight Brief
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            Agents ran at {briefTimestamp()}
          </span>
        </div>
        <span className="text-[10px] text-gray-400">{bullets.length} finding{bullets.length === 1 ? '' : 's'}</span>
      </div>

      {/* Bullets */}
      <ul className="m-0 p-0 list-none flex flex-col gap-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-sm mt-px shrink-0">{b.icon}</span>
            <span className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
              {b.text}
            </span>
            {b.nav && (
              <button
                type="button"
                onClick={() => navigate(b.nav, b.navOpts || {})}
                className="shrink-0 text-[10px] font-semibold text-brand-500 bg-transparent border-none cursor-pointer p-0 hover:underline whitespace-nowrap"
              >
                View →
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
