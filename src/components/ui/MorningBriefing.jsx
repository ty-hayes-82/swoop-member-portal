// MorningBriefing — printable daily sheet GMs can hand to department heads.
// Critique Phase 3: "Many GMs still run morning standups with printed sheets."
import { useState } from 'react';
import { theme } from '@/config/theme';
import { getDailyBriefing } from '@/services/briefingService';
import { getAtRiskMembers } from '@/services/memberService';

export default function MorningBriefing() {
  const [open, setOpen] = useState(false);
  const briefing = getDailyBriefing();
  const atRisk = getAtRiskMembers();

  const handlePrint = () => window.print();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '8px 16px', borderRadius: theme.radius.md, fontSize: theme.fontSize.sm,
          fontWeight: 600, cursor: 'pointer',
          border: `1px solid ${theme.colors.border}`,
          background: theme.colors.bgCard, color: theme.colors.textSecondary,
          display: 'flex', alignItems: 'center', gap: '6px',
        }}>
        🖨 Morning Briefing Sheet
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl,
        }}>
          <div style={{
            background: '#fff', color: '#1A2B1C',
            borderRadius: theme.radius.lg, width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
            {/* Print header */}
            <div style={{ padding: '24px 32px', borderBottom: '2px solid #1A7A3C', background: '#F7F5F2' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontWeight: 400, color: '#1A2B1C' }}>
                    Oakmont Hills CC
                  </div>
                  <div style={{ fontSize: '13px', color: '#4A6350', marginTop: 2 }}>
                    Morning Operations Briefing · Saturday, January 17, 2026
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handlePrint} style={{
                    padding: '7px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', border: 'none', background: '#1A7A3C', color: '#fff' }}>
                    Print / Save PDF
                  </button>
                  <button onClick={() => setOpen(false)} style={{
                    padding: '7px 14px', borderRadius: '6px', fontSize: '13px',
                    cursor: 'pointer', border: '1px solid #DDD8CF', background: 'none', color: '#4A6350' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Yesterday summary */}
              <section>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#1A7A3C', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Yesterday's Results
                </div>
                <div style={{ background: '#F7F5F2', borderRadius: '8px', padding: '14px 16px', fontSize: '14px', lineHeight: 1.7, color: '#1A2B1C' }}>
                  Revenue <strong>${briefing.yesterdayRecap.revenue.toLocaleString()}</strong> — {briefing.yesterdayRecap.revenueVsPlan > 0 ? '▲' : '▼'} {Math.abs(briefing.yesterdayRecap.revenueVsPlan)}% vs. plan.
                  {' '}{briefing.yesterdayRecap.rounds} rounds completed.
                  {briefing.yesterdayRecap.incidents.length > 0 && (
                    <span style={{ color: '#C0392B' }}> {briefing.yesterdayRecap.incidents.length} issue{briefing.yesterdayRecap.incidents.length > 1 ? 's' : ''} to follow up on.</span>
                  )}
                </div>
              </section>

              {/* Today's watch list */}
              <section>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#C0392B', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Members Needing Attention Today
                </div>
                {atRisk.filter(m => m.score < 40).map(m => (
                  <div key={m.memberId} style={{ borderBottom: '1px solid #EAE6DE', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A2B1C' }}>{m.name}</div>
                      <div style={{ fontSize: '12px', color: '#4A6350', marginTop: 2 }}>{m.topRisk}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#C0392B', fontWeight: 600, flexShrink: 0, marginLeft: '16px', marginTop: 4 }}>
                      Action needed
                    </div>
                  </div>
                ))}
              </section>

              {/* Staffing */}
              <section>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#9A5800', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Staffing & Weather
                </div>
                <div style={{ background: '#F7F5F2', borderRadius: '8px', padding: '14px 16px', fontSize: '14px', color: '#1A2B1C', lineHeight: 1.7 }}>
                  <div>Weather: <strong>{briefing.todayRisks.weather}</strong></div>
                  <div style={{ marginTop: 4 }}>
                    {briefing.todayRisks.staffingGaps.length === 0
                      ? <span style={{ color: '#1A6B34' }}>✓ All positions fully staffed</span>
                      : <span style={{ color: '#C0392B' }}>⚠ Gap: {briefing.todayRisks.staffingGaps.join(', ')}</span>}
                  </div>
                </div>
              </section>

              {/* Notes line */}
              <section>
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: '#8A9E8D', marginBottom: '8px', textTransform: 'uppercase' }}>
                  Department Head Notes
                </div>
                {['Golf Operations', 'F&B', 'Membership', 'Grounds'].map(dept => (
                  <div key={dept} style={{ borderBottom: '1px solid #EAE6DE', padding: '12px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#4A6350', width: 120, flexShrink: 0 }}>{dept}</div>
                    <div style={{ flex: 1, borderBottom: '1px solid #DDD8CF', height: 20 }} />
                  </div>
                ))}
              </section>

              <div style={{ fontSize: '11px', color: '#8A9E8D', textAlign: 'center', borderTop: '1px solid #EAE6DE', paddingTop: '16px' }}>
                Oakmont Hills CC · Powered by Swoop Golf Intelligence · Demo Environment
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
