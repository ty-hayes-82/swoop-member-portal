// ActionsDrawer — slide-in panel for pending actions + playbooks
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';

const DRAWER_TABS = [
  { key: 'inbox', label: 'Inbox' },
  { key: 'playbooks', label: 'Playbooks' },
];

const CORE_PLAYBOOKS = [
  { id: 'service-save', name: 'Service Save Protocol', category: 'Service Recovery', description: 'When an engaged member files an unresolved complaint, escalate to GM with full context and trigger a recovery sequence.', trackRecord: '3 of 4 at-risk members retained (Q4 2025)' },
  { id: 'new-member-90day', name: 'New Member 90-Day Integration', category: 'New Member Success', description: "When new members aren't building habits by Day 30/60/90, trigger member matching, family events, and concierge outreach.", trackRecord: '7 of 8 new members integrated (Q4 2025)' },
  { id: 'staffing-gap', name: 'Staffing Adjustment', category: 'Operations', description: "When staffing doesn't match demand \u2014 call-outs, weather shifts, event overlap \u2014 detect gaps and adjust before service quality drops.", trackRecord: 'Zero service complaints during gaps (Q4 2025)' },
  { id: 'ghost-reactivation', name: 'Ghost Member Reactivation', category: 'Member Engagement', description: 'When members have zero activity for 60+ days, trigger GM call, surprise gift, and guest pass sequence to re-engage.', trackRecord: '4 of 6 ghost members reactivated (Q4 2025)' },
  { id: 'declining-intervention', name: 'Declining Member Intervention', category: 'Member Engagement', description: 'When engagement drops below 30% of baseline, surface hidden dissatisfaction with pulse surveys and personal GM outreach.', trackRecord: '8 of 12 declining members stabilized (Q4 2025)' },
  { id: 'service-failure-rapid', name: 'Service Failure Rapid Response', category: 'Service Recovery', description: 'When high-value members report negative experiences, shrink response window from hours to minutes with auto-escalation.', trackRecord: '5 of 5 high-value members retained (Q4 2025)' },
  { id: 'post-event', name: 'Post-Event Engagement Capture', category: 'Events & Programming', description: 'After club events, convert peak engagement into sustained visits with thank-yous, introductions, and tee time holds.', trackRecord: '11 of 14 event attendees returned within 10 days (Q4 2025)' },
  { id: 'anniversary', name: 'Membership Anniversary Celebration', category: 'Member Engagement', description: 'At membership milestones (1, 5, 10, 20 years), deliver personalized recognition to reinforce belonging.', trackRecord: '11 of 11 milestone members renewed (Q4 2025)' },
];

export default function ActionsDrawer({ isOpen, onClose }) {
  const { inbox, approveAction, dismissAction, playbooks, dispatch } = useApp();
  const { navigate } = useNavigationContext();
  const pending = inbox.filter(i => i.status === 'pending');
  const [activeTab, setActiveTab] = useState('inbox');

  return (
    <>
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/35 z-[200] transition-opacity duration-200" />
      )}

      <div
        className={`fixed top-0 right-0 h-screen bg-white border-l border-gray-200 flex flex-col overflow-hidden z-[210] transition-transform duration-250 dark:bg-white/[0.03] dark:border-gray-800 ${isOpen ? 'translate-x-0 shadow-theme-xl' : 'translate-x-full'}`}
        style={{ width: Math.min(480, typeof window !== 'undefined' ? window.innerWidth - 60 : 480) }}
        role="dialog"
        aria-label="Actions drawer"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center shrink-0 dark:border-gray-800">
          <div className="text-base font-bold text-gray-800 dark:text-white/90">Actions & Playbooks</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-gray-200 bg-gray-100 text-gray-500 text-base cursor-pointer flex items-center justify-center dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            \u00D7
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex px-5 pt-2 border-b border-gray-200 dark:border-gray-800">
          {DRAWER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-semibold border-none cursor-pointer bg-transparent border-b-2 transition-all duration-150 ${
                activeTab === tab.key
                  ? 'text-gray-800 border-b-brand-500 dark:text-white/90'
                  : 'text-gray-500 border-b-transparent dark:text-gray-400'
              }`}
            >
              {tab.label}
              {tab.key === 'inbox' && pending.length > 0 && (
                <span className="ml-1.5 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold px-1.5">
                  {pending.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {activeTab === 'inbox' && (
            <>
              {pending.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-500 text-sm dark:text-gray-400">
                  <div className="text-[32px] mb-3">\u2713</div>
                  <div className="font-semibold mb-1">All caught up</div>
                  <div className="text-sm">No pending actions right now.</div>
                </div>
              ) : (
                pending.map(action => (
                  <div key={action.id} className="border border-gray-200 rounded-xl px-4 py-3.5 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
                    <div className="text-sm font-semibold text-gray-800 mb-1.5 dark:text-white/90">{action.description}</div>
                    <div className="text-xs text-gray-500 mb-2.5 dark:text-gray-400">
                      {action.source} \u00B7 {action.actionType?.replace(/_/g, ' ').toLowerCase()}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => approveAction(action.id)} className="px-4 py-1.5 rounded-md bg-success-500 text-white border-none text-xs font-semibold cursor-pointer">Approve</button>
                      <button onClick={() => dismissAction(action.id)} className="px-4 py-1.5 rounded-md bg-transparent text-gray-500 border border-gray-200 text-xs font-semibold cursor-pointer dark:border-gray-700 dark:text-gray-400">Dismiss</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === 'playbooks' && (
            <>
              <div className="text-sm text-gray-600 mb-1 flex justify-between items-center dark:text-gray-400">
                <span>{CORE_PLAYBOOKS.length} playbooks \u2014 activate to start automated response protocols.</span>
                <button onClick={(e) => { e.stopPropagation(); onClose(); navigate('playbooks'); }} className="text-[11px] font-semibold text-brand-500 bg-transparent border-none cursor-pointer p-0 underline">View all \u2192</button>
              </div>
              {CORE_PLAYBOOKS.map(pb => {
                const isActive = playbooks?.[pb.id]?.active;
                return (
                  <div key={pb.id} className={`border rounded-xl p-4 ${isActive ? 'border-success-200 bg-success-50/30 dark:border-success-500/30 dark:bg-success-500/5' : 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white/90">{pb.name}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5 dark:text-gray-400">{pb.category}</div>
                      </div>
                      {isActive && (
                        <span className="text-[10px] font-bold px-2 py-[3px] rounded-full bg-success-50 text-success-500 uppercase tracking-wide dark:bg-success-500/15">Active</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed mb-2.5 dark:text-gray-400">{pb.description}</div>
                    <div
                      onClick={(e) => { e.stopPropagation(); onClose(); navigate('members'); }}
                      className="text-xs text-success-500 font-semibold mb-3 px-2.5 py-1.5 bg-success-50 rounded-lg border border-success-200 cursor-pointer transition-colors duration-150 hover:bg-success-100 dark:bg-success-500/10 dark:border-success-500/20"
                      title="View members"
                    >Track record: {pb.trackRecord} \u2192</div>
                    <button
                      onClick={() => dispatch({ type: isActive ? 'DEACTIVATE_PLAYBOOK' : 'ACTIVATE_PLAYBOOK', id: pb.id })}
                      className={`px-5 py-2 rounded-md text-xs font-semibold cursor-pointer ${
                        isActive ? 'bg-transparent text-gray-500 border border-gray-200 dark:border-gray-700 dark:text-gray-400' : 'bg-brand-500 text-white border-none'
                      }`}
                    >{isActive ? 'Deactivate' : 'Activate Playbook'}</button>
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
