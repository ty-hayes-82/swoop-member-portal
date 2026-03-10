// DailyBriefing — Today mode: immediate priorities. Analytics mode: full briefing.
// Critique Phase 4: two-mode experience.
import React from 'react';
import { Panel, ConnectedSystems, StoryHeadline, AgentInboxStrip } from '@/components/ui/index.js';
import { useApp } from '@/context/AppContext.jsx';
import { getTopPendingAction } from '@/services/agentService.js';
import TodayMode from './TodayMode.jsx';
import YesterdayRecap from './YesterdayRecap.jsx';
import TodayRiskFactors from './TodayRiskFactors.jsx';
import PendingActions from './PendingActions.jsx';
import PipelineSnapshot from './PipelineSnapshot.jsx';
import MorningBriefing from '@/components/ui/MorningBriefing.jsx';
import DataQuality from '@/components/ui/DataQuality.jsx';
import { getDailyBriefing } from '@/services/briefingService.js';
import { useNavigation } from '@/context/NavigationContext.jsx';
import { theme } from '@/config/theme.js';

export default function DailyBriefing() {
  const { navigate, viewMode, setViewMode } = useNavigation();
  const briefing = getDailyBriefing();
  const { pendingAgentCount, approveAction, inbox } = useApp();
  const topAction = getTopPendingAction();

  const yesterday = briefing.yesterdayRecap || {};
  const km = briefing.keyMetrics || {};
  const pending = briefing.pendingActions || [];
  const [briefingGenerated, setBriefingGenerated] = React.useState(false);

  const recapItems = [
    { label: 'Yesterday revenue', value: yesterday.revenue ? '$' + yesterday.revenue.toLocaleString() : '—', color: yesterday.revenueVsLastWeek >= 0 ? theme.colors.success : theme.colors.urgent },
    { label: 'Rounds played', value: yesterday.rounds ? String(yesterday.rounds) + ' rounds' : '—', sub: yesterday.roundsVsLastWeek ? (yesterday.roundsVsLastWeek > 0 ? '+' : '') + yesterday.roundsVsLastWeek + ' vs last week' : null },
    { label: 'At-risk members', value: String(km.atRiskMembers || 0), color: (km.atRiskMembers || 0) > 3 ? theme.colors.warning : theme.colors.success },
    { label: 'Open complaints', value: String(km.openComplaints || 0), color: (km.openComplaints || 0) > 2 ? theme.colors.urgent : theme.colors.textPrimary },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>

      <StoryHeadline
        variant="urgent"
        headline="James Whitfield filed a complaint Jan 18. It was never resolved. He resigned Jan 22 — $18K/year in dues lost."
        context="An understaffed Friday caused a 40-minute lunch. The complaint was acknowledged but no one followed up. Four days later, he was gone. The Jan 9 and Jan 28 gaps follow the same pattern."
      />

      <div
        style={{
          background: `${theme.colors.success}0F`,
          border: `1px solid ${theme.colors.success}33`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.md,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm }}>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary }}>Yesterday — {yesterday.date || 'Jan 16'}</div>
          {yesterday.isUnderstaffed && <span style={{ fontSize: theme.fontSize.xs, padding: '2px 8px', borderRadius: theme.radius.sm, background: theme.colors.urgent + '18', color: theme.colors.urgent, fontWeight: 600 }}>Understaffed</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: theme.spacing.sm }}>
          {recapItems.map((item) => (
            <div key={item.label} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.sm, padding: theme.spacing.sm, border: `1px solid ${theme.colors.border}` }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: item.color || theme.colors.textPrimary }}>{item.value}</div>
              {item.sub && <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
        {(yesterday.incidents || []).length > 0 && (
          <div style={{ marginTop: theme.spacing.sm, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {yesterday.incidents.map((inc, i) => (
              <div key={i} style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 8 }}>●</span> {inc}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          background: theme.colors.bgCard,
          borderRadius: theme.radius.md,
          border: `1px solid ${theme.colors.borderLight}`,
          borderLeft: '4px solid #4ADE80',
          padding: theme.spacing.md,
          boxShadow: theme.shadow.sm,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          <div>
            <p style={{ fontSize: theme.fontSize.sm, fontWeight: 700, margin: 0 }}>Morning Briefing Sheet</p>
            <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 }}>Print-ready summary for your 8am stand-up</p>
          </div>
          <button
            type="button"
            onClick={() => {
              const w = window.open('', '_blank');
              const yr = yesterday;
              const risks = (briefing.todayRisks?.atRiskTeetimes || []);
              const actions = pending;
              const wins = (briefing.quickWins || []);
              w.document.write('<html><head><title>Morning Briefing - Oakmont Hills CC</title><style>'
                + 'body{font-family:-apple-system,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1a1a1a}'
                + 'h1{font-size:24px;border-bottom:2px solid #4ADE80;padding-bottom:8px}'
                + 'h2{font-size:16px;color:#333;margin-top:24px;text-transform:uppercase;letter-spacing:0.05em}'
                + '.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:12px 0}'
                + '.card{background:#f8f9fa;border-radius:8px;padding:12px;border:1px solid #e5e7eb}'
                + '.card .label{font-size:11px;color:#888;text-transform:uppercase}'
                + '.card .val{font-size:20px;font-weight:700;margin-top:4px}'
                + '.item{padding:8px 0;border-bottom:1px solid #f0f0f0}'
                + '.urgent{color:#ef4444}.warning{color:#f59e0b}'
                + '@media print{body{padding:20px}}'
                + '</style></head><body>'
                + '<h1>Oakmont Hills CC \u2014 Morning Briefing</h1>'
                + '<p style="color:#666">Saturday, January 17, 2026 \u00b7 Generated ' + new Date().toLocaleTimeString() + '</p>'
                + '<h2>Yesterday (Jan 16)</h2>'
                + '<div class="grid">'
                + '<div class="card"><div class="label">Revenue</div><div class="val">$' + (yr.revenue||0).toLocaleString() + '</div></div>'
                + '<div class="card"><div class="label">Rounds</div><div class="val">' + (yr.rounds||0) + '</div></div>'
                + '<div class="card"><div class="label">At-Risk Members</div><div class="val">' + (km.atRiskMembers||0) + '</div></div>'
                + '<div class="card"><div class="label">Open Complaints</div><div class="val">' + (km.openComplaints||0) + '</div></div>'
                + '</div>'
                + ((yr.incidents||[]).length ? '<h2>Incidents</h2>' + (yr.incidents||[]).map(function(i){return '<div class="item urgent">\u2022 '+i+'</div>'}).join('') : '')
                + (risks.length ? '<h2>At-Risk Tee Times Today</h2>' + risks.map(function(r){return '<div class="item"><strong>'+r.name+'</strong> \u00b7 '+r.time+' \u00b7 Score: '+r.score+'<br/><span style="color:#888">'+r.topRisk+'</span></div>'}).join('') : '')
                + '<h2>AI Agent Actions</h2>'
                + actions.map(function(a){return '<div class="item"><strong class="'+(a.urgency==='high'?'urgent':'warning')+'">['+a.urgency.toUpperCase()+']</strong> '+a.title+'<br/><span style="color:#888">'+a.reason+'</span></div>'}).join('')
                + (wins.length ? '<h2>Quick Wins</h2>' + wins.map(function(qw){return '<div class="item">'+qw.icon+' <strong>'+qw.title+'</strong><br/><span style="color:#888">Impact: '+qw.impact+'</span></div>'}).join('') : '')
                + '<div style="margin-top:32px;padding-top:16px;border-top:2px solid #e5e7eb;font-size:11px;color:#aaa">Swoop Golf \u00b7 Integrated Intelligence \u00b7 Confidential</div>'
                + '</body></html>');
              w.document.close();
              setTimeout(function(){ w.print(); }, 300);
              setBriefingGenerated(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: briefingGenerated ? '#22c55e' : '#4ADE80',
              color: '#0B3B1F',
              fontWeight: 700,
              fontSize: theme.fontSize.sm,
              borderRadius: theme.radius.md,
              padding: '12px 18px',
              border: 'none',
              cursor: 'pointer',
              minWidth: 240,
              transition: 'background 0.2s ease',
            }}
          >
            <span role="img" aria-label="document">📄</span> {briefingGenerated ? 'Briefing Generated \u2713' : "Generate Today's Briefing"}
          </button>
          <p style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, margin: 0 }}>Opens a print-ready page you can share with department heads</p>
        </div>
      </div>

      <AgentInboxStrip
        pendingCount={pendingAgentCount}
        topAction={topAction}
        onApproveTop={() => topAction && approveAction(topAction.id)}
        onOpenInbox={() => navigate('agent-command')}
      />

      {/* Mode switcher + print action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}` }}>
          {[['today', 'Today'], ['analytics', 'Analytics']].map(([mode, label]) => (
            <button key={mode} onClick={() => setViewMode(mode)} style={{
              padding: '7px 20px', borderRadius: '8px', fontSize: theme.fontSize.sm, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: viewMode === mode ? theme.colors.bgCard : 'transparent',
              color: viewMode === mode ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: viewMode === mode ? theme.shadow.sm : 'none',
            }}>{label}</button>
          ))}
        </div>
        <MorningBriefing />
      </div>

      {/* TODAY mode — 3 things that matter */}
      {viewMode === 'today' && (
        <TodayMode onNavigate={navigate} />
      )}

      {/* ANALYTICS mode — full analytical briefing */}
      {viewMode === 'analytics' && (
        <>
          {/* Date header */}
          <div style={{ paddingBottom: '4px', borderBottom: `1px solid ${theme.colors.border}` }}>
            <div style={{ fontSize: '11px', color: theme.colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: '4px' }}>
              SATURDAY, JANUARY 17, 2026 · OAKMONT HILLS CC
            </div>
            <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '26px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.1 }}>
              Full operational picture
            </h2>
          </div>

          {/* James Whitfield live alert */}
          <div
            onClick={() => navigate('staffing-service')}
            style={{
              background: `${theme.colors.urgent}06`,
              border: `1.5px solid ${theme.colors.urgent}50`,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
              cursor: 'pointer',
            }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.md }}>
              <div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.urgent, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  ⚠ Member Needs Attention — Preventable Resignation In Progress
                </div>
                <div style={{ fontFamily: theme.fonts.serif, fontSize: theme.fontSize.xl, color: theme.colors.textPrimary, marginTop: 4 }}>
                  James Whitfield · Balanced Active · $18,000/yr in dues
                </div>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, textAlign: 'right', flexShrink: 0, fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>Full case →</div>
                <div style={{ fontSize: '11px', color: theme.colors.textMuted }}>Staffing & Service</div>
              </div>
            </div>
            <div className="grid-responsive-4" style={{ marginBottom: theme.spacing.md }}>
              {[
                { label: 'Complaint filed', value: 'Jan 16', color: theme.colors.urgent },
                { label: 'Follow-up status', value: 'Not resolved', color: theme.colors.warning },
                { label: 'How unhappy', value: 'Very unhappy', color: theme.colors.urgent },
                { label: 'Resign risk by', value: 'Jan 22', color: theme.colors.urgent },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: theme.colors.bgCard, borderRadius: theme.radius.sm, padding: theme.spacing.sm }}>
                  <div style={{ fontSize: '11px', color: theme.colors.textMuted, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
              <strong style={{ color: theme.colors.textPrimary }}>What happened: </strong>
              Grill Room short-staffed Jan 16 → 40-minute wait for James's lunch → He filed a complaint that evening → We acknowledged it, no one followed up → He hasn't been back in 6 days → <strong style={{ color: theme.colors.urgent }}>At risk of resigning by Jan 22</strong>
            </div>
          </div>

          <Panel title="Yesterday's Results" subtitle="How did January 16th perform vs. expectations?">
            <YesterdayRecap data={briefing.yesterdayRecap} />
          </Panel>

          <Panel title="Today's Watch List" subtitle="What could affect today's operation?">
            <TodayRiskFactors data={briefing.todayRisks} onNavigate={navigate} />
          </Panel>

          <PipelineSnapshot onNavigate={navigate} />

          <Panel title="Active Response Plans" subtitle="Pre-assembled actions for known operational patterns">
            <PendingActions actions={briefing.pendingActions} onNavigate={navigate} />
          </Panel>

          <DataQuality />

          <ConnectedSystems />
        </>
      )}
    </div>
  );
}
