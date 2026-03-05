import { Panel } from '@/components/ui';
import { useNavigation } from '@/hooks/useNavigation';
import { theme } from '@/config/theme';
import Integrations from './Integrations';

const SCENARIOS = [
  {
    title: '"Bad Day" Scenario',
    icon: '📉', color: theme.colors.warning,
    description: 'Trace why January 16th underperformed — from understaffing to revenue impact.',
    steps: ['Operations → Daily Revenue', 'Click Jan 16 understaffed marker', 'Staffing & Service → Staffing Impact', 'Activate Staffing Gap Prevention playbook'],
  },
  {
    title: '"Churn Risk" Scenario',
    icon: '⚠️', color: theme.colors.urgent,
    description: 'The mbr_203 story: how an active member goes from complaint to resignation in 4 days.',
    steps: ['Member Retention → Health Overview', 'Find mbr_203 in risk table', 'Staffing & Service → Service Quality', 'Activate Service Save Protocol'],
  },
  {
    title: '"Hidden Revenue" Scenario',
    icon: '💰', color: theme.colors.success,
    description: 'Slow rounds are silently costing $5,760/month in lost dining. Show the math.',
    steps: ['Operations → Pace of Play', 'Review slow round rate (28%)', 'See F&B impact inline', 'Activate Slow Saturday Recovery'],
  },
  {
    title: '"Pipeline" Scenario',
    icon: '🎯', color: theme.colors.pipeline,
    description: 'An $18K membership is hiding in guest data. One name, one conversation.',
    steps: ['Growth Pipeline', 'Expand David Chen lead card', 'Review 92% conversion score', 'Discuss sponsor-led outreach'],
  },
];

const PERSONAS = [
  { title: 'The GM Path', icon: '⌘', color: theme.colors.operations,
    description: 'Operational focus — daily revenue, staffing, pace.',
    path: ['Operations', 'Staffing & Service', 'Member Retention'] },
  { title: 'The Board Path', icon: '◎', color: theme.colors.members,
    description: 'Strategic focus — retention risk, pipeline, ROI.',
    path: ['Member Retention', 'Growth Pipeline', 'All playbooks'] },
];

export default function DemoMode() {
  const { navigate } = useNavigation();

  return (
    <Panel
      title="Demo Mode"
      subtitle="Guided walkthroughs for sales demos and investor pitches"
      accentColor={theme.colors.fb}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xl }}>
        {/* Scenarios */}
        <div>
          <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md }}>Preset Demo Scenarios</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
            {SCENARIOS.map(s => (
              <div key={s.title} style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`, padding: theme.spacing.md }}>
                <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.sm }}>
                  <span style={{ fontSize: 24 }}>{s.icon}</span>
                  <span style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary }}>
                    {s.title}
                  </span>
                </div>
                <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary,
                  margin: `0 0 ${theme.spacing.md}`, lineHeight: 1.5 }}>{s.description}</p>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  {s.steps.map((step, i) => (
                    <li key={i} style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
                      marginBottom: 3 }}>{step}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer personas */}
        <div>
          <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md }}>Quick-Start by Buyer Persona</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.md }}>
            {PERSONAS.map(p => (
              <div key={p.title} style={{ background: theme.colors.bgCardHover, borderRadius: theme.radius.md,
                border: `1px solid ${p.color}40`, padding: theme.spacing.md }}>
                <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center', marginBottom: theme.spacing.sm }}>
                  <span style={{ fontSize: 20, color: p.color }}>{p.icon}</span>
                  <span style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: p.color }}>{p.title}</span>
                </div>
                <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary,
                  margin: `0 0 ${theme.spacing.sm}`, lineHeight: 1.5 }}>{p.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {p.path.map((step, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                      <span style={{ color: p.color }}>{i + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations — answers "how does it connect?" */}
        <div>
          <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md }}>System Integrations</div>
          <Integrations />
        </div>

        {/* Closing question */}
        <div style={{ padding: theme.spacing.lg, background: `${theme.colors.fb}12`,
          border: `1px solid ${theme.colors.fb}40`, borderRadius: theme.radius.md,
          textAlign: 'center' }}>
          <div style={{ fontSize: theme.fontSize.lg, fontFamily: theme.fonts.serif,
            color: theme.colors.textPrimary, lineHeight: 1.4 }}>
            "Which of these insights could you get today<br />from your current systems?"
          </div>
        </div>
      </div>
    </Panel>
  );
}
