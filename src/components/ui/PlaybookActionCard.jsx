// PlaybookActionCard — inline contextual card connecting insights to playbooks.
import { useState } from 'react';
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
  variant = 'standard',
  linkTo,
}) {
  const { showToast, dispatch, addAction } = useApp();
  const { navigate } = useNavigationContext();
  const [hovered, setHovered] = useState(false);

  const isUrgent = variant === 'urgent';
  const isCompact = variant === 'compact';

  const handleActivate = () => {
    showToast(`${playbookName || title} activated for ${memberCount || 'targeted'} members`, 'success');
    trackAction({ actionType: 'playbook', actionSubtype: 'activate', description: playbookName || title, meta: { memberCount, impact } });
    if (playbookName) {
      dispatch({ type: 'ACTIVATE_PLAYBOOK', id: playbookName.toLowerCase().replace(/\s+/g, '-') });
      addAction({ description: `${playbookName} activated — ${memberCount || 'targeted'} members`, actionType: 'RETENTION_OUTREACH', source: 'Playbook Engine', priority: 'high', impactMetric: impact || '' });
    }
  };

  const handleViewPlaybook = () => {
    if (linkTo) navigate(linkTo);
    else navigate('playbooks');
  };

  if (isCompact) {
    return (
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-lg gap-3 flex-wrap ${
        isUrgent ? 'bg-error-50 border-l-[3px] border-l-error-500' : 'bg-success-50 border-l-[3px] border-l-success-500'
      }`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-semibold text-swoop-text">{title}</span>
          {memberCount && (
            <span className="text-[11px] text-swoop-text-muted bg-swoop-row px-1.5 py-px rounded">
              {memberCount} members
            </span>
          )}
        </div>
        <div className="flex gap-1.5">
          {impact && (
            <span className="text-[11px] font-bold text-brand-500">{impact}</span>
          )}
          <button
            onClick={handleActivate}
            className="px-3 py-1 rounded-md text-[11px] font-semibold cursor-pointer border-none bg-brand-500 text-white focus-visible:ring-2 focus-visible:ring-brand-500"
          >{buttonLabel}</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`rounded-xl px-5 py-4 transition-colors duration-150 border-l-4 ${
        isUrgent
          ? `border-l-error-500 ${hovered ? 'bg-error-50' : 'bg-error-50/50'}`
          : `border-l-success-500 ${hovered ? 'bg-success-50' : 'bg-success-50/50'}`
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{icon}</span>
        <span className={`text-[10px] font-bold tracking-widest uppercase ${isUrgent ? 'text-error-500' : 'text-success-500'}`}>{label}</span>
      </div>
      <div className="text-sm font-bold text-swoop-text mb-1">{title}</div>
      {description && (
        <div className="text-sm text-swoop-text-muted leading-relaxed mb-3">{description}</div>
      )}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={handleActivate}
          className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-none bg-brand-500 text-white transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-brand-500"
        >{buttonLabel}</button>
        <button
          onClick={handleViewPlaybook}
          className="px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer border-[1.5px] border-brand-200 bg-transparent text-brand-500"
        >View Details</button>
        {impact && (
          <span className="text-xs font-bold text-error-500 ml-auto">{impact}</span>
        )}
        {memberCount && (
          <span className="text-[11px] text-swoop-text-muted">{memberCount} members affected</span>
        )}
      </div>
    </div>
  );
}
