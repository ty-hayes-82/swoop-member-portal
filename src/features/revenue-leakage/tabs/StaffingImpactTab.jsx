import { theme } from '@/config/theme';
import { understaffedDays, feedbackRecords, feedbackSummary } from '@/data/staffing';

export default function StaffingImpactTab() {
  const totalRevenueLoss = understaffedDays.reduce((sum, day) => sum + day.revenueLoss, 0);
  const totalComplaints = feedbackRecords.filter(f => f.isUnderstaffedDay).length;
  const avgComplaintMultiplier = (
    understaffedDays.reduce((sum, day) => sum + day.complaintMultiplier, 0) / understaffedDays.length
  ).toFixed(1);

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
          Understaffing = Service Failures = Lost Revenue
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: theme.spacing.md,
        }}>
          <MetricCard
            label="Understaffed days (Jan)"
            value={understaffedDays.length.toString()}
            sublabel="Grill Room lunch service"
          />
          <MetricCard
            label="Service complaints"
            value={`${avgComplaintMultiplier}x higher`}
            sublabel={`${totalComplaints} complaints on understaffed days`}
          />
          <MetricCard
            label="Revenue lost"
            value={`$${totalRevenueLoss.toLocaleString()}`}
            sublabel="Due to slower service and lost covers"
            highlight
          />
        </div>
      </div>

      {/* Understaffed Days Detail */}
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
          Understaffed Days (January 2026)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
          {understaffedDays.map((day, idx) => (
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
                    {day.outlet} Lunch
                  </div>
                </div>
                <div style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: theme.colors.risk,
                  fontFamily: theme.fonts.mono,
                }}>
                  -${day.revenueLoss.toLocaleString()}
                </div>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: theme.spacing.sm,
                fontSize: 13,
                color: theme.colors.textSecondary,
              }}>
                <div>
                  <span style={{ color: theme.colors.textTertiary }}>Staffing gap:</span>{' '}
                  <strong style={{ color: theme.colors.textPrimary }}>
                    {day.scheduledStaff}/{day.requiredStaff} servers
                  </strong>
                </div>
                <div>
                  <span style={{ color: theme.colors.textTertiary }}>Ticket time:</span>{' '}
                  <strong style={{ color: theme.colors.textPrimary }}>
                    +{(day.ticketTimeIncrease * 100).toFixed(0)}%
                  </strong>
                </div>
                <div>
                  <span style={{ color: theme.colors.textTertiary }}>Complaints:</span>{' '}
                  <strong style={{ color: theme.colors.textPrimary }}>
                    {day.complaintMultiplier.toFixed(1)}x higher
                  </strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Complaints Breakdown */}
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
          Complaint Correlation
        </h3>
        <div style={{ marginBottom: theme.spacing.md }}>
          <p style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: theme.colors.textSecondary,
            margin: 0,
          }}>
            <strong style={{ color: theme.colors.textPrimary }}>
              {totalComplaints} of {feedbackRecords.length} complaints
            </strong> occurred on understaffed days. Service Speed complaints are {avgComplaintMultiplier}x higher when Grill Room runs with 2-3 servers instead of the required 4.
          </p>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.xs }}>
          {feedbackSummary
            .filter(cat => cat.category === 'Service Speed' || cat.category === 'Food Quality')
            .map((category) => (
              <div
                key={category.category}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: theme.spacing.sm,
                  background: theme.colors.bgSecondary,
                  borderRadius: 6,
                  fontSize: 14,
                }}
              >
                <div style={{ color: theme.colors.textPrimary, fontWeight: 500 }}>
                  {category.category}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  fontSize: 13,
                  color: theme.colors.textSecondary,
                }}>
                  <div>
                    {category.count} complaints
                  </div>
                  <div style={{
                    color: category.unresolvedCount > 0 ? theme.colors.risk : theme.colors.success,
                    fontWeight: 600,
                  }}>
                    {category.unresolvedCount} unresolved
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* The Math */}
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
          How Understaffing Costs Revenue
        </h3>
        <div style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: theme.colors.textSecondary,
          fontFamily: theme.fonts.mono,
        }}>
          <p style={{ marginBottom: theme.spacing.sm }}>
            <strong style={{ color: theme.colors.textPrimary }}>Service slowdown:</strong><br />
            • Ticket time increases 18-22% with 2-3 servers vs 4<br />
            • Members wait longer, some leave without ordering<br />
            • Table turnover drops → fewer covers per shift
          </p>
          <p style={{ marginBottom: theme.spacing.sm }}>
            <strong style={{ color: theme.colors.textPrimary }}>Complaint spike:</strong><br />
            • Service complaints increase {avgComplaintMultiplier}x on understaffed days<br />
            • Negative sentiment spreads → reduced future visits<br />
            • Recovery costs: staff time, comped items, lost goodwill
          </p>
          <p>
            <strong style={{ color: theme.colors.risk }}>Total revenue impact (3 days):</strong>{' '}
            <span style={{ 
              fontSize: 16, 
              fontWeight: 700, 
              color: theme.colors.risk 
            }}>
              ${totalRevenueLoss.toLocaleString()}
            </span>
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
              Maintain 4-server minimum for Grill Room lunch service on high-demand days (typically Wednesday-Saturday). 
              Cost: ~$240/day (1 additional server). 
              Return: <strong style={{ color: theme.colors.opportunity }}>$920-1,280/day</strong> in protected revenue + eliminated service complaints.
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
        color: highlight ? theme.colors.risk : theme.colors.textPrimary,
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
