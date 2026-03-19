export default function RecoveryCTA({ recoverableAmount, totalLoss, onViewStaffingTab }) {
  const remaining = totalLoss - recoverableAmount;
  const recoverPct = Math.round((recoverableAmount / (recoverableAmount + remaining)) * 100);
  const remainPct = 100 - recoverPct;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
      border: '1px solid #bbf7d0',
      borderRadius: '16px',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle decorative element */}
      <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', borderRadius: '50%' }} />

      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
        <div style={{
          width: '44px', height: '44px',
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(34,197,94,0.3)',
          flexShrink: 0,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '2px' }}>Recovery Opportunity</div>
          <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
            Recover <span style={{ color: '#16a34a' }}>${recoverableAmount.toLocaleString()}</span>/month with ranger deployment
          </h3>
        </div>
      </div>

      {/* Stacked Bar Visualization */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly F&B Impact from Pace Issues</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>${totalLoss.toLocaleString()} total</span>
        </div>

        <div style={{ display: 'flex', height: '52px', borderRadius: '12px', overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{
            width: recoverPct + '%',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            color: 'white',
            fontWeight: 800, fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            position: 'relative',
            textShadow: '0 1px 2px rgba(0,0,0,0.15)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
            ${recoverableAmount.toLocaleString()}
          </div>
          <div style={{
            width: remainPct + '%',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            color: '#94a3b8',
            fontWeight: 700, fontSize: '16px',
            fontFamily: "'JetBrains Mono', monospace",
            borderLeft: '2px solid rgba(0,0,0,0.06)',
          }}>
            ${remaining.toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', marginTop: '10px' }}>
          <div style={{ width: recoverPct + '%', paddingRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Recoverable</span>
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', paddingLeft: '14px' }}>via Pace Management</span>
          </div>
          <div style={{ width: remainPct + '%', paddingLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>Remaining Gap</span>
            </div>
            <span style={{ fontSize: '11px', color: '#94a3b8', paddingLeft: '14px' }}>Addressable via Staffing optimization</span>
          </div>
        </div>
      </div>

      {/* Action Details */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '18px 20px',
        marginBottom: '24px',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{
            width: '36px', height: '36px',
            background: '#fef3c7',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            fontSize: '18px',
          }}>{'🎯'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>Deployment Strategy</div>
            <div style={{ fontSize: '13px', lineHeight: 1.6, color: '#475569' }}>
              Deploy rangers on <strong style={{ color: '#0f172a' }}>holes 4, 8, 12, and 16</strong> during peak times{' '}
              <span style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '12px', color: '#92400e' }}>Sat/Sun 8am{'–'}11am</span>
            </div>
            <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Avg delay reduced by <strong style={{ color: '#0f172a' }}>15 min</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                <span style={{ fontSize: '12px', color: '#64748b' }}>Recovers <strong style={{ color: '#16a34a' }}>35%</strong> of F&B losses</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button style={{
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          color: 'white', fontWeight: 700, fontSize: '14px',
          padding: '12px 24px', borderRadius: '10px', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 2px 8px rgba(34,197,94,0.3)', transition: '0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
          See Ranger Plan
        </button>
        <button onClick={onViewStaffingTab} style={{
          background: 'white', color: '#374151', fontWeight: 600, fontSize: '14px',
          padding: '12px 24px', borderRadius: '10px',
          border: '1.5px solid #d1d5db', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View Staffing Tab
        </button>
      </div>
    </div>
  );
}
