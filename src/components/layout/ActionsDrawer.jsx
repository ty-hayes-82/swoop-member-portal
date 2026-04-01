// ActionsDrawer — slide-in panel for pending actions + playbooks, accessible from any page
import { useState } from 'react';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';

const DRAWER_TABS = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'playbooks', label: 'Playbooks' },
];

// V5: Core playbooks with operational categories (matching PlaybooksPage)
const CORE_PLAYBOOKS = [
  {
    id: 'service-save',
    name: 'Service Save Protocol',
    category: 'Service Recovery',
    description: 'When an engaged member files an unresolved complaint, escalate to GM with full context and trigger a recovery sequence.',
    trackRecord: '3 of 4 at-risk members retained (Q4 2025)',
  },
  {
    id: 'new-member-90day',
    name: 'New Member 90-Day Integration',
    category: 'New Member Success',
    description: 'When new members aren\'t building habits by Day 30/60/90, trigger member matching, family events, and concierge outreach.',
    trackRecord: '7 of 8 new members integrated (Q4 2025)',
  },
  {
    id: 'staffing-gap',
    name: 'Staffing Adjustment',
    category: 'Operations',
    description: 'When staffing doesn\'t match demand — call-outs, weather shifts, event overlap — detect gaps and adjust before service quality drops.',
    trackRecord: 'Zero service complaints during gaps (Q4 2025)',
  },
  {
    id: 'ghost-reactivation',
    name: 'Ghost Member Reactivation',
    category: 'Member Engagement',
    description: 'When members have zero activity for 60+ days, trigger GM call, surprise gift, and guest pass sequence to re-engage.',
    trackRecord: '4 of 6 ghost members reactivated (Q4 2025)',
  },
  {
    id: 'declining-intervention',
    name: 'Declining Member Intervention',
    category: 'Member Engagement',
    description: 'When engagement drops below 30% of baseline, surface hidden dissatisfaction with pulse surveys and personal GM outreach.',
    trackRecord: '8 of 12 declining members stabilized (Q4 2025)',
  },
  {
    id: 'service-failure-rapid',
    name: 'Service Failure Rapid Response',
    category: 'Service Recovery',
    description: 'When high-value members report negative experiences, shrink response window from hours to minutes with auto-escalation.',
    trackRecord: '5 of 5 high-value members retained (Q4 2025)',
  },
  {
    id: 'post-event',
    name: 'Post-Event Engagement Capture',
    category: 'Events & Programming',
    description: 'After club events, convert peak engagement into sustained visits with thank-yous, introductions, and tee time holds.',
    trackRecord: '11 of 14 event attendees returned within 10 days (Q4 2025)',
  },
  {
    id: 'anniversary',
    name: 'Membership Anniversary Celebration',
    category: 'Member Engagement',
    description: 'At membership milestones (1, 5, 10, 20 years), deliver personalized recognition to reinforce belonging.',
    trackRecord: '11 of 11 milestone members renewed (Q4 2025)',
  },
];

export default function ActionsDrawer({ isOpen, onClose }) {
  const { inbox, approveAction, dismissAction, playbooks, dispatch } = useApp();
  const { navigate } = useNavigationContext();
  const pending = inbox.filter(i => i.status === 'pending');
  const [activeTab, setActiveTab] = useState('inbox');

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
          <div style={{ fontSize: 16, fontWeight: 700, color: theme.colors.textPrimary }}>
            Actions & Playbooks
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

        {/* Tab switcher */}
        <div style={{
          display: 'flex', padding: '8px 20px 0',
          borderBottom: `1px solid ${theme.colors.border}`,
          gap: 0,
        }}>
          {DRAWER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 16px',
                fontSize: 13, fontWeight: 600,
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: activeTab === tab.key ? theme.colors.textPrimary : theme.colors.textMuted,
                borderBottom: activeTab === tab.key ? `2px solid ${theme.colors.accent}` : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
              {tab.key === 'inbox' && pending.length > 0 && (
                <span style={{
                  marginLeft: 6, minWidth: 18, height: 18,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '999px', background: theme.colors.accent, color: '#fff',
                  fontSize: 10, fontWeight: 700, padding: '0 5px',
                }}>
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {/* Inbox tab */}
          {activeTab === 'inbox' && (
            <>
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
            </>
          )}

          {/* Playbooks tab */}
          {activeTab === 'playbooks' && (
            <>
              <div style={{ fontSize: 13, color: theme.colors.textSecondary, marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{CORE_PLAYBOOKS.length} playbooks — activate to start automated response protocols.</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onClose(); navigate('playbooks'); }}
                  style={{ fontSize: 11, fontWeight: 600, color: theme.colors.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >
                  View all →
                </button>
              </div>
              {CORE_PLAYBOOKS.map(pb => {
                const isActive = playbooks?.[pb.id]?.active;
                return (
                  <div key={pb.id} style={{
                    border: `1px solid ${isActive ? theme.colors.success + '40' : theme.colors.border}`,
                    borderRadius: theme.radius.md,
                    padding: '16px',
                    background: isActive ? `${theme.colors.success}04` : theme.colors.bg,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: theme.colors.textPrimary }}>
                          {pb.name}
                        </div>
                        <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 2 }}>
                          {pb.category}
                        </div>
                      </div>
                      {isActive && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: '999px',
                          background: `${theme.colors.success}15`, color: theme.colors.success,
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>
                          Active
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.5, marginBottom: 10 }}>
                      {pb.description}
                    </div>
                    <div
                      onClick={(e) => { e.stopPropagation(); onClose(); navigate('members'); }}
                      style={{
                        fontSize: 12, color: theme.colors.success, fontWeight: 600, marginBottom: 12,
                        padding: '6px 10px', background: `${theme.colors.success}08`,
                        borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.success}20`,
                        cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${theme.colors.success}15`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${theme.colors.success}08`; }}
                      title="View members"
                    >
                      Track record: {pb.trackRecord} →
                    </div>
                    <button
                      onClick={() => dispatch({ type: isActive ? 'DEACTIVATE_PLAYBOOK' : 'ACTIVATE_PLAYBOOK', id: pb.id })}
                      style={{
                        padding: '7px 18px', borderRadius: 6,
                        background: isActive ? 'transparent' : theme.colors.accent,
                        color: isActive ? theme.colors.textMuted : '#fff',
                        border: isActive ? `1px solid ${theme.colors.border}` : 'none',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {isActive ? 'Deactivate' : 'Activate Playbook'}
                    </button>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </>
  );
}
