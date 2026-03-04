import { CLUB_NAME } from '@/config/constants.js';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '10px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Swoop Golf · Integrated Intelligence for Private Clubs
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Simulated Data · {CLUB_NAME} · January 2026
      </span>
    </footer>
  );
}
