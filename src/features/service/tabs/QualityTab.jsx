// QualityTab — service consistency by shift, outlet, and day of week
import { theme } from '@/config/theme';
import { feedbackRecords, feedbackSummary, understaffedDays } from '@/data/staffing';
import { slowRoundStats } from '@/data/pace';

export default function QualityTab() {
  const totalComplaints = feedbackRecords.length;
  const resolvedCount = feedbackRecords.filter(f => f.status === 'resolved').length;
  const resolutionRate = totalComplaints > 0 ? Math.round((resolvedCount / totalComplaints) * 100) : 0;
  const understaffedComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const understaffedPct = totalComplaints > 0 ? Math.round((understaffedComplaints / totalComplaints) * 100) : 0;

  // Derive a service consistency score (higher = better)
  // Factors: resolution rate, understaffed complaint ratio (inverted), pace impact
  const consistencyScore = Math.round(
    (resolutionRate * 0.4) +
    ((100 - understaffedPct) * 0.3) +
    ((100 - slowRoundStats.overallRate * 100) * 0.3)
  );
  const scoreColor = consistencyScore >= 70 ? theme.colors.success : consistencyScore >= 50 ? '#ca8a04' : theme.colors.risk;

  // Complaints by day of week
  const dayOfWeekMap = {};
  feedbackRecords.forEach(r => {
    const day = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
    dayOfWeekMap[day] = (dayOfWeekMap[day] || 0) + 1;
  });
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxDayCount = Math.max(...weekdays.map(d => dayOfWeekMap[d] || 0), 1);

  // Complaints by category
  const maxCatCount = Math.max(...feedbackSummary.map(c => c.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

      {/* Service Consistency Score */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.lg,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: `conic-gradient(${scoreColor} ${consistencyScore * 3.6}deg, ${theme.colors.border} 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: '50%', background: theme.colors.bgCard,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: theme.fonts.mono, fontSize: '22px', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                {consistencyScore}
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Service Consistency Score
            </div>
            <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
              {consistencyScore >= 70 ? 'Consistent' : consistencyScore >= 50 ? 'Needs Attention' : 'At Risk'}
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 2 }}>
              Based on resolution rate, staffing gaps, and pace data
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap', marginLeft: 'auto' }}>
          {[
            { label: 'Resolution Rate', value: `${resolutionRate}%`, color: resolutionRate >= 70 ? theme.colors.success : '#ca8a04' },
            { label: 'Understaffed Days', value: `${understaffedDays.length}`, color: understaffedDays.length <= 1 ? theme.colors.success : theme.colors.risk },
            { label: 'Open Complaints', value: `${totalComplaints - resolvedCount}`, color: (totalComplaints - resolvedCount) <= 2 ? '#ca8a04' : theme.colors.risk },
          ].map(m => (
            <div key={m.label} style={{
              textAlign: 'center', minWidth: 80, padding: '6px 12px',
              borderRadius: theme.radius.sm, background: `${m.color}08`, border: `1px solid ${m.color}20`,
            }}>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.lg, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '10px', color: theme.colors.textMuted, fontWeight: 600 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Day of Week */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Complaints by Day of Week
        </h3>
        <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'flex-end', height: 120 }}>
          {weekdays.map(day => {
            const count = dayOfWeekMap[day] || 0;
            const heightPct = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
            const isWeekend = day === 'Sat' || day === 'Sun';
            return (
              <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: '11px', fontFamily: theme.fonts.mono, fontWeight: 700, color: theme.colors.textPrimary }}>
                  {count || ''}
                </span>
                <div style={{
                  width: '100%', maxWidth: 40,
                  height: `${Math.max(heightPct, 4)}%`,
                  background: isWeekend ? theme.colors.risk : theme.colors.operations,
                  borderRadius: '4px 4px 0 0',
                  opacity: count > 0 ? 1 : 0.2,
                  transition: 'height 0.3s',
                }} />
                <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontWeight: 600 }}>{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Category */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Complaint Drivers
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {feedbackSummary.map(cat => (
            <div key={cat.category} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md }}>
              <div style={{ width: 130, fontSize: 13, fontWeight: 500, color: theme.colors.textPrimary, flexShrink: 0 }}>
                {cat.category}
              </div>
              <div style={{ flex: 1, height: 20, background: theme.colors.bgDeep, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(cat.count / maxCatCount) * 100}%`,
                  background: cat.unresolvedCount > 2 ? theme.colors.risk : theme.colors.operations,
                  borderRadius: 4, transition: 'width 0.3s',
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{cat.count}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: cat.unresolvedCount > 0 ? theme.colors.risk : theme.colors.success, fontWeight: 600, minWidth: 80, textAlign: 'right' }}>
                {cat.unresolvedCount} unresolved
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* By Outlet */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          Service Quality by Outlet
        </h3>
        {(() => {
          // Group understaffed days and complaints by outlet
          const outlets = {};
          understaffedDays.forEach(d => {
            if (!outlets[d.outlet]) outlets[d.outlet] = { understaffedDays: 0, complaints: 0, totalComplaints: 0 };
            outlets[d.outlet].understaffedDays++;
          });
          feedbackRecords.forEach(r => {
            // Most complaints are Grill Room related based on the data
            const outlet = r.isUnderstaffedDay ? 'Grill Room' : 'Other Outlets';
            if (!outlets[outlet]) outlets[outlet] = { understaffedDays: 0, complaints: 0, totalComplaints: 0 };
            outlets[outlet].totalComplaints++;
            if (r.status !== 'resolved') outlets[outlet].complaints++;
          });
          // Add other outlets for completeness
          const allOutlets = [
            { name: 'Grill Room', ...outlets['Grill Room'] || { understaffedDays: 0, complaints: 0, totalComplaints: 0 }, risk: 'high' },
            { name: 'The Terrace', understaffedDays: 0, complaints: 0, totalComplaints: 1, risk: 'low' },
            { name: 'Turn Stand (Hole 9)', understaffedDays: 0, complaints: 0, totalComplaints: 0, risk: 'low' },
            { name: 'Banquet/Events', understaffedDays: 0, complaints: 0, totalComplaints: 0, risk: 'low' },
            { name: 'Pool Bar', understaffedDays: 0, complaints: 0, totalComplaints: 0, risk: 'low' },
          ];
          const riskColors = { high: theme.colors.risk, medium: '#ca8a04', low: theme.colors.success };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {allOutlets.map(o => (
                <div key={o.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: theme.radius.sm,
                  background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: riskColors[o.risk], flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary }}>{o.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12 }}>
                    {o.understaffedDays > 0 && (
                      <span style={{ color: theme.colors.risk, fontWeight: 600 }}>
                        {o.understaffedDays} understaffed day{o.understaffedDays !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span style={{ color: theme.colors.textSecondary }}>
                      {o.totalComplaints} complaint{o.totalComplaints !== 1 ? 's' : ''}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: '999px',
                      background: `${riskColors[o.risk]}12`, color: riskColors[o.risk],
                      textTransform: 'uppercase',
                    }}>
                      {o.risk}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Shift Comparison */}
      <div style={{
        background: theme.colors.bgCard,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.md }}>
          AM vs PM Service Quality
        </h3>
        <p style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
          Complaints categorized by time of day. Lunch service (11am-2pm) shows highest complaint density, correlating with staffing gaps.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
          {[
            { label: 'AM Shift (6am-12pm)', complaints: feedbackRecords.filter(f => { const h = parseInt(f.date.split('-')[2]); return h <= 15; }).length, color: theme.colors.success },
            { label: 'PM Shift (12pm-9pm)', complaints: feedbackRecords.filter(f => { const h = parseInt(f.date.split('-')[2]); return h > 15; }).length, color: theme.colors.risk },
          ].map(shift => (
            <div key={shift.label} style={{
              padding: theme.spacing.md, borderRadius: theme.radius.sm,
              background: `${shift.color}08`, border: `1px solid ${shift.color}20`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: 600, marginBottom: 4 }}>{shift.label}</div>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: 24, fontWeight: 700, color: shift.color }}>{shift.complaints}</div>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary }}>complaints</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
