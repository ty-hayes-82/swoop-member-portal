import { theme } from '@/config/theme';
import { integrationCategories } from '@/landing/data';

const swoopUnique = [
  { title: 'Real-Time Location Intelligence', desc: 'GPS and behavioral data from the Swoop member app. On-property movement patterns that no POS, tee sheet, or CRM captures.' },
  { title: 'Cross-System Behavioral Correlation', desc: 'How a member\'s dining patterns predict their tee sheet behavior. How staffing gaps correlate with revenue drops. Your systems cannot see this alone.' },
  { title: 'AI-Powered Predictive Recommendations', desc: 'Your systems collect data. Swoop interprets it and recommends specific actions with measurable outcomes — before problems become resignations.' },
  { title: 'Closed-Loop Engagement Tracking', desc: 'From signal detection to GM action to member response to outcome measurement. Your existing tools stop at the data layer. Swoop closes the loop.' },
];

export default function IntegrationsSection() {
  return (
    <>
      <section style={{ marginBottom: theme.spacing.xxl }}>
        <h2 style={{ fontSize: theme.fontSize.xxl, marginBottom: theme.spacing.md }}>
          Your tools manage operations. Swoop connects them and tells you what they mean together.
        </h2>
        <p style={{
          color: theme.colors.textSecondary,
          fontSize: theme.fontSize.lg,
          marginBottom: theme.spacing.xl,
        }}>
          These systems collect data. Swoop is the intelligence layer that connects them, adds location-aware behavioral signals, and turns cross-system patterns into actionable recommendations.
        </p>

        {/* What Swoop Adds (Unique Differentiators) */}
        <div style={{
          border: `2px solid ${theme.colors.ctaGreen}`,
          borderRadius: theme.radius.lg,
          background: theme.colors.bgCard,
          padding: 'clamp(18px, 4vw, 28px)',
          marginBottom: theme.spacing.xl,
        }}>
          <p style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: theme.spacing.md,
          }}>
            What Swoop Adds That No Integration Can Provide
          </p>
          <div className="landing-grid-2" style={{ gap: 16 }}>
            {swoopUnique.map((item) => (
              <div key={item.title} style={{
                borderLeft: `3px solid ${theme.colors.ctaGreen}`,
                paddingLeft: '14px',
              }}>
                <p style={{ fontWeight: 600, marginBottom: 6 }}>{item.title}</p>
                <p style={{
                  color: theme.colors.textSecondary,
                  fontSize: theme.fontSize.sm,
                  lineHeight: 1.6,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Visual: Data Flow */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          background: theme.colors.bgCard,
          padding: 'clamp(18px, 4vw, 28px)',
          marginBottom: theme.spacing.xl,
        }}>
          <p style={{
            fontSize: theme.fontSize.lg,
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
          }}>
            From disconnected systems to unified intelligence
          </p>
          <div className="landing-flow-grid" style={{ gap: 20 }}>
            {/* Left: Systems */}
            <div>
              <p style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: theme.spacing.sm,
              }}>
                Your Systems Collect
              </p>
              {['Tee times', 'POS transactions', 'CRM records', 'Payroll hours', 'Email opens'].map((item) => (
                <div key={item} style={{
                  border: `1px solid ${theme.colors.borderLight}`,
                  borderRadius: theme.radius.sm,
                  padding: '8px',
                  marginBottom: 8,
                  fontSize: theme.fontSize.sm,
                }}>
                  {item}
                </div>
              ))}
            </div>

            {/* Middle: Arrow + Swoop Layer */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                background: theme.colors.bgSidebar,
                color: theme.colors.textOnDark,
                borderRadius: theme.radius.md,
                padding: '16px',
                marginBottom: theme.spacing.md,
              }}>
                <p style={{
                  fontSize: theme.fontSize.xs,
                  color: theme.colors.ctaGreen,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}>
                  Swoop Intelligence Layer
                </p>
                <div style={{ fontSize: theme.fontSize.sm, lineHeight: 1.8 }}>
                  <p>Location data</p>
                  <p>Behavioral patterns</p>
                  <p>Cross-system correlation</p>
                  <p>AI prediction</p>
                </div>
              </div>
              <div style={{ fontSize: '32px', color: theme.colors.ctaGreen }}>→</div>
            </div>

            {/* Right: What Swoop Delivers */}
            <div>
              <p style={{
                fontSize: theme.fontSize.xs,
                color: theme.colors.textMuted,
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: theme.spacing.sm,
              }}>
                Swoop Delivers
              </p>
              {[
                { label: 'Member health intelligence', color: theme.colors.lensMemberIntelligence },
                { label: 'Retention-prioritized waitlist', color: theme.colors.lensTeeSheetDemand },
                { label: 'F&B demand prediction', color: theme.colors.lensFbOperations },
                { label: 'Staffing gap alerts', color: theme.colors.lensStaffingLabor },
                { label: 'Revenue attribution', color: theme.colors.lensRevenuePipeline },
              ].map((item) => (
                <div key={item.label} style={{
                  borderLeft: `3px solid ${item.color}`,
                  borderRadius: theme.radius.sm,
                  padding: '8px 8px 8px 12px',
                  marginBottom: 8,
                  fontSize: theme.fontSize.sm,
                  fontWeight: 500,
                  background: theme.colors.bgCard,
                }}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 28 Integrations Grid */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          background: theme.colors.bgCard,
          padding: 'clamp(18px, 4vw, 24px)',
          marginBottom: theme.spacing.lg,
        }}>
          <p style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: theme.spacing.md,
          }}>
            28 Integrations Across 10 Categories
          </p>
          <div className="landing-grid-auto" style={{ gap: 12 }}>
            {integrationCategories.map((category) => (
              <div key={category.label} style={{
                border: `1px solid ${theme.colors.borderLight}`,
                borderRadius: theme.radius.md,
                padding: '12px',
              }}>
                <p style={{ fontWeight: 600 }}>{category.label}</p>
                <p style={{
                  color: theme.colors.textSecondary,
                  fontFamily: theme.fonts.mono,
                  fontSize: theme.fontSize.sm,
                }}>
                  {category.systems} connected systems
                </p>
                <p style={{
                  color: theme.colors.textMuted,
                  fontSize: theme.fontSize.sm,
                  marginTop: 6,
                }}>
                  {category.vendors.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rollout Timeline */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.lg,
          background: theme.colors.bgDeep,
          padding: 'clamp(18px, 4vw, 24px)',
        }}>
          <p style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.textMuted,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: theme.spacing.md,
          }}>
            Rollout Timeline
          </p>
          <p style={{ fontSize: theme.fontSize.lg, marginBottom: theme.spacing.md }}>
            Typical launch: <span className="font-mono">10 business days</span>.
          </p>
          <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.md }}>
            Week 1: connector setup, data validation, and intelligence baselines. Week 2: workflows,
            AI agent playbooks, and GM readiness.
          </p>
          <div style={{
            borderRadius: theme.radius.sm,
            background: theme.colors.bgCard,
            padding: '12px',
            border: `1px solid ${theme.colors.border}`,
          }}>
            <p style={{ fontFamily: theme.fonts.mono, fontWeight: 600 }}>No operational downtime.</p>
            <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }}>
              Keep current systems active while Swoop comes online in parallel.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
