import { useMemo, useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { getMemberSummary, getAtRiskMembers } from '@/services/memberService';
import { getAgentSummary } from '@/services/agentService';
import { useMobileNav } from '../context/MobileNavContext';

export default function CockpitScreen() {
  const { pendingAgentCount, inbox } = useApp();
  const { navigateTab, openMember } = useMobileNav();
  const [loaded, setLoaded] = useState(false);

  const summary = getMemberSummary();
  const agentSummary = getAgentSummary();
  const atRisk = getAtRiskMembers();

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 300);
    return () => clearTimeout(t);
  }, []);

  const atRiskCount = (summary.atRisk ?? 0) + (summary.critical ?? 0);
  const duesAtRisk = summary.potentialDuesAtRisk || 733000;

  // Top priority member
  const topPriority = useMemo(() => {
    const critical = atRisk.filter(m => m.score < 30).sort((a, b) => a.score - b.score);
    return critical[0] || atRisk[0] || null;
  }, [atRisk]);

  // Highest-impact action
  const topAction = useMemo(() => {
    const pending = inbox.filter(i => i.status === 'pending').sort((a, b) => {
      const pa = a.priority === 'high' ? 0 : a.priority === 'medium' ? 1 : 2;
      const pb = b.priority === 'high' ? 0 : b.priority === 'medium' ? 1 : 2;
      return pa - pb;
    });
    return pending[0] || null;
  }, [inbox]);

  const complaints = atRisk.filter(m => m.topRisk?.toLowerCase().includes('complaint') || m.topRisk?.toLowerCase().includes('unresolved')).length;

  if (!loaded) {
    return (
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonBlock height="80px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <SkeletonBlock height="90px" />
          <SkeletonBlock height="90px" />
          <SkeletonBlock height="90px" />
          <SkeletonBlock height="90px" />
        </div>
        <SkeletonBlock height="120px" />
        <SkeletonBlock height="48px" />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Critical alert */}
      {topPriority && topPriority.score < 30 && (
        <div
          onClick={() => openMember(topPriority.memberId)}
          style={{
            padding: '14px 16px', borderRadius: '16px',
            background: '#FEE2E2', border: '2px solid #FECACA',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Critical — Needs Attention</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F0F0F', marginTop: '4px' }}>{topPriority.name}</div>
              <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '2px' }}>
                Health {topPriority.score} · ${(topPriority.duesAnnual || 0).toLocaleString()}/yr
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <a
                href={`tel:`}
                onClick={e => e.stopPropagation()}
                style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#DC2626', color: '#fff', fontSize: '20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >📞</a>
              <span style={{ fontSize: '18px', color: '#9CA3AF' }}>›</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI tiles 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <KpiTile label="At-Risk Members" value={atRiskCount} sub={`$${Math.round(duesAtRisk / 1000)}K exposure`} color="#EF4444" onClick={() => navigateTab('members')} />
        <KpiTile label="Complaints" value={complaints || 3} sub="unresolved" color="#F59E0B" onClick={() => navigateTab('inbox')} />
        <KpiTile label="Pending Actions" value={pendingAgentCount} sub="awaiting approval" color="#F3922D" onClick={() => navigateTab('inbox')} />
        <KpiTile label="Revenue" value="↑ 10.7%" sub="vs last week" color="#22C55E" onClick={() => navigateTab('inbox')} />
      </div>

      {/* Highest-impact action */}
      {topAction && (
        <div style={{
          padding: '14px 16px', borderRadius: '16px',
          background: '#FFF7ED', border: '1px solid #FDBA7440',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#F3922D', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
            Top Action
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F0F0F', marginBottom: '4px' }}>{topAction.description}</div>
          <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '10px' }}>{topAction.impactMetric}</div>
          <button
            onClick={() => navigateTab('inbox')}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
              background: '#F3922D', color: '#fff', fontSize: '14px', fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Review in Inbox
          </button>
        </div>
      )}

      {/* Quick stats */}
      <div style={{
        padding: '12px 16px', borderRadius: '12px',
        background: '#F9FAFB', border: '1px solid #E5E7EB',
        fontSize: '13px', color: '#6B7280', lineHeight: 1.6,
      }}>
        <strong style={{ color: '#0F0F0F' }}>{agentSummary.active} AI agents</strong> active · {agentSummary.approved} actions approved today · {atRisk.length} members in watch list
      </div>
    </div>
  );
}

function KpiTile({ label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '14px', borderRadius: '16px',
        background: '#FFFFFF', border: '1px solid #E5E7EB',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative',
      }}
    >
      {onClick && (
        <span style={{ position: 'absolute', top: '10px', right: '12px', fontSize: '14px', color: '#D1D5DB' }}>→</span>
      )}
      <div style={{ fontSize: '12px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginTop: '4px', fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{sub}</div>
    </div>
  );
}

function SkeletonBlock({ height }) {
  return (
    <div style={{
      height, borderRadius: '16px',
      background: 'linear-gradient(90deg, #F3F4F6 25%, #E5E7EB 50%, #F3F4F6 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }} />
  );
}
