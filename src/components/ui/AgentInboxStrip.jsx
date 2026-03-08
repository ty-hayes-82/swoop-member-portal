import { theme } from '@/config/theme';

export default function AgentInboxStrip({ pendingCount = 0, topAction, onApproveTop, onOpenInbox }) {
  if (pendingCount < 1) return null;

  return (
    <div
      style={{
        background: 'rgba(34,211,238,0.05)',
        border: '1px solid rgba(34,211,238,0.24)',
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
          <span style={{ color: '#22D3EE', fontWeight: 700, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Agent Inbox
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              background: '#22D3EE',
              color: '#06202A',
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

      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {topAction && (
          <button
            onClick={onApproveTop}
            style={{
              borderRadius: theme.radius.sm,
              border: '1px solid rgba(74,222,128,0.3)',
              background: 'rgba(74,222,128,0.12)',
              color: '#4ADE80',
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Approve top
          </button>
        )}
        <button
          onClick={onOpenInbox}
          style={{
            borderRadius: theme.radius.sm,
            border: '1px solid rgba(34,211,238,0.32)',
            background: 'transparent',
            color: '#22D3EE',
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
