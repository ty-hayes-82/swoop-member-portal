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
        Swoop Golf &middot; Integrated Intelligence for Private Clubs
      </span>
      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
        Simulated Data &middot; {CLUB_NAME} &middot; January 2026 &middot; Powered by ForeTees &middot; Jonas POS &middot; Northstar &middot; ClubReady &middot; Club Prophet
      </span>
    </footer>
  );
}
