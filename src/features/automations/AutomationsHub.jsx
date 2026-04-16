/**
 * AutomationsHub — Consolidated automation section
 * 3 tabs: Inbox (default), Playbooks, Agents
 */
import { useState, useEffect } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { useApp } from '@/context/AppContext';
import InboxTab from './InboxTab';
import AgentsTab from './AgentsTab';
import PlaybooksPage from '@/features/playbooks/PlaybooksPage';
import SMSChatSimulatorPage from '@/features/agents/SMSChatSimulatorPage';

const TABS = [
  { key: 'inbox', label: 'Inbox', icon: '📥' },
  { key: 'playbooks', label: 'Action Plans', icon: '📋' },
  { key: 'agents', label: 'Automated Saves', icon: '🤖' },
  { key: 'sms', label: 'SMS Simulator', icon: '💬' },
];

export default function AutomationsHub() {
  const { routeIntent } = useNavigationContext();
  const { pendingCount } = useApp();

  // Support deep-linking: navigate('automations', { tab: 'playbooks' })
  const [activeTab, setActiveTab] = useState(() => {
    if (routeIntent?.tab && TABS.some(t => t.key === routeIntent.tab)) {
      return routeIntent.tab;
    }
    return 'inbox';
  });

  // Update tab if routeIntent changes
  useEffect(() => {
    if (routeIntent?.tab && TABS.some(t => t.key === routeIntent.tab)) {
      setActiveTab(routeIntent.tab);
    }
  }, [routeIntent]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold m-0 text-swoop-text">Revenue &amp; Retention Opportunities</h1>
        <p className="text-sm text-swoop-text-muted mt-1 mb-0">
          Prioritized actions that protect dues revenue and improve member retention. Approve or dismiss in seconds.
        </p>
      </div>

      {/* Tab navigation — mobile-optimized: equal-width tabs, hidden icons on small screens */}
      <div role="tablist" aria-label="Automations tabs" className="flex gap-0.5 sm:gap-1 rounded-lg bg-swoop-row p-0.5 border border-swoop-border">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-brand-500 ${
              activeTab === tab.key
                ? 'bg-swoop-panel text-swoop-text shadow-theme-xs'
                : 'bg-transparent text-swoop-text-muted hover:text-swoop-text-2'
            }`}
          >
            <span className="text-sm hidden sm:inline">{tab.icon}</span>
            {tab.label}
            {tab.key === 'inbox' && pendingCount > 0 && (
              <span className="ml-0.5 sm:ml-1 min-w-[16px] h-[16px] sm:min-w-[18px] sm:h-[18px] inline-flex items-center justify-center rounded-full bg-brand-500 text-white text-[9px] sm:text-[10px] font-bold px-0.5 sm:px-1">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div role="tabpanel">
        {activeTab === 'inbox' && <InboxTab />}
        {activeTab === 'playbooks' && <PlaybooksPage embedded />}
        {activeTab === 'agents' && <AgentsTab />}
        {activeTab === 'sms' && <SMSChatSimulatorPage embedded />}
      </div>
    </div>
  );
}
