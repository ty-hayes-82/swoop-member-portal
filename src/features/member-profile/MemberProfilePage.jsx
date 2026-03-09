import { useMemo } from 'react';
import { theme } from '@/config/theme';
import { MemberProfileContent } from '@/components/members/MemberProfileDrawer.jsx';
import { useMemberProfile } from '@/context/MemberProfileContext';
import { useNavigationContext } from '@/context/NavigationContext';

export default function MemberProfilePage() {
  const { profile, addStaffNote, triggerQuickAction } = useMemberProfile();
  const { navigate } = useNavigationContext();

  const fallback = useMemo(() => (
    <div style={{ padding: theme.spacing.lg }}>
      <h2 style={{ marginBottom: theme.spacing.sm }}>Member profile</h2>
      <p style={{ color: theme.colors.textSecondary }}>Select a member from any table or card to load their profile.</p>
    </div>
  ), []);

  if (!profile) return fallback;

  return (
    <div style={{ padding: theme.spacing.lg, maxWidth: 960, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('member-health')}
        style={{
          border: 'none',
          background: 'none',
          color: theme.colors.textMuted,
          cursor: 'pointer',
          fontWeight: 600,
          marginBottom: theme.spacing.md,
        }}
      >
        ← Back to Member Health
      </button>
      <MemberProfileContent
        profile={profile}
        layout="page"
        onAddNote={addStaffNote}
        onQuickAction={triggerQuickAction}
      />
    </div>
  );
}
