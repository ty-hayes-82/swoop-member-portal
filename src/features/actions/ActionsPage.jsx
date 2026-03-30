import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { theme } from '@/config/theme';
import { getAgentSummary } from '@/services/agentService';
import { getIntegrationSummary } from '@/services/integrationsService';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import InboxTab from '@/features/agent-command/tabs/InboxTab';
import AgentsTab from '@/features/agent-command/tabs/AgentsTab';
import PlaybooksPage from '@/features/playbooks/PlaybooksPage';
import MemberPlaybooks from '@/features/member-health/MemberPlaybooks';
import { OutreachPlaybooks } from '@/features/outreach-playbooks';
import PageTransition from '@/components/ui/PageTransition';
import { AgentActionCard } from '@/components/ui';
import TeamWorkloadPanel from '@/components/ui/TeamWorkloadPanel';

// MVP: 2 tabs only — Inbox (manual approval queue) + Templates (playbook library)
// AI Agents and History tabs deferred to post-pilot
const TABS = [
  { key: 'inbox',     label: 'Inbox' },
  { key: 'playbooks', label: 'Templates' },
];

function ActionsBadge() {
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: '999px',
        border: `1px solid ${theme.colors.agentCyan}44`,
        background: `${theme.colors.agentCyan}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, color: theme.colors.agentCyan, fontSize: theme.fontSize.sm,
      }}
      aria-hidden="true"
    >
      ⚡
    </div>
  );
}

function MetricSeparator() {
  return (
    <span aria-hidden="true" style={{
      width: 6, height: 6, borderRadius: '50%', background: theme.colors.border,
      opacity: 0.7, display: 'inline-flex', flexShrink: 0,
    }} />
  );
}

// Recommendation 5: History tab with outcome/status indicators
function HistoryTab({ searchTerm }) {
  const { inbox } = useApp();
  const completedActions = useMemo(() => {
    let items = inbox.filter(i => i.status === 'approved' || i.status === 'dismissed');
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      items = items.filter(i => (i.description || '').toLowerCase().includes(q) || (i.source || '').toLowerCase().includes(q));
    }
    return items.sort((a, b) => new Date(b.approvedAt || b.dismissedAt || b.timestamp) - new Date(a.approvedAt || a.dismissedAt || a.timestamp));
  }, [inbox, searchTerm]);

  if (completedActions.length === 0) {
    return (
      <div style={{ padding: theme.spacing.xl, textAlign: 'center', color: theme.colors.textMuted, fontSize: theme.fontSize.sm }}>
        No completed actions yet. Approved and dismissed actions will appear here.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {completedActions.length} completed action{completedActions.length !== 1 ? 's' : ''}
      </div>
      {completedActions.map(action => {
        // Recommendation 5: Compute outcome status
        const isApproved = action.status === 'approved';
        const outcomeStatus = isApproved
          ? (action.outcomeNote || getSimulatedOutcome(action))
          : null;

        return (
          <div key={action.id} style={{
            background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
            borderLeft: `3px solid ${isApproved ? theme.colors.success500 : theme.colors.danger500}`,
            padding: theme.spacing.md, opacity: 0.9,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                  background: isApproved ? `${theme.colors.success500}1F` : `${theme.colors.danger500}1F`,
                  color: isApproved ? theme.colors.success500 : theme.colors.danger500,
                  textTransform: 'uppercase',
                }}>
                  {action.status}
                </span>
                <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{action.source}</span>
              </div>
              <span style={{ fontSize: '11px', fontFamily: theme.fonts.mono, color: theme.colors.textMuted }}>
                {new Date(action.approvedAt || action.dismissedAt || action.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            </div>
            <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, marginBottom: 4 }}>
              {action.description}
            </div>
            <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
              {action.impactMetric}
            </div>
            {action.approvalAction && (
              <div style={{ marginTop: 8, fontSize: '11px', color: theme.colors.success700, background: `${theme.colors.success500}0A`, padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                {action.approvalAction}
              </div>
            )}
            {action.dismissalReason && action.dismissalReason !== 'No reason provided' && (
              <div style={{ marginTop: 8, fontSize: '11px', color: theme.colors.danger700, background: `${theme.colors.danger500}0A`, padding: '4px 8px', borderRadius: 4, display: 'inline-block' }}>
                Reason: {action.dismissalReason}
              </div>
            )}
            {/* Recommendation 5: Outcome indicator */}
            {isApproved && outcomeStatus && (
              <div style={{
                marginTop: 8, padding: '6px 10px', borderRadius: theme.radius.sm,
                background: outcomeStatus.positive ? `${theme.colors.success}08` : `${theme.colors.accent}08`,
                border: `1px solid ${outcomeStatus.positive ? theme.colors.success + '20' : theme.colors.accent + '20'}`,
                fontSize: '11px', color: outcomeStatus.positive ? theme.colors.success : theme.colors.accent,
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{outcomeStatus.positive ? '✓' : '◎'}</span>
                {outcomeStatus.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simulated outcome status for demo — in production this comes from intervention tracking
function getSimulatedOutcome(action) {
  const desc = (action.description || '').toLowerCase();
  if (desc.includes('call') || desc.includes('outreach')) {
    return { text: 'Member re-engaged within 14 days', positive: true };
  }
  if (desc.includes('comp') || desc.includes('credit')) {
    return { text: 'Comp redeemed — monitoring for re-engagement', positive: true };
  }
  if (desc.includes('email') || desc.includes('send')) {
    return { text: 'Email delivered — open rate tracking active', positive: false };
  }
  if (desc.includes('route') || desc.includes('tee')) {
    return { text: 'Tee time booked — member confirmed', positive: true };
  }
  return { text: 'Pending execution — awaiting staff action', positive: false };
}

// Recommendation 2: Contextual guide links for playbook sections
function ContextualGuide({ section }) {
  const [expanded, setExpanded] = useState(false);
  const guides = {
    'archetype': { flow: '01', persona: 'Sarah (GM)', title: 'Detect & Act on Attrition Risk', steps: ['Member health drops below threshold', 'Archetype-specific playbook activates', 'GM reviews and approves outreach', 'Staff executes personalized action', 'Outcome tracked in Activity History'] },
    'response': { flow: '05', persona: 'Sarah (GM)', title: 'Service Failure Crisis Response', steps: ['Complaint detected from POS/feedback', 'Service Save Protocol triggers', 'GM receives priority alert', 'Personal call + comp offer within 2 hours', 'Member save documented in Board Report'] },
    'templates': { flow: '02', persona: 'Lisa (Membership Director)', title: 'Understand & Nurture New Members', steps: ['New member flagged at 30-day mark', '90-Day Integration playbook activates', 'Welcome sequence: match, invite, touch', 'Engagement pulse at 60 and 90 days', 'Health score baseline established'] },
  };
  const guide = guides[section];
  if (!guide) return null;

  return (
    <div style={{ marginBottom: theme.spacing.md }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          fontSize: theme.fontSize.xs, color: theme.colors.textMuted, background: 'none',
          border: 'none', cursor: 'pointer', padding: '4px 0',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        📖 See this in action — {guide.persona}: {guide.title} {expanded ? '▲' : '▼'}
      </button>
      {expanded && (
        <div style={{
          marginTop: 8, padding: '12px 16px', borderRadius: theme.radius.md,
          background: `${theme.colors.accent}04`, border: `1px solid ${theme.colors.accent}15`,
        }}>
          <div style={{ fontSize: theme.fontSize.xs, fontWeight: 700, color: theme.colors.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Flow {guide.flow}: {guide.title}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {guide.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: theme.fontSize.xs }}>
                <span style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: `${theme.colors.accent}15`, color: theme.colors.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', fontWeight: 700,
                }}>{i + 1}</span>
                <span style={{ color: theme.colors.textSecondary, lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Action Library constants ---
const AL_CHANNELS = ['Phone', 'Email', 'SMS', 'In-person', 'Email + SMS', 'Email + Pro Shop', 'Email + POS Flag', 'Email + Front Desk Flag', 'Email + Front Desk + Dining', 'In-person + Social Media', 'Email sequence (3-touch)'];
const AL_OWNERS = ['GM', 'Club Manager', 'Membership Director', 'Head Golf Professional', 'Events Director', 'F&B Director'];
const AL_EFFORTS = ['low', 'medium', 'high'];
const AL_ARCHETYPE_OPTIONS = ['all', 'Die-Hard Golfer', 'Social Butterfly', 'Balanced Active', 'Weekend Warrior', 'Declining', 'New Member', 'Ghost', 'Snowbird'];
const AL_TRIGGER_FIELDS = ['Health Score', 'Rounds (last 30d)', 'Days Since Last Visit', 'Days Since Last Activity', 'Membership Tenure (days)', 'Rounds Trend (30d)', 'Birthday', 'Anniversary', 'Event Proximity (days)', 'Complaint Filed', 'F&B Complaint', 'Course Complaint', 'Preferred Time Available'];
const AL_TRIGGER_OPS = ['<', '>', '=', '<=', '>=', 'within'];

const AL_INITIAL_CATEGORIES = [
  {
    key: 'personal-touch', name: 'Personal Touch', color: '#2563eb',
    actions: [
      { id: 'gm-call', name: 'GM Personal Call', channel: 'Phone', timing: 'Within 48hrs of health drop', owner: 'GM', effort: 'medium', archetypes: ['all'], active: true, description: 'Direct call from the GM to check in, address concerns, or simply reinforce the relationship.', triggers: [{ field: 'Health Score', op: '<', value: '30' }] },
      { id: 'concierge', name: 'Concierge Check-In', channel: 'In-person', timing: 'Next visit', owner: 'Club Manager', effort: 'low', archetypes: ['all'], active: true, description: 'Personal outreach from the concierge or club manager \u2014 a warm check-in call or handwritten note.', triggers: [{ field: 'Days Since Last Visit', op: '>', value: '21' }] },
      { id: 'birthday', name: 'Birthday/Anniversary Outreach', channel: 'Email + Front Desk Flag', timing: 'Day-of', owner: 'Membership Director', effort: 'low', archetypes: ['all'], active: true, description: 'Flag approaching milestones and schedule a celebration touch \u2014 complimentary dinner, cake, or a personal card from the GM.', triggers: [{ field: 'Birthday', op: 'within', value: '7 days' }] },
    ],
  },
  {
    key: 'social-community', name: 'Social & Community', color: '#7c3aed',
    actions: [
      { id: 'guest-pass', name: 'Complimentary Guest Pass', channel: 'Email', timing: 'Within 7 days of decline', owner: 'Membership Director', effort: 'low', archetypes: ['all'], active: true, description: 'Offer a guest pass to encourage the member to bring a friend and re-engage.', triggers: [{ field: 'Rounds (last 30d)', op: '<', value: '2' }, { field: 'Health Score', op: '<', value: '50' }] },
      { id: 'member-intro', name: 'Introduce to Other Members', channel: 'In-person', timing: 'Next visit', owner: 'Membership Director', effort: 'low', archetypes: ['New Member', 'Social Butterfly', 'Snowbird'], active: true, description: 'Connect the member with others who share similar interests.', triggers: [{ field: 'Membership Tenure (days)', op: '<', value: '90' }] },
      { id: 'vip-event', name: 'VIP / Exclusive Event Invite', channel: 'Email + SMS', timing: '14 days before event', owner: 'Events Director', effort: 'low', archetypes: ['all'], active: true, description: 'Invite to a members-only wine dinner, pro-am event, or exclusive tournament.', triggers: [{ field: 'Event Proximity (days)', op: '<', value: '14' }] },
      { id: 'family-invite', name: 'Family & Kids Event Invite', channel: 'Email', timing: '21 days before event', owner: 'Events Director', effort: 'low', archetypes: ['Social Butterfly', 'Balanced Active', 'New Member'], active: true, description: 'Invite the member and their family to an upcoming family event, kids clinic, or themed dinner night.', triggers: null },
    ],
  },
  {
    key: 're-engagement', name: 'Re-Engagement', color: '#ea580c',
    actions: [
      { id: 'tee-time', name: 'Reserve a Preferred Tee Time', channel: 'SMS', timing: 'When preferred slot opens', owner: 'Head Golf Professional', effort: 'low', archetypes: ['Die-Hard Golfer', 'Weekend Warrior'], active: true, description: 'Proactively hold a prime weekend tee time and send a "we saved this for you" message.', triggers: [{ field: 'Rounds (last 30d)', op: '<', value: '3' }, { field: 'Preferred Time Available', op: '=', value: 'true' }] },
      { id: 'lesson', name: 'Complimentary Lesson or Clinic', channel: 'Email + Pro Shop', timing: 'Within 14 days of golf decline', owner: 'Head Golf Professional', effort: 'medium', archetypes: ['Die-Hard Golfer', 'Weekend Warrior', 'New Member'], active: true, description: 'Offer a free lesson with the pro or invite to an upcoming golf clinic.', triggers: [{ field: 'Rounds Trend (30d)', op: '<', value: '-30%' }] },
      { id: 'win-back', name: 'Trigger Win-Back Campaign', channel: 'Email sequence (3-touch)', timing: 'After 30 days of inactivity', owner: 'Membership Director', effort: 'high', archetypes: ['Declining', 'Ghost'], active: true, description: 'A multi-touch sequence (personal note, call, in-person invite, gift) that runs automatically over 2\u20133 weeks.', triggers: [{ field: 'Days Since Last Activity', op: '>', value: '30' }] },
    ],
  },
  {
    key: 'service-recovery', name: 'Service Recovery', color: '#dc2626',
    actions: [
      { id: 'comp-round', name: 'Complimentary Round', channel: 'Email + Pro Shop', timing: 'Within 24hrs of complaint', owner: 'Club Manager', effort: 'medium', archetypes: ['all'], active: true, description: 'Offer a complimentary round as a goodwill gesture after a service issue.', triggers: [{ field: 'Complaint Filed', op: '=', value: 'true' }] },
      { id: 'dining-credit', name: 'Dining Credit', channel: 'Email + POS Flag', timing: 'Within 24hrs', owner: 'Club Manager', effort: 'medium', archetypes: ['all'], active: true, description: 'Issue a dining credit to recover from a service failure in the F&B area.', triggers: [{ field: 'F&B Complaint', op: '=', value: 'true' }] },
      { id: 'pro-shop-credit', name: 'Pro Shop Credit', channel: 'Email + Pro Shop', timing: 'Within 48hrs', owner: 'Head Golf Professional', effort: 'medium', archetypes: ['all'], active: true, description: 'Issue a pro shop credit as a recovery gesture for golf operations issues.', triggers: [{ field: 'Course Complaint', op: '=', value: 'true' }] },
    ],
  },
  {
    key: 'milestones', name: 'Milestones & Celebrations', color: '#16a34a',
    actions: [
      { id: 'anniversary', name: 'Membership Anniversary Celebration', channel: 'Email + Front Desk + Dining', timing: 'Anniversary week', owner: 'Membership Director', effort: 'medium', archetypes: ['all'], active: true, description: 'Celebrate the member\'s anniversary with a multi-touch recognition \u2014 email, front desk greeting, and complimentary dessert at dining.', triggers: [{ field: 'Anniversary', op: 'within', value: '7 days' }] },
      { id: 'achievement', name: 'Achievement Recognition', channel: 'In-person + Social Media', timing: 'Same day', owner: 'Club Manager', effort: 'low', archetypes: ['all'], active: true, description: 'Recognize notable achievements \u2014 hole-in-one, tournament win, or personal best \u2014 with in-person congratulations and social media shoutout.', triggers: null },
    ],
  },
];

// --- Confirmation Dialog ---
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.colors.bgCard, borderRadius: 12, padding: '24px 28px', maxWidth: 400, width: '90%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: '13px', color: theme.colors.textSecondary, lineHeight: 1.5, marginBottom: 20 }}>{message}</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'none', border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: '#dc2626', border: 'none', color: '#fff' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// --- Action Edit/Create Modal ---
function ActionModal({ action, categoryKey, categories, onSave, onCancel, isNew }) {
  const [form, setForm] = useState(() => ({
    name: action?.name || '',
    description: action?.description || '',
    channel: action?.channel || 'Email',
    timing: action?.timing || '',
    owner: action?.owner || 'GM',
    effort: action?.effort || 'low',
    archetypes: action?.archetypes || ['all'],
    active: action?.active !== false,
    categoryKey: categoryKey || (categories[0]?.key || ''),
    triggers: action?.triggers ? action.triggers.map(t => ({ ...t })) : [],
  }));

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const toggleArchetype = (arch) => {
    setForm(prev => {
      let next = prev.archetypes.includes(arch)
        ? prev.archetypes.filter(a => a !== arch)
        : [...prev.archetypes.filter(a => a !== 'all'), arch];
      if (arch === 'all') next = ['all'];
      if (next.length === 0) next = ['all'];
      return { ...prev, archetypes: next };
    });
  };

  const addTrigger = () => setForm(prev => ({ ...prev, triggers: [...prev.triggers, { field: 'Health Score', op: '<', value: '' }] }));
  const removeTrigger = (i) => setForm(prev => ({ ...prev, triggers: prev.triggers.filter((_, idx) => idx !== i) }));
  const updateTrigger = (i, k, v) => setForm(prev => ({ ...prev, triggers: prev.triggers.map((t, idx) => idx === i ? { ...t, [k]: v } : t) }));

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave({ ...form, triggers: form.triggers.length > 0 ? form.triggers : null });
  };

  const fieldLabel = { fontSize: '11px', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 };
  const fieldInput = { width: '100%', padding: '7px 10px', fontSize: '13px', background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, borderRadius: 6, color: theme.colors.textPrimary, outline: 'none', fontFamily: theme.fonts.sans };
  const fieldSelect = { ...fieldInput, cursor: 'pointer' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', paddingTop: 60, overflowY: 'auto' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.colors.bgCard, borderRadius: 12, padding: '24px 28px', maxWidth: 560, width: '94%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: `1px solid ${theme.colors.border}`, marginBottom: 40 }}>
        <div style={{ fontSize: '17px', fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 20 }}>
          {isNew ? 'New Action' : `Edit: ${action?.name}`}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <div style={fieldLabel}>Action Name *</div>
            <input value={form.name} onChange={e => setField('name', e.target.value)} style={fieldInput} placeholder="e.g., GM Personal Call" autoFocus />
          </div>

          {/* Description */}
          <div>
            <div style={fieldLabel}>Description</div>
            <textarea value={form.description} onChange={e => setField('description', e.target.value)} rows={2} style={{ ...fieldInput, resize: 'vertical', minHeight: 48 }} placeholder="What does this action accomplish?" />
          </div>

          {/* Category (only for new) */}
          {isNew && (
            <div>
              <div style={fieldLabel}>Category</div>
              <select value={form.categoryKey} onChange={e => setField('categoryKey', e.target.value)} style={fieldSelect}>
                {categories.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Channel + Timing row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={fieldLabel}>Channel</div>
              <select value={form.channel} onChange={e => setField('channel', e.target.value)} style={fieldSelect}>
                {AL_CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
              </select>
            </div>
            <div>
              <div style={fieldLabel}>Timing</div>
              <input value={form.timing} onChange={e => setField('timing', e.target.value)} style={fieldInput} placeholder="e.g., Within 48hrs" />
            </div>
          </div>

          {/* Owner + Effort row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={fieldLabel}>Owner</div>
              <select value={form.owner} onChange={e => setField('owner', e.target.value)} style={fieldSelect}>
                {AL_OWNERS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <div style={fieldLabel}>Effort Level</div>
              <select value={form.effort} onChange={e => setField('effort', e.target.value)} style={fieldSelect}>
                {AL_EFFORTS.map(e => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Active toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setField('active', !form.active)}
              style={{
                width: 38, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', position: 'relative',
                background: form.active ? theme.colors.success500 : theme.colors.border, transition: 'background 0.15s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, width: 16, height: 16, borderRadius: '50%', background: '#fff',
                transition: 'left 0.15s', left: form.active ? 20 : 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
            <span style={{ fontSize: '13px', fontWeight: 600, color: form.active ? theme.colors.success700 : theme.colors.textMuted }}>
              {form.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          {/* Archetypes */}
          <div>
            <div style={fieldLabel}>Applicable Archetypes</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {AL_ARCHETYPE_OPTIONS.map(arch => {
                const sel = form.archetypes.includes(arch);
                return (
                  <button key={arch} onClick={() => toggleArchetype(arch)} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                    background: sel ? theme.colors.textPrimary : theme.colors.bg, color: sel ? '#fff' : theme.colors.textMuted,
                    border: `1px solid ${sel ? theme.colors.textPrimary : theme.colors.border}`, transition: 'all 0.1s',
                  }}>{arch}</button>
                );
              })}
            </div>
          </div>

          {/* Trigger Conditions */}
          <div>
            <div style={{ ...fieldLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Trigger Conditions</span>
              <button onClick={addTrigger} style={{ fontSize: '11px', fontWeight: 600, color: theme.colors.accent, background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Condition</button>
            </div>
            {form.triggers.length === 0 && (
              <div style={{ fontSize: '12px', color: theme.colors.textMuted, fontStyle: 'italic', padding: '6px 0' }}>No trigger conditions. This action will be manual only.</div>
            )}
            {form.triggers.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                {i > 0 && <div style={{ fontSize: '10px', fontWeight: 700, color: theme.colors.accent, width: 30, textAlign: 'center', flexShrink: 0 }}>AND</div>}
                {i === 0 && <div style={{ width: 30, flexShrink: 0 }} />}
                <select value={t.field} onChange={e => updateTrigger(i, 'field', e.target.value)} style={{ ...fieldSelect, flex: 2 }}>
                  {AL_TRIGGER_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select value={t.op} onChange={e => updateTrigger(i, 'op', e.target.value)} style={{ ...fieldSelect, flex: 0, width: 56 }}>
                  {AL_TRIGGER_OPS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input value={t.value} onChange={e => updateTrigger(i, 'value', e.target.value)} style={{ ...fieldInput, flex: 1 }} placeholder="Value" />
                <button onClick={() => removeTrigger(i)} aria-label="Remove condition" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px', padding: '0 4px', flexShrink: 0 }}>&times;</button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 22, paddingTop: 16, borderTop: `1px solid ${theme.colors.border}` }}>
          <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'none', border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!form.name.trim()} style={{ padding: '8px 18px', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: form.name.trim() ? theme.colors.textPrimary : theme.colors.border, border: 'none', color: '#fff', opacity: form.name.trim() ? 1 : 0.5 }}>
            {isNew ? 'Create Action' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Category Create Modal ---
function CategoryModal({ onSave, onCancel, existingKeys }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const colors = ['#2563eb', '#7c3aed', '#ea580c', '#dc2626', '#16a34a', '#0891b2', '#9333ea', '#be185d'];

  const handleSubmit = () => {
    if (!name.trim()) return;
    const key = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (existingKeys.includes(key)) return;
    onSave({ key, name: name.trim(), color, actions: [] });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)' }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: theme.colors.bgCard, borderRadius: 12, padding: '24px 28px', maxWidth: 400, width: '90%', boxShadow: '0 16px 48px rgba(0,0,0,0.18)', border: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '17px', fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 16 }}>New Category</div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 4 }}>Category Name *</div>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="e.g., Seasonal Outreach" style={{ width: '100%', padding: '7px 10px', fontSize: '13px', background: theme.colors.bg, border: `1px solid ${theme.colors.border}`, borderRadius: 6, color: theme.colors.textPrimary, outline: 'none', fontFamily: theme.fonts.sans }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 6 }}>Color</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {colors.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 24, height: 24, borderRadius: '50%', background: c, border: color === c ? '2px solid #000' : '2px solid transparent', cursor: 'pointer', padding: 0,
              }} />
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: 'none', border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim()} style={{ padding: '7px 16px', borderRadius: 8, fontSize: '13px', fontWeight: 600, cursor: 'pointer', background: name.trim() ? theme.colors.textPrimary : theme.colors.border, border: 'none', color: '#fff', opacity: name.trim() ? 1 : 0.5 }}>Create Category</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Action Library ---
function ActionLibrarySection() {
  const [categories, setCategories] = useState(AL_INITIAL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [collapsedCats, setCollapsedCats] = useState({});
  const [expandedAction, setExpandedAction] = useState(null);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Modal state
  const [editModal, setEditModal] = useState(null);   // { catKey, action } or { catKey, action: null, isNew: true }
  const [catModal, setCatModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm }

  const stickyRef = useRef(null);

  const totalActions = categories.reduce((sum, c) => sum + c.actions.length, 0);
  const activeCount = categories.reduce((sum, c) => sum + c.actions.filter(a => a.active !== false).length, 0);

  const filteredCategories = useMemo(() => {
    let cats = filter === 'all' ? categories : categories.filter(c => c.key === filter);
    if (search) {
      const q = search.toLowerCase();
      cats = cats.map(c => ({
        ...c,
        actions: c.actions.filter(a =>
          a.name.toLowerCase().includes(q) || a.channel.toLowerCase().includes(q) ||
          a.owner.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q)
        ),
      })).filter(c => c.actions.length > 0);
    }
    return cats;
  }, [categories, filter, search]);

  const toggleCat = (key) => setCollapsedCats(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAction = (id) => setExpandedAction(prev => prev === id ? null : id);

  const toggleActive = useCallback((catKey, actionId) => {
    setCategories(prev => prev.map(c => c.key === catKey
      ? { ...c, actions: c.actions.map(a => a.id === actionId ? { ...a, active: !a.active } : a) }
      : c
    ));
  }, []);

  const handleDeleteAction = (catKey, actionId, actionName) => {
    setConfirmDialog({
      title: `Delete "${actionName}"?`,
      message: 'This action will be permanently removed from the library. This cannot be undone.',
      onConfirm: () => {
        setCategories(prev => prev.map(c => c.key === catKey
          ? { ...c, actions: c.actions.filter(a => a.id !== actionId) }
          : c
        ));
        setConfirmDialog(null);
        if (expandedAction === actionId) setExpandedAction(null);
      },
    });
  };

  const handleDuplicateAction = (catKey, actionId) => {
    setCategories(prev => prev.map(c => {
      if (c.key !== catKey) return c;
      const src = c.actions.find(a => a.id === actionId);
      if (!src) return c;
      const dup = { ...src, id: src.id + '-copy-' + Date.now(), name: src.name + ' (Copy)', triggers: src.triggers ? src.triggers.map(t => ({ ...t })) : null, active: true };
      const idx = c.actions.findIndex(a => a.id === actionId);
      const newActions = [...c.actions];
      newActions.splice(idx + 1, 0, dup);
      return { ...c, actions: newActions };
    }));
  };

  const handleDeleteCategory = (catKey) => {
    const cat = categories.find(c => c.key === catKey);
    if (!cat) return;
    const count = cat.actions.length;
    setConfirmDialog({
      title: `Delete "${cat.name}"?`,
      message: `This will permanently remove the category and ${count > 0 ? `all ${count} action${count !== 1 ? 's' : ''} inside it` : 'its empty container'}. This cannot be undone.`,
      onConfirm: () => {
        setCategories(prev => prev.filter(c => c.key !== catKey));
        setConfirmDialog(null);
        if (filter === catKey) setFilter('all');
      },
    });
  };

  const handleSaveAction = (formData) => {
    const { categoryKey, ...actionData } = formData;
    const id = editModal.isNew
      ? (actionData.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()
      : editModal.action.id;

    if (editModal.isNew) {
      setCategories(prev => prev.map(c => c.key === categoryKey
        ? { ...c, actions: [...c.actions, { ...actionData, id }] }
        : c
      ));
    } else {
      setCategories(prev => prev.map(c => c.key === editModal.catKey
        ? { ...c, actions: c.actions.map(a => a.id === id ? { ...a, ...actionData } : a) }
        : c
      ));
    }
    setEditModal(null);
  };

  const handleSaveCategory = (newCat) => {
    setCategories(prev => [...prev, newCat]);
    setCatModal(false);
  };

  const effortStyles = { low: { bg: '#dcfce7', color: '#166534' }, medium: { bg: '#fef3c7', color: '#92400e' }, high: { bg: '#fecaca', color: '#991b1b' } };

  const chipBase = { padding: '5px 14px', borderRadius: 20, fontSize: '12px', fontWeight: 600, cursor: 'pointer', border: '1px solid transparent', transition: 'all 0.15s' };
  const chipActive = { background: theme.colors.textPrimary, color: '#fff', borderColor: theme.colors.textPrimary };
  const chipInactive = { background: theme.colors.bgDeep, color: theme.colors.textMuted, borderColor: theme.colors.border };

  // Higher-contrast icon buttons
  const iconBtnBase = {
    background: 'none', borderRadius: 6, cursor: 'pointer', width: 28, height: 28,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', padding: 0,
    border: `1px solid transparent`, transition: 'all 0.15s', opacity: 0,
  };
  const iconBtnVisible = { ...iconBtnBase, opacity: 1, color: '#52525B', border: `1px solid ${theme.colors.border}` };
  const iconBtnDanger = { ...iconBtnVisible, color: '#dc2626' };
  // Category-level buttons are always visible
  const catIconBtn = { background: 'none', borderRadius: 6, cursor: 'pointer', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', padding: 0, border: `1px solid ${theme.colors.border}`, color: '#52525B', transition: 'all 0.12s' };

  const GRID_COLS = '1.6fr 1.1fr 1.3fr 1fr 44px 90px';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.textPrimary }}>Action Library</div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>
            {totalActions} actions across {categories.length} categories ({activeCount} active) \u2014 click rows to see triggers & details
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setCatModal(true)} style={{ padding: '6px 14px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: 'none', border: `1px solid ${theme.colors.border}`, color: theme.colors.textSecondary }}>+ Category</button>
          <button onClick={() => setEditModal({ catKey: categories[0]?.key, action: null, isNew: true })} style={{ padding: '6px 14px', borderRadius: 8, fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: theme.colors.textPrimary, border: 'none', color: '#fff' }}>+ New Action</button>
        </div>
      </div>

      {/* Sticky search + filter bar */}
      <div ref={stickyRef} style={{ position: 'sticky', top: 0, zIndex: 20, background: theme.colors.bg, paddingBottom: 4, marginBottom: -4 }}>
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400, marginBottom: 10 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '14px', color: theme.colors.textMuted, pointerEvents: 'none' }}>&#128269;</span>
          <input
            type="text" placeholder="Search actions..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', fontSize: '13px', background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: 8, color: theme.colors.textPrimary, outline: 'none', fontFamily: theme.fonts.sans }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted, fontSize: '16px' }}>&times;</button>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span onClick={() => setFilter('all')} style={{ ...chipBase, ...(filter === 'all' ? chipActive : chipInactive) }}>All</span>
          {categories.map(c => (
            <span key={c.key} onClick={() => setFilter(c.key)} style={{ ...chipBase, ...(filter === c.key ? chipActive : chipInactive) }}>{c.name}</span>
          ))}
        </div>
      </div>

      {/* Categories */}
      {filteredCategories.map(cat => {
        const isOpen = !collapsedCats[cat.key];
        const activeInCat = cat.actions.filter(a => a.active !== false).length;
        return (
          <div key={cat.key} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: 10, background: theme.colors.bgCard, overflow: 'hidden' }}>
            {/* Category header */}
            <div
              onClick={() => toggleCat(cat.key)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '13px', color: cat.color }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cat.color, display: 'inline-block', flexShrink: 0 }} />
                {cat.name}
                <span style={{ fontWeight: 400, fontSize: '11px', color: theme.colors.textMuted, marginLeft: 4 }}>{activeInCat}/{cat.actions.length} active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); setEditModal({ catKey: cat.key, action: null, isNew: true }); }} style={catIconBtn} title="Add action to this category">+</button>
                <button onClick={e => { e.stopPropagation(); handleDeleteCategory(cat.key); }}
                  style={{ ...catIconBtn, color: '#dc2626' }}
                  title={`Remove "${cat.name}" category`}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                >&times;</button>
                <span style={{ fontSize: '12px', color: theme.colors.textMuted, marginLeft: 4, transition: 'transform 0.15s', transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)', display: 'inline-block' }}>{'\u25BC'}</span>
              </div>
            </div>

            {isOpen && (
              <>
                {/* Column headers */}
                <div style={{ display: 'grid', gridTemplateColumns: GRID_COLS, padding: '6px 14px', fontSize: '11px', fontWeight: 700, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em', borderTop: `1px solid ${theme.colors.border}`, borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.bg }}>
                  <div>Action</div><div>Channel</div><div>Timing</div><div>Owner</div><div></div><div></div>
                </div>

                {/* Action rows */}
                {cat.actions.map(action => {
                  const isExpanded = expandedAction === action.id;
                  const isHovered = hoveredRow === action.id;
                  const hasTrigger = action.triggers && action.triggers.length > 0;
                  const isActive = action.active !== false;
                  const eff = effortStyles[action.effort] || effortStyles.low;
                  const rowId = action.id;

                  return (
                    <div key={rowId}>
                      <div
                        onClick={() => toggleAction(rowId)}
                        onMouseEnter={() => setHoveredRow(rowId)}
                        onMouseLeave={() => setHoveredRow(null)}
                        style={{
                          display: 'grid', gridTemplateColumns: GRID_COLS, padding: '9px 14px',
                          fontSize: '13px', cursor: 'pointer', alignItems: 'center',
                          borderBottom: `1px solid ${theme.colors.borderLight}`,
                          background: isExpanded ? theme.colors.bg : (isHovered ? theme.colors.bg : 'transparent'),
                          transition: 'background 0.1s',
                          opacity: isActive ? 1 : 0.5,
                        }}
                      >
                        <div style={{ fontWeight: 600, color: theme.colors.textPrimary, display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                          {hasTrigger && <span style={{ color: '#f97316', fontSize: '11px', flexShrink: 0 }} title="Has trigger conditions (auto-fires)">&#9889;</span>}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.name}</span>
                          {!isActive && <span style={{ fontSize: '10px', color: theme.colors.textMuted, fontWeight: 400, flexShrink: 0 }}>(off)</span>}
                        </div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.channel}</div>
                        <div style={{ color: theme.colors.textMuted, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.timing}</div>
                        <div style={{ color: theme.colors.textSecondary, fontSize: '12px' }}>{action.owner}</div>
                        {/* Active toggle */}
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <button
                            onClick={e => { e.stopPropagation(); toggleActive(cat.key, action.id); }}
                            title={isActive ? 'Deactivate action' : 'Activate action'}
                            aria-label={isActive ? 'Deactivate action' : 'Activate action'}
                            style={{
                              width: 32, height: 17, borderRadius: 9, border: 'none', cursor: 'pointer', position: 'relative',
                              background: isActive ? theme.colors.success500 : theme.colors.border, transition: 'background 0.15s',
                            }}
                          >
                            <span style={{
                              position: 'absolute', top: 1.5, width: 14, height: 14, borderRadius: '50%', background: '#fff',
                              transition: 'left 0.15s', left: isActive ? 16 : 2, boxShadow: '0 1px 2px rgba(0,0,0,0.18)',
                            }} />
                          </button>
                        </div>
                        {/* Row action buttons — visible on hover */}
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          <button
                            onClick={e => { e.stopPropagation(); setEditModal({ catKey: cat.key, action, isNew: false }); }}
                            style={isHovered || isExpanded ? iconBtnVisible : iconBtnBase}
                            title="Edit action"
                            aria-label="Edit action"
                            onMouseEnter={e => { e.currentTarget.style.background = theme.colors.bgDeep; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                          >&#9998;</button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDuplicateAction(cat.key, action.id); }}
                            style={isHovered || isExpanded ? iconBtnVisible : iconBtnBase}
                            title="Duplicate action"
                            aria-label="Duplicate action"
                            onMouseEnter={e => { e.currentTarget.style.background = theme.colors.bgDeep; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                          >&#10697;</button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteAction(cat.key, action.id, action.name); }}
                            style={isHovered || isExpanded ? iconBtnDanger : iconBtnBase}
                            title="Delete action"
                            aria-label="Delete action"
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                          >&times;</button>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div style={{ padding: '14px 14px 16px', borderBottom: `1px solid ${theme.colors.border}`, background: theme.colors.bg }}>
                          {action.description && (
                            <div style={{ fontSize: '13px', color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 1.5 }}>{action.description}</div>
                          )}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: hasTrigger ? 14 : 0 }}>
                            <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '11px', fontWeight: 600, background: eff.bg, color: eff.color }}>{action.effort} effort</span>
                            {(action.archetypes || []).map(a => (
                              <span key={a} style={{ padding: '2px 10px', borderRadius: 12, fontSize: '11px', fontWeight: 500, background: `${theme.colors.accent}10`, color: theme.colors.textSecondary, border: `1px solid ${theme.colors.accent}20` }}>{a}</span>
                            ))}
                          </div>
                          {hasTrigger && (
                            <div style={{ padding: '10px 12px', borderRadius: 8, background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}` }}>
                              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f97316', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                &#9889; Trigger Conditions
                                <span style={{ fontWeight: 400, color: theme.colors.textMuted, textTransform: 'none', letterSpacing: 0 }}>(auto-fires when ALL conditions met)</span>
                              </div>
                              {action.triggers.map((t, i) => (
                                <div key={i}>
                                  {i > 0 && (
                                    <div style={{ margin: '4px 0', fontSize: '11px', fontWeight: 700, color: theme.colors.accent }}>AND</div>
                                  )}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', borderRadius: 6, background: theme.colors.bg, fontSize: '12px' }}>
                                    <span style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{t.field}</span>
                                    <span style={{ color: theme.colors.textMuted, fontWeight: 700 }}>{t.op}</span>
                                    <span style={{ color: theme.colors.accent, fontWeight: 600 }}>{t.value}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Quick edit link in expanded view */}
                          <button
                            onClick={e => { e.stopPropagation(); setEditModal({ catKey: cat.key, action, isNew: false }); }}
                            style={{ marginTop: 12, fontSize: '12px', fontWeight: 600, color: theme.colors.accent, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >Edit this action &rarr;</button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {cat.actions.length === 0 && (
                  <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: '12px', color: theme.colors.textMuted }}>
                    No actions yet.{' '}
                    <button onClick={() => setEditModal({ catKey: cat.key, action: null, isNew: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.accent, fontWeight: 600, fontSize: '12px' }}>Add one</button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}

      {filteredCategories.length === 0 && (
        <div style={{ padding: '24px', textAlign: 'center', fontSize: '13px', color: theme.colors.textMuted }}>
          No actions match your search.
        </div>
      )}

      {/* Modals */}
      {editModal && (
        <ActionModal
          action={editModal.action}
          categoryKey={editModal.catKey}
          categories={categories}
          isNew={editModal.isNew}
          onSave={handleSaveAction}
          onCancel={() => setEditModal(null)}
        />
      )}
      {catModal && (
        <CategoryModal
          existingKeys={categories.map(c => c.key)}
          onSave={handleSaveCategory}
          onCancel={() => setCatModal(false)}
        />
      )}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// S1: Playbook Performance Summary — aggregated stats at top of Playbooks tab
function PlaybookPerformanceSummary() {
  const { inbox } = useApp();
  const approved = inbox.filter(i => i.status === 'approved');
  const dismissed = inbox.filter(i => i.status === 'dismissed');
  const pending = inbox.filter(i => i.status === 'pending');
  const total = approved.length + dismissed.length;
  const approvalRate = total > 0 ? Math.round(approved.length / total * 100) : 0;

  // Estimate cumulative impact from approved actions
  const cumulativeImpact = approved.reduce((sum, a) => {
    const metric = a.impactMetric || '';
    // Match $XXK, $XX,XXX, $X.XK patterns
    const kMatch = metric.match(/\$([\d.]+)\s*K/i);
    if (kMatch) return sum + Number(kMatch[1]) * 1000;
    const fullMatch = metric.match(/\$([\d,]+)/);
    if (fullMatch) {
      const val = Number(fullMatch[1].replace(/,/g, ''));
      return sum + (val < 100 ? val * 1000 : val); // Assume small numbers are in thousands
    }
    return sum;
  }, 0);

  // Format as $XXK for display
  const impactDisplay = cumulativeImpact > 0
    ? (cumulativeImpact >= 1000 ? `$${Math.round(cumulativeImpact / 1000)}K` : `$${cumulativeImpact.toLocaleString()}`)
    : '$168K';

  const stats = [
    { label: 'Active Playbooks', value: '7', sub: 'of 13 templates' },
    { label: 'Actions Approved', value: String(approved.length), sub: `${approvalRate}% approval rate` },
    { label: 'Pending Review', value: String(pending.length), sub: 'awaiting GM decision' },
    { label: 'Est. Impact', value: impactDisplay, sub: 'cumulative protected', tooltip: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm }}>
      {stats.map(s => (
        <div key={s.label} style={{
          padding: '12px 14px', borderRadius: theme.radius.md,
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
        }}>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.mono, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
            {s.value}
            {/* S2: ROI methodology tooltip */}
            {s.tooltip && <ROITooltip />}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

// S2: ROI Methodology Tooltip
function ROITooltip() {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setShow(!show)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: '12px', color: theme.colors.textMuted, lineHeight: 1,
        }}
        title="How is this calculated?"
      >&#9432;</button>
      {show && (
        <div style={{
          position: 'absolute', top: '100%', left: '-100px', zIndex: 50,
          width: '280px', padding: '12px', borderRadius: theme.radius.md,
          background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: theme.fontSize.xs,
          color: theme.colors.textSecondary, lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, color: theme.colors.textPrimary, marginBottom: 6 }}>How is this calculated?</div>
          Impact estimates are based on: <strong>member annual dues</strong> for at-risk members where a playbook was activated,
          multiplied by <strong>historical save rate</strong> from Track Record data (per-playbook), weighted by
          <strong> archetype risk factor</strong> and <strong>health score at time of intervention</strong>.
          Confidence varies by data availability — clubs with 6+ months of data produce higher-confidence projections.
          <div style={{ marginTop: 8, fontSize: '10px', color: theme.colors.textMuted }}>
            Formula: dues_at_risk × save_rate × archetype_weight × (1 - score/100)
          </div>
          <button onClick={() => setShow(false)} style={{
            marginTop: 8, fontSize: '11px', color: theme.colors.accent,
            background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
          }}>Got it</button>
        </div>
      )}
    </span>
  );
}

// N2: Playbook Relationship Guide — explains the distinction, hides after first view
function PlaybookRelationshipGuide() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('swoop_playbook_guide_dismissed') === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div style={{
      padding: '10px 14px', borderRadius: theme.radius.sm,
      background: `${theme.colors.accent}04`, border: `1px solid ${theme.colors.accent}15`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
    }}>
      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.6 }}>
        <strong style={{ color: theme.colors.textPrimary }}>How these sections relate:</strong> <strong>Archetype Playbooks</strong> configure which actions
        run for each member type (Die-Hard Golfer, Ghost, etc.). <strong>Response Plans</strong> are automated multi-step protocols that trigger from
        events (complaint filed, health score drops). <strong>Playbook Templates</strong> are step-by-step guides you activate manually for specific scenarios.
        The <strong>Action Library</strong> is the full catalog of individual actions available across all playbooks.
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          try { localStorage.setItem('swoop_playbook_guide_dismissed', 'true'); } catch {}
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.colors.textMuted, fontSize: '14px', flexShrink: 0, padding: '0 4px' }}
      >×</button>
    </div>
  );
}

export default function ActionsPage() {
  const summary = getAgentSummary();
  const integrationStatus = getIntegrationSummary();
  const { pendingAgentCount } = useApp();
  const { routeIntent, clearRouteIntent } = useNavigationContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Map old 'outreach' tab intent to new 'playbooks' tab
  const [activeTab, setActiveTab] = useState(() => {
    if (routeIntent?.tab) {
      const tab = routeIntent.tab === 'outreach' ? 'playbooks' : routeIntent.tab;
      if (TABS.some((t) => t.key === tab)) return tab;
    }
    return 'inbox';
  });

  useEffect(() => {
    if (routeIntent?.tab) {
      const tab = routeIntent.tab === 'outreach' ? 'playbooks' : routeIntent.tab;
      if (TABS.some((t) => t.key === tab)) {
        setActiveTab(tab);
        clearRouteIntent();
      }
    }
  }, [routeIntent, clearRouteIntent]);

  // Recommendation 1: Sub-tab within merged Playbooks tab
  const [playbookSection, setPlaybookSection] = useState('archetype');

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

        {/* Recommendation 3: Actions summary only visible on Inbox tab */}
        {activeTab === 'inbox' && (
          <div
            style={{
              background: `${theme.colors.accent}10`, border: `1px solid ${theme.colors.accent}44`,
              borderRadius: theme.radius.lg, padding: theme.spacing.lg,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: theme.spacing.md,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <ActionsBadge />
                <span style={{ fontSize: theme.fontSize.xl, fontWeight: 700, color: theme.colors.textPrimary, fontFamily: theme.fonts.serif }}>
                  Actions
                </span>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span>{pendingAgentCount} action{pendingAgentCount !== 1 ? 's' : ''} ready for review</span>
                {(summary.approved > 0 || summary.dismissed > 0) && (
                  <>
                    <MetricSeparator />
                    <span>{summary.approved} approved / {summary.dismissed} dismissed today</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 180 }}>
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Action pipeline</div>
              <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: theme.colors.agentCyan, fontSize: theme.fontSize.md }}>
                {pendingAgentCount} pending review
              </div>
            </div>
          </div>
        )}

        {/* Contextual status for non-Inbox tabs */}
        {activeTab !== 'inbox' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: 12,
              background: integrationStatus.syncStatus === 'Healthy' ? `${theme.colors.success500}12` : `${theme.colors.warning500}12`,
              color: integrationStatus.syncStatus === 'Healthy' ? theme.colors.success500 : theme.colors.warning500,
              border: `1px solid ${integrationStatus.syncStatus === 'Healthy' ? theme.colors.success500 + '30' : theme.colors.warning500 + '30'}`,
            }}>
              Monitoring 300 members across golf, dining, events, and email {integrationStatus.syncStatus === 'Healthy' ? '— all healthy' : ''}
            </span>
          </div>
        )}

        {/* Tab switcher — 4 tabs (merged Outreach+Playbooks) */}
        <div style={{ display: 'flex', background: theme.colors.bgDeep, borderRadius: theme.radius.md, padding: '3px', border: `1px solid ${theme.colors.border}`, alignSelf: 'flex-start' }}>
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: '7px 20px', borderRadius: '8px', fontSize: theme.fontSize.sm, fontWeight: 600,
              cursor: 'pointer', border: 'none', transition: 'all 0.15s',
              background: activeTab === key ? theme.colors.bgCard : 'transparent',
              color: activeTab === key ? theme.colors.textPrimary : theme.colors.textMuted,
              boxShadow: activeTab === key ? theme.shadow.sm : 'none',
            }}>{label}{key === 'inbox' && pendingAgentCount > 0 ? ` (${pendingAgentCount})` : ''}</button>
          ))}
        </div>

        {/* S3: Search bar — visible on all tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            placeholder="Search actions and templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              flex: 1, padding: '7px 14px', fontSize: theme.fontSize.xs, fontFamily: theme.fonts.sans,
              background: theme.colors.bgDeep, border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.sm, color: theme.colors.textPrimary,
              outline: 'none', maxWidth: 320,
            }}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: theme.colors.textMuted, fontSize: '14px',
            }}>Clear</button>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'inbox' && (
          <>
            <InboxTab searchTerm={searchTerm} />
            <TeamWorkloadPanel />
          </>
        )}

        {/* Merged Playbooks tab with sub-sections */}
        {activeTab === 'playbooks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>

            {/* S1: Playbook Performance Summary */}
            <PlaybookPerformanceSummary />

            {/* Sub-section toggle */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { key: 'archetype', label: 'Archetype Playbooks', desc: 'Per-segment action configs' },
                { key: 'response', label: 'Response Plans', desc: 'Auto-triggered protocols' },
                { key: 'templates', label: 'Playbook Templates', desc: 'Step-by-step guides' },
                { key: 'library', label: 'Action Library', desc: 'All available actions' },
              ].map(sub => (
                <button
                  key={sub.key}
                  onClick={() => setPlaybookSection(sub.key)}
                  title={sub.desc}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', fontSize: theme.fontSize.xs, fontWeight: 600,
                    cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                    background: playbookSection === sub.key ? theme.colors.textPrimary : theme.colors.bgDeep,
                    color: playbookSection === sub.key ? '#fff' : theme.colors.textMuted,
                  }}
                >{sub.label}</button>
              ))}
            </div>

            {/* N2: Relationship explainer — shows once then hides */}
            <PlaybookRelationshipGuide />

            {/* Archetype Playbooks */}
            {playbookSection === 'archetype' && (
              <>
                <ContextualGuide section="archetype" />
                <div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.sm, padding: '8px 12px', background: `${theme.colors.info}06`, borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.info}15` }}>
                    Configure which actions run for each member archetype. These are the per-segment intervention playbooks that determine outreach strategy by member type.
                  </div>
                  <OutreachPlaybooks />
                </div>
              </>
            )}

            {/* Response Plans */}
            {playbookSection === 'response' && (
              <>
                <ContextualGuide section="response" />
                <div>
                  <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
                    Response Plans
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                    Automated multi-step protocols triggered by health score drops and service events. These run independently from archetype playbooks and activate when specific conditions are met.
                  </div>
                  <MemberPlaybooks />
                </div>
              </>
            )}

            {/* Playbook Templates */}
            {playbookSection === 'templates' && (
              <>
                <ContextualGuide section="templates" />
                <div>
                  <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
                    Playbook Templates
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                    Step-by-step playbooks for specific scenarios. Each template includes timing, steps, track record, and before/after KPIs. Activate a template to create a sequenced action plan for a member.
                  </div>
                  <PlaybooksPage searchTerm={searchTerm} />
                </div>
              </>
            )}

            {/* Recommendation 4: Action Library as prominent section */}
            {playbookSection === 'library' && (
              <ActionLibrarySection />
            )}
          </div>
        )}

        {/* AI Agents and History tabs deferred to post-pilot */}
      </div>
    </PageTransition>
  );
}
