// ArrivalBriefs — Upcoming member arrival briefs for the Today operational dashboard
// Self-contained component, importable into TodayView.jsx
import { useState, useEffect, useCallback } from 'react';

const ROLES = [
  { key: 'pro_shop', label: 'Pro Shop', icon: '🏌️', color: '#6366f1' },
  { key: 'grill_room', label: 'Grill Room', icon: '🍽️', color: '#ea580c' },
  { key: 'beverage_cart', label: 'Beverage Cart', icon: '🥤', color: '#0891b2' },
];

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

function minutesUntil(isoTime) {
  const diff = new Date(isoTime).getTime() - Date.now();
  return Math.max(0, Math.round(diff / 60000));
}

function formatTeeTime(isoTime) {
  return new Date(isoTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function CollapsibleSection({ role, isOpen, onToggle }) {
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border-none cursor-pointer transition-colors text-left"
      >
        <span className="text-sm">{role.icon}</span>
        <span className="text-xs font-semibold text-gray-700 flex-1">{role.label}</span>
        <span className="text-[10px] text-gray-400">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && (
        <div className="px-3 py-2 text-xs text-gray-600 leading-relaxed bg-white">
          {role.briefText || 'No brief available'}
        </div>
      )}
    </div>
  );
}

function ArrivalCard({ brief }) {
  const [openSections, setOpenSections] = useState({});
  const minsAway = minutesUntil(brief.tee_time);
  const hasComplaint = brief.has_complaint;

  const toggleSection = useCallback((key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Urgency color based on how soon arrival is
  const urgencyColor = minsAway <= 30 ? '#ef4444' : minsAway <= 60 ? '#f59e0b' : '#6366f1';

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl p-4 transition-all duration-150 hover:shadow-md hover:-translate-y-px"
      style={{ borderLeft: `3px solid ${urgencyColor}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-800">
              {brief.member_name}
            </span>
            {hasComplaint && (
              <span
                className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full"
                style={{ background: '#ef4444' }}
                title="Open complaint on file"
              >
                {'\u26a0\ufe0f'} Complaint
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
            <span>{formatTeeTime(brief.tee_time)}</span>
            {brief.course && (
              <>
                <span className="text-gray-300">|</span>
                <span>{brief.course}</span>
              </>
            )}
          </div>
        </div>
        <div
          className="text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0"
          style={{ background: `${urgencyColor}12`, color: urgencyColor }}
        >
          {minsAway === 0 ? 'Arriving now' : `${minsAway}m away`}
        </div>
      </div>

      {/* Role sections */}
      <div className="flex flex-col gap-1.5">
        {ROLES.map(role => {
          const roleBrief = brief.briefs?.find(b => b.role === role.key);
          return (
            <CollapsibleSection
              key={role.key}
              role={{ ...role, briefText: roleBrief?.brief_text }}
              isOpen={!!openSections[role.key]}
              onToggle={() => toggleSection(role.key)}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ArrivalBriefs() {
  const [briefs, setBriefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBriefs = useCallback(async () => {
    try {
      const res = await fetch('/api/staff-briefs?date=today');
      if (!res.ok) throw new Error(`Failed to fetch briefs: ${res.status}`);
      const data = await res.json();

      // Group briefs by member+tee_time into arrival cards
      const grouped = {};
      for (const brief of (data.briefs || [])) {
        const key = `${brief.member_id}_${brief.tee_time}`;
        if (!grouped[key]) {
          grouped[key] = {
            member_id: brief.member_id,
            member_name: brief.member_name || 'Unknown Member',
            tee_time: brief.tee_time,
            course: brief.course || '',
            has_complaint: false,
            briefs: [],
          };
        }
        if (brief.brief_text?.includes('\u26a0\ufe0f')) {
          grouped[key].has_complaint = true;
        }
        grouped[key].briefs.push(brief);
      }

      // Sort by tee time ascending, filter to next 2 hours
      const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;
      const sorted = Object.values(grouped)
        .filter(g => new Date(g.tee_time).getTime() <= twoHoursFromNow)
        .filter(g => new Date(g.tee_time).getTime() >= Date.now() - 10 * 60 * 1000) // include up to 10 min past
        .sort((a, b) => new Date(a.tee_time).getTime() - new Date(b.tee_time).getTime());

      setBriefs(sorted);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBriefs();
    const interval = setInterval(fetchBriefs, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchBriefs]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide">
          Arrival Briefs
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-xs text-gray-400">Loading arrival briefs...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide">
          Arrival Briefs
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-400">Unable to load briefs</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold text-brand-500 uppercase tracking-wide">
          Arrival Briefs
          {briefs.length > 0 && (
            <span className="ml-1.5 text-gray-400 font-normal">({briefs.length})</span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchBriefs}
          className="text-[10px] text-gray-400 hover:text-brand-500 bg-transparent border-none cursor-pointer transition-colors"
        >
          Refresh
        </button>
      </div>

      {briefs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <div className="text-lg mb-1">🏌️</div>
          <div className="text-xs text-gray-400">No upcoming arrivals in the next 2 hours</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {briefs.map(brief => (
            <ArrivalCard key={`${brief.member_id}_${brief.tee_time}`} brief={brief} />
          ))}
        </div>
      )}
    </div>
  );
}
