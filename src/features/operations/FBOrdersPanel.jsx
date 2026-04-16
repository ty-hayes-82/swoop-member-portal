import { useState } from 'react';
import { getFBOrders } from '@/services/operationsActivityService';

const STATUS_META = {
  new:        { label: 'New',        style: 'bg-blue-100 text-blue-800' },
  preparing:  { label: 'Preparing',  style: 'bg-yellow-100 text-yellow-800' },
  ready:      { label: 'Ready',      style: 'bg-green-100 text-green-800' },
  picked_up:  { label: 'Picked Up',  style: 'bg-gray-100 text-gray-500' },
};

const STATUS_FLOW = ['new', 'preparing', 'ready', 'picked_up'];

function nextStatus(current) {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function actionLabel(current) {
  if (current === 'new') return 'Start Preparing';
  if (current === 'preparing') return 'Mark Ready';
  if (current === 'ready') return 'Mark Picked Up';
  return null;
}

function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function FBOrdersPanel() {
  const [orders, setOrders] = useState(getFBOrders);

  function advance(id) {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== id) return o;
        const ns = nextStatus(o.status);
        return ns ? { ...o, status: ns } : o;
      })
    );
  }

  const active = orders.filter(o => o.status !== 'picked_up');
  const done   = orders.filter(o => o.status === 'picked_up');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-swoop-text">F&amp;B Pickup Queue</h2>
        <p className="text-sm text-swoop-text-muted mt-0.5">Member pickup orders. Advance each order through the kitchen pipeline.</p>
      </div>

      {active.length === 0 && (
        <div className="rounded-xl border border-swoop-border bg-swoop-panel px-6 py-10 text-center text-sm text-swoop-text-muted">
          No active orders right now.
        </div>
      )}

      {active.length > 0 && (
        <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden">
          <div className="px-4 py-2.5 border-b border-swoop-border bg-swoop-row">
            <span className="text-xs font-bold uppercase tracking-wide text-swoop-text-muted">Active Orders ({active.length})</span>
          </div>
          <div className="divide-y divide-swoop-border">
            {active.map(order => {
              const meta = STATUS_META[order.status] || { label: order.status, style: 'bg-gray-100 text-gray-500' };
              const action = actionLabel(order.status);
              return (
                <div key={order.id} className="flex items-start gap-3 px-4 py-3 hover:bg-swoop-row/50 transition-colors">
                  <span className="text-xl flex-shrink-0 mt-0.5">🍽</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-swoop-text">{order.memberName}</span>
                      <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 ${meta.style}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-sm text-swoop-text-muted mt-0.5 leading-snug">{order.items}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-swoop-text-label">Pickup: {order.pickupTime}</span>
                      <span className="text-xs text-swoop-text-label">Placed {relativeTime(order.placedAt)}</span>
                    </div>
                  </div>
                  {action && (
                    <button
                      onClick={() => advance(order.id)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-brand-500 text-white text-xs font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors whitespace-nowrap mt-0.5"
                    >
                      {action}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {done.length > 0 && (
        <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden opacity-60">
          <div className="px-4 py-2.5 border-b border-swoop-border bg-swoop-row">
            <span className="text-xs font-bold uppercase tracking-wide text-swoop-text-muted">Completed ({done.length})</span>
          </div>
          <div className="divide-y divide-swoop-border">
            {done.map(order => (
              <div key={order.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-xl flex-shrink-0">🍽</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold text-swoop-text">{order.memberName}</span>
                  <span className="mx-2 text-swoop-text-muted">·</span>
                  <span className="text-sm text-swoop-text-muted">{order.items}</span>
                </div>
                <span className="text-[10px] font-bold uppercase rounded-full px-2 py-0.5 bg-gray-100 text-gray-500">
                  Picked Up
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
