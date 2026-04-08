/**
 * AutomationsHub — Consolidated automation section
 * 3 tabs: Inbox (default), Playbooks, Agents
 */
import { useState, useEffect } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { useApp } from '@/context/AppContext';
import { getDataMode, isSourceLoaded } from '@/services/demoGate';
import InboxTab from './InboxTab';
import AgentsTab from './AgentsTab';
import SettingsTab from './SettingsTab';
import PlaybooksPage from '@/features/playbooks/PlaybooksPage';

const TABS = [
  { key: 'inbox', label: 'Inbox', icon: '📥' },
  { key: 'playbooks', label: 'Playbooks', icon: '📋' },
  { key: 'agents', label: 'Agents', icon: '🤖' },
  { key: 'settings', label: 'Settings', icon: '⚙️' },
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

  // In guided demo, hide automations content until agents gate is imported
  const guidedNoAgents = getDataMode() === 'guided' && !isSourceLoaded('agents');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold m-0 text-gray-800 dark:text-white/90">Automations</h1>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          AI agents, action inbox, and automated playbooks.
        </p>
      </div>

      {guidedNoAgents && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-8 text-center">
          <div className="text-3xl mb-3">🤖</div>
          <h3 className="text-base font-semibold text-gray-700 dark:text-gray-200 mb-1">AI Agents not yet activated</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-0">
            Import <strong>AI Agents</strong> from the Guided Demo panel to see automated playbooks, inbox actions, and agent settings.
          </p>
        </div>
      )}

      {/* Tab navigation — mobile-optimized: equal-width tabs, hidden icons on small screens */}
      {!guidedNoAgents && <div role="tablist" aria-label="Automations tabs" className="flex gap-0.5 sm:gap-1 rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                : 'bg-transparent text-gray-500 hover:text-gray-700'
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
      </div>}

      {/* Tab content */}
      {!guidedNoAgents && (
        <div role="tabpanel">
          {activeTab === 'inbox' && <InboxTab />}
          {activeTab === 'playbooks' && <PlaybooksPage embedded />}
          {activeTab === 'agents' && <AgentsTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>
      )}
    </div>
  );
}
