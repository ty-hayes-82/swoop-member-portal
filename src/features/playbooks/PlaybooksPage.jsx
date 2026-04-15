import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageTransition from '@/components/ui/PageTransition';
import { useApp } from '@/context/AppContext';
import { trackAction } from '@/services/activityService';
import { useCurrentClub } from '@/hooks/useCurrentClub';
import { CATEGORY_FILTERS, CATEGORY_META } from '@/config/playbookDefinitions';

// ────────────────────────────────────────────────
// Components
// ────────────────────────────────────────────────

function PlaybookDetail({ playbook, onClose }) {
  const { showToast, addAction, dispatch } = useApp();
  const [editingSteps, setEditingSteps] = useState(false);
  const clubId = useCurrentClub();

  const customSteps = (() => {
    try {
      const all = JSON.parse(localStorage.getItem('swoop_playbook_customizations') || '{}');
      return all[playbook.id] || null;
    } catch { return null; }
  })();
  const displaySteps = customSteps || playbook.steps;

  if (editingSteps) {
    const PlaybookEditor = React.lazy(() => import('@/features/automations/PlaybookEditor'));
    return (
      <React.Suspense fallback={<div className="p-4 text-swoop-text-label">Loading editor...</div>}>
        <PlaybookEditor playbook={{ ...playbook, steps: displaySteps }} onClose={() => setEditingSteps(false)} />
      </React.Suspense>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
          <span className="text-[11px] font-bold tracking-wider text-brand-500 uppercase">Playbook</span>
          {playbook.triggeredCount > 0 && (
            <>
              <span className="bg-brand-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">TRIGGERED</span>
              <span className="text-[11px] font-semibold text-brand-500 bg-brand-500/10 px-2.5 py-0.5 rounded-md">
                Triggered for {playbook.triggeredCount} members
              </span>
            </>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-swoop-text m-0 mb-2">{playbook.name}</h2>
        <p className="text-sm text-swoop-text-muted leading-relaxed m-0">{playbook.description}</p>
      </div>

      {/* Track Record (if any) */}
      {playbook.trackRecord?.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="sm:text-right">
            <div className="text-xs text-swoop-text-label">Track record</div>
            <div className="text-base font-bold text-success-600">{playbook.trackRecord[0]?.result}</div>
            <div className="text-xs text-swoop-text-label">{playbook.trackRecord[0]?.period}</div>
          </div>
        </div>
      )}

      {/* Steps Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <div className="text-xs sm:text-[13px] text-swoop-text-label font-medium">When you activate this playbook:</div>
        <button
          onClick={() => setEditingSteps(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-swoop-border bg-transparent text-xs font-semibold text-swoop-text-muted cursor-pointer hover:bg-swoop-row-hover transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Customize Steps
          {customSteps && <span className="text-[9px] bg-brand-500 text-white px-1.5 py-px rounded-full ml-1">Customized</span>}
        </button>
      </div>

      {/* Steps */}
      {displaySteps.map((step, idx) => (
        <div key={idx} className="bg-swoop-row border border-swoop-border rounded-xl p-3 sm:p-4 lg:px-6 mb-3">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
            <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
            <span style={{ background: step.badge.bg, color: step.badge.color }} className="text-[11px] font-semibold px-2.5 py-0.5 rounded">{step.badge.text}</span>
            <span className="text-[11px] text-swoop-text-label ml-auto">{step.timing}</span>
          </div>
          <div className="font-semibold text-sm text-swoop-text mb-1">{step.title}</div>
          <div className="text-xs sm:text-[13px] text-swoop-text-muted leading-relaxed">{step.detail}</div>
        </div>
      ))}

      {/* Track Record */}
      {playbook.trackRecord?.length > 0 && (
        <div className="bg-swoop-panel border border-swoop-border rounded-xl p-4 sm:p-6 mt-6 sm:mt-8">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <span className="text-success-600 font-bold">{'\u2713'}</span>
            <span className="text-xs font-bold tracking-wider text-success-600 uppercase">Track Record</span>
          </div>
          {playbook.trackRecord.map((tr, idx) => (
            <div key={idx} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center py-2.5 gap-1 sm:gap-2 ${
              idx < playbook.trackRecord.length - 1 ? 'border-b border-swoop-border-inset' : ''
            }`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-[13px] font-semibold text-swoop-text">{tr.period}</span>
                <span className="text-[10px] sm:text-[11px] bg-swoop-row text-swoop-text-muted px-2 py-0.5 rounded">{tr.runs}</span>
                <span className="text-xs sm:text-[13px] text-swoop-text-muted">{tr.result}</span>
              </div>
              {tr.impact && <span className="text-xs sm:text-[13px] font-semibold text-success-600">{tr.impact}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Activate Button */}
      <div className="mt-6 sm:mt-8">
        <button
          onClick={() => {
            showToast(`${playbook.name} activated`, 'success');
            trackAction({ actionType: 'playbook', actionSubtype: 'activate', description: playbook.name });
            addAction({ description: `${playbook.name} activated`, actionType: 'RETENTION_OUTREACH', source: 'Playbook Engine', priority: 'high', impactMetric: '' });
            dispatch({ type: 'ACTIVATE_PLAYBOOK', id: playbook.id });

            if (clubId) {
              fetch('/api/execute-playbook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clubId,
                  playbookId: playbook.id,
                  playbookName: playbook.name,
                  memberId: 'manual_activation',
                  triggeredBy: 'GM',
                  triggerReason: playbook.description,
                  steps: (playbook.steps || []).map((s, i) => ({
                    title: s.title,
                    description: s.detail,
                    assignedTo: s.owner || null,
                    dueDays: i * 3 + 1,
                  })),
                }),
              }).catch((err) => { console.error('Playbook execution API error:', err); });
            }
            if (onClose) onClose();
          }}
          className="w-full text-white border-none py-3 sm:py-4 rounded-xl text-sm sm:text-base font-semibold cursor-pointer transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500"
          style={{ background: playbook.categoryColor || '#c0392b' }}
        >
          Activate this playbook
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Slide-over detail panel
// ────────────────────────────────────────────────

function DetailSlideOver({ playbook, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 250);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="absolute inset-0 transition-opacity duration-250"
        style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: visible ? 'blur(4px)' : 'none', opacity: visible ? 1 : 0 }}
      />
      {/* Panel */}
      <div
        className="relative w-full max-w-[600px] bg-swoop-panel shadow-2xl overflow-y-auto transition-transform duration-250 ease-out"
        style={{ transform: visible ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white/95 border-b border-swoop-border backdrop-blur-sm">
          <span className="text-[13px] font-semibold text-swoop-text-2">Playbook Details</span>
          <button
            onClick={handleClose}
            className="text-xs font-semibold text-swoop-text-muted hover:text-swoop-text-2 cursor-pointer bg-transparent border-none px-2 py-1 rounded hover:bg-swoop-row-hover transition focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            {'\u2715'} Close
          </button>
        </div>
        <div className="p-5 sm:p-6 lg:p-8">
          <PlaybookDetail playbook={playbook} onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────

export default function PlaybooksPage({ embedded = false }) {
  const [playbooks, setPlaybooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const clubId = useCurrentClub();

  // Fetch playbooks from API
  useEffect(() => {
    let cancelled = false;

    async function fetchPlaybooks() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('swoop_token') || '';
        const params = new URLSearchParams();
        if (clubId) params.set('clubId', clubId);

        const res = await fetch(`/api/playbooks?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Failed to load playbooks (${res.status})`);
        const data = await res.json();
        if (!cancelled) setPlaybooks(data.playbooks || []);
      } catch (err) {
        console.error('Playbooks fetch error:', err);
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPlaybooks();
    return () => { cancelled = true; };
  }, [clubId]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'All') return playbooks;
    return playbooks.filter(p => p.category === categoryFilter);
  }, [categoryFilter, playbooks]);

  const selectedPlaybook = selectedId ? playbooks.find(p => p.id === selectedId) : null;

  // Build category summaries
  const categorySummaries = useMemo(() => {
    const cats = {};
    for (const pb of playbooks) {
      if (!cats[pb.category]) cats[pb.category] = { count: 0, triggered: 0 };
      cats[pb.category].count++;
      cats[pb.category].triggered += pb.triggeredCount || 0;
    }
    return CATEGORY_FILTERS.slice(1).map(cat => ({
      name: cat,
      ...CATEGORY_META[cat],
      count: cats[cat]?.count || 0,
      triggered: cats[cat]?.triggered || 0,
    }));
  }, [playbooks]);

  const totalTriggers = useMemo(() => playbooks.reduce((s, p) => s + (p.triggeredCount || 0), 0), [playbooks]);

  // Group filtered playbooks by category
  const groupedPlaybooks = useMemo(() => {
    const groups = [];
    const catOrder = CATEGORY_FILTERS.slice(1);
    for (const cat of catOrder) {
      const items = filtered.filter(p => p.category === cat);
      if (items.length > 0) groups.push({ category: cat, items, meta: CATEGORY_META[cat] });
    }
    return groups;
  }, [filtered]);

  // Total runs for a playbook
  const getRuns = (pb) => {
    if (pb.runCount > 0) return `${pb.runCount}x run`;
    if (pb.trackRecord?.length > 0) {
      const total = pb.trackRecord.reduce((s, tr) => {
        const m = tr.runs.match(/(\d+)/);
        return s + (m ? parseInt(m[1], 10) : 0);
      }, 0);
      return `${total}x run`;
    }
    return '0x run';
  };

  const Wrapper = embedded ? ({ children }) => <>{children}</> : PageTransition;

  // Loading state
  if (loading) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center py-20 text-swoop-text-label">
          <div className="w-8 h-8 border-2 border-swoop-border border-t-brand-500 rounded-full animate-spin mb-4" />
          <span className="text-sm">Loading playbooks...</span>
        </div>
      </Wrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <Wrapper>
        <div className="flex flex-col items-center justify-center py-20 text-swoop-text-label">
          <span className="text-sm text-red-500 mb-2">Failed to load playbooks</span>
          <span className="text-xs text-swoop-text-label">{error}</span>
        </div>
      </Wrapper>
    );
  }

  // Empty state — no playbook activity yet
  const hasAnyActivity = playbooks.some(p => p.triggeredCount > 0);

  return (
    <Wrapper>
      <div className="flex flex-col gap-4 sm:gap-5">
        {/* Category Filter Pills */}
        <div className="overflow-x-auto -mx-1 px-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="inline-flex gap-1 bg-swoop-row rounded-lg p-0.5">
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer border-none whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-brand-500 ${
                  categoryFilter === cat
                    ? 'bg-swoop-panel text-swoop-text shadow-sm'
                    : 'bg-transparent text-swoop-text-muted hover:text-swoop-text-2'
                }`}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* Category Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {categorySummaries.map(cat => (
            <button
              key={cat.name}
              onClick={() => setCategoryFilter(prev => prev === cat.name ? 'All' : cat.name)}
              className={`flex flex-col items-start gap-1.5 p-3 sm:p-4 rounded-xl border-none cursor-pointer text-left transition-all focus-visible:ring-2 focus-visible:ring-brand-500 ${
                categoryFilter === cat.name ? 'ring-2 ring-offset-1 scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{
                background: cat.bg,
                ...(categoryFilter === cat.name ? { ringColor: cat.color } : {}),
              }}
            >
              <div className="text-lg sm:text-xl">{cat.icon}</div>
              <div className="text-[11px] sm:text-xs font-bold leading-tight" style={{ color: cat.color }}>{cat.name}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg sm:text-xl font-bold tabular-nums" style={{ color: cat.color }}>{cat.triggered}</span>
                <span className="text-[10px] sm:text-[11px] font-medium" style={{ color: cat.color }}>triggered</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-medium" style={{ color: cat.color }}>
                {cat.count} playbook{cat.count !== 1 ? 's' : ''}
              </div>
            </button>
          ))}
        </div>

        {/* Empty activity banner */}
        {!hasAnyActivity && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-sm text-amber-700 m-0">
              No playbook activity yet. Import data and activate agents to see playbooks fire.
            </p>
          </div>
        )}

        {/* Total Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-swoop-row rounded-lg text-xs text-swoop-text-muted">
          <span>Showing <strong className="text-swoop-text-2">{filtered.length} playbooks</strong> across {groupedPlaybooks.length} categories</span>
          <span><span className="font-bold text-swoop-text-2 tabular-nums">{totalTriggers}</span> total triggers</span>
        </div>

        {/* Grouped Table */}
        <div className="bg-swoop-panel border border-swoop-border rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-[1fr_120px_80px_1fr_70px] gap-2 px-4 py-2.5 bg-swoop-row border-b border-swoop-border text-[11px] font-semibold text-swoop-text-label uppercase tracking-wider">
            <div>Playbook</div>
            <div>Triggered</div>
            <div>Steps</div>
            <div>Track Record</div>
            <div className="text-right">Runs</div>
          </div>

          {/* Category Groups */}
          {groupedPlaybooks.map(group => (
            <div key={group.category}>
              {/* Category Label */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-swoop-border-inset">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: group.meta.dotColor }} />
                <span className="text-xs font-bold" style={{ color: group.meta.color }}>{group.category}</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: group.meta.bg, color: group.meta.color }}>{group.items.length}</span>
              </div>

              {/* Rows */}
              {group.items.map(pb => (
                <div
                  key={pb.id}
                  onClick={() => setSelectedId(pb.id)}
                  className={`group grid grid-cols-1 sm:grid-cols-[1fr_120px_80px_1fr_70px] gap-1 sm:gap-2 px-4 py-3 border-b border-swoop-border-inset cursor-pointer transition-colors ${
                    selectedId === pb.id
                      ? 'bg-brand-50'
                      : 'hover:bg-swoop-row-hover'
                  }`}
                >
                  {/* Playbook Name */}
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold transition-colors ${
                      selectedId === pb.id ? 'text-brand-500' : 'text-swoop-text group-hover:text-brand-500'
                    }`}>{pb.name}</span>
                    <svg className="w-3.5 h-3.5 text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* Triggered */}
                  <div className="flex items-center">
                    {pb.triggeredCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
                        </span>
                        {pb.triggeredCount} triggered
                      </span>
                    ) : (
                      <span className="text-xs text-swoop-text-label">0 triggered</span>
                    )}
                  </div>

                  {/* Steps */}
                  <div className="text-xs text-swoop-text-muted flex items-center">{pb.steps.length} steps</div>

                  {/* Track Record */}
                  <div className="text-xs text-swoop-text-muted flex items-center leading-snug">{pb.trackRecord?.[0]?.result || '\u2014'}</div>

                  {/* Runs */}
                  <div className="text-xs text-swoop-text-label text-right flex items-center justify-end sm:justify-end">{getRuns(pb)}</div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Slide-Over Detail Panel */}
        {selectedPlaybook && (
          <DetailSlideOver
            key={selectedPlaybook.id}
            playbook={selectedPlaybook}
            onClose={() => setSelectedId(null)}
          />
        )}
      </div>
    </Wrapper>
  );
}
