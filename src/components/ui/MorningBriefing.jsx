// MorningBriefing — printable daily sheet GMs can hand to department heads.
// Critique Phase 3: "Many GMs still run morning standups with printed sheets."
import { useState } from 'react';
import { theme } from '@/config/theme';
import MemberLink from '@/components/MemberLink.jsx';
import { getDailyBriefing } from '@/services/briefingService';
import { getAtRiskMembers } from '@/services/memberService';

export default function MorningBriefing() {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState({
    results: false,
    actions: false,
    members: false,
    staffing: false,
    notes: false,
  });
  const briefing = getDailyBriefing();
  const atRisk = getAtRiskMembers();

  const handlePrint = () => window.print();
  const toggleSection = (key) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const SectionHeader = ({ label, color, sectionKey }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '6px 0', border: 'none', background: 'none',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color, textTransform: 'uppercase' }}>
        {label}
      </div>
      <span style={{ fontSize: '16px', color }}>{collapsed[sectionKey] ? '＋' : '−'}</span>
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 20px', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm,
          fontWeight: 700, cursor: 'pointer',
          border: 'none',
          background: theme.colors.operations, color: '#fff',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          transition: 'opacity 0.15s',
        }}>
        🖨 Print Today's Briefing
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl,
        }}>
          <div style={{
            background: theme.colors.white, color: theme.colors.briefingInk,
            borderRadius: theme.radius.lg, width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Print header */}
            <div style={{ padding: '24px 32px', borderBottom: `2px solid ${theme.colors.operations}`, background: theme.colors.briefingPaper }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: '22px', fontWeight: 400, color: theme.colors.briefingInk }}>
                    Oakmont Hills CC
                  </div>
                  <div style={{ fontSize: '13px', color: theme.colors.briefingMuted, marginTop: 2 }}>
                    Morning Operations Briefing · Saturday, January 17, 2026
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handlePrint} style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', background: theme.colors.operations, color: theme.colors.white }}>
                    Print / Save PDF
                  </button>
                  <button onClick={() => setOpen(false)} style={{
                    padding: '7px 14px', borderRadius: '6px', fontSize: '13px',
                    cursor: 'pointer', border: `1px solid ${theme.colors.briefingBorder}`, background: 'none', color: theme.colors.briefingMuted }}>
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Yesterday summary */}
              <section>
                <SectionHeader label="Yesterday's Results" color={theme.colors.operations} sectionKey="results" />
                {!collapsed.results && (
                  <div style={{ background: theme.colors.briefingPaper, borderRadius: '8px', padding: '14px 16px', fontSize: '14px', lineHeight: 1.7, color: theme.colors.briefingInk }}>
                    Revenue <strong>${briefing.yesterdayRecap.revenue.toLocaleString()}</strong> — {briefing.yesterdayRecap.revenueVsPlan > 0 ? '▲' : '▼'} {Math.abs(briefing.yesterdayRecap.revenueVsPlan)}% vs. plan
                    {briefing.yesterdayRecap.revenueVsLastWeek && (
                      <>, {briefing.yesterdayRecap.revenueVsLastWeek > 0 ? '▲' : '▼'} {Math.abs(briefing.yesterdayRecap.revenueVsLastWeek).toFixed(1)}% vs. last Sat</>
                    )}.
                    {' '}{briefing.yesterdayRecap.rounds} rounds completed
                    {briefing.yesterdayRecap.roundsVsLastWeek && (
                      <> ({briefing.yesterdayRecap.roundsVsLastWeek > 0 ? '+' : ''}{briefing.yesterdayRecap.roundsVsLastWeek} vs. last Sat)</>
                    )}.
                    {briefing.yesterdayRecap.incidents.length > 0 && (
                      <span style={{ color: theme.colors.urgent }}> {briefing.yesterdayRecap.incidents.length} issue{briefing.yesterdayRecap.incidents.length > 1 ? 's' : ''} to follow up on.</span>
                    )}
                  </div>
                )}
              </section>

              {/* Priority Actions for Today */}
              <section>
                <SectionHeader label="Priority Actions — Do These First" color={theme.colors.success} sectionKey="actions" />
                {!collapsed.actions && (
                  <div style={{ background: theme.colors.briefingPaper, borderRadius: '8px', padding: '12px 16px' }}>
                    {(briefing.quickWins || []).map((win, idx) => (
                      <div key={win.id} style={{ borderBottom: idx < briefing.quickWins.length - 1 ? `1px solid ${theme.colors.briefingDivider}` : 'none', paddingBottom: '10px', marginBottom: idx < briefing.quickWins.length - 1 ? '10px' : 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: theme.colors.briefingInk, marginBottom: '4px' }}>
                          {win.icon} {win.title}
                        </div>
                        <div style={{ fontSize: '12px', color: theme.colors.briefingMuted, lineHeight: 1.5 }}>
                          {win.detail}
                        </div>
                        <div style={{ fontSize: '11px', color: theme.colors.success, fontWeight: 600, marginTop: '4px' }}>
                          Impact: {win.impact} · Effort: {win.effort}
                          {win.conversionRate && <> · {win.conversionRate}% conversion</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Today's watch list */}
              <section>
                <SectionHeader label="Members Needing Attention Today" color={theme.colors.urgent} sectionKey="members" />
                {!collapsed.members && atRisk.filter(m => m.score < 40).map(m => (
                  <div key={m.memberId} style={{ borderBottom: `1px solid ${theme.colors.briefingDivider}`, padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <MemberLink
                        memberId={m.memberId}
                        style={{ fontSize: '14px', fontWeight: 600, color: theme.colors.briefingInk }}
                      >
                        {m.name}
                      </MemberLink>
                      <div style={{ fontSize: '12px', color: theme.colors.briefingMuted, marginTop: 2 }}>{m.topRisk}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: theme.colors.urgent, fontWeight: 600, flexShrink: 0, marginLeft: '16px', marginTop: 4 }}>
                      Action needed
                    </div>
                  </div>
                ))}
              </section>

              {/* Staffing */}
              <section>
                <SectionHeader label="Staffing & Weather" color={theme.colors.staffing} sectionKey="staffing" />
                {!collapsed.staffing && (
                  <div style={{ background: theme.colors.briefingPaper, borderRadius: '8px', padding: '14px 16px', fontSize: '14px', color: theme.colors.briefingInk, lineHeight: 1.7 }}>
                    <div>Weather: <strong>{briefing.todayRisks.weather}</strong></div>
                    <div style={{ marginTop: 4 }}>
                      {briefing.todayRisks.staffingGaps.length === 0
                        ? <span style={{ color: theme.colors.success }}>✓ All positions fully staffed</span>
                        : <span style={{ color: theme.colors.urgent }}>⚠ Gap: {briefing.todayRisks.staffingGaps.join(', ')}</span>}
                    </div>
                  </div>
                )}
              </section>

              {/* Notes line */}
              <section>
                <SectionHeader label="Department Head Notes" color={theme.colors.briefingSection} sectionKey="notes" />
                {!collapsed.notes && ['Golf Operations', 'F&B', 'Membership', 'Grounds'].map(dept => (
                  <div key={dept} style={{ borderBottom: `1px solid ${theme.colors.briefingDivider}`, padding: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: theme.colors.briefingMuted, width: 120, flexShrink: 0 }}>{dept}</div>
                    <div style={{ flex: 1, borderBottom: `1px solid ${theme.colors.briefingBorder}`, height: 20 }} />
                  </div>
                ))}
              </section>

              <div style={{ fontSize: '11px', color: theme.colors.briefingSection, textAlign: 'center', borderTop: `1px solid ${theme.colors.briefingDivider}`, paddingTop: '16px' }}>
                Oakmont Hills CC · Powered by Swoop Golf Intelligence · Demo Environment
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
