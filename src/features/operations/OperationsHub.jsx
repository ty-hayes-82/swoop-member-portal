import { useState, lazy, Suspense } from 'react';
import ActivityLog from './ActivityLog';
import CourtReservationsPanel from './CourtReservationsPanel';
import FBOrdersPanel from './FBOrdersPanel';

const SMSChatSimulatorPage = lazy(() => import('@/features/agents/SMSChatSimulatorPage'));

const TABS = [
  { key: 'activity',   label: 'Activity',      icon: '📋' },
  { key: 'sms',        label: 'SMS Simulator', icon: '💬' },
  { key: 'courts',     label: 'Court Bookings',icon: '🎾' },
  { key: 'fb',         label: 'F&B Orders',    icon: '🍽' },
];

export default function OperationsHub() {
  const [activeTab, setActiveTab] = useState('activity');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold m-0 text-swoop-text">Operations Center</h1>
        <p className="text-sm text-swoop-text-muted mt-1 mb-0">
          All agent activity, member requests, and club operations in one place.
        </p>
      </div>

      <div role="tablist" aria-label="Operations tabs" className="flex gap-0.5 sm:gap-1 rounded-lg bg-swoop-row p-0.5 border border-swoop-border">
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
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'activity' && <ActivityLog />}
        {activeTab === 'sms' && (
          <Suspense fallback={<div className="text-sm text-swoop-text-muted py-6 text-center">Loading SMS Simulator...</div>}>
            <SMSChatSimulatorPage embedded={true} />
          </Suspense>
        )}
        {activeTab === 'courts' && <CourtReservationsPanel />}
        {activeTab === 'fb' && <FBOrdersPanel />}
      </div>
    </div>
  );
}
