import { theme } from '@/config/theme';
import InfoTooltip from '@/components/ui/InfoTooltip';

export default function AgentInboxStrip({ pendingCount = 0, topAction, onApproveTop, onOpenInbox }) {
  if (pendingCount < 1) return null;

  return (
    <div
      style={{
        background: `${theme.colors.agentCyan}0D`,
        border: `1px solid ${theme.colors.agentCyan}3D`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <span style={{ color: theme.colors.agentCyan, fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Agent Inbox
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              background: theme.colors.agentCyan,
              color: theme.colors.textPrimary,
              borderRadius: 999,
              padding: '1px 7px',
            }}
          >
            {pendingCount}
          </span>
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {topAction?.description ?? 'Actions are waiting for review.'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
        {topAction && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={onApproveTop}
              style={{
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.agentApproved}4D`,
                background: `${theme.colors.agentApproved}1F`,
                color: theme.colors.agentApproved,
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Approve top
            </button>
            <InfoTooltip text="Approve → Sends push notification via Swoop app → Tracks in Intervention Queue → GM sees response status within 24h" />
          </div>
        )}
        <button
          onClick={onOpenInbox}
          style={{
            borderRadius: theme.radius.sm,
            border: `1px solid ${theme.colors.agentCyan}52`,
            background: 'transparent',
            color: theme.colors.agentCyan,
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          View inbox
        </button>
      </div>
    </div>
  );
}
