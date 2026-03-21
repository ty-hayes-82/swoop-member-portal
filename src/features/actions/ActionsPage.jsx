import { useState, useEffect, useMemo } from 'react';
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

// Recommendation 1: Merge Outreach + Playbooks into single "Playbooks" tab
// Recommendation 3: Actions summary only shows on Inbox tab
const TABS = [
  { key: 'inbox',     label: 'Inbox' },
  { key: 'playbooks', label: 'Playbooks' },
  { key: 'agents',    label: 'AI Agents' },
  { key: 'history',   label: 'History' },
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

// Recommendation 4: Action Library as a prominent section
function ActionLibrarySection() {
  const [expanded, setExpanded] = useState(false);
  const categories = [
    {
      name: 'Personal Touch', color: '#2563eb', actions: [
        { name: 'GM Personal Call', channel: 'Phone', timing: 'Within 48hrs of health drop', effectiveness: '95% retention when score < 30' },
        { name: 'Concierge Check-In', channel: 'In-person', timing: 'Next visit', effectiveness: '78% re-engagement rate' },
        { name: 'Birthday/Anniversary Outreach', channel: 'Email + Front Desk Flag', timing: 'Day-of', effectiveness: '22% higher satisfaction scores' },
      ],
    },
    {
      name: 'Social & Community', color: '#7c3aed', actions: [
        { name: 'Complimentary Guest Pass', channel: 'Email', timing: 'Within 7 days of decline', effectiveness: '3.2x visit frequency boost' },
        { name: 'Introduce to Other Members', channel: 'In-person', timing: 'Next visit', effectiveness: '91% renewal for multi-connection members' },
        { name: 'VIP / Exclusive Event Invite', channel: 'Email + SMS', timing: '14 days before event', effectiveness: '84% attendance, 96% renewal' },
        { name: 'Family & Kids Event Invite', channel: 'Email', timing: '21 days before event', effectiveness: 'Household renewal +18%' },
      ],
    },
    {
      name: 'Re-Engagement', color: '#ea580c', actions: [
        { name: 'Reserve a Preferred Tee Time', channel: 'SMS', timing: 'When preferred slot opens', effectiveness: '68% booking conversion' },
        { name: 'Complimentary Lesson or Clinic', channel: 'Email + Pro Shop', timing: 'Within 14 days of golf decline', effectiveness: '45% round frequency recovery' },
        { name: 'Trigger Win-Back Campaign', channel: 'Email sequence (3-touch)', timing: 'After 30 days of inactivity', effectiveness: '31% re-activation rate' },
      ],
    },
    {
      name: 'Service Recovery', color: '#dc2626', actions: [
        { name: 'Complimentary Round', channel: 'Email + Pro Shop', timing: 'Within 24hrs of complaint', effectiveness: '89% complaint resolution satisfaction' },
        { name: 'Dining Credit', channel: 'Email + POS Flag', timing: 'Within 24hrs', effectiveness: '74% post-recovery dining visit' },
        { name: 'Pro Shop Credit', channel: 'Email + Pro Shop', timing: 'Within 48hrs', effectiveness: '62% spend recovery' },
      ],
    },
    {
      name: 'Milestones & Celebrations', color: '#16a34a', actions: [
        { name: 'Membership Anniversary Celebration', channel: 'Email + Front Desk + Dining', timing: 'Anniversary week', effectiveness: '96% renewal rate for celebrated members' },
        { name: 'Achievement Recognition', channel: 'In-person + Social Media', timing: 'Same day', effectiveness: 'Social sharing drives 2.1x referrals' },
      ],
    },
  ];

  return (
    <div style={{
      border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md,
      background: theme.colors.bgCard, overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', padding: theme.spacing.md,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: theme.colors.bgDeep, border: 'none', cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${theme.colors.border}` : 'none',
        }}
      >
        <div>
          <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, color: theme.colors.textPrimary, textAlign: 'left' }}>
            Action Library — {categories.reduce((sum, c) => sum + c.actions.length, 0)} actions across {categories.length} categories
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textAlign: 'left', marginTop: 2 }}>
            Browse all available intervention actions with channel, timing, and effectiveness data.
          </div>
        </div>
        <span style={{ fontSize: '14px', color: theme.colors.textMuted, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {categories.map(cat => (
            <div key={cat.name}>
              <div style={{
                fontSize: theme.fontSize.xs, fontWeight: 700, textTransform: 'uppercase',
                letterSpacing: '0.06em', color: cat.color, marginBottom: 8,
              }}>{cat.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cat.actions.map(action => (
                  <div key={action.name} style={{
                    padding: '8px 12px', borderRadius: theme.radius.sm,
                    border: `1px solid ${theme.colors.border}`, background: theme.colors.bg,
                    display: 'grid', gridTemplateColumns: '1.5fr 0.8fr 1fr 1.2fr', gap: 8, alignItems: 'center',
                    fontSize: theme.fontSize.xs,
                  }}>
                    <div style={{ fontWeight: 600, color: theme.colors.textPrimary }}>{action.name}</div>
                    <div style={{ color: theme.colors.info, fontWeight: 500 }}>{action.channel}</div>
                    <div style={{ color: theme.colors.textMuted }}>{action.timing}</div>
                    <div style={{ color: theme.colors.success, fontWeight: 500, fontSize: '11px' }}>{action.effectiveness}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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
    const match = (a.impactMetric || '').match(/\$[\d,]+/);
    if (match) return sum + Number(match[0].replace(/[$,]/g, ''));
    return sum;
  }, 0);

  const stats = [
    { label: 'Active Playbooks', value: '7', sub: 'of 13 templates' },
    { label: 'Actions Approved', value: String(approved.length), sub: `${approvalRate}% approval rate` },
    { label: 'Pending Review', value: String(pending.length), sub: 'awaiting GM decision' },
    { label: 'Est. Impact', value: cumulativeImpact > 0 ? `$${cumulativeImpact.toLocaleString()}` : '$168K', sub: 'cumulative protected', tooltip: true },
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
                <span>{pendingAgentCount} actions ready for review</span>
                <MetricSeparator />
                <span>{summary.approved} approved / {summary.dismissed} dismissed today</span>
              </div>
            </div>
            <div onClick={() => setActiveTab('agents')} style={{ textAlign: 'right', minWidth: 220, cursor: 'pointer' }} role="button" title="View AI Agents">
              <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Impact summary →</div>
              <div style={{ fontFamily: theme.fonts.mono, fontWeight: 700, color: theme.colors.agentCyan, fontSize: theme.fontSize.md, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' }}>
                <span>{summary.active} agents active</span>
                <MetricSeparator />
                <span>{summary.total} agents deployed</span>
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
            placeholder="Search actions, playbooks, agents..."
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
        {activeTab === 'inbox' && <InboxTab searchTerm={searchTerm} />}

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
              <div>
                <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm }}>
                  Action Library
                </div>
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
                  All available intervention actions with channel, timing, and effectiveness data. Use these to build archetype playbooks and response plans.
                </div>
                <ActionLibrarySection />
              </div>
            )}
          </div>
        )}

        {activeTab === 'agents' && <AgentsTab searchTerm={searchTerm} />}
        {activeTab === 'history' && <HistoryTab searchTerm={searchTerm} />}
      </div>
    </PageTransition>
  );
}
