import { StatCard } from '@/components/ui/index.js';
import { SoWhatCallout } from '@/components/ui/index.js';
import { trends } from '@/data/trends.js';

export default function YesterdayRecap({ data }) {
  const { revenue, revenuePlan, revenueVsPlan, rounds, incidents, isUnderstaffed } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard
          label="Revenue (Jan 16)"
          value={revenue}
          format="currency"
          trend={{ direction: revenueVsPlan < 0 ? 'down' : 'up', value: Math.abs(revenueVsPlan * 100), period: 'vs. avg' }}
          sparklineData={trends.golfRevenue}
        />
        <StatCard
          label="Rounds Played"
          value={rounds}
          trend={{ direction: 'down', value: 8.2, period: 'vs. avg Fri' }}
        />
        <StatCard
          label="Complaints Filed"
          value={5}
          badge={{ text: 'Understaffed', variant: 'urgent' }}
          trend={{ direction: 'up', value: 150, period: 'vs. avg', inverted: true }}
        />
      </div>

      {incidents.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {incidents.map((inc, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 14px',
              background: '#EF444408',
              border: '1px solid #EF444422',
              borderRadius: '8px',
              fontSize: '13px', color: 'var(--text-secondary)',
            }}>
              <span style={{ color: '#EF4444', fontSize: '10px' }}>●</span>
              {inc}
            </div>
          ))}
        </div>
      )}

      <SoWhatCallout variant="warning">
        Friday Jan 16 came in {Math.abs(revenueVsPlan * 100).toFixed(0)}% below plan with the Grill Room understaffed. 
        Five complaints were filed — 2× the normal rate. This pattern repeats on Jan 9 and Jan 28.
      </SoWhatCallout>
    </div>
  );
}
