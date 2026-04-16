import { useState } from 'react';
import { getActivityLog } from '@/services/operationsActivityService';

const TYPE_META = {
  agent_action:  { icon: '⚡', dot: 'bg-purple-500',  label: 'Agent Action' },
  member_alert:  { icon: '🔔', dot: 'bg-orange-500',  label: 'Member Alert' },
  concierge:     { icon: '💬', dot: 'bg-blue-500',    label: 'Concierge' },
  fb_order:      { icon: '🍽', dot: 'bg-amber-500',   label: 'F&B Order' },
  court_booking: { icon: '🎾', dot: 'bg-green-500',   label: 'Court Booking' },
  checkin:       { icon: '📍', dot: 'bg-teal-500',    label: 'Check-in' },
};

const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-500',
  completed: 'bg-emerald-100 text-emerald-800',
};

const FILTER_TABS = [
  { key: 'all',           label: 'All' },
  { key: 'agent_action',  label: 'Agent Actions' },
  { key: 'member_alert',  label: 'Member Alerts' },
  { key: 'concierge',     label: 'Concierge' },
  { key: 'fb_order',      label: 'Orders' },
  { key: 'court_booking', label: 'Reservations' },
];

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function ActivityRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  const meta = TYPE_META[item.type] || { icon: '•', dot: 'bg-gray-400', label: item.type };
  const statusStyle = STATUS_STYLES[item.status] || 'bg-gray-100 text-gray-500';

  return (
    <div
      className="border-b border-swoop-border last:border-b-0 cursor-pointer"
      onClick={() => setExpanded(v => !v)}
    >
      <div className="flex items-start gap-3 px-4 py-3 hover:bg-swoop-row transition-colors">
        {/* Icon + dot */}
        <div className="relative flex-shrink-0 mt-0.5">
          <span className="text-lg leading-none">{meta.icon}</span>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white ${meta.dot}`} />
        </div>

        {/* Center */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-swoop-text">{item.memberName}</span>
            <span className="text-[10px] font-semibold text-swoop-text-muted uppercase tracking-wide">{meta.label}</span>
          </div>
          <p className="text-sm text-swoop-text-muted mt-0.5 leading-snug">{item.description}</p>
          {item.agentLabel && (
            <span className="text-[11px] text-swoop-text-label mt-0.5 block">
              via {item.agentLabel}
              {item.agentId ? ` · ${item.agentId}` : ''}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex-shrink-0 flex flex-col items-end gap-1 ml-2">
          <span className="text-[11px] text-swoop-text-muted whitespace-nowrap">{relativeTime(item.timestamp)}</span>
          <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${statusStyle}`}>
            {item.status}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 ml-10 bg-swoop-row/50">
          <div className="rounded-lg border border-swoop-border bg-swoop-panel p-3 text-sm text-swoop-text-muted space-y-1">
            {item.notes && (
              <p><span className="font-semibold text-swoop-text">Notes:</span> {item.notes}</p>
            )}
            {item.result && (
              <p><span className="font-semibold text-swoop-text">Result:</span> {item.result}</p>
            )}
            {item.agentId && (
              <p><span className="font-semibold text-swoop-text">Agent:</span> {item.agentLabel} ({item.agentId})</p>
            )}
            <p className="text-[11px] text-swoop-text-label">
              {new Date(item.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ActivityLog() {
  const [filter, setFilter] = useState('all');
  const allItems = getActivityLog();
  const items = filter === 'all' ? allItems : allItems.filter(i => i.type === filter);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex gap-0.5 rounded-lg bg-swoop-row p-0.5 border border-swoop-border overflow-x-auto no-scrollbar">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-swoop-panel text-swoop-text shadow-theme-xs'
                : 'bg-transparent text-swoop-text-muted hover:text-swoop-text-2'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className="ml-1 text-[10px] text-swoop-text-label">
                ({allItems.filter(i => i.type === tab.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden">
        {items.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-swoop-text-muted">No activity for this filter.</div>
        ) : (
          items.map(item => <ActivityRow key={item.id} item={item} />)
        )}
      </div>

      <p className="text-[11px] text-swoop-text-label text-center">
        Showing {items.length} of {allItems.length} events. Click any row to expand details.
      </p>
    </div>
  );
}
