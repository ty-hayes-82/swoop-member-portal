import { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

const STORAGE_KEY = 'swoop_last_visit';

function formatTimeAgo(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCurrency(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '--';
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export default function SinceLastVisit({ yesterdayData = null }) {
  const { pendingAgentCount } = useApp();
  const [lastVisit, setLastVisit] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLastVisit(new Date(stored));
    }
    // Update timestamp for next visit
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  }, []);

  if (!lastVisit) return null;

  const elapsed = Date.now() - lastVisit.getTime();
  if (elapsed < 60000) return null; // less than 1 minute, skip

  const showYesterday = yesterdayData && elapsed > 12 * 60 * 60 * 1000; // >12 hours

  return (
    <div
      className={`flex flex-col bg-blue-600/[0.024] border border-blue-600/[0.12] rounded-lg ${showYesterday ? 'gap-2.5 py-3 px-3.5' : 'gap-0 py-2 px-3.5'}`}
    >
      <div className="flex items-center gap-2.5 text-xs text-gray-500">
        <span className="font-semibold">Since your last visit</span>
        <span className="text-gray-400">({formatTimeAgo(elapsed)})</span>
        {pendingAgentCount > 0 && (
          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-brand-500/[0.07] border border-brand-500/20 text-brand-500 font-bold text-[11px]">
            {pendingAgentCount} new action{pendingAgentCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Yesterday's key metrics — shown when GM has been away >12 hours */}
      {showYesterday && (
        <div className="flex gap-4 flex-wrap pt-1.5 border-t border-blue-600/[0.08]">
          {yesterdayData.revenue != null && (
            <div className="text-xs">
              <span className="text-gray-400">Revenue: </span>
              <span className="font-bold font-mono text-gray-800 dark:text-white/90">
                {formatCurrency(yesterdayData.revenue)}
              </span>
              {yesterdayData.revenueVsPlan != null && (
                <span className={`ml-1 font-semibold ${yesterdayData.revenueVsPlan < 0 ? 'text-error-500' : 'text-success-500'}`}>
                  {yesterdayData.revenueVsPlan >= 0 ? '+' : ''}{(yesterdayData.revenueVsPlan * 100).toFixed(0)}% vs plan
                </span>
              )}
            </div>
          )}
          {yesterdayData.rounds != null && (
            <div className="text-xs">
              <span className="text-gray-400">Rounds: </span>
              <span className="font-bold font-mono text-gray-800 dark:text-white/90">
                {yesterdayData.rounds}
              </span>
            </div>
          )}
          {yesterdayData.isUnderstaffed && (
            <span className="text-[10px] font-bold py-px px-1.5 rounded bg-error-500/[0.07] text-error-500">
              5 complaints filed — understaffed
            </span>
          )}
        </div>
      )}
    </div>
  );
}
