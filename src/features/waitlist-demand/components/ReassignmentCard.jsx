import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { Badge, Btn } from '@/components/ui';
import { theme } from '@/config/theme';

const riskColor = (level) => {
  if (level === 'Critical') return theme.colors.urgent;
  if (level === 'At Risk') return theme.colors.warning;
  if (level === 'Watch') return theme.colors.info;
  return theme.colors.success;
};

export default function ReassignmentCard({ reassignment, onApprove, onOverride, onSkip, queueMembers = [] }) {
  const [showOverride, setShowOverride] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [showSkip, setShowSkip] = useState(false);
  const isActionable = reassignment.status === 'pending';
  const rc = riskColor(reassignment.recommendedFillRiskLevel);

  return (
    <div style={{
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.lg,
      background: theme.colors.bgCard,
      boxShadow: theme.shadow.sm,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: `${theme.colors.urgent}08`,
        borderBottom: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
          Open Slot: <strong style={{ color: theme.colors.textPrimary }}>{reassignment.sourceSlot}</strong>
          <span style={{ margin: '0 8px', opacity: 0.4 }}>·</span>
          Vacated by <MemberLink memberId={reassignment.sourceMemberId}>{reassignment.sourceMemberName}</MemberLink>
        </div>
        <Badge
          text={reassignment.status === 'completed' ? 'Filled' : reassignment.status === 'pending' ? 'Awaiting Decision' : reassignment.status}
          variant={reassignment.status === 'completed' ? 'success' : reassignment.status === 'pending' ? 'warning' : 'effort'}
          size="sm"
        />
      </div>

      {/* Two-column: slot context + recommended fill */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md, padding: theme.spacing.md }}>
        {/* Left — cancel context */}
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 4 }}>Cancel Context</div>
          <div>{reassignment.cancelReason}</div>
          {reassignment.auditTrail?.length > 0 && (
            <div style={{ marginTop: 8, borderTop: `1px solid ${theme.colors.border}`, paddingTop: 6 }}>
              {reassignment.auditTrail.slice(0, 3).map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 2, fontSize: 11, color: theme.colors.textMuted }}>
                  <span style={{ flexShrink: 0 }}>{new Date(entry.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span>{entry.action}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — recommended fill */}
        <div style={{
          background: `${rc}08`,
          border: `1px solid ${rc}30`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.sm,
        }}>
          <div style={{ fontSize: 11, color: theme.colors.textMuted, marginBottom: 4 }}>Recommended Fill</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <MemberLink memberId={reassignment.overrideMemberId ?? reassignment.recommendedFillMemberId}
              style={{ fontWeight: 700, fontSize: theme.fontSize.sm }}>
              {reassignment.overrideMemberName ?? reassignment.recommendedFillMemberName}
            </MemberLink>
            <Badge text={reassignment.recommendedFillRiskLevel} variant={
              reassignment.recommendedFillRiskLevel === 'Critical' ? 'urgent' :
              reassignment.recommendedFillRiskLevel === 'At Risk' ? 'warning' : 'effort'
            } size="sm" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
            <div>
              <span style={{ color: theme.colors.textMuted }}>Health: </span>
              <span style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: rc }}>{reassignment.recommendedFillHealthScore}</span>
            </div>
            <div>
              <span style={{ color: theme.colors.textMuted }}>Dues: </span>
              <span style={{ fontFamily: theme.fonts.mono, fontWeight: 700 }}>${(reassignment.recommendedFillDuesAtRisk ?? 0).toLocaleString()}/yr</span>
            </div>
            <div>
              <span style={{ color: theme.colors.textMuted }}>Waiting: </span>
              <span style={{ fontFamily: theme.fonts.mono }}>{reassignment.recommendedFillDaysWaiting}d</span>
            </div>
            <div>
              <span style={{ color: theme.colors.textMuted }}>Recovery: </span>
              <span style={{ fontFamily: theme.fonts.mono, color: theme.colors.success }}>+${(reassignment.revenueRecovered ?? 0).toLocaleString()}</span>
            </div>
          </div>
          {reassignment.retentionRationale && (
            <div style={{ fontSize: 11, color: theme.colors.textSecondary, marginTop: 6, fontStyle: 'italic', lineHeight: 1.4 }}>
              {reassignment.retentionRationale}
            </div>
          )}
        </div>
      </div>

      {/* Actions footer */}
      {isActionable && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: '10px 16px',
          display: 'flex',
          gap: 8,
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}>
          <Btn variant="primary" size="sm" accent={theme.colors.success}
            onClick={() => onApprove(reassignment.id)}>
            Approve Fill
          </Btn>
          <Btn variant="secondary" size="sm"
            onClick={() => setShowOverride(!showOverride)}>
            Override
          </Btn>
          <Btn variant="ghost" size="sm"
            onClick={() => setShowSkip(!showSkip)}>
            Skip
          </Btn>
        </div>
      )}

      {/* Completed outcome */}
      {reassignment.status === 'completed' && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: '10px 16px',
          background: `${theme.colors.success}08`,
          fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary,
        }}>
          <strong style={{ color: theme.colors.success }}>Filled</strong> — {reassignment.staffDecision}
          {reassignment.healthScoreAfter != null && (
            <span style={{ marginLeft: 8 }}>
              Health: {reassignment.healthScoreBefore} → <strong style={{ color: theme.colors.success }}>{reassignment.healthScoreAfter}</strong>
            </span>
          )}
        </div>
      )}

      {/* Override member picker */}
      {showOverride && isActionable && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: theme.spacing.md,
          background: theme.colors.bgDeep,
        }}>
          <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>
            Select alternate member:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
            {queueMembers.length === 0 && (
              <div style={{ fontSize: 11, color: theme.colors.textMuted, padding: 8 }}>No other candidates in queue for this slot.</div>
            )}
            {queueMembers
              .filter((m) => m.memberId !== reassignment.recommendedFillMemberId)
              .slice(0, 6)
              .map((m) => (
                <button
                  key={m.memberId}
                  onClick={() => { onOverride(reassignment.id, m); setShowOverride(false); }}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    background: theme.colors.bgCard,
                    cursor: 'pointer',
                    fontSize: 12,
                    textAlign: 'left',
                    color: theme.colors.textPrimary,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{m.memberName}</span>
                  <span style={{ fontSize: 11, color: theme.colors.textMuted }}>
                    Health {m.healthScore} · ${(m.memberValueAnnual ?? 0).toLocaleString()}/yr · {m.daysWaiting}d waiting
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Skip reason */}
      {showSkip && isActionable && (
        <div style={{
          borderTop: `1px solid ${theme.colors.border}`,
          padding: theme.spacing.md,
          background: theme.colors.bgDeep,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <input
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            placeholder="Reason for skipping..."
            style={{
              flex: 1,
              padding: '6px 10px',
              fontSize: theme.fontSize.xs,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              background: theme.colors.bgCard,
              color: theme.colors.textPrimary,
              fontFamily: theme.fonts.sans,
            }}
          />
          <Btn variant="ghost" size="xs"
            onClick={() => { onSkip(reassignment.id, skipReason); setShowSkip(false); }}>
            Confirm Skip
          </Btn>
        </div>
      )}
    </div>
  );
}
