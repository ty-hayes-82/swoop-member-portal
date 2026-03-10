import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate as useRouterNavigate } from 'react-router-dom';
import { getMemberProfile } from '@/services/memberService';
import { useApp } from '@/context/AppContext';

const MemberProfileContext = createContext(null);

export function MemberProfileProvider({ children }) {
  const { showToast } = useApp();
  const routerNavigate = useRouterNavigate();
  const [drawerMemberId, setDrawerMemberId] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [staffNotes, setStaffNotes] = useState({});

  const activeMemberId = drawerMemberId;

  const profile = useMemo(() => {
    if (!activeMemberId) return null;
    const base = getMemberProfile(activeMemberId);
    if (!base) return null;
    const appendedNotes = staffNotes[activeMemberId] ?? [];
    return {
      ...base,
      staffNotes: [...(base.staffNotes ?? []), ...appendedNotes],
    };
  }, [activeMemberId, staffNotes]);

  const openProfile = useCallback(
    (memberId, options = {}) => {
      if (!memberId) return;
      const mode = options.mode ?? 'drawer';
      if (mode === 'page') {
        routerNavigate(`/member/${memberId}`);
        setDrawerOpen(false);
        return;
      }
      setDrawerMemberId(memberId);
      setDrawerOpen(true);
    },
    [routerNavigate]
  );

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const addStaffNote = useCallback(
    (memberId, note) => {
      if (!memberId || !note?.text) return;
      setStaffNotes((prev) => ({
        ...prev,
        [memberId]: [
          ...(prev[memberId] ?? []),
          {
            id: `note_${Date.now()}`,
            author: note.author ?? 'GM Team',
            department: note.department ?? 'General',
            text: note.text,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      showToast?.('Staff note added', 'success');
    },
    [showToast]
  );

  const triggerQuickAction = useCallback(
    (memberId, actionType) => {
      if (!memberId) return;
      const memberName = getMemberProfile(memberId)?.name ?? 'Member';
      const label =
        actionType === 'call'
          ? 'Call scheduled'
          : actionType === 'email'
          ? 'Email draft queued'
          : actionType === 'sms'
          ? 'SMS drafted'
          : actionType === 'comp'
          ? 'Comp offer logged'
          : 'Action captured';
      showToast?.(`${label} for ${memberName}`, 'success');
    },
    [showToast]
  );

  return (
    <MemberProfileContext.Provider
      value={{
        profile,
        activeMemberId,
        isDrawerOpen,
        openProfile,
        openProfilePage: (memberId) => openProfile(memberId, { mode: 'page' }),
        closeDrawer,
        addStaffNote,
        triggerQuickAction,
      }}
    >
      {children}
    </MemberProfileContext.Provider>
  );
}

export const useMemberProfile = () => {
  const ctx = useContext(MemberProfileContext);
  if (!ctx) throw new Error('useMemberProfile must be used within MemberProfileProvider');
  return ctx;
};
