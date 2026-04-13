import { theme } from '@/config/theme';
import { agents } from '@/landing/data';
import { SectionShell, Card, IconBadge } from '@/landing/ui';
import AgentsLiveDemo from './AgentsLiveDemo';

export default function AgentsSection() {
  return (
    <SectionShell
      id="agents"
      band="cream"
      eyebrow="Agents"
      title="Six AI agents working your club — live."
      subtitle="Watch what the agents surface, recommend, and protect in real time. This panel auto-cycles through real scenarios from the Swoop OS."
    >
      <AgentsLiveDemo />

      <div
        style={{
          marginTop: 64,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16,
        }}
      >
        {agents.map((agent) => (
          <Card key={agent.name} interactive padded={false} style={{ padding: 18, gap: 10, flexDirection: 'row', alignItems: 'flex-start' }}>
            <IconBadge name={agent.icon} tone="orange" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '2px 0 4px', color: theme.neutrals.ink }}>
                {agent.name}
              </h3>
              <p style={{ color: theme.colors.textSecondary, fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                {agent.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </SectionShell>
  );
}
