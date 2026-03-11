import { Panel, ConnectedSystems } from '@/components/ui';
import { useNavigation } from '@/hooks/useNavigation';
import { theme } from '@/config/theme';

const SCENARIOS = [
  {
    title: 'This Morning — See It',
    icon: '☀️', color: theme.colors.accent,
    description: 'It is 7:15 AM. What does your GM see? Open the Daily Briefing and walk through the three priorities.',
    steps: ['Daily Briefing → Today mode', 'Review James Whitfield alert (6-day unresolved complaint)', 'Check wind advisory impact on afternoon tee times', 'See 2 at-risk members with tee times today'],
  },
  {
    title: 'Taking Action — Fix It',
    icon: '⚡', color: theme.colors.success,
    description: 'The AI agents have recommendations ready. Approve, assign, and send recovery outreach via Swoop app.',
    steps: ['Agent Command → review pending actions', 'Approve GM call to James Whitfield', 'Assign extra Grill Room server for wind day', 'Send personalized check-in to at-risk members via Swoop app'],
  },
  {
    title: '30 Days Later — Prove It',
    icon: '📊', color: theme.colors.pipeline,
    description: 'Show the board what was prevented: members saved, revenue protected, and service failures caught before members felt them.',
    steps: ['Recent Interventions → 3 saves this week', 'Member Health → James Whitfield score 42 → 67', 'Staffing → Friday gaps eliminated, avg check held at 7', 'Revenue → 68K in annual dues protected'],
  },
  {
    title: 'The Data Moat',
    icon: '🌐', color: theme.colors.warning,
    description: 'Why Swoop sees what no single system can. Two layers of intelligence from 28 integrations + the Swoop member app.',
    steps: ['Integrations → Two-Layer Diagram', 'GPS data: members leaving after 9 holes', 'Cross-system: tee sheet pace → dining conversion', 'Health scores combining 6+ signal sources'],
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

        {/* Connected Systems status */}
        <div>
          <div style={{ fontSize: theme.fontSize.md, fontWeight: 600, color: theme.colors.textPrimary,
            marginBottom: theme.spacing.md }}>Live Connections (Simulated)</div>
          <ConnectedSystems />
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
