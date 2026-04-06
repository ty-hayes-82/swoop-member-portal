/**
 * AutomationsHub — Consolidated automation section
 * 3 tabs: Inbox (default), Playbooks, Agents
 */
import { useState, useEffect } from 'react';
import { useNavigationContext } from '@/context/NavigationContext';
import { useApp } from '@/context/AppContext';
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold m-0 text-gray-800 dark:text-white/90">Automations</h1>
        <p className="text-sm text-gray-500 mt-1 mb-0">
          AI agents, action inbox, and automated playbooks.
        </p>
      </div>

      {/* Tab navigation */}
      <div role="tablist" aria-label="Automations tabs" className="flex gap-1 rounded-lg bg-gray-100 p-0.5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border-none transition-all duration-150 whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-white text-gray-800 shadow-theme-xs dark:bg-gray-700 dark:text-white'
                : 'bg-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            {tab.label}
            {tab.key === 'inbox' && pendingCount > 0 && (
              <span className="ml-1 min-w-[18px] h-[18px] inline-flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold px-1">
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
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}
