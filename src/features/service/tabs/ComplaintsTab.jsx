// ComplaintsTab — complaint patterns, resolution status, and understaffed-day correlation
import { theme } from '@/config/theme';
import { feedbackRecords, feedbackSummary } from '@/data/staffing';
import { paceFBImpact } from '@/data/pace';
import MemberLink from '@/components/MemberLink';

const STATUS_STYLES = {
  resolved: { bg: `${theme.colors.success}12`, color: theme.colors.success, label: 'Resolved' },
  in_progress: { bg: '#ca8a0412', color: '#ca8a04', label: 'In Progress' },
  acknowledged: { bg: `${theme.colors.info || '#3B82F6'}12`, color: theme.colors.info || '#3B82F6', label: 'Acknowledged' },
  escalated: { bg: `${theme.colors.risk}12`, color: theme.colors.risk, label: 'Escalated' },
};

export default function ComplaintsTab() {
  const openComplaints = feedbackRecords.filter(f => f.status !== 'resolved');
  const understaffedComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const { fastConversionRate, slowConversionRate } = paceFBImpact;
  const conversionDrop = ((fastConversionRate - slowConversionRate) / fastConversionRate * 100).toFixed(0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* Open Complaints */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
            Open Complaints ({openComplaints.length})
          </h3>
          <div style={{ fontSize: 12, color: theme.colors.textMuted }}>
            {feedbackRecords.length} total this month
          </div>
        </div>

        {openComplaints.length === 0 ? (
          <div style={{ padding: theme.spacing.lg, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
            All complaints resolved.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
            {openComplaints.map(complaint => {
              const daysSince = Math.round((new Date('2026-01-31') - new Date(complaint.date)) / (1000 * 60 * 60 * 24));
              const statusStyle = STATUS_STYLES[complaint.status] || STATUS_STYLES.acknowledged;
              return (
                <div key={complaint.id} style={{
                  padding: theme.spacing.md,
                  background: theme.colors.bgDeep,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${daysSince > 7 ? theme.colors.risk + '30' : theme.colors.border}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: theme.spacing.sm,
                }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      {complaint.memberName ? (
                        <MemberLink mode="drawer" memberId={complaint.memberId} style={{ fontWeight: 600, color: theme.colors.textPrimary, fontSize: 14 }}>
                          {complaint.memberName}
                        </MemberLink>
                      ) : (
                        <span style={{ fontWeight: 600, color: theme.colors.textPrimary, fontSize: 14 }}>
                          Member {complaint.memberId}
                        </span>
                      )}
                      {complaint.isUnderstaffedDay && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, color: theme.colors.risk,
                          background: `${theme.colors.risk}12`, padding: '2px 6px', borderRadius: '999px',
                        }}>
                          Understaffed day
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                      {complaint.category} — {new Date(complaint.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    {daysSince > 7 && (
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.colors.risk }}>
                        {daysSince}d open
                      </span>
                    )}
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: '999px',
                      background: statusStyle.bg, color: statusStyle.color,
                    }}>
                      {statusStyle.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Understaffed Day Correlation */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Understaffed Day Correlation
        </h3>
        <div style={{
          display: 'flex', alignItems: 'center', gap: theme.spacing.lg, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: 36, fontWeight: 800, color: theme.colors.risk, lineHeight: 1 }}>
              {understaffedComplaints}/{feedbackRecords.length}
            </div>
            <div style={{ fontSize: 14, color: theme.colors.textSecondary, marginTop: 4 }}>
              complaints occurred on understaffed days
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: theme.colors.textSecondary }}>
              <strong style={{ color: theme.colors.textPrimary }}>{Math.round((understaffedComplaints / feedbackRecords.length) * 100)}%</strong> of all complaints
              are linked to days when the Grill Room was understaffed. Staffing is the single biggest driver of service inconsistency.
            </div>
          </div>
        </div>
      </div>

      {/* Complaint Drivers */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Complaint Drivers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {feedbackSummary.map(cat => (
            <div key={cat.category} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: theme.spacing.sm, background: theme.colors.bgDeep, borderRadius: theme.radius.sm, fontSize: 14,
            }}>
              <div style={{ color: theme.colors.textPrimary, fontWeight: 500 }}>{cat.category}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, fontSize: 13, color: theme.colors.textSecondary }}>
                <div>{cat.count} complaints</div>
                <div style={{ color: cat.unresolvedCount > 0 ? theme.colors.risk : theme.colors.success, fontWeight: 600 }}>
                  {cat.unresolvedCount} unresolved
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pace Impact on Dining */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
          Pace Impact on Post-Round Dining
        </h3>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: theme.colors.textSecondary, margin: 0, marginBottom: theme.spacing.md }}>
          When rounds exceed 4.5 hours, post-round dining conversion drops <strong style={{ color: theme.colors.risk }}>{conversionDrop}%</strong> — from{' '}
          {(fastConversionRate * 100).toFixed(0)}% to {(slowConversionRate * 100).toFixed(0)}%. Slow pace is a service quality issue that directly impacts member satisfaction.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
          <div style={{ padding: theme.spacing.md, borderRadius: theme.radius.sm, background: `${theme.colors.success}08`, border: `1px solid ${theme.colors.success}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600, marginBottom: 4 }}>Under 4.5 hrs</div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 700, color: theme.colors.success }}>{(fastConversionRate * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>dine after round</div>
          </div>
          <div style={{ padding: theme.spacing.md, borderRadius: theme.radius.sm, background: `${theme.colors.risk}08`, border: `1px solid ${theme.colors.risk}20`, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: theme.colors.textMuted, fontWeight: 600, marginBottom: 4 }}>Over 4.5 hrs</div>
            <div style={{ fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 700, color: theme.colors.risk }}>{(slowConversionRate * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>dine after round</div>
          </div>
        </div>
      </div>
    </div>
  );
}
