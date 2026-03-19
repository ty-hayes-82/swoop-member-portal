import { useApp } from '@/context/AppContext';

const mono = "'JetBrains Mono', monospace";

export default function ActionPath({ label, amount, color, action }) {
  const { showToast } = useApp();
  const playbookMap = {
    'Pace of Play': 'Deploy Rangers',
    'Staffing': 'Activate Staffing Protocol',
    'Weather': 'Activate Weather Playbook',
  };
  const btnLabel = playbookMap[label] || 'Activate';
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '8px', alignItems: 'center',
      padding: '10px 12px', borderRadius: '6px', border: '1px solid #e4e4e7', background: '#f8f9fa',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 999, background: color, marginTop: 2 }} />
      <div style={{ display: 'grid', gap: '2px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#0f0f0f', fontWeight: 600 }}>{label}</span>
          <span style={{ fontSize: '14px', color, fontFamily: mono, fontWeight: 700 }}>${amount.toLocaleString()}/month</span>
        </div>
        <p style={{ fontSize: '12px', color: '#3f3f46', margin: 0 }}>{action}</p>
      </div>
      <button
        onClick={() => showToast(btnLabel + ' activated', 'success')}
        style={{
          padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', border: 'none', background: '#e8772e', color: 'white',
          whiteSpace: 'nowrap', alignSelf: 'center',
        }}
      >{btnLabel}</button>
    </div>
  );
}
