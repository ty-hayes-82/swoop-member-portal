const SOURCE_ICONS = {
  'Tee Sheet': '\u26F3',
  'POS': '\uD83D\uDCB3',
  'Email': '\u2709\uFE0F',
  'GPS': '\uD83D\uDCCD',
  'CRM': '\uD83D\uDCCB',
  'Member CRM': '\uD83D\uDCCB',
  'Swoop App': '\uD83D\uDCF1',
  'Dining': '\uD83C\uDF7D\uFE0F',
  'Staffing': '\uD83D\uDC64',
  'Scheduling': '\uD83D\uDCC5',
  'Events': '\uD83C\uDF89',
  'Weather': '\u26C5',
  'Complaint': '\u26A0\uFE0F',
  'Complaints': '\u26A0\uFE0F',
  'Analytics': '\uD83D\uDCCA',
  'Fitness': '\uD83C\uDFCB\uFE0F',
  'Spa': '\uD83D\uDC86',
  'All Systems': '\uD83D\uDD17',
  'Postgres': '\uD83D\uDDC4\uFE0F',
};

const SOURCE_DESCRIPTIONS = {
  'Tee Sheet': 'Round bookings, pace data, cancellation history',
  'POS': 'Dining transactions, F&B revenue, check averages',
  'Scheduling': 'Staff schedules, shift coverage, labor data',
  'Complaints': 'Member feedback, service issues, resolution status',
  'Weather': 'Daily forecasts, impact on demand and operations',
  'Member CRM': 'Member profiles, tenure, contact info, dues',
  'Email': 'Campaign opens, click rates, engagement decay',
  'Analytics': 'Health scores, engagement trends, risk signals',
  'Events': 'Event registrations, attendance, RSVPs',
  'All Systems': 'Aggregated data across all connected sources',
  'Postgres': 'Database tables, schemas, and relationships',
};

/**
 * EvidenceStrip — shows which data sources contributed to an insight.
 * Accepts either `signals` (array of {source, detail}) or `systems` (array of strings).
 */
export default function EvidenceStrip({ signals = [], systems = [], compact = false }) {
  const items = signals.length > 0
    ? signals
    : systems.map(s => ({ source: s, detail: '' }));
  if (!items.length) return null;
  return (
    <div className={`flex flex-wrap border-t border-swoop-border ${compact ? 'gap-1.5 py-1.5 mt-1.5' : 'gap-2 py-2 mt-2.5'}`}>
      {items.map((sig, i) => (
        <div
          key={i}
          className={`inline-flex items-center gap-1 bg-swoop-row border border-swoop-border rounded-lg ${
            compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
          } text-swoop-text-muted`}
          title={SOURCE_DESCRIPTIONS[sig.source] || (sig.timestamp ? sig.source + ' \u2014 ' + sig.timestamp : sig.source)}
        >
          <span>{SOURCE_ICONS[sig.source] || '\uD83D\uDD17'}</span>
          <span className="font-semibold text-swoop-text-muted">{sig.source}</span>
          {!compact && <span className="opacity-80">{sig.detail}</span>}
        </div>
      ))}
    </div>
  );
}
