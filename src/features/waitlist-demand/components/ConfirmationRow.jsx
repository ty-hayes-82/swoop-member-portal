import { useState } from 'react';
import MemberLink from '@/components/MemberLink.jsx';
import { Badge, Btn } from '@/components/ui';
import { theme } from '@/config/theme';

const STATUS_STYLES = {
  pending: { text: 'Pending', variant: 'effort' },
  contacted: { text: 'Contacted', variant: 'timeline' },
  confirmed: { text: 'Confirmed', variant: 'success' },
  cancelled: { text: 'Cancelled', variant: 'urgent' },
  no_response: { text: 'No Response', variant: 'warning' },
};

const probabilityStyle = (p) => {
  if (p < 0.3) return { color: theme.colors.success, bg: `${theme.colors.success}12`, border: `${theme.colors.success}2E` };
  if (p <= 0.6) return { color: theme.colors.warning, bg: `${theme.colors.warning}14`, border: `${theme.colors.warning}2E` };
  return { color: theme.colors.urgent, bg: `${theme.colors.urgent}14`, border: `${theme.colors.urgent}33` };
};

export default function ConfirmationRow({ confirmation, onUpdateStatus, onAddNotes }) {
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState(confirmation.staffNotes ?? '');
  const risk = probabilityStyle(confirmation.cancelProbability);
  const statusInfo = STATUS_STYLES[confirmation.outreachStatus] ?? STATUS_STYLES.pending;
  const isResolved = ['confirmed', 'cancelled', 'no_response'].includes(confirmation.outreachStatus);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr 90px 100px 1fr',
      gap: theme.spacing.sm,
      alignItems: 'center',
      padding: '10px 12px',
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.radius.md,
      background: theme.colors.bgCard,
    }}>
      {/* Member info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <MemberLink memberId={confirmation.memberId} style={{ fontWeight: 700, fontSize: theme.fontSize.sm }}>
          {confirmation.memberName}
        </MemberLink>
        <div style={{ fontSize: 11, color: theme.colors.textMuted }}>
          {confirmation.archetype} · {confirmation.teeTime}
        </div>
      </div>

      {/* Drivers */}
      <div style={{ fontSize: 11, color: theme.colors.textSecondary, lineHeight: 1.4 }}>
        {confirmation.drivers?.[0] ?? ''}
      </div>

      {/* Cancel probability */}
      <span style={{
        display: 'inline-block',
        textAlign: 'center',
        fontFamily: theme.fonts.mono,
        fontSize: theme.fontSize.xs,
        fontWeight: 700,
        color: risk.color,
        background: risk.bg,
        border: `1px solid ${risk.border}`,
        borderRadius: '999px',
        padding: '2px 8px',
      }}>
        {Math.round(confirmation.cancelProbability * 100)}%
      </span>

      {/* Outreach status */}
      <Badge text={statusInfo.text} variant={statusInfo.variant} size="sm" />

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {!isResolved && (
          <>
            <Btn variant="primary" size="xs" accent={theme.colors.success}
              onClick={() => onUpdateStatus(confirmation.id, 'confirmed')}>
              Confirmed
            </Btn>
            <Btn variant="ghost" size="xs"
              onClick={() => onUpdateStatus(confirmation.id, 'cancelled')}>
              Cancelled
            </Btn>
            <Btn variant="ghost" size="xs"
              onClick={() => onUpdateStatus(confirmation.id, 'no_response')}>
              No Response
            </Btn>
          </>
        )}
        <Btn variant="tertiary" size="xs" onClick={() => setShowNotes(!showNotes)}>
          {showNotes ? 'Close' : 'Notes'}
        </Btn>
      </div>

      {/* Notes expansion */}
      {showNotes && (
        <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add staff notes..."
              style={{
                flex: 1,
                padding: 8,
                fontSize: theme.fontSize.xs,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.sm,
                background: theme.colors.bgDeep,
                color: theme.colors.textPrimary,
                resize: 'vertical',
                minHeight: 48,
                fontFamily: theme.fonts.sans,
              }}
            />
            <Btn variant="primary" size="xs"
              onClick={() => { onAddNotes(confirmation.id, noteText); setShowNotes(false); }}>
              Save
            </Btn>
          </div>
          {confirmation.contactedAt && (
            <div style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4 }}>
              Last contacted: {new Date(confirmation.contactedAt).toLocaleString()} via {confirmation.outreachChannel ?? 'unknown'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
