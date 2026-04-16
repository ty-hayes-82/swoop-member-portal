import { useState } from 'react';
import { StoryHeadline } from '@/components/ui';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import SourceBadge from '@/components/ui/SourceBadge';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge';
import MemberLink from '@/components/MemberLink';
import ActionPanel from '@/components/ui/ActionPanel';
import PageTransition from '@/components/ui/PageTransition';
import { getTodayTeeSheet, getTeeSheetSummary } from '@/services/operationsService';
import { useApp } from '@/context/AppContext';
import { apiFetch } from '@/services/apiClient';
import { isGateOpen } from '@/services/demoGate';
import { getFirstName } from '../../utils/nameUtils';
import { CourseUtilizationCards } from '@/components/insights/DeepInsightWidgets';

const healthColor = (score) => {
  if (score >= 70) return '#12b76a';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#ea580c';
  return '#ef4444';
};

const healthRgb = (score) => {
  if (score >= 70) return '18,183,106';
  if (score >= 50) return '245,158,11';
  if (score >= 30) return '234,88,12';
  return '239,68,68';
};

const healthLabel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

const showMemberNames = () => isGateOpen('members');

function AlertCard({ teeTime, onSendRecovery, isExpanded, onToggle }) {
  const color = healthColor(teeTime.healthScore);
  const rgb = healthRgb(teeTime.healthScore);
  const isVip = teeTime.duesAnnual >= 18000;
  const hasComplaint = teeTime.cartPrep.note?.toLowerCase().includes('complaint') || teeTime.cartPrep.note?.toLowerCase().includes('critical');
  const severityLabel = isVip ? 'VIP' : healthLabel(teeTime.healthScore).toUpperCase();

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

  const metaParts = [
    `${teeTime.time} ${teeTime.course}`,
    `Health ${teeTime.healthScore}`,
    teeTime.archetype,
    teeTime.duesAnnual > 0 ? `$${Math.round(teeTime.duesAnnual / 1000)}K/yr` : null,
  ].filter(Boolean);

  return (
    <div>
      <div
        onClick={onToggle}
        className="swoop-detail-row cursor-pointer"
        style={{
          background: `rgba(${rgb},0.07)`,
          borderColor: `rgba(${rgb},0.18)`,
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Header strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color,
              background: `rgba(${rgb},0.15)`,
              border: `1px solid rgba(${rgb},0.3)`,
              padding: '2px 7px',
              borderRadius: 999,
              flexShrink: 0,
            }}
          >
            {severityLabel}
          </span>
          {showMemberNames() ? (
            <MemberLink
              memberId={teeTime.memberId}
              mode="drawer"
              style={{ fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none' }}
            >
              {teeTime.name}
            </MemberLink>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Member</span>
          )}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            {metaParts.join(' · ')}
          </span>
          <span style={{ flex: '1 1 0%' }} />
          <span
            className="text-[10px] font-bold py-0.5 px-2 rounded-full shrink-0"
            style={{ background: `rgba(${rgb},0.15)`, color }}
          >
            {Math.round(teeTime.cancelRisk * 100)}% cancel risk
          </span>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className="swoop-action-btn"
          >
            {isExpanded ? 'Less ▴' : 'Act →'}
          </button>
        </div>

        {/* Divider + note + quick actions */}
        {showMemberNames() && teeTime.cartPrep.note && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              width: '100%',
            }}
          >
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
              Signal
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>
              {teeTime.cartPrep.note}
            </div>
            <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {hasComplaint && (
                <button
                  type="button"
                  onClick={() => onSendRecovery(teeTime, 'email')}
                  className="swoop-action-btn"
                >
                  ✉ Recovery Email
                </button>
              )}
              <button
                type="button"
                onClick={() => onSendRecovery(teeTime, 'sms')}
                className="swoop-action-btn"
              >
                💬 {hasComplaint ? 'Apology Text' : 'Check-in Text'}
              </button>
              {showMemberNames() && (
                <MemberLink
                  memberId={teeTime.memberId}
                  mode="drawer"
                  className="swoop-action-btn no-underline"
                >
                  🔗 Decay Sequence
                </MemberLink>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Expanded inline action panel */}
      {isExpanded && (
        <div onClick={(e) => e.stopPropagation()}>
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
        </div>
      )}
    </div>
  );
}

function CartPrepCard({ teeTime, onSendCartText, onSendDiningNudge }) {
  const color = healthColor(teeTime.healthScore);
  const isAtRisk = teeTime.healthScore < 50;
  const firstName = getFirstName(teeTime.name);
  return (
    <div className={`rounded-xl border p-4 ${isAtRisk ? 'bg-red-500/[0.07] border-red-500/30' : 'bg-swoop-panel border-swoop-border'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-swoop-text">{showMemberNames() ? teeTime.name : 'Member'}</span>
          <span className="text-xs text-swoop-text-label">{teeTime.time}</span>
        </div>
        <span className="font-mono text-xs font-bold" style={{ color }}>{teeTime.healthScore}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {teeTime.cartPrep.beverage && (
          <div className="flex items-start gap-1.5">
            <span className="text-swoop-text-label shrink-0">Beverage:</span>
            <span className="text-swoop-text-2 font-medium">{teeTime.cartPrep.beverage}</span>
          </div>
        )}
        {teeTime.cartPrep.snack && (
          <div className="flex items-start gap-1.5">
            <span className="text-swoop-text-label shrink-0">Snack:</span>
            <span className="text-swoop-text-2 font-medium">{teeTime.cartPrep.snack}</span>
          </div>
        )}
        <div className="flex items-start gap-1.5 sm:col-span-1">
          <span className="text-swoop-text-label shrink-0">Group:</span>
          <span className="text-swoop-text-2 font-medium">{teeTime.group.join(', ')}</span>
        </div>
      </div>
      {teeTime.cartPrep.note && (
        <div className={`mt-2 text-[11px] leading-relaxed p-2 rounded-lg ${isAtRisk ? 'bg-red-500/10 text-red-300 border border-red-500/30' : 'bg-swoop-row text-swoop-text-muted'}`}>
          {teeTime.cartPrep.note}
        </div>
      )}
      {/* Action buttons */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          onClick={() => onSendCartText(teeTime)}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-brand-500/40 bg-brand-500/10 text-brand-400 inline-flex items-center gap-1 hover:bg-brand-500/20 transition-colors"
        >
          <span>💬</span> Send Cart Prep Text
        </button>
        <button
            onClick={() => onSendDiningNudge(teeTime)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border border-amber-500/40 bg-amber-500/10 text-amber-400 inline-flex items-center gap-1 hover:bg-amber-500/20 transition-colors"
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
    const firstName = getFirstName(teeTime.name);
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
      showToast(`Cart prep text sent to ${firstName}`, 'success');
    } catch {
      const body = encodeURIComponent(`Hi ${firstName}! Your cart is ready for your ${teeTime.time} tee time: ${items}. See you on the first tee!`);
      const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
      window.open(`sms:${demoPhone}?&body=${body}`, '_self');
      showToast(`Cart prep text sent to ${firstName}`, 'success');
    }
  };

  const handleSendRecovery = async (teeTime, type) => {
    const firstName = getFirstName(teeTime.name);
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
        showToast(`Check-in text drafted for ${firstName}`, 'success');
      } else {
        const to = encodeURIComponent(localStorage.getItem('swoop_demo_email') || draft?.memberEmail || '');
        const subject = encodeURIComponent(draft?.subject || `A personal note from your club`);
        const body = encodeURIComponent(draft?.body || '');
        if (emailSendMode === 'gmail') {
          window.open(`https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`, '_blank');
        } else {
          window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_self');
        }
        showToast(`Recovery email drafted for ${firstName}`, 'success');
      }
    } catch {
      if (type === 'sms') {
        const body = encodeURIComponent(`Hi ${firstName}, I wanted to personally reach out about your recent experience. We've made changes and I'd love to show you. Can we connect?`);
        window.open(`sms:?&body=${body}`, '_self');
        showToast(`Check-in text drafted for ${firstName}`, 'success');
      }
    }
  };

  const handleSendDiningNudge = async (teeTime) => {
    const firstName = getFirstName(teeTime.name);
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
      showToast(`Dining nudge sent to ${firstName}`, 'success');
    } catch {
      const body = encodeURIComponent(`Great round today, ${firstName}! Chef has a special lunch menu — your usual table is open at the Grill Room. Want me to hold it?`);
      const demoPhone = localStorage.getItem('swoop_demo_phone') || '';
      window.open(`sms:${demoPhone}?&body=${body}`, '_self');
      showToast(`Dining nudge sent to ${firstName}`, 'success');
    }
  };

  if (teeData.length === 0) {
    return (
      <PageTransition>
        <div className="flex flex-col gap-6">
          <StoryHeadline variant="insight" headline="Who's on the course today — and who needs your attention?" context="Import tee sheet data to see today's rounds, at-risk members on course, and cart prep recommendations." />
          <div className="py-12 px-4 text-center text-sm text-swoop-text-label border border-dashed border-swoop-border rounded-xl">
            No tee sheet data available yet. Import tee sheet reservations to see today's schedule.
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <StoryHeadline
          variant="insight"
          headline="Who's on the course today — and who needs your attention?"
        />

        <EvidenceStrip systems={['Tee Sheet', 'Member CRM', 'Weather', 'POS']} />

        {/* Course utilization powered by imported courses + bookings */}
        <CourseUtilizationCards />

        {/* At-Risk members are surfaced inline in the tee sheet table via color-coded health badges.
            Full alert cards live on the Today view — this keeps the tee sheet focused on scheduling. */}
        {atRiskTimes.length > 0 && (
          <div className="flex items-center gap-2 px-1">
            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
            <span className="text-[11px] text-error-500 font-semibold">
              {atRiskTimes.length} at-risk member{atRiskTimes.length !== 1 ? 's' : ''} on today's sheet — health scores visible in the table below
            </span>
          </div>
        )}

        {/* Today's Tee Sheet Timeline */}
        <div className="bg-swoop-panel rounded-2xl border border-swoop-border overflow-hidden">
          <div className="p-4 border-b border-swoop-border flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <div className="text-sm font-bold text-swoop-text">Today's Tee Sheet</div>
              <div className="text-xs text-swoop-text-label">{(getTeeSheetSummary().date ? new Date(getTeeSheetSummary().date + 'T12:00:00') : new Date()).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {teeData.length} groups</div>
              {/* Source badges for the underlying columns — Pillar 1: SEE IT */}
              <div className="flex gap-1 mt-1.5 flex-wrap">
                <SourceBadge system="Tee Sheet" size="xs" />
                <SourceBadge system="Member CRM" size="xs" />
                <SourceBadge system="Analytics" size="xs" />
                <SourceBadge system="POS" size="xs" />
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-swoop-text-muted">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> At Risk</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Watch</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success-500" /> Healthy</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-200 border border-amber-400" /> VIP</span>
            </div>
          </div>
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-swoop-row text-xs text-swoop-text-label uppercase tracking-wider">
                  <th className="px-4 py-2.5 text-left font-medium" title="Source: Tee Sheet">Time ⛳</th>
                  <th className="px-4 py-2.5 text-left font-medium" title="Source: Tee Sheet">Course ⛳</th>
                  <th className="px-4 py-2.5 text-left font-medium" title="Source: Member CRM">Member ★</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden sm:table-cell" title="Source: Analytics">Archetype ◉</th>
                  <th className="px-4 py-2.5 text-center font-medium" title="Source: Analytics (cross-domain composite)">Health ◉</th>
                  <th className="px-4 py-2.5 text-left font-medium hidden md:table-cell" title="Source: Tee Sheet">Group ⛳</th>
                  <th className="px-4 py-2.5 text-center font-medium hidden lg:table-cell" title="Source: Analytics ML prediction">Cancel Risk ◉</th>
                  <th className="px-4 py-2.5 text-left font-medium" title="Source: Member CRM + POS">Flags ★</th>
                </tr>
              </thead>
              <tbody>
                {teeData.map((t, i) => {
                  const color = healthColor(t.healthScore);
                  const isAtRisk = t.healthScore < 50;
                  const isVip = t.duesAnnual >= 18000 && t.healthScore >= 50;
                  // Polish #4: healthy/watch rows with no visible dues badge get a subtle hover tooltip
                  const showHoverDuesTip = !isAtRisk && !isVip && t.duesAnnual > 0;
                  const rowTitle = showHoverDuesTip ? `$${Math.round(t.duesAnnual / 1000)}K/yr dues` : undefined;
                  return (
                    <tr
                      key={`${t.memberId}-${t.time}`}
                      title={rowTitle}
                      className={`border-t border-swoop-border-inset transition-colors ${isAtRisk ? 'bg-red-500/[0.06]' : i % 2 === 0 ? 'bg-swoop-panel' : 'bg-swoop-row'} hover:bg-swoop-row-hover`}
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-semibold text-swoop-text-2 whitespace-nowrap">{t.time}</td>
                      <td className="px-4 py-2.5 text-xs text-swoop-text-muted">{t.course}</td>
                      <td className="px-4 py-2.5">
                        {showMemberNames() ? (
                          <MemberLink
                            memberId={t.memberId}
                            mode="drawer"
                            className="font-semibold text-sm text-swoop-text hover:text-brand-500"
                          >
                            <span title={t.duesAnnual > 0 ? `$${t.duesAnnual.toLocaleString()}/yr in dues — click to view full profile` : 'Click to view profile'}>
                              {t.name}
                            </span>
                          </MemberLink>
                        ) : (
                          <span className="font-semibold text-sm text-swoop-text">Member</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <ArchetypeBadge archetype={t.archetype} size="xs" />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span
                          className="font-mono font-bold text-xs cursor-help"
                          style={{ color }}
                          title={`Cross-domain health score · 4 dimensions:\nGolf · Dining · Email · Events\nClick member name to see breakdown`}
                        >
                          {t.healthScore}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell text-xs text-swoop-text-muted max-w-[200px] truncate" title={t.group.join(', ')}>
                        {t.group.join(', ')}
                      </td>
                      <td className="px-4 py-2.5 text-center hidden lg:table-cell">
                        {t.cancelRisk > 0.3 ? (
                          <span className="font-mono text-xs font-bold text-red-500">{Math.round(t.cancelRisk * 100)}%</span>
                        ) : (
                          <span className="font-mono text-xs text-swoop-text-label">{Math.round(t.cancelRisk * 100)}%</span>
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
                          {/* Dues exposure — Pillar 3: PROVE IT */}
                          {isAtRisk && t.duesAnnual > 0 && (
                            <span
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200"
                              title={`$${t.duesAnnual.toLocaleString()}/yr in dues at risk`}
                            >
                              ${Math.round(t.duesAnnual / 1000)}K AT RISK
                            </span>
                          )}
                          {isVip && t.duesAnnual > 0 && (
                            <span
                              className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
                              title={`$${t.duesAnnual.toLocaleString()}/yr VIP dues`}
                            >
                              ${Math.round(t.duesAnnual / 1000)}K VIP
                            </span>
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
            className="flex items-center gap-2 text-sm font-bold text-swoop-text cursor-pointer bg-transparent border-none p-0 mb-3 focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <svg className={`w-4 h-4 text-swoop-text-label transition-transform ${showCartPrep ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="currentColor">
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
