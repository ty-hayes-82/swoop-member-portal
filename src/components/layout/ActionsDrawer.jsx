// ActionsDrawer — slide-in panel for pending actions, accessible from any page
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { AgentActionCard } from '@/components/ui';

export default function ActionsDrawer({ isOpen, onClose }) {
  const { inbox, approveAction, dismissAction } = useApp();
  const pending = inbox.filter(i => i.status === 'pending');

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.35)',
            zIndex: 200,
            transition: 'opacity 0.2s',
          }}
        />
      )}

      {/* Drawer panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        width: Math.min(480, typeof window !== 'undefined' ? window.innerWidth - 60 : 480),
        height: '100vh',
        background: theme.colors.bgCard,
        borderLeft: `1px solid ${theme.colors.border}`,
        boxShadow: isOpen ? '-8px 0 30px rgba(0,0,0,0.12)' : 'none',
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.25s ease',
        zIndex: 210,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary }}>
              Pending Actions ({pending.length})
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textMuted, marginTop: 2 }}>
              Review and approve recommended actions
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.bgDeep,
              color: theme.colors.textMuted,
              fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {pending.length === 0 ? (
            <div style={{
              padding: '40px 20px', textAlign: 'center',
              color: theme.colors.textMuted, fontSize: 14,
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>All caught up</div>
              <div style={{ fontSize: 13 }}>No pending actions right now.</div>
            </div>
          ) : (
            pending.map(action => (
              <div key={action.id} style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: '14px 16px',
                background: theme.colors.bg,
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 6 }}>
                  {action.description}
                </div>
                <div style={{ fontSize: 12, color: theme.colors.textMuted, marginBottom: 10 }}>
                  {action.source} · {action.actionType?.replace(/_/g, ' ').toLowerCase()}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => approveAction(action.id)}
                    style={{
                      padding: '6px 16px', borderRadius: 6,
                      background: theme.colors.success, color: '#fff',
                      border: 'none', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => dismissAction(action.id)}
                    style={{
                      padding: '6px 16px', borderRadius: 6,
                      background: 'transparent', color: theme.colors.textMuted,
                      border: `1px solid ${theme.colors.border}`,
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
