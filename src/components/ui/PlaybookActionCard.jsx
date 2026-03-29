// PlaybookActionCard — inline contextual card connecting insights to playbooks.
// Used across Experience Insights, Member Risk, Daily Briefing, etc.
import { useState } from 'react';
import { theme } from '@/config/theme';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { trackAction } from '@/services/activityService';

export default function PlaybookActionCard({
  icon = '\u26A1',
  label = 'RECOMMENDED ACTION',
  title,
  description,
  playbookName,
  impact,
  memberCount,
  buttonLabel = 'Take Action',
  buttonColor = '#e8772e',
  variant = 'standard', // 'standard' | 'compact' | 'urgent'
  linkTo,
}) {
  const { showToast } = useApp();
  const { navigate } = useNavigationContext();
  const [hovered, setHovered] = useState(false);

  const isUrgent = variant === 'urgent';
  const isCompact = variant === 'compact';
  const borderColor = isUrgent ? '#dc2626' : '#22c55e';
  const bgColor = isUrgent ? 'rgba(220,38,38,0.03)' : 'rgba(34,197,94,0.03)';

  const handleActivate = () => {
    showToast(`${playbookName || title} activated for ${memberCount || 'targeted'} members`, 'success');
    trackAction({ actionType: 'playbook', actionSubtype: 'activate', description: playbookName || title, meta: { memberCount, impact } });
  };

  const handleViewPlaybook = () => {
    if (linkTo) navigate(linkTo);
    else navigate('playbooks');
  };

  if (isCompact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px', borderRadius: 8,
        background: bgColor, borderLeft: `3px solid ${borderColor}`,
        gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#0f0f0f' }}>{title}</span>
          {memberCount && (
            <span style={{ fontSize: 11, color: '#888', background: '#f4f4f5', padding: '1px 6px', borderRadius: 3 }}>
              {memberCount} members
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {impact && (
            <span style={{ fontSize: 11, fontWeight: 700, color: buttonColor }}>{impact}</span>
          )}
          <button
            onClick={handleActivate}
            style={{
              padding: '4px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', border: 'none',
              background: buttonColor, color: 'white',
            }}
          >{buttonLabel}</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? (isUrgent ? 'rgba(220,38,38,0.04)' : 'rgba(34,197,94,0.04)') : bgColor,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 10,
        padding: '16px 20px',
        transition: 'background 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1px',
          textTransform: 'uppercase', color: borderColor,
        }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#0f0f0f', marginBottom: 4 }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, marginBottom: 12 }}>
          {description}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleActivate}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: 'none',
            background: buttonColor, color: 'white',
            transition: 'opacity 0.15s',
          }}
        >{buttonLabel}</button>
        <button
          onClick={handleViewPlaybook}
          style={{
            padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', border: `1.5px solid ${buttonColor}40`,
            background: 'transparent', color: buttonColor,
          }}
        >View Details</button>
        {impact && (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#d9534f', marginLeft: 'auto' }}>{impact}</span>
        )}
        {memberCount && (
          <span style={{ fontSize: 11, color: '#888' }}>{memberCount} members affected</span>
        )}
      </div>
    </div>
  );
}
