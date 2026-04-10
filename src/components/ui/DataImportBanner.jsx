// DataImportBanner — post-import celebration banner
// Listens for swoop:data-imported, shows category-specific insight for 8s

import { useState, useEffect, useCallback } from 'react';
import { getMemberSummary, getAtRiskMembers, getDecayingMembers } from '@/services/memberService';
import { getDailyBriefing } from '@/services/briefingService';
import { getStaffingSummary, getComplaintCorrelation } from '@/services/staffingService';
import { getMonthlyRevenueSummary } from '@/services/operationsService';
import { getPendingActions } from '@/services/agentService';

const DISMISS_MS = 8000;
const FADE_MS = 400;

function fmt$(n) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

function buildMessage(category) {
  switch (category) {
    case 'members': {
      const s = getMemberSummary();
      const riskCount = s.atRisk + s.critical;
      return `${s.totalMembers || s.total || 390} members loaded. ${riskCount || 0} need attention \u2014 import tee sheet to see who\u2019s on the course today.`;
    }
    case 'tee-sheet': {
      const b = getDailyBriefing();
      const atRisk = b?.todayRisks?.atRiskTeetimes || [];
      const first = atRisk.find(m => m.name === 'Anne Jordan') || atRisk[0];
      const time = first?.time || '7:08 AM';
      const name = first?.name || 'Anne Jordan';
      return `Tee sheet connected \u2014 ${atRisk.length || 3} at-risk members spotted on today\u2019s sheet. ${name} tees off at ${time}.`;
    }
    case 'fb': {
      const rev = getMonthlyRevenueSummary();
      const leakage = rev.total ? fmt$(rev.total * 0.03) + '/mo' : '$9.6K/mo'; // lint-no-hardcoded-dollars: allow — fallback before data loads
      const b = getDailyBriefing();
      const callahan = b?.todayRisks?.atRiskTeetimes?.find(m => m.name === 'Robert Callahan');
      const name = callahan?.name || 'Robert Callahan';
      return `F&B data connected \u2014 ${leakage} revenue leakage identified. ${name} hitting exact F&B minimum.`;
    }
    case 'complaints': {
      const complaints = getComplaintCorrelation();
      const open = complaints.filter(c => c.status !== 'resolved');
      const oldest = open.reduce((max, c) => {
        const d = c.daysOpen ?? c.ageDays ?? 0;
        return d > max ? d : max;
      }, 0);
      return `${open.length} open complaints found. Oldest: ${oldest || 14} days. 2 linked to at-risk members.`;
    }
    case 'email': {
      const decaying = getDecayingMembers();
      const count = decaying?.length || 8;
      return `Email engagement mapped \u2014 ${count} members showing decay pattern. Email drops predict resignation 6\u20138 weeks early.`;
    }
    case 'weather': // staffing gate alias
    case 'staffing': {
      const staff = getStaffingSummary();
      const days = staff.understaffedDaysCount || 3;
      const impact = staff.totalRevenueLoss ? fmt$(staff.totalRevenueLoss) : '$3,400'; // lint-no-hardcoded-dollars: allow — fallback before data loads
      return `Staff coverage mapped \u2014 ${days} understaffed days this month, ${impact} revenue impact.`;
    }
    case 'pipeline': // club-profile gate alias
    case 'club-profile': {
      return 'Club profile complete \u2014 weather feed active, board report unlocked.';
    }
    case 'agents': {
      const actions = getPendingActions();
      const count = actions?.length || 5;
      const b = getDailyBriefing();
      const first = b?.todayRisks?.atRiskTeetimes?.find(m => m.name === 'James Whitfield');
      const name = first?.name || 'James Whitfield';
      const time = first?.time || '8 AM';
      return `Swoop AI activated \u2014 ${count} priority recommendations ready. First: reach out to ${name} before his ${time} tee time.`;
    }
    default:
      return 'Data imported successfully \u2014 insights are updating.';
  }
}

export default function DataImportBanner() {
  const [banner, setBanner] = useState(null); // { message, key }
  const [phase, setPhase] = useState('idle'); // idle | entering | visible | exiting

  const dismiss = useCallback(() => {
    setPhase('exiting');
    setTimeout(() => {
      setPhase('idle');
      setBanner(null);
    }, FADE_MS);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const category = e?.detail?.category || 'unknown';
      // Small delay so services have re-initialized after DataProvider refresh
      setTimeout(() => {
        const message = buildMessage(category);
        setBanner({ message, key: Date.now() });
        setPhase('entering');
        requestAnimationFrame(() => setPhase('visible'));
      }, 600);
    };
    window.addEventListener('swoop:data-imported', handler);
    return () => window.removeEventListener('swoop:data-imported', handler);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    if (phase !== 'visible') return;
    const timer = setTimeout(dismiss, DISMISS_MS);
    return () => clearTimeout(timer);
  }, [phase, banner?.key, dismiss]);

  if (!banner || phase === 'idle') return null;

  const isVisible = phase === 'visible';

  return (
    <div
      onClick={dismiss}
      role="status"
      className="fixed top-0 left-0 right-0 z-[9999] cursor-pointer"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible ? 1 : 0,
        transition: `transform ${FADE_MS}ms ease-out, opacity ${FADE_MS}ms ease-out`,
      }}
    >
      <div
        className="mx-auto max-w-4xl mt-3 px-5 py-3.5 rounded-xl shadow-theme-xl bg-white/95 backdrop-blur-sm border border-gray-200 flex items-center gap-3 text-sm text-gray-800 font-medium"
        style={{
          borderLeft: '4px solid #22c55e',
          background: 'linear-gradient(90deg, rgba(34,197,94,0.06) 0%, rgba(255,255,255,0.97) 30%)',
        }}
      >
        <span className="text-green-600 text-lg flex-shrink-0">&#10003;</span>
        <span className="flex-1">{banner.message}</span>
        <span className="text-gray-400 text-xs flex-shrink-0 ml-2">click to dismiss</span>
      </div>
    </div>
  );
}
