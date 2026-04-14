import { theme } from '@/config/theme';
import { SectionShell, Card } from '@/landing/ui';

const narrativeBlocks = [
  {
    time: 'The Morning',
    agents: 'Member Pulse · Chief of Staff',
    headline: 'Before you open your laptop, your morning briefing is ready.',
    story: 'Overnight, the agent reviewed every signal across your systems: tee times booked, complaints filed, staffing gaps, weather changes, health score drops. It assembled a prioritized action plan ranked by dollars at risk. Three cards. Three decisions. Your entire morning triaged in 90 seconds.',
    callout: '$18K dues at risk. Call James Whitfield before 10:15 AM.',
  },
  {
    time: 'The Watch',
    agents: 'Member Pulse · Service Recovery',
    headline: 'The complaint was filed Tuesday. By Thursday, the agent escalated it.',
    story: 'Member Pulse monitors every health score and flags the moment a member\'s behavior crosses a threshold. Service Recovery tracks every complaint and escalates when resolution windows are breached. Together, they caught the complaint, connected it to a dining drop-off, and surfaced a coordinated recovery action before anyone on staff noticed the pattern.',
    callout: 'Complaint aging 6 days · dining visits ↓40% · tee time 9:20 AM today.',
  },
  {
    time: 'The Revenue',
    agents: 'Revenue Analyst · Demand Optimizer',
    headline: 'Tuesday twilight slots were 42% empty. Now they\'re 68% full.',
    story: 'Revenue Analyst identified the pattern: Tuesday PM fill rates were dragging, but waitlist members had a 72% historical conversion rate for that window. Demand Optimizer routed them a targeted offer. The slot filled. The F&B team got a heads-up. The incremental revenue was $780 that week.',
    callout: '+$780 this week · 4 at-risk members converted · F&B prep adjusted.',
  },
  {
    time: 'The Floor',
    agents: 'Labor Optimizer · Engagement Autopilot',
    headline: 'Two servers called out. The agent redeployed before the lunch rush.',
    story: 'Labor Optimizer cross-references your staffing schedule with tee sheet density, weather forecasts, and complaint history. When a gap appears in a window where at-risk members are booked, it doesn\'t just flag it — it recommends which floater to move, which outlet to prioritize, and which server to assign to the high-value tables.',
    callout: 'Grill Room short 2 servers · banquet floater redeployed · 3 VIP tables covered.',
  },
];

export default function AgentRevealSection() {
  return (
    <SectionShell
      band="dark"
      eyebrow="YOU HAVE A 300-MEMBER CLUB AND A 12-PERSON STAFF."
      title="Now you have a team that never sleeps."
      subtitle="Six specialized agents monitor your operations continuously. They surface what matters, recommend what to do, and learn what works. You approve. They execute."
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: 24,
          marginBottom: 56,
        }}
      >
        {narrativeBlocks.map((block) => (
          <div
            key={block.time}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 20,
              padding: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: theme.colors.brass || '#B5956A', margin: '0 0 4px' }}>
                {block.time}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.40)', margin: 0, letterSpacing: '0.02em' }}>
                {block.agents}
              </p>
            </div>
            <h3
              style={{
                fontFamily: theme.fonts.serif,
                fontSize: 'clamp(17px, 1.6vw, 20px)',
                fontWeight: 700,
                color: '#FFFFFF',
                margin: 0,
                lineHeight: 1.35,
              }}
            >
              {block.headline}
            </h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
              {block.story}
            </p>
            <div
              style={{
                background: 'rgba(181,149,106,0.10)',
                border: '1px solid rgba(181,149,106,0.25)',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: 13,
                fontFamily: theme.fonts.mono,
                color: theme.colors.brass || '#B5956A',
                lineHeight: 1.5,
              }}
            >
              {block.callout}
            </div>
          </div>
        ))}
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: 18,
          fontStyle: 'italic',
          color: 'rgba(255,255,255,0.70)',
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        "Every agent proposes. You decide. The outcome is tracked.{' '}
        <strong style={{ color: '#FFFFFF', fontStyle: 'normal' }}>The model gets smarter.</strong>"
      </p>
    </SectionShell>
  );
}
