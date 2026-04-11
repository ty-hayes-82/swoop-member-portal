import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMemberProfile } from '@/services/memberService';
import { useApp } from '@/context/AppContext';
import { useNavigationContext } from '@/context/NavigationContext';
import { trackAction, checkRecentOutreach } from '@/services/activityService';
import { apiFetch } from '@/services/apiClient';

const MemberProfileContext = createContext(null);

// Normalize API response to match drawer field expectations
function normalizeApiProfile(data) {
  if (!data?.member) return null;
  const m = data.member;
  const c = data.contact ?? {};
  const f = data.financials ?? {};

  return {
    memberId: m.id,
    name: m.name,
    initials: m.initials,
    tier: m.membershipType,
    joinDate: m.joinDate,
    status: m.status,
    archetype: m.archetype,
    healthScore: m.healthScore,
    scoreDelta: m.scoreDelta,
    healthTrend: m.healthTrend,
    trend: (data.engagementHistory ?? []).map((w) => w.score),
    duesAnnual: f.annualDues,
    memberValueAnnual: f.ytdTotal || f.annualDues,
    lastSeenLocation: c.lastSeenLocation ?? c.lastVisitLocation ?? null,
    contact: {
      phone: c.phone,
      email: c.email,
      preferredChannel: c.preferredChannel,
      lastOutreach: c.lastOutreach,
      lastVisitDate: c.lastVisitDate,
      daysSinceLastVisit: c.daysSinceLastVisit,
    },
    family: data.family ?? [],
    preferences: data.preferences ?? {},
    activity: (data.activityTimeline ?? []).map((a) => ({
      id: a.id,
      type: a.type,
      detail: a.description ?? a.detail,
      timestamp: a.date,
    })),
    riskSignals: (data.riskSignals ?? []).map((s) => ({
      id: s.id,
      label: s.label ?? s.detail,
      source: s.source ?? 'Analytics',
      confidence: s.confidence ?? (s.severity === 'critical' ? 'High' : 'Medium'),
      timestamp: s.timestamp ?? s.date,
    })),
    staffNotes: (data.notes ?? []).map((n) => ({
      id: n.id,
      author: n.owner ?? n.author ?? 'Staff',
      department: n.department ?? 'General',
      text: n.note ?? n.text,
      timestamp: n.date ?? n.timestamp,
    })),
    keyMetrics: data.keyMetrics ?? [],
    healthTimeline: data.healthTimeline ?? [],
    financials: f,
    invoices: data.invoices ?? null,
  };
}

export function MemberProfileProvider({ children }) {
  const { showToast, addAction, approveAction } = useApp();
  const { navigate } = useNavigationContext();
  const [drawerMemberId, setDrawerMemberId] = useState(null);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [staffNotes, setStaffNotes] = useState({});
  const [apiProfile, setApiProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const activeMemberId = drawerMemberId;

  // Fetch from API when member changes
  useEffect(() => {
    if (!activeMemberId) {
      setApiProfile(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const authToken = localStorage.getItem('swoop_auth_token');
    fetch(`/api/member-detail?id=${encodeURIComponent(activeMemberId)}`, {
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setApiProfile(normalizeApiProfile(data));
        } else {
          // Fallback to static service
          setApiProfile(null);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setApiProfile(null);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [activeMemberId]);

  // Known seed profile IDs — static data is authoritative for these
  const SEED_IDS = new Set(['mbr_t01', 'mbr_t04', 'mbr_t05', 'mbr_t06', 'mbr_312']);

  const profile = useMemo(() => {
    if (!activeMemberId) return null;

    // For seed profiles, always prefer static data (DB may have stale/mismatched records)
    // For all others, try API first, then fall back to static service
    const staticProfile = getMemberProfile(activeMemberId);
    const base = SEED_IDS.has(activeMemberId) && staticProfile
      ? staticProfile
      : (apiProfile ?? staticProfile);
    if (!base) return null;

    const appendedNotes = staffNotes[activeMemberId] ?? [];
    return {
      ...base,
      staffNotes: [...(base.staffNotes ?? []), ...appendedNotes],
    };
  }, [activeMemberId, apiProfile, staffNotes]);

  const openProfile = useCallback((memberId) => {
    if (!memberId) return;
    setDrawerMemberId(memberId);
    setDrawerOpen(true);
  }, []);

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
      trackAction({ actionType: 'note', actionSubtype: 'staff', memberId, memberName: null, description: note.text });
    },
    [showToast]
  );

  const triggerQuickAction = useCallback(
    async (memberId, actionType) => {
      if (!memberId) return;
      const memberName = profile?.name ?? 'Member';
      const memberEmail = profile?.contact?.email || '';
      const memberPhone = profile?.contact?.phone || '';

      // Warn if member was recently contacted
      if (['email', 'sms', 'call', 'comp'].includes(actionType)) {
        const check = checkRecentOutreach(memberId);
        if (check.recentlyContacted) {
          showToast?.(`Heads up: ${memberName} was contacted ${check.hoursAgo}h ago (${check.lastContact?.type})`, 'warning');
        }
      }

      // Route email and SMS through AI draft + approveAction flow
      if (actionType === 'email' || actionType === 'sms') {
        const actionId = `quick_${actionType}_${Date.now()}`;
        showToast?.('Generating draft...', 'info');
        trackAction({ actionType, memberId, memberName });
        // Add to inbox so the action has a record, then approve with skipCloudSend
        // to avoid a 404 from /api/execute-action (this ID doesn't exist in the DB)
        addAction?.({ description: `${actionType === 'email' ? 'Email' : 'SMS'} outreach — ${memberName}`, memberId, memberName, actionType: 'RETENTION_OUTREACH', source: 'Quick Action', priority: 'medium', impactMetric: `${actionType} sent` });
        approveAction?.(actionId, {
          executionType: actionType,
          memberId,
          memberName,
          memberEmail,
          memberPhone,
          skipCloudSend: true,
        });
        return;
      }

      const label =
        actionType === 'call'
          ? 'Call scheduled'
          : actionType === 'comp'
          ? 'Comp offer logged'
          : 'Action captured';
      showToast?.(`${label} for ${memberName}`, 'success');
      trackAction({ actionType, memberId, memberName });
      addAction?.({ description: `${label} — ${memberName}`, memberId, memberName, actionType: 'RETENTION_OUTREACH', source: 'Quick Action', priority: 'medium', impactMetric: label });
    },
    [showToast, profile, addAction, approveAction]
  );

  return (
    <MemberProfileContext.Provider
      value={{
        profile,
        activeMemberId,
        isDrawerOpen,
        loading,
        openProfile,
        openProfilePage: (memberId) => {
          closeDrawer();
          navigate('member-profile', { memberId: memberId || activeMemberId });
        },
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
