import { theme } from '@/config/theme';
import { weatherDaily } from '@/data/weather';
import { rainDayImpact } from '@/data/outlets';

export default function WeatherImpactTab() {
  const rainyDays = weatherDaily.filter(d => d.rain);
  const windyDays = weatherDaily.filter(d => d.condition === 'windy');
  const totalGolfRevenueLost = rainDayImpact.reduce((sum, day) => sum + (12000 - day.golfRevenue), 0);
  const totalFBShift = rainDayImpact.reduce((sum, day) => sum + (day.fbRevenue - 4200), 0);

  return (
    <div style={{ padding: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      {/* Summary Card */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 18,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          Weather Impacts Dining Patterns
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.md,
        }}>
          <MetricCard
            label="Rain days in January"
            value={rainyDays.length.toString()}
            sublabel="2 days with course-affecting rain"
          />
          <MetricCard
            label="Golf revenue lost"
            value={`$${totalGolfRevenueLost.toLocaleString()}`}
            sublabel="Reduced rounds and cancellations"
          />
          <MetricCard
            label="F&B shift to indoor"
            value={`+$${totalFBShift.toLocaleString()}`}
            sublabel="Clubhouse dining increases on rain days"
            highlight
          />
          <MetricCard
            label="Windy days"
            value={windyDays.length.toString()}
            sublabel="High wind affects pace and comfort"
          />
        </div>
      </div>

      {/* Rain Day Detail */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          Rain Day Revenue Patterns
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {rainDayImpact.map((day, idx) => {
            const normalGolfRevenue = 12000; // Estimated normal daily golf revenue
            const normalFBRevenue = 4200; // Estimated normal daily F&B
            const golfLoss = normalGolfRevenue - day.golfRevenue;
            const fbGain = day.fbRevenue - normalFBRevenue;
            const netImpact = -golfLoss + fbGain;

            return (
              <div
                key={idx}
                style={{
                  padding: theme.spacing.md,
                  background: theme.colors.bgSecondary,
                  borderRadius: 6,
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: theme.spacing.sm,
                }}>
                  <div>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: theme.colors.textPrimary,
                      marginBottom: 4,
                    }}>
                      {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div style={{
                      fontSize: 13,
                      color: theme.colors.textSecondary,
                    }}>
                      {day.weather === 'rainy' ? '🌧️ Rainy' : '☁️ Cloudy'}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: netImpact >= 0 ? theme.colors.success : theme.colors.risk,
                    fontFamily: theme.fonts.mono,
                  }}>
                    {netImpact >= 0 ? '+' : ''}${netImpact.toLocaleString()}
                  </div>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: theme.spacing.md,
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                }}>
                  <div>
                    <div style={{ marginBottom: 4, color: theme.colors.textTertiary }}>Golf Revenue</div>
                    <div>
                      <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>
                        ${day.golfRevenue.toLocaleString()}
                      </span>
                      {' '}
                      <span style={{ color: theme.colors.risk }}>
                        (-${golfLoss.toLocaleString()})
                      </span>
                    </div>
                  </div>
                  <div>
                    <div style={{ marginBottom: 4, color: theme.colors.textTertiary }}>F&B Revenue</div>
                    <div>
                      <span style={{ color: theme.colors.textPrimary, fontWeight: 600 }}>
                        ${day.fbRevenue.toLocaleString()}
                      </span>
                      {' '}
                      <span style={{ color: theme.colors.success }}>
                        (+${fbGain.toLocaleString()})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weather Patterns */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          January Weather Summary
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: theme.spacing.sm,
          marginBottom: theme.spacing.md,
        }}>
          {[
            { condition: 'sunny', emoji: '☀️', count: weatherDaily.filter(d => d.condition === 'sunny').length },
            { condition: 'cloudy', emoji: '☁️', count: weatherDaily.filter(d => d.condition === 'cloudy').length },
            { condition: 'rainy', emoji: '🌧️', count: rainyDays.length },
            { condition: 'windy', emoji: '💨', count: windyDays.length },
          ].map((item) => (
            <div
              key={item.condition}
              style={{
                padding: theme.spacing.sm,
                background: theme.colors.bgSecondary,
                borderRadius: 6,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{item.emoji}</div>
              <div style={{
                fontSize: 18,
                fontWeight: 700,
                color: theme.colors.textPrimary,
                fontFamily: theme.fonts.mono,
              }}>
                {item.count}
              </div>
              <div style={{
                fontSize: 12,
                color: theme.colors.textSecondary,
                textTransform: 'capitalize',
                marginTop: 4,
              }}>
                {item.condition} days
              </div>
            </div>
          ))}
        </div>

        <p style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: theme.colors.textSecondary,
          margin: 0,
        }}>
          Scottsdale's dry January (only {rainyDays.length} rain days) means weather had minimal impact on monthly revenue. 
          However, on rain days, F&B revenue <strong style={{ color: theme.colors.textPrimary }}>increased 18%</strong> as 
          members shifted to indoor dining instead of golf.
        </p>
      </div>

      {/* The Insight */}
      <div style={{
        background: theme.colors.cardBg,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <h3 style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.colors.textPrimary,
          marginBottom: theme.spacing.md,
        }}>
          Weather Intelligence
        </h3>
        <div style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: theme.colors.textSecondary,
          fontFamily: theme.fonts.mono,
        }}>
          <p style={{ marginBottom: theme.spacing.sm }}>
            <strong style={{ color: theme.colors.textPrimary }}>Rain days:</strong><br />
            • Golf rounds drop ~50% ($6,800 lost per rain day)<br />
            • Indoor dining increases ~38% ($1,600 gain per rain day)<br />
            • Net revenue impact: <span style={{ color: theme.colors.risk, fontWeight: 600 }}>-$5,200/day</span>
          </p>
          <p style={{ marginBottom: theme.spacing.sm }}>
            <strong style={{ color: theme.colors.textPrimary }}>Windy days (20+ mph):</strong><br />
            • Rounds complete but pace slows 15-20%<br />
            • Post-round dining drops (similar to slow-round effect)<br />
            • Members more likely to skip and go home
          </p>
          <p>
            <strong style={{ color: theme.colors.textPrimary }}>Strategic response:</strong><br />
            • Forecast rain → promote indoor dining specials<br />
            • Pre-schedule extra F&B staff on forecasted rain days<br />
            • Convert weather-lost golf rounds into dining opportunities
          </p>
        </div>
      </div>

      {/* Action Recommendation */}
      <div style={{
        background: `linear-gradient(135deg, ${theme.colors.opportunity}15, ${theme.colors.opportunity}05)`,
        border: `1px solid ${theme.colors.opportunity}40`,
        borderRadius: 8,
        padding: theme.spacing.lg,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md }}>
          <span style={{ fontSize: 24 }}>💡</span>
          <div>
            <h4 style={{ 
              fontSize: 15, 
              fontWeight: 600, 
              color: theme.colors.textPrimary,
              marginBottom: theme.spacing.xs,
            }}>
              Recommended Action
            </h4>
            <p style={{ 
              fontSize: 14, 
              lineHeight: 1.5, 
              color: theme.colors.textSecondary,
              margin: 0,
            }}>
              Enable weather-triggered push notifications via Swoop app: "Rainy day special – 20% off Main Dining Room lunch today!" 
              Capture indoor F&B opportunity when golf rounds are lost. Target members on-property or scheduled for canceled tee times.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, sublabel, highlight }) {
  return (
    <div>
      <div style={{
        fontSize: 12,
        fontWeight: 500,
        color: theme.colors.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: highlight ? 24 : 20,
        fontWeight: 700,
        color: highlight ? theme.colors.success : theme.colors.textPrimary,
        fontFamily: theme.fonts.mono,
        marginBottom: 4,
      }}>
        {value}
      </div>
      {sublabel && (
        <div style={{
          fontSize: 12,
          color: theme.colors.textTertiary,
          lineHeight: 1.4,
        }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
