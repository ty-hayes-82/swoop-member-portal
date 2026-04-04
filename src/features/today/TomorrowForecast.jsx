// TomorrowForecast — demand prediction for tomorrow
import { theme } from '@/config/theme';
import { getDailyBriefing } from '@/services/briefingService';
import { getTomorrowForecast } from '@/services/weatherService';
import { understaffedDays } from '@/data/staffing';

const outlets = [
  { name: 'Grill Room', requiredStaff: 4, scheduledStaff: 2, status: 'gap' },
  { name: 'Terrace', requiredStaff: 3, scheduledStaff: 3, status: 'full' },
  { name: 'Pool Bar', requiredStaff: 1, scheduledStaff: 1, status: 'full' },
];

export default function TomorrowForecast() {
  const briefing = getDailyBriefing();
  const tomorrow = briefing?.todayRisks?.tomorrow || getTomorrowForecast();
  const roundsBooked = briefing?.teeSheet?.roundsToday || 220;

  const weather = tomorrow?.conditions || briefing?.todayRisks?.weather || 'clear';
  const wind = tomorrow?.wind || briefing?.todayRisks?.wind || 0;
  const gusts = tomorrow?.gusts || wind;
  const tempHigh = tomorrow?.high || briefing?.todayRisks?.tempHigh || 72;
  const precipProb = tomorrow?.precipProb || 0;

  const highDemand = roundsBooked > 200;
  const weatherImpact = gusts > 15
    ? `Wind advisory — ${gusts} mph gusts may shift golfers to indoor dining`
    : precipProb > 60
      ? `${precipProb}% rain probability — prepare for cancellations and indoor overflow`
      : precipProb > 40
        ? `${precipProb}% chance of rain — monitor and prepare contingency`
        : weather === 'rainy'
          ? 'Rain expected — prepare for indoor overflow'
          : 'No weather disruptions expected';

  const diningImpact = highDemand
    ? `${roundsBooked} rounds booked — expect 15% higher dining traffic`
    : `${roundsBooked} rounds booked — standard dining demand`;

  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
    }}>
      <div style={{
        fontSize: '11px', fontWeight: 700, color: theme.colors.info,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12,
      }}>
        Tomorrow's Forecast
      </div>

      {/* Demand prediction */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 16,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
            {roundsBooked}
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Rounds booked
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: theme.colors.textPrimary }}>
            {tempHigh}°F
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            High temp
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: gusts > 15 ? theme.colors.warning : theme.colors.textPrimary }}>
            {gusts > wind ? `${wind}–${gusts}` : wind} mph
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Wind{gusts > wind ? ' / Gusts' : ''}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: theme.fontSize.lg, fontWeight: 700, color: precipProb > 40 ? theme.colors.warning : theme.colors.textPrimary }}>
            {precipProb}%
          </div>
          <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
            Rain chance
          </div>
        </div>
      </div>

      {/* Staffing recommendation per outlet */}
      <div style={{
        fontSize: '11px', fontWeight: 700, color: theme.colors.textSecondary,
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8,
      }}>
        Staffing Recommendation
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
        {outlets.map(outlet => {
          const isFull = outlet.status === 'full';
          const color = isFull ? theme.colors.success : theme.colors.urgent;
          return (
            <div key={outlet.name} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 12px', borderRadius: theme.radius.sm,
              background: `${color}08`, border: `1px solid ${color}20`,
            }}>
              <span style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>
                {outlet.name}
              </span>
              <span style={{ fontSize: theme.fontSize.xs, fontWeight: 600, color }}>
                {outlet.scheduledStaff}/{outlet.requiredStaff} staff
                {!isFull && ' — needs coverage'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Event & weather impact notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.4 }}>
          {diningImpact}
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: gusts > 15 || precipProb > 40 ? theme.colors.warning : theme.colors.textSecondary, lineHeight: 1.4 }}>
          {weatherImpact}
        </div>
      </div>
    </div>
  );
}
