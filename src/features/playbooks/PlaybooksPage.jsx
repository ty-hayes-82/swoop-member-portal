import { useState } from 'react';
import { theme } from '@/config/theme';
import PageTransition from '@/components/ui/PageTransition';
import { useApp } from '@/context/AppContext';

const PLAYBOOKS = [
  {
    id: 'service-save',
    name: 'Service Save Protocol',
    category: 'Retention',
    categoryColor: '#c0392b',
    description: 'The pattern we see with members like James Whitfield: an engaged member \u2014 in James\u2019s case, a 6-year member in good standing \u2014 files a complaint that goes unresolved, leading to resignation within days. One saved resignation protects $18K\u2013$22K in dues plus $3K\u2013$5K in ancillary revenue.',
    triggeredFor: { name: 'James Whitfield', note: 'Normally engaged across all domains \u2014 complaint from this archetype is a red flag' },
    monthlyImpact: '$18K',
    yearlyImpact: '$216K/yr',
    steps: [
      { label: 'Staff Alert', badge: { text: '\uD83D\uDCE2 Staff Alert', bg: '#fff3cd', color: '#856404' }, title: 'Auto-escalate high-sentiment complaints', detail: 'James Whitfield\u2019s complaint (slow service, felt ignored) \u2192 auto-routed to F&B Director. Alert includes complaint text, member profile, and last 3 visits.', timing: 'Hour 1\u20132' },
      { label: 'Front Desk Flag', badge: { text: '\uD83D\uDEA9 Front Desk Flag', bg: '#f8d7da', color: '#721c24' }, title: 'GM personal alert with member profile', detail: 'GM alert: "James Whitfield \u2014 member since 2019, $18K/yr dues. Complaint about slow lunch on Jan 16 \u2014 unresolved 4 days. Recommend personal call today."', timing: 'Hour 2\u20134' },
      { label: 'Comp Offer', badge: { text: '\uD83C\uDF81 Comp Offer', bg: '#d4edda', color: '#155724' }, title: 'Personal GM follow-up + comp offer', detail: 'Comp offer queued: complimentary dinner for 2. Front desk flagged: greet James by name on next visit.', timing: 'Day 1\u20132' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '4x run', result: '3 of 4 at-risk members retained', impact: '$54K dues protected' },
      { period: 'Q3 2025', runs: '2x run', result: '2 of 2 at-risk members retained', impact: '$36K dues protected' },
    ],
    before: [
      { label: 'Avg response to negative feedback', value: '48+ hours' },
      { label: 'Complaint resolution rate', value: '62%' },
      { label: 'Resignations from complaints', value: '1 this month' },
    ],
    after: [
      { label: 'Response to high-sentiment feedback', value: '< 2 hours' },
      { label: 'Complaint resolution rate', value: '94%' },
      { label: 'Preventable resignations', value: '0' },
    ],
  },
  {
    id: 'demand-surge',
    name: 'Demand Surge Playbook',
    category: 'Revenue',
    categoryColor: '#2563eb',
    description: 'When tee time demand spikes \u2014 holidays, tournaments, perfect weather weekends \u2014 clubs leave revenue on the table with static pricing. This playbook dynamically adjusts pricing tiers, sends targeted offers to low-frequency members, and optimizes slot allocation.',
    triggeredFor: { name: 'Memorial Day Weekend', note: 'Tee time demand 3.2x normal \u2014 dynamic pricing window' },
    monthlyImpact: '$12K',
    yearlyImpact: '$48K/yr',
    steps: [
      { label: 'Demand Alert', badge: { text: '\uD83D\uDCC8 Demand Spike', bg: '#dbeafe', color: '#1e40af' }, title: 'Auto-detect booking surge pattern', detail: 'Booking velocity 3.2x baseline detected for May 24\u201326. Prime slots (7\u201310am) at 94% fill rate 5 days out.', timing: 'Day -5' },
      { label: 'Dynamic Pricing', badge: { text: '\uD83D\uDCB0 Price Adjust', bg: '#fef3c7', color: '#92400e' }, title: 'Activate tiered premium pricing', detail: 'Premium tier (+15%) activated for prime slots. Standard pricing maintained for off-peak. Guest fee premium (+$25) auto-applied.', timing: 'Day -3' },
      { label: 'Member Outreach', badge: { text: '\uD83D\uDCE7 Targeted Offer', bg: '#d4edda', color: '#155724' }, title: 'Send offers to low-frequency members', detail: 'Push notification to 47 members who haven\u2019t played in 30+ days: "Perfect weather this weekend \u2014 we saved your favorite 8:30am slot."', timing: 'Day -2' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '6x run', result: '14% avg revenue lift per surge event', impact: '$72K incremental revenue' },
      { period: 'Q3 2025', runs: '4x run', result: '11% avg revenue lift', impact: '$44K incremental revenue' },
    ],
    before: [
      { label: 'Revenue capture during peak demand', value: '~78%' },
      { label: 'Low-frequency member re-engagement', value: '12%' },
      { label: 'Guest fee optimization', value: 'Static' },
    ],
    after: [
      { label: 'Revenue capture during peak demand', value: '94%' },
      { label: 'Low-frequency member re-engagement', value: '34%' },
      { label: 'Guest fee optimization', value: 'Dynamic' },
    ],
  },
  {
    id: 'staffing-gap',
    name: 'Staffing Gap Protocol',
    category: 'Operations',
    categoryColor: '#7c3aed',
    description: 'When staffing drops below service thresholds \u2014 call-outs, seasonal transitions, event overlap \u2014 member experience degrades fast. This playbook auto-detects coverage gaps, triggers cross-training recalls, and adjusts service pacing to maintain quality.',
    triggeredFor: { name: 'Saturday Brunch Service', note: '2 servers called out \u2014 dining room at 85% capacity with 60% staffing' },
    monthlyImpact: '$8K',
    yearlyImpact: '$96K/yr',
    steps: [
      { label: 'Gap Detection', badge: { text: '\u26A0\uFE0F Coverage Gap', bg: '#fef3c7', color: '#92400e' }, title: 'Auto-detect staffing shortfall', detail: 'Saturday brunch: 2 of 5 servers unavailable. Current ratio 1:18 (threshold 1:12). F&B Director alerted with gap analysis.', timing: 'Hour -4' },
      { label: 'Cross-Train Recall', badge: { text: '\uD83D\uDCDE Recall Alert', bg: '#dbeafe', color: '#1e40af' }, title: 'Activate cross-trained staff', detail: '3 cross-trained staff contacted: 1 banquet server available, 1 host can cover tables. Updated floor plan sent to F&B Director.', timing: 'Hour -3' },
      { label: 'Service Pacing', badge: { text: '\u23F1 Pace Adjust', bg: '#ede9fe', color: '#5b21b6' }, title: 'Adjust reservation pacing', detail: 'Brunch reservations re-paced: 15-min gaps between seatings (was 10-min). Walk-in wait estimate updated on member app.', timing: 'Hour -2' },
    ],
    trackRecord: [
      { period: 'Q4 2025', runs: '8x run', result: 'Zero service complaints during gaps', impact: '$8K complaint costs avoided' },
      { period: 'Q3 2025', runs: '5x run', result: '1 complaint (vs 5 avg before)', impact: '$6K saved' },
    ],
    before: [
      { label: 'Avg complaints per staffing gap', value: '3.2' },
      { label: 'Time to fill coverage gap', value: '90+ min' },
      { label: 'Member satisfaction during gaps', value: '3.1/5' },
    ],
    after: [
      { label: 'Avg complaints per staffing gap', value: '0.2' },
      { label: 'Time to fill coverage gap', value: '< 25 min' },
      { label: 'Member satisfaction during gaps', value: '4.4/5' },
    ],
  },
];

function PlaybookCard({ playbook, onSelect, isSelected }) {
  return (
    <div
      onClick={() => onSelect(playbook.id)}
      style={{
        background: '#fff',
        border: isSelected ? '2px solid #e8772e' : '1px solid #e5e5e5',
        borderRadius: 12,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: isSelected ? '0 0 0 3px rgba(232,119,46,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.2px', color: playbook.categoryColor, textTransform: 'uppercase' }}>
          {playbook.category}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f0f0f', marginBottom: 6 }}>{playbook.name}</div>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {playbook.description}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#d9534f' }}>{playbook.monthlyImpact}/mo</span>
        <span style={{ fontSize: 12, color: '#999' }}>{playbook.trackRecord[0]?.runs} last quarter</span>
      </div>
    </div>
  );
}

function PlaybookDetail({ playbook }) {
  const { showToast } = useApp();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#e8772e', textTransform: 'uppercase' }}>Playbook</span>
          <span style={{ background: '#e8772e', color: 'white', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 10 }}>TRIGGERED</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: '#0f0f0f', margin: '0 0 8px 0', fontFamily: 'inherit' }}>{playbook.name}</h2>
        <p style={{ color: '#666', fontSize: 14, lineHeight: 1.6, maxWidth: 700, margin: 0 }}>{playbook.description}</p>
      </div>

      {/* Triggered For + Monthly Impact */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: '#999', marginBottom: 6 }}>Triggered for:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ background: '#1a1a2e', color: 'white', padding: '5px 14px', borderRadius: 6, fontSize: 13, fontWeight: 500 }}>{playbook.triggeredFor.name}</span>
            <span style={{ color: '#888', fontSize: 13, fontStyle: 'italic' }}>{playbook.triggeredFor.note}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: '#999' }}>Monthly impact</div>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#d9534f' }}>{playbook.monthlyImpact}</div>
          <div style={{ fontSize: 13, color: '#999' }}>{playbook.yearlyImpact}</div>
        </div>
      </div>

      {/* Steps Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#999', fontWeight: 500 }}>When you activate this playbook:</div>
      </div>

      {/* Steps */}
      {playbook.steps.map((step, idx) => (
        <div key={idx} style={{
          background: '#fafafa', border: '1px solid #eee', borderRadius: 12,
          padding: '20px 24px', marginBottom: 12,
          display: 'flex', alignItems: 'flex-start', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 28, height: 28, background: '#4a90d9', color: 'white', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
            }}>{idx + 1}</div>
            <span style={{
              background: step.badge.bg, color: step.badge.color,
              padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600,
            }}>{step.badge.text}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#0f0f0f', fontSize: 14, marginBottom: 4 }}>{step.title}</div>
            <div style={{ color: '#777', fontSize: 13, lineHeight: 1.5 }}>{step.detail}</div>
          </div>
          <div style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>{step.timing}</div>
        </div>
      ))}

      {/* Track Record */}
      <div style={{ background: 'white', border: '1px solid #e5e5e5', borderRadius: 12, padding: 24, marginTop: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ color: '#27ae60', fontWeight: 700 }}>{'\u2713'}</span>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1px', color: '#27ae60', textTransform: 'uppercase' }}>Track Record</span>
        </div>
        {playbook.trackRecord.map((tr, idx) => (
          <div key={idx} style={{
            display: 'flex', justifyContent: 'space-between', padding: '10px 0',
            borderBottom: idx < playbook.trackRecord.length - 1 ? '1px solid #f0f0f0' : 'none',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>{tr.period}</span>
              <span style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: '#666' }}>{tr.runs}</span>
              <span style={{ color: '#666', fontSize: 13 }}>{tr.result}</span>
            </div>
            <span style={{ color: '#27ae60', fontWeight: 600, fontSize: 13 }}>{tr.impact}</span>
          </div>
        ))}
      </div>

      {/* Before / After */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
        <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#999', marginBottom: 16 }}>{'\u25CF'} BEFORE</div>
          {playbook.before.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx < playbook.before.length - 1 ? 12 : 0 }}>
              <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f0f0f' }}>{item.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#27ae60', marginBottom: 16 }}>{'\u25CF'} AFTER</div>
          {playbook.after.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: idx < playbook.after.length - 1 ? 12 : 0 }}>
              <span style={{ fontSize: 13, color: '#555' }}>{item.label}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0f0f0f' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activate Button */}
      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => showToast(`${playbook.name} activated`, 'success')}
          style={{
            width: '100%', background: playbook.categoryColor || '#c0392b', color: 'white', border: 'none',
            padding: 16, borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Activate this playbook
        </button>
      </div>
    </div>
  );
}

export default function PlaybooksPage() {
  const [selectedId, setSelectedId] = useState(PLAYBOOKS[0].id);
  const selected = PLAYBOOKS.find(p => p.id === selectedId);

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Page Title */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '1.5px', color: '#e8772e', textTransform: 'uppercase', marginBottom: 6 }}>
            Outreach Playbooks
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f0f0f', margin: '0 0 6px', fontFamily: theme.fonts.serif }}>
            Automated Response Protocols
          </h1>
          <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>
            Step-by-step playbooks that activate automatically when patterns are detected. Each playbook coordinates staff alerts, member outreach, and follow-up actions.
          </p>
        </div>

        {/* Playbook Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {PLAYBOOKS.map(pb => (
            <PlaybookCard
              key={pb.id}
              playbook={pb}
              onSelect={setSelectedId}
              isSelected={selectedId === pb.id}
            />
          ))}
        </div>

        {/* Selected Playbook Detail */}
        {selected && (
          <div style={{
            background: '#fff', border: '1px solid #e5e5e5', borderRadius: 14,
            padding: '32px 40px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <PlaybookDetail playbook={selected} />
          </div>
        )}
      </div>
    </PageTransition>
  );
}
