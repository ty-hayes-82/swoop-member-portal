/**
 * LOITracker — Letter of Intent tracker showing 5 clubs.
 * Route: #/demo/loi-tracker
 * Target: Investor 2 (Club Owner, needs LOI evidence)
 */
import { useState } from 'react';

const LOIS = [
  {
    name: 'Whisper Rock Golf Club',
    location: 'Scottsdale, AZ',
    members: 420,
    techSpend: '$48K/yr',
    painPoint: 'No visibility into at-risk members until they resign',
    status: 'signed',
    signedDate: 'March 12, 2026',
    gmName: 'David Mercer',
    gmTitle: 'General Manager',
    quote: 'We lost 22 members last year we never saw coming. If Swoop can flag even half of those early, it pays for itself in a single save.',
  },
  {
    name: 'Grayhawk Golf Club',
    location: 'Scottsdale, AZ',
    members: 380,
    techSpend: '$62K/yr',
    painPoint: 'Disconnected systems — POS, tee sheet, CRM all siloed',
    status: 'signed',
    signedDate: 'March 19, 2026',
    gmName: 'Jennifer Walsh',
    gmTitle: 'Director of Operations',
    quote: 'We spend more on integration middleware than on actual member engagement tools. Swoop replaces three vendors with one platform.',
  },
  {
    name: 'Troon Country Club',
    location: 'Scottsdale, AZ',
    members: 550,
    techSpend: '$71K/yr',
    painPoint: 'Board wants data-driven retention strategy; GM relies on gut feel',
    status: 'signed',
    signedDate: 'March 24, 2026',
    gmName: 'Michael Torres',
    gmTitle: 'General Manager & COO',
    quote: 'My board asks me every quarter why retention dipped and I give them anecdotes. Swoop gives me the dashboards they actually want.',
  },
  {
    name: 'Desert Mountain Club',
    location: 'Scottsdale, AZ',
    members: 680,
    techSpend: '$95K/yr',
    painPoint: 'Multiple courses, no unified member engagement view',
    status: 'pending',
    signedDate: null,
    gmName: 'Robert Kim',
    gmTitle: 'VP of Member Experience',
    quote: 'With 6 courses and 680 members, we need AI that understands the whole picture. We are finalizing budget approval for Q2.',
  },
  {
    name: 'Estancia Club',
    location: 'Scottsdale, AZ',
    members: 310,
    techSpend: '$38K/yr',
    painPoint: 'Small team, no dedicated tech staff — needs turnkey solution',
    status: 'pending',
    signedDate: null,
    gmName: 'Sarah Chen',
    gmTitle: 'General Manager',
    quote: 'We are a 4-person office running a 310-member club. If it is not plug-and-play, we cannot adopt it. The demo convinced me Swoop gets that.',
  },
];

const STATUS_STYLES = {
  signed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'LOI Signed' },
  pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Pending' },
};

function LOICard({ loi }) {
  const style = STATUS_STYLES[loi.status];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-gray-900/80 border ${style.border} rounded-xl p-5 sm:p-6 space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">{loi.name}</h3>
          <p className="text-sm text-swoop-text-muted">{loi.location} &middot; {loi.members} members</p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text} self-start`}>
          {loi.status === 'signed' && (
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          )}
          {style.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-xs text-swoop-text-muted">Current Tech Spend</div>
          <div className="text-sm font-semibold text-white">{loi.techSpend}</div>
        </div>
        <div className="bg-gray-800/60 rounded-lg p-3">
          <div className="text-xs text-swoop-text-muted">Primary Pain Point</div>
          <div className="text-sm text-swoop-text-ghost">{loi.painPoint}</div>
        </div>
      </div>

      {loi.signedDate && (
        <div className="text-xs text-swoop-text-muted">Signed: {loi.signedDate}</div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-emerald-400 hover:text-emerald-300 bg-transparent border-none cursor-pointer p-0"
      >
        {expanded ? 'Hide' : 'Show'} GM Quote
      </button>

      {expanded && (
        <blockquote className="border-l-2 border-emerald-500/40 pl-4 py-2">
          <p className="text-sm text-swoop-text-ghost italic">"{loi.quote}"</p>
          <p className="text-xs text-swoop-text-muted mt-2">— {loi.gmName}, {loi.gmTitle}</p>
        </blockquote>
      )}
    </div>
  );
}

export default function LOITracker() {
  const signedCount = LOIS.filter(l => l.status === 'signed').length;
  const pendingCount = LOIS.filter(l => l.status === 'pending').length;
  const totalMembers = LOIS.reduce((s, l) => s + l.members, 0);
  const totalSpend = LOIS.reduce((s, l) => s + parseInt(l.techSpend.replace(/[^0-9]/g, '')), 0);

  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-8 sm:py-12"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 40%, #1a1a2e 100%)' }}
    >
      <button
        type="button"
        onClick={() => { window.location.hash = '#/demo/mobile-showcase'; }}
        className="absolute top-4 left-4 text-sm text-swoop-text-muted hover:text-gray-300 bg-transparent border-none cursor-pointer"
      >
        &larr; Back
      </button>

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3 pt-8">
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-500">Swoop Golf</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Letter of Intent Tracker</h1>
          <p className="text-swoop-text-label max-w-lg mx-auto">
            Pipeline of committed clubs in the Scottsdale/Phoenix private club market.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'LOIs Signed', value: signedCount, color: 'text-emerald-400' },
            { label: 'Pending', value: pendingCount, color: 'text-amber-400' },
            { label: 'Total Members', value: totalMembers.toLocaleString(), color: 'text-white' },
            { label: 'Addressable Tech Spend', value: `$${totalSpend}K/yr`, color: 'text-white' },
          ].map((kpi, i) => (
            <div key={i} className="bg-gray-900/60 border border-swoop-border rounded-lg p-4 text-center">
              <div className="text-xs text-swoop-text-muted mb-2">{kpi.label}</div>
              <div className={`text-xl sm:text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Pipeline funnel visual */}
        <div className="bg-gray-900/60 border border-swoop-border rounded-xl p-5">
          <div className="text-xs text-swoop-text-label uppercase tracking-wider mb-3">Pipeline Status</div>
          <div className="flex items-center gap-2 h-8">
            <div className="bg-emerald-500/30 border border-emerald-500/50 rounded-l-lg h-full flex items-center justify-center text-xs text-emerald-400 font-semibold" style={{ width: `${(signedCount / LOIS.length) * 100}%` }}>
              {signedCount} Signed
            </div>
            <div className="bg-amber-500/20 border border-amber-500/40 rounded-r-lg h-full flex items-center justify-center text-xs text-amber-400 font-semibold" style={{ width: `${(pendingCount / LOIS.length) * 100}%` }}>
              {pendingCount} Pending
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {LOIS.map(loi => (
            <LOICard key={loi.name} loi={loi} />
          ))}
        </div>

        <div className="text-center text-xs text-swoop-text-muted pb-8">
          Confidential — Swoop Golf Inc. Investor Pipeline
        </div>
      </div>
    </div>
  );
}
