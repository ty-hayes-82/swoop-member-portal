import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function SettingsScreen() {
  const { showToast } = useApp();
  const [notifyRequested, setNotifyRequested] = useState(() => {
    try { return localStorage.getItem('swoop_push_notify_requested') === 'true'; } catch { return false; }
  });

  const handleNotifyMe = () => {
    setNotifyRequested(true);
    try { localStorage.setItem('swoop_push_notify_requested', 'true'); } catch {}
    showToast('You\'ll be notified when push notifications are available', 'success');
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F0F0F' }}>Settings</div>

      <div style={{ borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <SettingsRow
          icon="🔔"
          label="Push Notifications"
          sub={notifyRequested ? 'We\'ll notify you when available' : 'Coming soon'}
          action={
            notifyRequested ? (
              <span style={{ fontSize: '12px', color: '#22C55E', fontWeight: 600 }}>Requested</span>
            ) : (
              <button
                onClick={handleNotifyMe}
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: '1px solid #F3922D',
                  background: '#fff', color: '#F3922D', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >Notify me</button>
            )
          }
        />
        <SettingsRow icon="🖥️" label="Open Desktop Version" sub="Full analytics, board reports, AI agents" action={
          <button onClick={() => { window.location.hash = '#/today'; }} style={{
            padding: '6px 12px', borderRadius: '8px', border: '1px solid #E5E7EB',
            background: '#fff', color: '#374151', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}>Open</button>
        } />
        <SettingsRow icon="👤" label="Signed in as" sub="Sarah Mitchell · General Manager" />
        <SettingsRow icon="🏌️" label="Club" sub="Oakmont Hills Country Club" />
        <SettingsRow icon="📱" label="Version" sub="Swoop Mobile 1.0.0 · Phase 1 MVP" />
      </div>

      <div style={{
        padding: '14px 16px', borderRadius: '12px',
        background: '#F9FAFB', border: '1px solid #E5E7EB',
        fontSize: '12px', color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6,
      }}>
        Swoop Golf · Club Intelligence Platform<br />
        For full analytics, board reports, and admin settings, use the desktop version.
      </div>
    </div>
  );
}

function SettingsRow({ icon, label, sub, action }) {
  return (
    <div style={{
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px',
      borderBottom: '1px solid #F3F4F6',
    }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F0F0F' }}>{label}</div>
        {sub && <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '1px' }}>{sub}</div>}
      </div>
      {action}
    </div>
  );
}
