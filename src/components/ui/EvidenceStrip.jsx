import { theme } from '@/config/theme';

const SOURCE_ICONS = {
  'Tee Sheet': '\u26F3',
  'POS': '\uD83D\uDCB3',
  'Email': '\u2709\uFE0F',
  'GPS': '\uD83D\uDCCD',
  'CRM': '\uD83D\uDCCB',
  'Swoop App': '\uD83D\uDCF1',
  'Dining': '\uD83C\uDF7D\uFE0F',
  'Staffing': '\uD83D\uDC64',
  'Events': '\uD83C\uDF89',
  'Weather': '\u26C5',
  'Complaint': '\u26A0\uFE0F',
  'Fitness': '\uD83C\uDFCB\uFE0F',
  'Spa': '\uD83D\uDC86',
};

/**
 * EvidenceStrip — shows which data sources contributed to an insight.
 * @param {{ signals: Array<{ source: string, detail: string, timestamp?: string }>, compact?: boolean }} props
 */
export default function EvidenceStrip({ signals = [], compact = false }) {
  if (!signals.length) return null;
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: compact ? '6px' : '8px',
      padding: compact ? '6px 0' : '8px 0',
      borderTop: '1px solid ' + (theme.colors?.border || '#2d2d44'),
      marginTop: compact ? '6px' : '10px',
    }}>
      {signals.map((sig, i) => (
        <div
          key={i}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: (theme.colors?.bgCard || '#1a1a2e') + 'cc',
            border: '1px solid ' + (theme.colors?.border || '#2d2d44'),
            borderRadius: '6px',
            padding: compact ? '2px 8px' : '4px 10px',
            fontSize: compact ? '11px' : '12px',
            color: theme.colors?.textSecondary || '#a0a0b8',
          }}
          title={sig.timestamp ? sig.source + ' — ' + sig.timestamp : sig.source}
        >
          <span>{SOURCE_ICONS[sig.source] || '\uD83D\uDD17'}</span>
          <span style={{ fontWeight: 600, color: theme.colors?.textMuted || '#cbd5e0' }}>{sig.source}</span>
          {!compact && <span style={{ opacity: 0.8 }}>{sig.detail}</span>}
        </div>
      ))}
    </div>
  );
}
