import { CLUB_NAME } from '@/config/constants.js';

const SYSTEMS = ['ForeTees', 'Jonas POS', 'Northstar', 'ClubReady', 'Club Prophet'];

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '10px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
      gap: '12px',
      flexWrap: 'wrap',
    }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Swoop Golf · Integrated Intelligence for Private Clubs
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Demo Environment · {CLUB_NAME} · January 2026
      </span>
      <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span>Powered by</span>
        {SYSTEMS.map((s, i) => (
          <span key={s}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{s}</span>
            {i < SYSTEMS.length - 1 && <span style={{ margin: '0 2px', opacity: 0.4 }}>·</span>}
          </span>
        ))}
      </span>
    </footer>
  );
}
