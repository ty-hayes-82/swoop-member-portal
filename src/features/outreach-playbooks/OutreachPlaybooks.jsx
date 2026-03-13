import { useState, useMemo } from 'react';
import { theme } from '@/config/theme';
import { memberArchetypes } from '@/data/members';
import {
  outreachCategories,
  defaultOutreachActions,
  archetypePlaybooks,
  getActionsForArchetype,
  getAllActionsForArchetype,
} from '@/data/outreach';
import PageTransition from '@/components/ui/PageTransition';
import { StoryHeadline } from '@/components/ui';

const EFFORT_BADGE = {
  low: { label: 'Low Effort', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  medium: { label: 'Medium', color: '#ca8a04', bg: 'rgba(202,138,4,0.08)' },
  high: { label: 'High Effort', color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
};
const IMPACT_BADGE = {
  medium: { label: 'Medium Impact', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  high: { label: 'High Impact', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  'very-high': { label: 'Very High', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
};

function ActionCard({ action, isRecommended, onDeploy }) {
  const [hovered, setHovered] = useState(false);
  const category = outreachCategories.find(c => c.key === action.category);
  const effort = EFFORT_BADGE[action.effort] || EFFORT_BADGE.medium;
  const impact = IMPACT_BADGE[action.impact] || IMPACT_BADGE.medium;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#fafbff' : '#fff',
        border: isRecommended ? '1px solid rgba(37,99,235,0.25)' : '1px solid #e4e4e7',
        borderRadius: '12px',
        padding: '20px',
        transition: 'all 0.2s',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {isRecommended && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #2563eb, #7c3aed)',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '10px',
          background: category ? category.color + '12' : '#f4f4f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', flexShrink: 0,
          border: `1px solid ${category ? category.color + '25' : '#e4e4e7'}`,
        }}>
          {category?.icon || '\u2728'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f0f0f' }}>{action.label}</span>
            {isRecommended && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#2563eb', background: 'rgba(37,99,235,0.08)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommended
              </span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5, margin: '0 0 12px' }}>
            {action.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: effort.color, background: effort.bg, padding: '3px 8px', borderRadius: '4px' }}>
              {effort.label}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: impact.color, background: impact.bg, padding: '3px 8px', borderRadius: '4px' }}>
              {impact.label}
            </span>
            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>{'\u2022'} {action.defaultOwner}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutreachPlaybooks() {
  const [selectedArchetype, setSelectedArchetype] = useState('Die-Hard Golfer');
  const [showAll, setShowAll] = useState(false);

  const playbook = archetypePlaybooks[selectedArchetype];
  const recommended = useMemo(() => getActionsForArchetype(selectedArchetype), [selectedArchetype]);
  const allActions = useMemo(() => getAllActionsForArchetype(selectedArchetype), [selectedArchetype]);
  const additionalActions = useMemo(
    () => allActions.filter(a => !recommended.find(r => r.id === a.id)),
    [allActions, recommended]
  );
  const archData = memberArchetypes.find(a => a.archetype === selectedArchetype);

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <StoryHeadline
          variant="info"
          headline="Every archetype needs a different playbook. Choose the right touch for the right member."
          context="Outreach actions are prioritized by archetype based on engagement patterns. Customize the playbook for your club's culture."
        />

        {/* Archetype Selector */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7', borderRadius: '14px',
          padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Select Archetype
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {memberArchetypes.map(arch => {
              const isActive = selectedArchetype === arch.archetype;
              return (
                <button
                  key={arch.archetype}
                  onClick={() => { setSelectedArchetype(arch.archetype); setShowAll(false); }}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: isActive ? '2px solid #2563eb' : '1px solid #e4e4e7',
                    background: isActive ? 'rgba(37,99,235,0.06)' : '#fafafa',
                    color: isActive ? '#2563eb' : '#3f3f46',
                    boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                  }}
                >
                  {arch.archetype}
                  <span style={{ fontSize: '11px', color: isActive ? '#2563eb' : '#a1a1aa', marginLeft: '6px' }}>
                    ({arch.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Archetype Profile + Playbook */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7', borderRadius: '14px',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {/* Profile Header */}
          <div style={{
            padding: '24px 28px', borderBottom: '1px solid #e4e4e7',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.03), rgba(124,58,237,0.02))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0f0f', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {selectedArchetype}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  {playbook?.description || 'Select an archetype to see the recommended playbook.'}
                </p>
              </div>
              {archData && (
                <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f0f0f', fontFamily: "'JetBrains Mono', monospace" }}>{archData.count}</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                      color: archData.trend >= 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {archData.trend >= 0 ? '+' : ''}{archData.trend}
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trend</div>
                  </div>
                </div>
              )}
            </div>
            {archData && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {[
                  { label: 'Golf', value: archData.golf, color: '#16a34a' },
                  { label: 'Dining', value: archData.dining, color: '#f59e0b' },
                  { label: 'Events', value: archData.events, color: '#7c3aed' },
                  { label: 'Email', value: archData.email, color: '#2563eb' },
                ].map(stat => (
                  <div key={stat.label} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{stat.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</span>
                    </div>
                    <div style={{ height: '4px', background: '#f4f4f5', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: stat.value + '%', background: stat.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Actions */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f0f', margin: '0 0 4px' }}>
                  Recommended Playbook
                </h3>
                <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
                  Top {recommended.length} actions for {selectedArchetype} members, ordered by effectiveness
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#2563eb', background: 'rgba(37,99,235,0.06)', padding: '4px 12px', borderRadius: '6px' }}>
                {recommended.length} actions
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recommended.map((action, idx) => (
                <div key={action.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: idx === 0 ? '#2563eb' : idx === 1 ? '#7c3aed' : '#e4e4e7',
                    color: idx < 2 ? '#fff' : '#6b7280',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 700, flexShrink: 0, marginTop: '8px',
                  }}>
                    {idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <ActionCard action={action} isRecommended={idx < 2} />
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Actions Toggle */}
            {additionalActions.length > 0 && (
              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={() => setShowAll(!showAll)}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '10px',
                    border: '1px dashed #d4d4d8', background: showAll ? '#fafafa' : '#fff',
                    color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {showAll ? 'Hide' : 'Show'} {additionalActions.length} more available actions
                </button>
                {showAll && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                    {additionalActions.map(action => (
                      <ActionCard key={action.id} action={action} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* All Actions Reference */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7', borderRadius: '14px',
          padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f0f', margin: '0 0 4px' }}>
            All Outreach Actions
          </h3>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 16px' }}>
            Full library of {defaultOutreachActions.length} actions across all categories. Customize per archetype above.
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {outreachCategories.map(cat => {
              const catActions = defaultOutreachActions.filter(a => a.category === cat.key);
              return (
                <div key={cat.key} style={{ borderRadius: '10px', border: '1px solid #f4f4f5', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: cat.color }}>{cat.label}</span>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>({catActions.length})</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {catActions.map(a => (
                      <span key={a.id} style={{
                        fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                        background: '#f4f4f5', color: '#3f3f46', fontWeight: 500,
                      }}>
                        {a.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
