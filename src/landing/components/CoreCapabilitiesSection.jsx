import { theme } from '@/config/theme';
import { coreCapabilities } from '@/landing/data';
import { SectionShell, Card, IconBadge } from '@/landing/ui';

const iconMap = {
  Users: 'Users',
  Calendar: 'Calendar',
  Utensils: 'Utensils',
  UsersRound: 'UsersRound',
  DollarSign: 'DollarSign',
  Send: 'Send',
  Mail: 'Mail',
};

// Outcome metric prefixes keyed by card title substring
function getOutcomePrefix(title) {
  const t = title.toLowerCase();
  if (t.includes('drift') || t.includes('resign') || t.includes('at-risk') || t.includes('dues')) {
    return 'Avg $2,400 recovered per flag. ';
  }
  if (t.includes('tee sheet') || t.includes('slot') || t.includes('fill every')) {
    return 'Saves ~6 hrs/week of AGM time. ';
  }
  if (t.includes('morning') || t.includes('brief') || t.includes('saturday')) {
    return '0 spreadsheets. 1 brief. Every system. ';
  }
  return null;
}

export default function CoreCapabilitiesSection() {
  return (
    <SectionShell
      id="platform"
      band="cream"
      eyebrow="THE PLATFORM"
      title="Six jobs Swoop does before your GM finishes coffee."
      subtitle="Member behavior, demand, service, labor, revenue, outreach — all surfaced on one page your team can act from before the first tee time."
    >
      <style>{`@media (max-width: 639px) { .cap-card-body { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; } }`}</style>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {coreCapabilities.map((cap) => {
          const outcomePrefix = getOutcomePrefix(cap.title);
          const bodyText = cap.description || cap.summary;
          return (
          <Card key={cap.title} interactive>
            <div style={{ background: 'rgba(243,146,45,0.1)', borderRadius: 8, padding: 8, display: 'inline-flex' }}>
              <IconBadge name={iconMap[cap.icon] || 'Circle'} tone="neutral" style={{ color: '#F3922D', opacity: 0.9 }} />
            </div>
            {cap.category && (
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: theme.colors.textMuted, margin: '8px 0 2px' }}>
                {cap.category}
              </p>
            )}
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '4px 0 4px', color: theme.neutrals.ink, lineHeight: 1.3 }}>
              {cap.title}
            </h3>
            {cap.dataSources && (
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: theme.colors.textMuted, margin: '4px 0 8px', textTransform: 'uppercase' }}>
                {cap.dataSources}
              </p>
            )}
            <p className="cap-card-body" style={{ fontSize: 14, color: theme.colors.textSecondary, margin: 0, lineHeight: 1.6 }}>
              {outcomePrefix && <strong style={{ color: theme.neutrals.ink }}>{outcomePrefix}</strong>}{bodyText}
            </p>
            {cap.bullets?.length > 0 && (
              <ul
                style={{
                  margin: '8px 0 0',
                  paddingLeft: 16,
                  color: theme.colors.textSecondary,
                  fontSize: 13,
                  lineHeight: 1.65,
                }}
              >
                {cap.bullets.map((bullet) => (
                  <li key={bullet} style={{ marginBottom: 3 }}>{bullet}</li>
                ))}
              </ul>
            )}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 14,
                borderTop: '1px solid rgba(17,17,17,0.07)',
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: theme.colors.textMuted,
                  margin: 0,
                }}
              >
                READS FROM: {cap.source}
              </p>
              {cap.metric && (
                <div style={{ marginTop: 8 }}>
                  <p style={{ fontSize: 20, fontWeight: 800, fontFamily: theme.fonts?.mono, color: theme.colors.accent, margin: 0, lineHeight: 1 }}>
                    {cap.metric.value}
                  </p>
                  <p style={{ fontSize: 11, color: theme.colors.textMuted, margin: '2px 0 0' }}>{cap.metric.label}</p>
                  {cap.metric.source && (
                    <p style={{ fontSize: 11, color: '#888', margin: '4px 0 0' }}>{cap.metric.source}</p>
                  )}
                </div>
              )}
            </div>
          </Card>
          );
        })}
      </div>
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <p style={{ fontSize: 17, fontWeight: 600, color: theme.neutrals.ink, margin: '0 0 16px' }}>
          Ready to see how Swoop maps to your club?
        </p>
        <a
          href="#/contact"
          onClick={() => { window.location.hash = '#/contact'; }}
          style={{ display: 'inline-block', background: '#F3922D', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 8, textDecoration: 'none' }}
        >
          Book the 30-Minute Walkthrough →
        </a>
      </div>
    </SectionShell>
  );
}
