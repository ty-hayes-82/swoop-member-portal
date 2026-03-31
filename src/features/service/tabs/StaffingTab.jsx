// StaffingTab — staffing-to-demand intelligence
// Addresses #2 survey demand: "Better staffing to match real demand" (60%)
// 4/4 survey respondents would act on "Add server based on weather + demand"
import { useState } from 'react';
import { theme } from '@/config/theme';
import { understaffedDays, feedbackRecords } from '@/data/staffing';
import { getDailyBriefing } from '@/services/briefingService';
import MemberLink from '@/components/MemberLink';

export default function StaffingTab() {
  const [expandedDay, setExpandedDay] = useState(null);
  const briefing = getDailyBriefing();
  const totalComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const avgComplaintMultiplier = (
    understaffedDays.reduce((sum, day) => sum + day.complaintMultiplier, 0) / understaffedDays.length
  ).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* Tomorrow's Staffing Risk — most actionable cross-domain insight */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.accent}08, ${theme.colors.accent}02)`,
        border: `1px solid ${theme.colors.accent}30`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>📋</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.accent, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
              Tomorrow's Staffing Risk
            </div>
            <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>
              Saturday: Grill Room needs 4 servers — only 2 scheduled
            </div>
            <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, lineHeight: 1.6, marginBottom: theme.spacing.md }}>
              Based on {briefing?.teeSheet?.roundsToday || 220} booked rounds + weather forecast + 1 private dining event.
              On similar days with 2 servers, complaints increased {avgComplaintMultiplier}x and ticket times rose 20%.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: theme.radius.sm,
              background: theme.colors.accent, color: '#fff',
              fontSize: theme.fontSize.sm, fontWeight: 600,
              cursor: 'pointer',
            }}>
              Add server to Saturday schedule
            </div>
          </div>
        </div>
      </div>

      {/* Understaffing = Inconsistent Service */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Understaffing Drives Service Inconsistency
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
          <MetricCard label="Understaffed Days (Jan)" value={String(understaffedDays.length)} sublabel="Grill Room lunch service" />
          <MetricCard label="Complaint Spike" value={`${avgComplaintMultiplier}x higher`} sublabel={`${totalComplaints} complaints on those days`} />
          <MetricCard label="Ticket Time Impact" value="+20%" sublabel="Average increase when short-staffed" />
        </div>
      </div>

      {/* Understaffed Days Detail */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Understaffed Days — January 2026
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {understaffedDays.map((day, idx) => {
            const isExpanded = expandedDay === day.date;
            const dayComplaints = feedbackRecords.filter(f => f.date === day.date && f.isUnderstaffedDay);
            return (
            <div key={idx}>
            <div
              onClick={() => setExpandedDay(isExpanded ? null : day.date)}
              style={{
                padding: theme.spacing.md,
                background: theme.colors.bgDeep,
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.border}`,
                cursor: 'pointer', transition: 'background 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${theme.colors.border}40`; }}
              onMouseLeave={e => { e.currentTarget.style.background = theme.colors.bgDeep; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
                    {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    <span style={{ color: theme.colors.textMuted, fontSize: 12, marginLeft: 8 }}>{isExpanded ? '▾' : '▸'}</span>
                  </div>
                  <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>{day.outlet} Lunch</div>
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: theme.colors.risk,
                  background: `${theme.colors.risk}10`, padding: '3px 10px', borderRadius: '999px',
                }}>
                  {day.scheduledStaff}/{day.requiredStaff} servers
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: theme.spacing.sm, fontSize: 13, color: theme.colors.textSecondary }}>
                <div>
                  Ticket time: <strong style={{ color: theme.colors.textPrimary }}>+{(day.ticketTimeIncrease * 100).toFixed(0)}%</strong>
                </div>
                <div>
                  Complaints: <strong style={{ color: theme.colors.textPrimary }}>{day.complaintMultiplier.toFixed(1)}x higher</strong>
                </div>
                <div>
                  Service impact: <strong style={{ color: theme.colors.risk }}>Degraded</strong>
                </div>
              </div>
            </div>
            {isExpanded && (
              <div style={{ padding: '8px 14px 12px', borderLeft: `3px solid ${theme.colors.risk}30`, marginLeft: 14, fontSize: 13 }}>
                <div style={{ fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                  {dayComplaints.length} complaint{dayComplaints.length !== 1 ? 's' : ''} filed on this day:
                </div>
                {dayComplaints.length > 0 ? dayComplaints.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: `1px solid ${theme.colors.border}` }}>
                    <span>
                      <MemberLink mode="drawer" memberId={c.memberId} style={{ fontWeight: 600, color: theme.colors.accent, textDecoration: 'none' }}>
                        {c.memberName || c.memberId}
                      </MemberLink>
                      <span style={{ color: theme.colors.textMuted }}> — {c.category}</span>
                    </span>
                    <span style={{ fontSize: 11, color: theme.colors.textMuted }}>{c.status}</span>
                  </div>
                )) : <div style={{ color: theme.colors.textMuted }}>No individual complaints recorded for this date.</div>}
              </div>
            )}
            </div>
            );
          })}
        </div>
      </div>

      {/* Staffing-to-Satisfaction Correlation */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
          Staffing-to-Satisfaction Correlation
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: theme.colors.textSecondary, margin: 0, marginBottom: theme.spacing.md }}>
          <strong style={{ color: theme.colors.textPrimary }}>{totalComplaints} of {feedbackRecords.length} complaints</strong>{' '}
          occurred on understaffed days. When the Grill Room runs with 2-3 servers instead of 4, service complaints increase {avgComplaintMultiplier}x.
        </p>
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.success}08, ${theme.colors.success}02)`,
          border: `1px solid ${theme.colors.success}30`,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.md,
          display: 'flex', alignItems: 'flex-start', gap: theme.spacing.sm,
        }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: theme.colors.textSecondary }}>
            <strong style={{ color: theme.colors.textPrimary }}>Recommendation:</strong>{' '}
            Maintain 4-server minimum for Grill Room lunch on high-demand days (Wed-Sat). This eliminates the primary driver of service inconsistency.
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sublabel }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 500, color: theme.colors.textSecondary, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.mono, marginBottom: 4 }}>{value}</div>
      {sublabel && <div style={{ fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.4 }}>{sublabel}</div>}
    </div>
  );
}
