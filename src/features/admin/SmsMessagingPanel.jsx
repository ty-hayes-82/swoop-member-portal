/**
 * SMS & Messaging Admin Panel
 *
 * 5 sections:
 *   1. Status       — enable toggle, phone coverage, opted-in stats, 30d delivery
 *   2. Staff Phones — add/edit staff phone numbers and alert categories
 *   3. Templates    — view and edit message template body text
 *   4. Message Log  — paginated sms_log for this club
 *   5. Consent      — bulk opt-in controls
 */
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/services/apiClient';

const ALERT_CATEGORIES = [
  { value: 'complaint_escalation', label: 'Complaint Escalation' },
  { value: 'staffing_gap', label: 'Staffing Gap' },
  { value: 'health_critical', label: 'Health Critical' },
  { value: 'high_value_action', label: 'High Value Action' },
  { value: 'tee_time_cancellation', label: 'Tee Time Cancellation' },
  { value: 'pace_alert', label: 'Pace Alert' },
  { value: 'weather_disruption', label: 'Weather Disruption' },
  { value: 'dining_surge', label: 'Dining Surge' },
  { value: 'new_member_milestone', label: 'New Member Milestone' },
  { value: 'resignation_risk', label: 'Resignation Risk' },
  { value: 'event_capacity', label: 'Event Capacity' },
  { value: 'arrival_anticipation', label: 'Arrival Brief' },
];

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-swoop-border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-swoop-row text-sm font-semibold text-swoop-text-2 cursor-pointer border-none text-left"
        onClick={() => setOpen(v => !v)}
      >
        <span>{title}</span>
        <span className="text-swoop-text-label">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: Status
// ---------------------------------------------------------------------------

function StatusSection({ clubId }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    apiFetch(`/api/sms/config?clubId=${clubId}`)
      .then(setData)
      .catch(e => setError(e.message));
  }, [clubId]);

  useEffect(() => { load(); }, [load]);

  async function toggleEnabled() {
    if (!data) return;
    setSaving(true);
    try {
      await apiFetch('/api/sms/config', {
        method: 'PUT',
        body: JSON.stringify({ ...data.config, clubId, enabled: !data.config.enabled }),
      });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveConfig(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(e.target);
    const updates = {
      clubId,
      enabled: data.config.enabled,
      sender_name: form.get('sender_name'),
      quiet_hours_start: form.get('quiet_hours_start'),
      quiet_hours_end: form.get('quiet_hours_end'),
      max_daily_per_member: parseInt(form.get('max_daily_per_member'), 10),
      opt_out_message: form.get('opt_out_message'),
    };
    try {
      await apiFetch('/api/sms/config', { method: 'PUT', body: JSON.stringify(updates) });
      load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-sm text-swoop-text-muted">Loading...</p>;

  const { config, stats } = data;
  const coveragePct = stats.phone_coverage_pct;
  const optInPct = stats.has_phone > 0
    ? Math.round((stats.opted_in / stats.has_phone) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Enable toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleEnabled}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer border-none ${
            config.enabled ? 'bg-green-500' : 'bg-swoop-border'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-swoop-panel shadow transition-transform ${
            config.enabled ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
        <span className="text-sm font-medium text-swoop-text-2">
          SMS {config.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Coverage stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          { label: 'Phone Coverage', value: `${coveragePct}%`, sub: `${stats.has_phone} of ${stats.total_members} members` },
          { label: 'Opted In', value: `${optInPct}%`, sub: `${stats.opted_in} of ${stats.has_phone}` },
          { label: 'Sent (30d)', value: stats.sent_30d.toLocaleString() },
          { label: 'Delivery Rate', value: stats.delivery_rate != null ? `${stats.delivery_rate}%` : '—' },
          { label: 'Reply Rate', value: stats.reply_rate != null ? `${stats.reply_rate}%` : '—', sub: 'action keywords' },
        ].map(s => (
          <div key={s.label} className="rounded-lg bg-swoop-row border border-swoop-border p-3">
            <p className="text-xs text-swoop-text-muted mb-1">{s.label}</p>
            <p className="text-lg font-bold text-swoop-text">{s.value}</p>
            {s.sub && <p className="text-xs text-swoop-text-label mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {coveragePct < 60 && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          Phone coverage is below 60%. Consider requesting phone numbers from members to improve SMS reach.
        </p>
      )}

      {/* Config form */}
      <form onSubmit={saveConfig} className="flex flex-col gap-3 pt-2 border-t border-swoop-border">
        <p className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Club Settings</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-swoop-text-muted">Sender Name (shown in messages)</span>
            <input name="sender_name" defaultValue={config.sender_name} required
              className="rounded border border-swoop-border bg-swoop-panel px-2 py-1.5 text-sm text-swoop-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-swoop-text-muted">Max messages / member / day</span>
            <input name="max_daily_per_member" type="number" min="1" max="10" defaultValue={config.max_daily_per_member}
              className="rounded border border-swoop-border bg-swoop-panel px-2 py-1.5 text-sm text-swoop-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-swoop-text-muted">Quiet hours start</span>
            <input name="quiet_hours_start" type="time" defaultValue={config.quiet_hours_start}
              className="rounded border border-swoop-border bg-swoop-panel px-2 py-1.5 text-sm text-swoop-text" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-swoop-text-muted">Quiet hours end</span>
            <input name="quiet_hours_end" type="time" defaultValue={config.quiet_hours_end}
              className="rounded border border-swoop-border bg-swoop-panel px-2 py-1.5 text-sm text-swoop-text" />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-swoop-text-muted">Opt-out reply message</span>
          <input name="opt_out_message" defaultValue={config.opt_out_message}
            className="rounded border border-swoop-border bg-swoop-panel px-2 py-1.5 text-sm text-swoop-text" />
        </label>
        <div>
          <button type="submit" disabled={saving}
            className="px-4 py-1.5 text-sm font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 cursor-pointer border-none">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Staff Alert Routing
// ---------------------------------------------------------------------------

function StaffSection({ clubId }) {
  const [staff, setStaff] = useState([]);
  const [saving, setSaving] = useState({});
  const [testResult, setTestResult] = useState({});

  useEffect(() => {
    apiFetch(`/api/users?clubId=${clubId}`)
      .then(d => setStaff(d.users || d || []))
      .catch(() => {});
  }, [clubId]);

  async function savePhone(userId, phone, categories) {
    setSaving(s => ({ ...s, [userId]: true }));
    try {
      await apiFetch('/api/users/update-sms', {
        method: 'PUT',
        body: JSON.stringify({ userId, clubId, phone, alert_categories: categories }),
      });
    } catch (e) {
      console.error('save phone error:', e);
    } finally {
      setSaving(s => ({ ...s, [userId]: false }));
    }
  }

  async function sendTest(userId, phone) {
    setTestResult(r => ({ ...r, [userId]: 'sending...' }));
    try {
      await apiFetch('/api/sms/send-test', {
        method: 'POST',
        body: JSON.stringify({ to: phone, body: 'Swoop SMS test — your staff alerts are configured correctly.' }),
      });
      setTestResult(r => ({ ...r, [userId]: 'sent!' }));
    } catch (e) {
      setTestResult(r => ({ ...r, [userId]: 'failed' }));
    }
  }

  if (!staff.length) return <p className="text-sm text-swoop-text-muted">No staff users found. Add team members in Club Management.</p>;

  return (
    <div className="flex flex-col gap-3">
      {staff.map(user => (
        <StaffRow
          key={user.user_id}
          user={user}
          saving={saving[user.user_id]}
          testResult={testResult[user.user_id]}
          onSave={savePhone}
          onTest={sendTest}
        />
      ))}
    </div>
  );
}

function StaffRow({ user, saving, testResult, onSave, onTest }) {
  const [phone, setPhone] = useState(user.phone || '');
  const [categories, setCategories] = useState(user.alert_categories || []);

  function toggleCategory(val) {
    setCategories(c => c.includes(val) ? c.filter(x => x !== val) : [...c, val]);
  }

  return (
    <div className="border border-swoop-border rounded-lg p-3 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-swoop-text">{user.name}</span>
        <span className="text-xs text-swoop-text-label">{user.role} {user.title ? `· ${user.title}` : ''}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="(555) 867-5309"
          className="rounded border border-swoop-border bg-swoop-panel px-2 py-1 text-sm text-swoop-text w-40"
        />
        <button
          onClick={() => onSave(user.user_id, phone, categories)}
          disabled={saving}
          className="px-3 py-1 text-xs font-semibold rounded bg-swoop-row text-swoop-text-2 hover:bg-gray-200 border border-swoop-border cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {phone && (
          <button
            onClick={() => onTest(user.user_id, phone)}
            className="px-3 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 cursor-pointer"
          >
            Test
          </button>
        )}
        {testResult && <span className="text-xs text-swoop-text-muted">{testResult}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {ALERT_CATEGORIES.map(cat => (
          <label key={cat.value} className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={categories.includes(cat.value)}
              onChange={() => toggleCategory(cat.value)}
              className="w-3 h-3"
            />
            <span className="text-xs text-swoop-text-muted">{cat.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Message Templates
// ---------------------------------------------------------------------------

function TemplatesSection({ clubId }) {
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch(`/api/sms/templates?clubId=${clubId}`)
      .then(d => setTemplates(d.templates || []))
      .catch(() => {});
  }, [clubId]);

  async function saveTemplate(templateId, body) {
    setSaving(true);
    try {
      await apiFetch(`/api/sms/templates?id=${templateId}`, {
        method: 'PUT',
        body: JSON.stringify({ clubId, template_id: templateId, body }),
      });
      setTemplates(ts => ts.map(t => t.template_id === templateId ? { ...t, body } : t));
      setEditing(null);
    } catch (e) {
      console.error('save template error:', e);
    } finally {
      setSaving(false);
    }
  }

  const slots = (body) => [...body.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);

  if (!templates.length) return <p className="text-sm text-swoop-text-muted">Loading templates...</p>;

  return (
    <div className="flex flex-col gap-2">
      {templates.map(t => (
        <div key={t.template_id} className="border border-swoop-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-swoop-text-muted">{t.template_id}</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-swoop-row text-swoop-text-muted">{t.category}</span>
              {t.club_id && <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">customized</span>}
            </div>
            <button
              onClick={() => setEditing(editing === t.template_id ? null : t.template_id)}
              className="text-xs text-blue-500 hover:text-blue-700 cursor-pointer border-none bg-transparent"
            >
              {editing === t.template_id ? 'Cancel' : 'Edit'}
            </button>
          </div>

          {editing === t.template_id ? (
            <div className="flex flex-col gap-2">
              <textarea
                id={`tpl-${t.template_id}`}
                defaultValue={t.body}
                rows={3}
                className="w-full rounded border border-swoop-border bg-swoop-panel px-2 py-1.5 text-sm text-swoop-text font-mono resize-y"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const val = document.getElementById(`tpl-${t.template_id}`).value;
                    saveTemplate(t.template_id, val);
                  }}
                  disabled={saving}
                  className="px-3 py-1 text-xs font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 cursor-pointer border-none disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <p className="text-xs text-swoop-text-label">Variables: {slots(t.body).map(s => `{{${s}}}`).join(', ') || 'none'}</p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs text-swoop-text-muted font-mono leading-relaxed">{t.body}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {slots(t.body).map(s => (
                  <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-swoop-row text-swoop-text-muted font-mono">{`{{${s}}}`}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 4: Message Log
// ---------------------------------------------------------------------------

const STATUS_COLORS = {
  delivered: 'text-green-600',
  sent: 'text-blue-500',
  queued: 'text-swoop-text-label',
  failed: 'text-red-500',
  received: 'text-purple-500',
};

function LogSection({ clubId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState({ direction: '', status: '' });
  const PAGE_SIZE = 20;

  const load = useCallback((pg = 0, f = filter) => {
    setLoading(true);
    const params = new URLSearchParams({ clubId, limit: PAGE_SIZE, offset: pg * PAGE_SIZE });
    if (f.direction) params.set('direction', f.direction);
    if (f.status) params.set('status', f.status);
    apiFetch(`/api/sms/log?${params}`)
      .then(d => {
        setRows(d.rows || []);
        setHasMore((d.rows || []).length === PAGE_SIZE);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clubId, filter]);

  useEffect(() => { load(0); }, [clubId]);

  function applyFilter(newFilter) {
    setFilter(newFilter);
    setPage(0);
    load(0, newFilter);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Outbound', value: 'outbound' },
          { label: 'Staff', value: 'outbound_staff' },
          { label: 'Inbound', value: 'inbound' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => applyFilter({ ...filter, direction: f.value })}
            className={`px-3 py-1 text-xs rounded-full border cursor-pointer ${
              filter.direction === f.value
                ? 'bg-brand-500 text-white border-brand-500'
                : 'bg-swoop-panel text-swoop-text-muted border-swoop-border'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-swoop-text-label">Loading...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-swoop-text-label">No messages found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-swoop-text-muted border-b border-swoop-border">
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Direction</th>
                <th className="py-2 pr-3 font-medium">Name</th>
                <th className="py-2 pr-3 font-medium">Template</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 font-medium">Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.log_id} className="border-b border-swoop-border-inset hover:bg-swoop-row-hover">
                  <td className="py-1.5 pr-3 text-swoop-text-muted whitespace-nowrap">
                    {new Date(row.sent_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-1.5 pr-3">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                      row.direction === 'inbound' ? 'bg-purple-50 text-purple-600' :
                      row.direction === 'outbound_staff' ? 'bg-orange-50 text-orange-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>{row.direction}</span>
                  </td>
                  <td className="py-1.5 pr-3 text-swoop-text-muted whitespace-nowrap">{row.member_name || '—'}</td>
                  <td className="py-1.5 pr-3 font-mono text-swoop-text-muted">{row.template_id || '—'}</td>
                  <td className={`py-1.5 pr-3 font-medium ${STATUS_COLORS[row.status] || 'text-swoop-text-muted'}`}>{row.status}</td>
                  <td className="py-1.5 text-swoop-text-muted max-w-xs truncate">{row.body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => { const p = page - 1; setPage(p); load(p); }}
          disabled={page === 0 || loading}
          className="px-3 py-1 text-xs rounded border border-swoop-border disabled:opacity-40 cursor-pointer bg-swoop-panel text-swoop-text-muted"
        >
          Prev
        </button>
        <span className="text-xs text-swoop-text-muted self-center">Page {page + 1}</span>
        <button
          onClick={() => { const p = page + 1; setPage(p); load(p); }}
          disabled={!hasMore || loading}
          className="px-3 py-1 text-xs rounded border border-swoop-border disabled:opacity-40 cursor-pointer bg-swoop-panel text-swoop-text-muted"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 5: Consent Setup
// ---------------------------------------------------------------------------

function ConsentSection({ clubId }) {
  const [mode, setMode] = useState('membership_agreement');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    apiFetch(`/api/sms/config?clubId=${clubId}`)
      .then(d => setStats(d.stats))
      .catch(() => {});
  }, [clubId]);

  async function runConsent() {
    setRunning(true);
    setResult(null);
    setError(null);
    try {
      const data = await apiFetch('/api/sms/bulk-consent', {
        method: 'POST',
        body: JSON.stringify({ mode, clubId }),
      });
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'Have phone', value: stats.has_phone },
            { label: 'Opted in', value: stats.opted_in },
            { label: 'Not yet opted in', value: Math.max(0, stats.has_phone - stats.opted_in) },
          ].map(s => (
            <div key={s.label} className="rounded-lg bg-swoop-row border border-swoop-border p-3">
              <p className="text-xs text-swoop-text-muted mb-1">{s.label}</p>
              <p className="text-lg font-bold text-swoop-text">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Consent Approach</p>
        {[
          {
            value: 'membership_agreement',
            label: 'Membership Agreement (Recommended)',
            description: 'Confirm that your membership agreement covers club communications via text. All members with phone numbers will be marked as opted in. STOP opt-outs are always honored.',
          },
          {
            value: 'welcome_text',
            label: 'Send Welcome Text',
            description: 'Send a welcome text to all members with phones who have not yet been contacted. Members reply YES to opt in. Lower initial reach, highest legal certainty.',
          },
        ].map(opt => (
          <label key={opt.value} className="flex gap-3 cursor-pointer border border-swoop-border rounded-lg p-3 hover:bg-swoop-row-hover">
            <input
              type="radio"
              name="consent_mode"
              value={opt.value}
              checked={mode === opt.value}
              onChange={() => setMode(opt.value)}
              className="mt-0.5 cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-swoop-text">{opt.label}</p>
              <p className="text-xs text-swoop-text-muted mt-0.5">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>

      {mode === 'membership_agreement' && (
        <p className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded p-2">
          By clicking below, you confirm that your club's membership agreement includes consent for member communications via phone, email, and text.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={runConsent}
          disabled={running}
          className="px-4 py-2 text-sm font-semibold rounded bg-brand-500 text-white hover:bg-brand-600 cursor-pointer border-none disabled:opacity-50"
        >
          {running
            ? (mode === 'welcome_text' ? 'Sending texts...' : 'Processing...')
            : (mode === 'welcome_text' ? 'Send Welcome Texts' : 'Confirm & Opt In Members')}
        </button>
      </div>

      {result && (
        <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded p-3">
          {mode === 'membership_agreement'
            ? `Done. ${result.opted_in} members opted in.`
            : `Done. ${result.sent} texts sent, ${result.failed} failed.`}
        </div>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

export default function SmsMessagingPanel({ clubId }) {
  if (!clubId) return <p className="text-sm text-swoop-text-muted">Select a club first.</p>;

  return (
    <div className="flex flex-col gap-3">
      <Section title="Status & Configuration" defaultOpen={true}>
        <StatusSection clubId={clubId} />
      </Section>
      <Section title="Staff Alert Routing">
        <StaffSection clubId={clubId} />
      </Section>
      <Section title="Message Templates">
        <TemplatesSection clubId={clubId} />
      </Section>
      <Section title="Message Log">
        <LogSection clubId={clubId} />
      </Section>
      <Section title="Consent Setup">
        <ConsentSection clubId={clubId} />
      </Section>
    </div>
  );
}
