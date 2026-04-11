import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/services/apiClient';
import SourceBadge from '@/components/ui/SourceBadge';

const ACTION_LABELS = {
  book_tee_time: 'booked tee time',
  concierge_booking: 'booked via concierge',
  make_dining_reservation: 'made reservation',
  cancel_tee_time: 'cancelled tee time',
  rsvp_event: 'RSVP\'d to event',
  file_complaint: 'filed complaint',
  intervention: 'outreach logged',
  agent_action: 'agent action',
  approve: 'approved action',
  dismiss: 'dismissed action',
  call: 'logged call',
  email: 'sent email',
  sms: 'sent SMS',
};

function formatTimeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function sourceBadgeFor(item) {
  if (item.action_type === 'concierge_booking') return 'Concierge AI';
  if (item.agent_id) return 'Agent';
  if (item.action_type === 'agent_action') return 'Agent';
  return 'Staff';
}

export default function RecentActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [newIds, setNewIds] = useState(new Set());
  const intervalRef = useRef(null);

  const fetchActivities = async () => {
    try {
      const res = await apiFetch('/api/activity?limit=5');
      const data = typeof res === 'string' ? JSON.parse(res) : res;
      const items = data?.activities || [];
      setActivities(prev => {
        const oldIds = new Set(prev.map(a => a.id));
        const fresh = new Set();
        items.forEach(a => { if (!oldIds.has(a.id)) fresh.add(a.id); });
        if (fresh.size > 0) setNewIds(fresh);
        return items;
      });
    } catch {
      // silently fail — feed is non-critical
    }
  };

  useEffect(() => {
    fetchActivities();
    intervalRef.current = setInterval(fetchActivities, 3000);
    return () => clearInterval(intervalRef.current);
  }, []);

  // Clear new-item highlights after animation
  useEffect(() => {
    if (newIds.size === 0) return;
    const t = setTimeout(() => setNewIds(new Set()), 1500);
    return () => clearTimeout(t);
  }, [newIds]);

  if (activities.length === 0) return null;

  return (
    <div className="fade-in-up" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', letterSpacing: -0.2 }}>Live Activity</span>
          <span className="pulse-dot" style={{ width: 6, height: 6, background: '#12b76a', borderRadius: '50%', display: 'inline-block' }} />
        </div>
        <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Last 5</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {activities.map(item => {
          const isNew = newIds.has(item.id);
          const label = ACTION_LABELS[item.action_subtype] || ACTION_LABELS[item.action_type] || item.action_type;
          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 10,
                background: isNew ? 'rgba(18,183,106,0.06)' : '#fafafa',
                border: isNew ? '1px solid rgba(18,183,106,0.2)' : '1px solid transparent',
                transition: 'all 0.4s ease',
                animation: isNew ? 'activitySlideIn 0.4s ease-out' : 'none',
              }}
            >
              <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, minWidth: 52, flexShrink: 0 }}>
                {formatTimeAgo(item.created_at)}
              </span>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 600, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.member_name || item.actor || 'System'}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280', flex: 'none' }}>
                {label}
              </span>
              <SourceBadge system={sourceBadgeFor(item)} size="xs" />
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes activitySlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
