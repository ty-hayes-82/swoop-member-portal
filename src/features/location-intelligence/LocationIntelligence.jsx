import { useMemo, useState } from 'react';
import { theme } from '@/config/theme';
import OnlySwoopModule from '@/components/ui/OnlySwoopModule.jsx';
import { onlySwoopAngles } from '@/data/onlySwoopAngles.js';
import ClubMap from './ClubMap.jsx';
import { getLiveMemberLocations, getServiceRecoveryAlerts, getStaffLocations, getZoneDensity } from '@/services/locationService';
import { StoryHeadline, SoWhatCallout } from '@/components/ui';
import MemberLink from '@/components/MemberLink.jsx';
import { useApp } from '@/context/AppContext';
import { useMemberProfile } from '@/context/MemberProfileContext';

const HEALTH_LABELS = {
  healthy: 'Healthy',
  watch: 'Watch',
  'at-risk': 'At-Risk',
  critical: 'Critical',
};

const HEALTH_COLORS = {
  healthy: theme.colors.success,
  watch: theme.colors.warning,
  'at-risk': theme.colors.urgent,
  critical: '#8E1C17',
};

const STAFF_STATUS_COLORS = {
  Available: theme.colors.success,
  'With member': theme.colors.warning,
  'On radio': theme.colors.accent,
};

function distanceInFeet(from, to) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusMeters = 6371000;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLat = lat2 - lat1;
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = earthRadiusMeters * c;
  return Math.round(meters * 3.28084);
}

function StatCard({ label, value, accent, sub }) {
  return (
    <div style={{
      background: theme.colors.bgCard,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <span style={{ fontSize: theme.fontSize.xxl, fontFamily: theme.fonts.mono, fontWeight: 700, color: accent }}>{value}</span>
      {sub && <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>{sub}</span>}
    </div>
  );
}

export default function LocationIntelligence() {
  const members = useMemo(() => {
    const next = getLiveMemberLocations();
    return Array.isArray(next) ? next : [];
  }, []);
  const staffMembers = useMemo(() => {
    const next = getStaffLocations();
    return Array.isArray(next) ? next : [];
  }, []);
  const alertsFeed = useMemo(() => {
    const next = getServiceRecoveryAlerts();
    return Array.isArray(next) ? next : [];
  }, []);
  const zoneAnalytics = useMemo(() => {
    const next = getZoneDensity(members);
    return Array.isArray(next) ? next : [];
  }, [members]);
  const { showToast } = useApp();
  const { openProfile } = useMemberProfile();
  const [mapMode, setMapMode] = useState('live');
  const [selectedMemberId, setSelectedMemberId] = useState(() => members.find((m) => m.needsAttention)?.memberId ?? members[0]?.memberId ?? null);

  const onsiteCount = members.length;
  const atRiskCount = members.filter((member) => member.status === 'at-risk' || member.status === 'critical').length;
  const attentionCount = members.filter((member) => member.needsAttention).length;

  const densityByZone = useMemo(() => {
    const counts = {};
    members.forEach((member) => {
      counts[member.zoneId] = (counts[member.zoneId] || 0) + 1;
    });
    return counts;
  }, [members]);

  const selectedMember = useMemo(() => members.find((member) => member.memberId === selectedMemberId) ?? null, [members, selectedMemberId]);

  const handleQuickAction = (action) => {
    if (!selectedMember) return;
    if (action === 'dispatch') {
      const nearestStaff = staffMembers.reduce((closest, staff) => {
        const distanceFeet = distanceInFeet(selectedMember, staff);
        if (!closest || distanceFeet < closest.distanceFeet) {
          return { staff, distanceFeet };
        }
        return closest;
      }, null);
      if (nearestStaff) {
        showToast(
          `Dispatched ${nearestStaff.staff.name} (${nearestStaff.staff.role}) · ${nearestStaff.distanceFeet} ft away · ${nearestStaff.staff.etaText}`,
          'success'
        );
      }
      return;
    }
    const message = action === 'message'
      ? `Drafted SMS update for ${selectedMember.name}.`
      : `Opening profile for ${selectedMember.name}.`;
    showToast(message, 'info');
    if (action === 'profile') {
      openProfile(selectedMember.memberId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
      <OnlySwoopModule {...onlySwoopAngles.locationIntelligence} />
      <StoryHeadline
        variant="insight"
        headline="Know who is on property right now — and who needs attention before they leave."
        context="47 members are on site this morning. Three are at-risk, two have active service-recovery opportunities, and alerts fire the moment they cross a zone."
      />
      <div style={{
        background: `${theme.colors.warning}12`,
        border: `1px solid ${theme.colors.warning}60`,
        borderRadius: theme.radius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        color: theme.colors.textSecondary,
        fontSize: theme.fontSize.sm,
      }}>
        Demo environment: location signals are simulated. Connect the Swoop member app GPS feed to enable live operational intelligence.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px,1fr))', gap: theme.spacing.md }}>
        <StatCard label="Members on property" value={onsiteCount} accent={theme.colors.accent} sub="Live via Swoop app GPS" />
        <StatCard label="At-risk onsite" value={atRiskCount} accent={theme.colors.urgent} sub="Needs proactive engagement" />
        <StatCard label="Service alerts" value={attentionCount} accent={theme.colors.warning} sub="Actionable right now" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(320px, 1fr)', gap: theme.spacing.lg, alignItems: 'start' }}>
        <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.lg, padding: theme.spacing.md, minHeight: 520 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm, flexWrap: 'wrap', gap: theme.spacing.sm }}>
            <h3 style={{ margin: 0, fontSize: theme.fontSize.lg }}>Live club map</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <div style={{ display: 'inline-flex', border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, overflow: 'hidden' }}>
                {[
                  { key: 'live', label: 'Live' },
                  { key: 'historical', label: 'Historical (typical Monday)' },
                ].map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setMapMode(option.key)}
                    style={{
                      border: 'none',
                      background: mapMode === option.key ? theme.colors.accent : 'transparent',
                      color: mapMode === option.key ? theme.colors.white : theme.colors.textSecondary,
                      fontSize: theme.fontSize.xs,
                      fontWeight: 600,
                      padding: '8px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {Object.entries(HEALTH_LABELS).map(([status, label]) => (
                  <span key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: HEALTH_COLORS[status] }} />
                    {label}
                  </span>
                ))}
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: theme.fontSize.xs, color: theme.colors.textSecondary }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: theme.colors.accent }} />
                  Staff on duty
                </span>
              </div>
            </div>
          </div>
          <div style={{ width: '100%', height: 500, position: 'relative' }}>
            <ClubMap
              members={members}
              staffMembers={staffMembers}
              selectedMemberId={selectedMemberId}
              onSelectMember={setSelectedMemberId}
              densityByZone={densityByZone}
            />
            {mapMode === 'historical' && (
              <div style={{
                position: 'absolute',
                left: theme.spacing.md,
                bottom: theme.spacing.md,
                background: 'rgba(5, 22, 40, 0.9)',
                color: theme.colors.white,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                padding: theme.spacing.sm,
                maxWidth: 360,
                backdropFilter: 'blur(2px)',
              }}>
                <div style={{ fontSize: theme.fontSize.sm, fontWeight: 700, marginBottom: 4 }}>Typical Monday flow</div>
                <div style={{ fontSize: theme.fontSize.xs, opacity: 0.9 }}>6:30-8:30 AM: Pro Shop and range surge (+42%).</div>
                <div style={{ fontSize: theme.fontSize.xs, opacity: 0.9 }}>11:45 AM-1:15 PM: Grill Room lunch wave (+37%).</div>
                <div style={{ fontSize: theme.fontSize.xs, opacity: 0.9 }}>4:00-6:00 PM hotspot: Clubhouse lounge, board-member cluster.</div>
              </div>
            )}
          </div>
          {members.length === 0 && (
            <div style={{
              marginTop: theme.spacing.sm,
              fontSize: theme.fontSize.sm,
              color: theme.colors.textMuted,
              border: `1px dashed ${theme.colors.border}`,
              borderRadius: theme.radius.sm,
              padding: theme.spacing.sm,
            }}>
              Location intelligence is available when member app GPS is connected.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {selectedMember && (
            <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm }}>
                <div>
                  <MemberLink memberId={selectedMember.memberId} style={{ fontSize: theme.fontSize.md, fontWeight: 700 }}>
                    {selectedMember.name}
                  </MemberLink>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{selectedMember.timeInZone}</div>
                </div>
                <span style={{ fontSize: theme.fontSize.sm, fontFamily: theme.fonts.mono, color: HEALTH_COLORS[selectedMember.status] || theme.colors.textSecondary }}>
                  Score {selectedMember.healthScore}
                </span>
              </div>
              <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginTop: theme.spacing.sm }}>
                {selectedMember.recommendedAction}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: theme.spacing.sm, flexWrap: 'wrap' }}>
                <button onClick={() => handleQuickAction('dispatch')} style={{ flex: 1, minWidth: 120, border: 'none', borderRadius: theme.radius.sm, background: theme.colors.accent, color: theme.colors.white, fontWeight: 700, padding: '8px 10px', cursor: 'pointer' }}>
                  Dispatch staff
                </button>
                <button onClick={() => handleQuickAction('message')} style={{ flex: 1, minWidth: 120, borderRadius: theme.radius.sm, border: `1px solid ${theme.colors.border}`, background: 'transparent', color: theme.colors.textPrimary, fontWeight: 600, padding: '8px 10px', cursor: 'pointer' }}>
                  Send SMS
                </button>
                <button onClick={() => handleQuickAction('profile')} style={{ flexBasis: '100%', border: 'none', borderRadius: theme.radius.sm, background: theme.colors.bgDeep, color: theme.colors.textSecondary, fontWeight: 600, padding: '8px 10px', cursor: 'pointer' }}>
                  View full profile →
                </button>
              </div>
            </div>
          )}

          <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: theme.fontSize.sm, letterSpacing: '0.05em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Staff on duty</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {staffMembers.map((staff) => (
                <div key={staff.id} style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '8px 10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600 }}>{staff.name}</div>
                      <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{staff.role} · {staff.zone}</div>
                    </div>
                    <span style={{ fontSize: theme.fontSize.xs, color: STAFF_STATUS_COLORS[staff.status] || theme.colors.textSecondary }}>
                      {staff.status}
                    </span>
                  </div>
                  <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, marginTop: 4 }}>{staff.etaText}</div>
                </div>
              ))}
              {staffMembers.length === 0 && (
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>
                  No staff presence detected yet.
                </div>
              )}
            </div>
          </div>

          <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: theme.fontSize.sm, letterSpacing: '0.05em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Zone density</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {zoneAnalytics.map((zone) => {
                const percent = onsiteCount > 0 ? Math.round((zone.count / onsiteCount) * 100) : 0;
                return (
                  <div key={zone.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.sm, fontWeight: 600 }}>
                      <span>{zone.label}</span>
                      <span>{zone.count} • {zone.dwell}</span>
                    </div>
                    <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginBottom: 4 }}>Peak {zone.peak}</div>
                    <div style={{ height: 6, borderRadius: 999, background: theme.colors.border }}>
                      <div style={{ width: `${percent}%`, height: '100%', borderRadius: 999, background: theme.colors.accent }} />
                    </div>
                  </div>
                );
              })}
              {zoneAnalytics.length === 0 && (
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>
                  Waiting for zone analytics data.
                </div>
              )}
            </div>
          </div>

          <div style={{ background: theme.colors.bgCard, border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.md, padding: theme.spacing.md }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: theme.fontSize.sm, letterSpacing: '0.05em', textTransform: 'uppercase', color: theme.colors.textMuted }}>Live alerts</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertsFeed.map((alert) => (
                <div key={alert.id} style={{
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: '10px 12px',
                  background: alert.severity === 'high' ? `${theme.colors.warning}10` : theme.colors.bgCard,
                  animation: alert.severity === 'high' ? 'location-alert-pulse 2.2s ease-in-out infinite' : 'none',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>
                    <span>{alert.timestamp}</span>
                    <span>{alert.severity.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, margin: '4px 0' }}>{alert.title}</div>
                  <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary }}>{alert.detail}</div>
                  {alert.memberId && (
                    <MemberLink memberId={alert.memberId} style={{ fontSize: theme.fontSize.xs, marginTop: 6 }}>
                      Open profile →
                    </MemberLink>
                  )}
                </div>
              ))}
              {alertsFeed.length === 0 && (
                <div style={{ fontSize: theme.fontSize.sm, color: theme.colors.textMuted }}>
                  No live alerts at the moment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SoWhatCallout variant="opportunity">
        Location Intelligence converts passive GPS pings into immediate actions: identify who is on property, route staff proactively, and prove interventions in minutes instead of hours.
      </SoWhatCallout>
      <style>{`
        @keyframes location-alert-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(243,146,45,0.0); }
          50% { box-shadow: 0 0 0 6px rgba(243,146,45,0.14); }
        }
      `}</style>
    </div>
  );
}
