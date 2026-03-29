import { theme } from '@/config/theme';
import { SoWhatCallout, PlaybookActionCard } from '@/components/ui';
import { eventROI } from '@/services/experienceInsightsService';

export default function EventsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: 0 }}>
        Which events deliver the highest retention ROI? This answers: &ldquo;I can&rsquo;t prove events are my best retention tool.&rdquo;
      </p>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: 600, borderCollapse: 'collapse', fontSize: theme.fontSize.sm }}>
          <thead>
            <tr style={{ borderBottom: '1px solid ' + theme.colors.border }}>
              {['Event Type', 'Avg Attendance', 'Retention Rate', 'Health Impact', 'Avg Spend/Member', 'ROI Score', 'Frequency'].map((h) => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.06em', color: theme.colors.textMuted, fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eventROI.sort((a, b) => b.roi - a.roi).map((evt) => (
              <tr key={evt.type} style={{ borderBottom: '1px solid ' + theme.colors.border + '60' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: theme.colors.textPrimary }}>{evt.type}</td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono }}>{evt.attendance}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ color: evt.retentionRate >= 93 ? theme.colors.success : theme.colors.warning, fontWeight: 600 }}>
                    {evt.retentionRate}%
                  </span>
                </td>
                <td style={{ padding: '8px 12px' }}>
                  {(() => {
                    const delta = Math.round((evt.retentionRate - 85) * 0.8);
                    return (
                      <span style={{
                        color: delta > 0 ? '#16a34a' : '#dc2626',
                        fontWeight: 600, fontFamily: theme.fonts.mono,
                      }}>
                        {delta > 0 ? '+' : ''}{delta} pts
                      </span>
                    );
                  })()}
                </td>
                <td style={{ padding: '8px 12px', fontFamily: theme.fonts.mono }}>${evt.avgSpend}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '12px',
                    background: (evt.roi >= 4 ? theme.colors.success : theme.colors.warning) + '18',
                    color: evt.roi >= 4 ? theme.colors.success : theme.colors.warning,
                  }}>
                    {evt.roi}x
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: theme.colors.textSecondary }}>{evt.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SoWhatCallout>
        Chef&rsquo;s Table has the highest ROI (5.1x) despite lowest attendance &mdash; intimate events create the deepest loyalty.
        Member-Guest Tournaments deliver the best balance of scale and retention (48 attendees, 96% renewal, 4.2x ROI).
        <strong> Events are provably your second-best retention tool after golf itself.</strong>
      </SoWhatCallout>

      {/* Invite at-risk members action */}
      <PlaybookActionCard
        icon={'🌟'}
        title="Invite 24 Ghost + Declining members to upcoming Chef's Table"
        description="Chef's Table has 5.1x ROI. 24 disengaged members haven't attended an event in 8+ weeks. A personal invite could re-engage them."
        playbookName="Social Butterfly Event Amplifier"
        impact="$6K/mo"
        memberCount={24}
        buttonLabel="Create Invitations"
        buttonColor="#22c55e"
      />
    </div>
  );
}
