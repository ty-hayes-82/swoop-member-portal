import { useState } from 'react';
import { StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge';
import MemberLink from '@/components/MemberLink';
import ActionPanel from '@/components/ui/ActionPanel';
import PageTransition from '@/components/ui/PageTransition';
import { getTodayTeeSheet, getTeeSheetSummary } from '@/services/operationsService';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/services/apiClient';

const healthColor = (score) => {
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#ea580c';
  return '#ef4444';
};

const healthLabel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

function AlertCard({ teeTime, onSendRecovery, isExpanded, onToggle }) {
  const color = healthColor(teeTime.healthScore);
  const isVip = teeTime.duesAnnual >= 18000;
  const hasComplaint = teeTime.cartPrep.note?.toLowerCase().includes('complaint') || teeTime.cartPrep.note?.toLowerCase().includes('critical');

  const recommended = [];
  if (hasComplaint) {
    recommended.push({ key: 'recovery-email', icon: '✉', label: 'Send Recovery Email', type: 'email', description: 'Acknowledge issue and offer remedy' });
    recommended.push({ key: 'apology-sms', icon: '💬', label: 'Send Apology Text', type: 'sms', description: 'Personal apology via SMS' });
  } else {
    recommended.push({ key: 'checkin-sms', icon: '💬', label: 'Personal Check-in Text', type: 'sms', description: 'Warm outreach to re-engage' });
    recommended.push({ key: 'checkin-email', icon: '✉', label: 'Send Personal Email', type: 'email', description: 'Personalized GM email' });
  }
  if (isVip) {
    recommended.push({ key: 'comp', icon: '🎁', label: 'Comp Offer', type: 'comp_offer', description: `VIP recovery — $${(teeTime.duesAnnual / 1000).toFixed(0)}K member` });
  }

  return (
    <div className="bg-white rounded-xl border-l-4 p-4 border border-gray-200" style={{ borderLeftColor: color }}>
      <div
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <MemberLink memberId={teeTime.memberId} mode="drawer" className="font-bold text-sm text-gray-800">
                {teeTime.name}
              </MemberLink>
              <span className="text-xs text-gray-400">{teeTime.time} - {teeTime.course}</span>
              {isVip && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">VIP</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-mono text-sm font-bold" style={{ color }}>{teeTime.healthScore}</span>
              <span className="text-[10px] font-semibold" style={{ color }}>{healthLabel(teeTime.healthScore)}</span>
              <ArchetypeBadge archetype={teeTime.archetype} size="xs" />
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0" style={{ background: `${color}15`, color }}>
            {Math.round(teeTime.cancelRisk * 100)}% cancel risk
          </span>
        </div>
        <div className="text-xs text-gray-600 leading-relaxed">
          {teeTime.cartPrep.note}
        </div>
      </div>
      {/* Quick action buttons (always visible) */}
      <div className="flex gap-2 mt-3 flex-wrap">
        {hasComplaint && (
          <button
            onClick={() => onSendRecovery(teeTime, 'email')}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-red-200 bg-red-50 text-red-600 inline-flex items-center gap-1"
          >
            <span>✉</span> Send Recovery Email
          </button>
        )}
        <button
          onClick={() => onSendRecovery(teeTime, 'sms')}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-brand-200 bg-brand-50 text-brand-500 inline-flex items-center gap-1"
        >
          <span>💬</span> {hasComplaint ? 'Send Apology Text' : 'Personal Check-in Text'}
        </button>
        <button
          onClick={onToggle}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-gray-200 bg-white text-gray-500 inline-flex items-center gap-1"
        >
          {isExpanded ? '▾ Less' : '▸ More actions'}
        </button>
      </div>
      {/* Expanded inline action panel */}
      {isExpanded && (
        <ActionPanel
          context={{
            memberId: teeTime.memberId,
            memberName: teeTime.name,
            description: teeTime.cartPrep.note,
            source: 'Tee Sheet',
          }}
          recommended={recommended}
          onClose={onToggle}
          compact
        />
      )}
    </div>
  );
}

function CartPrepCard({ teeTime, onSendCartText, onSendDiningNudge }) {
  const color = healthColor(teeTime.healthScore);
  const isAtRisk = teeTime.healthScore < 50;
  const firstName = teeTime.name.split(' ')[0];
  return (
    <div className={`rounded-xl border p-4 ${isAtRisk ? 'bg-red-50/30 border-red-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-800">{teeTime.name}</span>
          <span className="text-xs text-gray-400">{teeTime.time}</span>
        </div>
        <span className="font-mono text-xs font-bold" style={{ color }}>{teeTime.healthScore}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {teeTime.cartPrep.beverage && (
          <div className="flex items-start gap-1.5">
            <span className="text-gray-400 shrink-0">Beverage:</span>
            <span className="text-gray-700 font-medium">{teeTime.cartPrep.beverage}</span>
          </div>
        )}
        {teeTime.cartPrep.snack && (
          <div className="flex items-start gap-1.5">
            <span className="text-gray-400 shrink-0">Snack:</span>
            <span className="text-gray-700 font-medium">{teeTime.cartPrep.snack}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5 sm:col-span-1">
          <span className="text-gray-400 shrink-0">Group:</span>
          <span className="text-gray-700 font-medium">{teeTime.group.join(', ')}</span>
        </div>
      </div>
      {teeTime.cartPrep.note && (
        <div className={`mt-2 text-[11px] leading-relaxed p-2 rounded-lg ${isAtRisk ? 'bg-red-500/5 text-red-700 border border-red-200' : 'bg-gray-50 text-gray-500'}`}>
          {teeTime.cartPrep.note}
        </div>
      )}
      {/* Action buttons */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={() => onSendCartText(teeTime)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-brand-200 bg-brand-50 text-brand-500 inline-flex items-center gap-1"
        >
          <span>💬</span> Send Cart Prep Text
        </button>
        <button
          onClick={() => onSendDiningNudge(teeTime)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-amber-200 bg-amber-50 text-amber-700 inline-flex items-center gap-1"
        >
          <span>🍽</span> Post-Round Dining Nudge
        </button>
      </div>
    </div>
  );
}

export default function TeeSheetView() {
  const [showCartPrep, setShowCartPrep] = useState(false);
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const { showToast } = useApp();
  const teeData = getTodayTeeSheet();
  const atRiskTimes = teeData.filter(t => t.healthScore < 50);
  const vipTimes = teeData.filter(t => t.duesAnnual >= 18000 && t.healthScore >= 50);

  const handleSendCartText = async (teeTime) => {
    const firstName = teeTime.name.split(' ')[0];
    const items = [teeTime.cartPrep.beverage, teeTime.cartPrep.snack].filter(Boolean).join(', ');
    showToast('Generating cart prep text...', 'info');
    try {
      const draft = await apiFetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: teeTime.memberId,
          draftType: 'sms',
          context: `Cart prep confirmation for ${teeTime.time} tee time. Cart is ready with: ${items}. ${teeTime.cartPrep.note || ''}`,
        }),
      });
      const body = encodeURIComponent(draft?.body || `Hi ${firstName}! Your cart is ready for your ${teeTime.time} tee time: ${items}. See you on the first tee!`);
      const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
      window.open(`sms:${demoPhone}?&body=${body}`, '_self');
    } catch {
      const body = encodeURIComponent(`Hi ${firstName}! Your cart is ready for your ${teeTime.time} tee time: ${items}. See you on the first tee!`);
      const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
      window.open(`sms:${demoPhone}?&body=${body}`, '_self');
    }
  };

  const handleSendRecovery = async (teeTime, type) => {
    const firstName = teeTime.name.split(' ')[0];
    const hasComplaint = teeTime.cartPrep.note?.toLowerCase().includes('complaint');
    const recoveryContext = hasComplaint
      ? `Proactive service recovery message. This member had a recent complaint that is being resolved. Acknowledge the issue, explain what the club has changed, and invite them back with a specific offer. Be genuine and personal — not corporate.`
      : `Proactive check-in for an at-risk member. Their engagement is declining. Reach out warmly, ask how things are going, and offer something specific to re-engage them.`;

    showToast(`Generating ${hasComplaint ? 'recovery' : 'check-in'} message...`, 'info');
    const emailSendMode = localStorage.getItem('swoop_email_send_mode') || 'local';
    try {
      const draft = await apiFetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: teeTime.memberId,
          draftType: type,
          context: recoveryContext,
          templateHint: 'recovery_outreach',
        }),
      });
      if (type === 'sms') {
        const body = encodeURIComponent(draft?.body || `Hi ${firstName}, I wanted to personally reach out and make sure everything is to your satisfaction at the club. Would love to connect.`);
        const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
        window.open(`sms:${demoPhone}?&body=${body}`, '_self');
      } else {
        const to = encodeURIComponent(localStorage.getItem('swoop_demo_email') || draft?.memberEmail || '');
        const subject = encodeURIComponent(draft?.subject || `A personal note from your club`);
        const body = encodeURIComponent(draft?.body || '');
        if (emailSendMode === 'gmail') {
          window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`, '_blank');
        } else {
          window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
        }
      }
    } catch {
      if (type === 'sms') {
        const body = encodeURIComponent(`Hi ${firstName}, I wanted to personally reach out about your recent experience. We've made changes and I'd love to show you. Can we connect?`);
        window.open(`sms:?&body=${body}`, '_self');
      }
    }
  };

  const handleSendDiningNudge = async (teeTime) => {
    const firstName = teeTime.name.split(' ')[0];
    showToast('Generating dining offer...', 'info');
    try {
      const draft = await apiFetch('/api/generate-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: teeTime.memberId,
          draftType: 'sms',
          context: `Post-round dining nudge. Member just finished their round from ${teeTime.time} tee time on the ${teeTime.course} course. Suggest dining at the Grill Room or Terrace. Make it personal and mention something they'd enjoy.`,
        }),
      });
      const body = encodeURIComponent(draft?.body || `Great round today, ${firstName}! Chef has a special lunch menu — your usual table is open at the Grill Room. Want me to hold it?`);
      const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
      window.open(`sms:${demoPhone}?&body=${body}`, '_self');
    } catch {
      const body = encodeURIComponent(`Great round today, ${firstName}! Chef has a special lunch menu — your usual table is open at the Grill Room. Want me to hold it?`);
      const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
      window.open(`sms:${demoPhone}?&body=${body}`, '_self');
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <StoryHeadline
          variant="insight"
          headline="Who's on the course today — and who needs your attention?"
          context={`${getTeeSheetSummary().totalRounds} rounds booked across ${teeData.length} groups. ${atRiskTimes.length} at-risk members playing today. ${getTeeSheetSummary().weatherTemp}\u00B0F, ${getTeeSheetSummary().weatherCondition}.`}
        />

        <EvidenceStrip systems={['Tee Sheet', 'Member CRM', 'Weather', 'POS']} />

        {/* At-Risk & VIP Alerts */}
        {atRiskTimes.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-error-500 uppercase tracking-wide mb-2.5">
              At-Risk Members on Course Today ({atRiskTimes.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {atRiskTimes.map(t => (
                <AlertCard
                  key={t.memberId}
                  teeTime={t}
                  onSendRecovery={handleSendRecovery}
                  isExpanded={expandedAlertId === t.memberId}
                  onToggle={() => setExpandedAlertId(expandedAlertId === t.memberId ? null : t.memberId)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Today's Tee Sheet Timeline */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div className="text-sm font-bold text-gray-800">Today's Tee Sheet</div>
              <div className="text-xs text-gray-400">Friday, January 17, 2026 - {teeData.length} groups</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> At Risk</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Watch</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-200 border border-amber-400" /> VIP</span>
            </div>
          </div>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left font-medium">Time</th>
                  <th className="px-4 py-2.5 text-left font-medium">Course</th>
                  <th className="px-4 py-2.5 text-left font-medium">Member</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell">Archetype</th>
                  <th className="px-4 py-2.5 text-center font-medium">Health</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell">Group</th>
                  <th className="px-4 py-2.5 text-center font-medium hidden lg:table-cell">Cancel Risk</th>
                  <th className="px-4 py-2.5 text-left font-medium">Flags</th>
                </tr>
              </thead>
              <tbody>
                {teeData.map((t, i) => {
                  const color = healthColor(t.healthScore);
                  const isAtRisk = t.healthScore < 50;
                  const isVip = t.duesAnnual >= 18000 && t.healthScore >= 50;
                  return (
                    <tr
                      key={`${t.memberId}-${t.time}`}
                      className={`border-t border-gray-100 transition-colors ${isAtRisk ? 'bg-red-50/30' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-gray-50`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-gray-700 whitespace-nowrap">{t.time}</td>
                      <td className="px-4 py-2.5 text-xs text-gray-500">{t.course}</td>
                      <td className="px-4 py-2.5">
                        <MemberLink memberId={t.memberId} mode="drawer" className="font-semibold text-sm text-gray-800 hover:text-brand-500">
                          {t.name}
                        </MemberLink>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <ArchetypeBadge archetype={t.archetype} size="xs" />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-mono font-bold text-xs" style={{ color }}>{t.healthScore}</span>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs text-gray-500 max-w-[200px] truncate">
                        {t.group.join(', ')}
                      </td>
                      <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                        {t.cancelRisk > 0.3 ? (
                          <span className="font-mono text-xs font-bold text-red-500">{Math.round(t.cancelRisk * 100)}%</span>
                        ) : (
                          <span className="font-mono text-xs text-gray-400">{Math.round(t.cancelRisk * 100)}%</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1 flex-wrap">
                          {isAtRisk && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">AT RISK</span>
                          )}
                          {isVip && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">VIP</span>
                          )}
                          {t.group.some(g => g === 'Guest' || g.includes('guest') || g === 'Client' || g.includes('Client')) && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">GUEST</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cart Prep Section */}
        <div>
          <button
            onClick={() => setShowCartPrep(!showCartPrep)}
            className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer bg-transparent border-none p-0 mb-3"
          >
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${showCartPrep ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
            </svg>
            Cart Prep Recommendations ({teeData.length} carts)
          </button>
          {showCartPrep && (
            <div className="flex flex-col gap-3">
              {teeData.map(t => <CartPrepCard key={`prep-${t.memberId}`} teeTime={t} onSendCartText={handleSendCartText} onSendDiningNudge={handleSendDiningNudge} />)}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
