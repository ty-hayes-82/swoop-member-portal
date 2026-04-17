import { useEffect, useRef, useState } from "react";
import { useCurrentClub } from "@/hooks/useCurrentClub";

const ROLE_OPTIONS = [
  { value: 'gm',                 label: 'General Manager' },
  { value: 'assistant_gm',       label: 'Assistant GM' },
  { value: 'head_pro',           label: 'Head Pro' },
  { value: 'fb_director',        label: 'F&B Director' },
  { value: 'dining_room_manager',label: 'Dining Room Manager' },
  { value: 'membership_director',label: 'Membership Director' },
  { value: 'controller',         label: 'Controller' },
  { value: 'staff',              label: 'Staff' },
];

function authHeaders() {
  const token = localStorage.getItem('swoop_auth_token');
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export default function StaffDutyPanel() {
  const clubId = useCurrentClub();
  const [myDuty, setMyDuty] = useState(null);       // { role, started_at } | null
  const [roster, setRoster] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  // Don't render for demo or when not logged in
  const token = localStorage.getItem('swoop_auth_token');
  if (!token || !clubId || clubId === 'demo' || clubId?.startsWith('demo_')) return null;

  useEffect(() => {
    loadDutyStatus();
  }, [clubId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function loadDutyStatus() {
    try {
      const res = await fetch(`/api/staff/on-duty?clubId=${clubId}`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setMyDuty(data.my_duty ?? null);
      setRoster(data.roster ?? []);
    } catch {
      // non-fatal
    }
  }

  async function clockIn() {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const res = await fetch('/api/staff/clock-in', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ role: selectedRole }),
      });
      if (res.ok) {
        const data = await res.json();
        setMyDuty(data.on_duty);
        await loadDutyStatus();
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function clockOut() {
    setLoading(true);
    try {
      const res = await fetch('/api/staff/clock-out', {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        setMyDuty(null);
        await loadDutyStatus();
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  const roleLabel = ROLE_OPTIONS.find(r => r.value === myDuty?.role)?.label;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
          myDuty
            ? 'bg-success-50 border-success-200 text-success-700 hover:bg-success-100'
            : 'bg-swoop-row border-swoop-border text-swoop-text-muted hover:bg-swoop-row-hover'
        }`}
        title={myDuty ? `On duty as ${roleLabel}` : 'Not on duty — click to start shift'}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${myDuty ? 'bg-success-500' : 'bg-gray-400'}`} />
        <span className="hidden sm:inline">
          {myDuty ? roleLabel : 'Off Duty'}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-swoop-border bg-swoop-panel shadow-theme-lg z-50">
          {myDuty ? (
            <div className="p-4">
              <p className="text-sm font-semibold text-swoop-text mb-0.5">On duty as {roleLabel}</p>
              <p className="text-xs text-swoop-text-muted mb-3">
                Since {new Date(myDuty.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <button
                onClick={clockOut}
                disabled={loading}
                className="w-full py-2 rounded-lg bg-error-50 text-error-600 border border-error-200 text-sm font-medium hover:bg-error-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Ending shift...' : 'End Shift'}
              </button>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-sm font-semibold text-swoop-text mb-3">Start your shift</p>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full mb-3 px-3 py-2 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text focus:outline-none focus:border-brand-300"
              >
                <option value="">Select your role...</option>
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <button
                onClick={clockIn}
                disabled={!selectedRole || loading}
                className="w-full py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors cursor-pointer disabled:opacity-40"
              >
                {loading ? 'Starting...' : 'Start Shift'}
              </button>
            </div>
          )}

          {roster.length > 0 && (
            <div className="border-t border-swoop-border-inset px-4 pb-3 pt-2">
              <p className="text-xs font-semibold text-swoop-text-label uppercase tracking-wide mb-2">Also on duty</p>
              {roster
                .filter(r => r.user_id !== ((() => { try { return JSON.parse(localStorage.getItem('swoop_auth_user') || '{}').user_id; } catch { return null; } })()))
                .slice(0, 5)
                .map(r => (
                  <div key={r.id} className="flex items-center gap-2 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-500 flex-shrink-0" />
                    <span className="text-xs text-swoop-text-2">
                      {r.name || r.user_id} <span className="text-swoop-text-muted">({ROLE_OPTIONS.find(o => o.value === r.role)?.label ?? r.role})</span>
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
