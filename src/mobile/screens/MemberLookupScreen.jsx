import { useState, useMemo } from 'react';
import { getAtRiskMembers, getMemberProfile } from '@/services/memberService';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { useMobileNav } from '../context/MobileNavContext';

const HEALTH_COLORS = { critical: '#EF4444', atRisk: '#F59E0B', watch: '#3B82F6', healthy: '#22C55E' };
function getHealthColor(score) {
  if (score < 30) return HEALTH_COLORS.critical;
  if (score < 50) return HEALTH_COLORS.atRisk;
  if (score < 70) return HEALTH_COLORS.watch;
  return HEALTH_COLORS.healthy;
}

function MobileMemberCard({ member, expanded, onToggle }) {
  const { showToast, addAction } = useApp();
  const color = getHealthColor(member.score);
  const profile = expanded ? getMemberProfile(member.memberId) : null;

  const quickAction = (type, label) => {
    showToast(`${label} for ${member.name}`, 'success');
    trackAction({ actionType: type, memberId: member.memberId, memberName: member.name });
    addAction?.({ description: `${label} — ${member.name}`, memberId: member.memberId, memberName: member.name, actionType: 'RETENTION_OUTREACH', source: 'Mobile Quick Action', priority: 'medium', impactMetric: `$${(member.duesAnnual || member.annualDues || 15000).toLocaleString()}/yr` });
  };

  return (
    <div
      onClick={onToggle}
      style={{
        borderRadius: '16px', background: '#fff', border: '1px solid #E5E7EB',
        overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: `${color}18`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}>
          {member.score}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F0F0F' }}>{member.name}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
            {member.archetype} · ${(member.duesAnnual || member.annualDues || 15000).toLocaleString()}/yr
          </div>
        </div>
        <span style={{ fontSize: '14px', color: '#9CA3AF' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid #F3F4F6' }}>
          {/* Status line */}
          <div style={{ fontSize: '13px', color: '#374151', padding: '10px 0', lineHeight: 1.5 }}>
            {member.topRisk && member.topRisk !== 'No current risks' && member.topRisk !== 'Monitoring'
              ? <span>⚠ {member.topRisk}</span>
              : <span style={{ color: '#22C55E' }}>✓ No current risks</span>
            }
          </div>

          {/* Profile details */}
          {profile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <InfoItem label="Member since" value={profile.joinDate ? new Date(profile.joinDate).getFullYear() : '—'} />
              <InfoItem label="Last visit" value={profile.activity?.[0]?.timestamp ? new Date(profile.activity[0].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'} />
              <InfoItem label="Archetype" value={member.archetype} />
              <InfoItem label="Annual value" value={`$${(profile.duesAnnual || 15000).toLocaleString()}`} />
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <QuickBtn icon="📞" label="Call" onClick={(e) => { e.stopPropagation(); quickAction('call', 'Call scheduled'); }} />
            <QuickBtn icon="💬" label="SMS" onClick={(e) => { e.stopPropagation(); quickAction('sms', 'SMS drafted'); }} />
            <QuickBtn icon="✉️" label="Email" onClick={(e) => { e.stopPropagation(); quickAction('email', 'Email queued'); }} />
            <QuickBtn icon="🎁" label="Comp" onClick={(e) => { e.stopPropagation(); quickAction('comp', 'Comp offer logged'); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ padding: '6px 8px', background: '#F9FAFB', borderRadius: '8px' }}>
      <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{value}</div>
    </div>
  );
}

function QuickBtn({ icon, label, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px', borderRadius: '10px', border: '1px solid #E5E7EB',
      background: '#FAFAFA', cursor: 'pointer', display: 'flex',
      alignItems: 'center', justifyContent: 'center', gap: '6px',
      fontSize: '13px', fontWeight: 600, color: '#374151',
    }}>
      {icon} {label}
    </button>
  );
}

export default function MemberLookupScreen() {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const atRisk = getAtRiskMembers();

  const filtered = useMemo(() => {
    if (!search) return atRisk.slice(0, 20);
    const q = search.toLowerCase();
    return atRisk.filter(m => m.name.toLowerCase().includes(q)).slice(0, 20);
  }, [atRisk, search]);

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <input
        type="text"
        placeholder="Search members..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        autoFocus
        style={{
          width: '100%', padding: '12px 16px', fontSize: '16px',
          border: '1px solid #E5E7EB', borderRadius: '12px',
          background: '#F9FAFB', outline: 'none', boxSizing: 'border-box',
          WebkitAppearance: 'none',
        }}
      />
      <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
        {search ? `${filtered.length} results` : `${atRisk.length} at-risk members`}
      </div>
      {filtered.map(member => (
        <MobileMemberCard
          key={member.memberId}
          member={member}
          expanded={expandedId === member.memberId}
          onToggle={() => setExpandedId(expandedId === member.memberId ? null : member.memberId)}
        />
      ))}
    </div>
  );
}
