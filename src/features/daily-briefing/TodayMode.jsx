import { useState } from 'react';
import { theme } from '@/config/theme';
import ArchetypeBadge from '@/components/ui/ArchetypeBadge.jsx';
import QuickActions from '@/components/ui/QuickActions.jsx';
import MemberLink from '@/components/MemberLink.jsx';
import { getTopPendingAction } from '@/services/agentService';
import { useApp } from '@/context/AppContext';
import { getDailyBriefing } from '@/services/briefingService';
import { getPriorityItems } from '@/services/cockpitService';
import EvidenceStrip from '@/components/ui/EvidenceStrip';

const HOUR = new Date().getHours();
const IS_MORNING = HOUR < 12;
const IS_EOD = HOUR >= 17;

const timeLabel = IS_MORNING ? 'This morning' : IS_EOD ? "Today's close" : 'Right now';
const timeGreet = IS_MORNING
  ? 'Here are the three things that need your attention before the first tee time.'
  : IS_EOD
  ? "Here's how the day closed out and what's pending tomorrow."
  : "Here's where things stand mid-day.";

function MiniMemberRow({ member, onNavigate }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onNavigate?.('member-health')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '9px 12px',
        borderRadius: theme.radius.sm,
        background: hovered ? `${theme.colors.accent}0A` : `${theme.colors.accent}08`,
        border: `1px solid ${hovered ? `${theme.colors.members}45` : `${theme.colors.members}22`}`,
        cursor: 'pointer',
        transition: 'all 0.12s ease',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: `${theme.colors.accent}14`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontFamily: theme.fonts.mono,
          color: theme.colors.accent,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {member.score}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <MemberLink
            memberId={member.memberId}
            style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: hovered ? theme.colors.accent : theme.colors.textPrimary, transition: 'color 0.12s ease' }}
          >
            {member.name}
          </MemberLink>
          <ArchetypeBadge archetype={member.archetype} size="xs" />
        </div>
        <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{member.risk}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: theme.fontSize.xs, fontFamily: theme.fonts.mono, color: theme.colors.textSecondary }}>{member.time}</span>
        <span style={{ fontSize: '14px', color: hovered ? theme.colors.accent : theme.colors.textMuted, transition: 'color 0.12s ease' }}>{'\u203A'}</span>
      </div>
      {hovered && (
        <div style={{ width: '100%', paddingTop: '6px', display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
          <QuickActions memberName={member.name} memberId={member.memberId} context={member.risk} archetype={member.archetype} />
        </div>
      )}
    </div>
  );
}

export default function TodayMode({ onNavigate }) {
  const topAction = getTopPendingAction();
  const { pendingAgentCount, approveAction } = useApp();
  const briefing = getDailyBriefing();
  const quickWins = briefing.quickWins || [];

  const items = getPriorityItems();
  const [expandedItem, setExpandedItem] = useState(null);

  const urgencyBorder = { urgent: theme.colors.urgent, warning: theme.colors.warning, neutral: theme.colors.border };
  const urgencyBg = { urgent: `${theme.colors.urgent}06`, warning: `${theme.colors.warning}06`, neutral: theme.colors.bgCard };
  const renderHeadline = (item) => {
    if (!item.memberName || !item.memberId) return item.headline;
    const segments = item.headline.split(item.memberName);
    if (segments.length === 1) {
      return (
        <MemberLink mode="drawer" memberId={item.memberId} style={{ fontWeight: 700 }}>{item.headline}</MemberLink>
      );
    }
    return (
      <>
        {segments[0]}
        <MemberLink mode="drawer" memberId={item.memberId} style={{ fontWeight: 700 }}>{item.memberName}</MemberLink>
        {segments.slice(1).join(item.memberName)}
      </>
    );
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
      <div style={{ paddingBottom: theme.spacing.md, borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontSize: '11px', color: theme.colors.textMuted, letterSpacing: '0.08em', fontWeight: 600, marginBottom: '6px' }}>
          {timeLabel.toUpperCase()} · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ 
            fontSize: '11px', 
            fontWeight: 700, 
            color: theme.colors.operations, 
            background: `${theme.colors.operations}12`, 
            padding: '3px 10px', 
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
          }}>
            ⚡ Real-Time Cockpit
          </span>
        </div>
        <h2 style={{ fontFamily: theme.fonts.serif, fontSize: '26px', color: theme.colors.textPrimary, fontWeight: 400, lineHeight: 1.2, marginBottom: '4px' }}>
          Where is today breaking?
        </h2>
        <p style={{ fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, margin: 0 }}>
          {timeGreet}
        </p>
      </div>

      {/* Since Last Login */}
      <div style={{
        background: `${theme.colors.accent}08`,
        border: `1px solid ${theme.colors.accent}25`,
        borderRadius: theme.radius.md,
        padding: theme.spacing.md,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Since your last visit (18 hours ago)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: theme.spacing.sm }}>
          {[
            { label: 'New at-risk members', value: '+2', detail: '$36K exposure', color: theme.colors.urgent },
            { label: 'New complaints', value: '+1', detail: 'unresolved', color: theme.colors.warning },
            { label: 'Actions completed', value: '3', detail: 'by your team', color: theme.colors.success },
            { label: 'Health movements', value: '2↑ 1↓', detail: 'net improving', color: theme.colors.info },
          ].map((d) => (
            <div key={d.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: theme.fonts.mono, fontSize: theme.fontSize.lg, fontWeight: 700, color: d.color }}>{d.value}</div>
              <div style={{ fontSize: 11, color: theme.colors.textSecondary, lineHeight: 1.3 }}>{d.label}</div>
              <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{d.detail}</div>
            </div>
          ))}
        </div>
      </div>


      {/* Quick Wins — Immediate Revenue Opportunities */}
      {quickWins.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${theme.colors.success}08 0%, ${theme.colors.operations}08 100%)`,
          border: `1.5px solid ${theme.colors.success}`,
          borderRadius: theme.radius.md,
          padding: theme.spacing.lg,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: theme.spacing.md }}>
            <span style={{ fontSize: '18px' }}>⚡</span>
            <h3 style={{ fontSize: theme.fontSize.md, fontWeight: 700, color: theme.colors.textPrimary, margin: 0 }}>
              Quick Wins — Do These First
            </h3>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: theme.colors.success,
              background: `${theme.colors.success}12`,
              padding: '2px 8px',
              borderRadius: '12px',
              marginLeft: 'auto',
            }}>
              {quickWins.reduce((sum, w) => sum + (parseInt(w.effort) || 0), 0)} min total
            </span>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', 
            gap: theme.spacing.sm 
          }}>
            {quickWins.map((win) => (
              <div
                key={win.id}
                onClick={() => onNavigate?.(win.link)}
                className="quick-win-card"
                style={{
                  background: theme.colors.white,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.sm,
                  padding: theme.spacing.md,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.success;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = theme.shadow.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{win.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.3, marginBottom: '4px' }}>
                      {win.title}
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: theme.colors.success,
                        background: `${theme.colors.success}10`,
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}>
                        {win.impact}
                      </span>
                      <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.mono }}>
                        {win.effort} effort
                      </span>
                      {win.conversionRate && (
                        <span style={{ fontSize: '11px', color: theme.colors.textMuted, fontFamily: theme.fonts.mono }}>
                          {win.conversionRate}% conversion
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: theme.fontSize.xs, color: theme.colors.textSecondary, lineHeight: 1.5, marginBottom: '8px' }}>
                  {win.detail}
                </div>
                <button
                  onClick={(event) => { event.stopPropagation(); onNavigate?.(win.link); }}
                  style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    fontSize: theme.fontSize.xs,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderRadius: theme.radius.sm,
                    border: 'none',
                    background: theme.colors.success,
                    color: theme.colors.white,
                    cursor: 'pointer',
                  }}
                >
                  {win.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Priority Items — Accordion */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {items.map((item) => {
          const isExpanded = expandedItem === item.priority;
          const borderColor = urgencyBorder[item.urgency];
          return (
            <div
              key={item.priority}
              style={{
                background: isExpanded ? urgencyBg[item.urgency] : theme.colors.bgCard,
                border: `1px solid ${isExpanded ? borderColor + '50' : theme.colors.border}`,
                borderRadius: theme.radius.md,
                borderLeft: `4px solid ${borderColor}`,
                boxShadow: isExpanded ? theme.shadow.md : theme.shadow.sm,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
            >
              {/* Compact summary row — always visible */}
              <div
                onClick={() => setExpandedItem(isExpanded ? null : item.priority)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = `${borderColor}08`; }}
                onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1, minWidth: 0, fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {renderHeadline(item)}
                </div>
                {item.stakes && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: borderColor,
                    background: `${borderColor}12`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}>
                    {item.stakes}
                  </span>
                )}
                {item.meta?.urgency && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: item.meta.urgencyColor ?? theme.colors.urgent,
                    background: `${item.meta.urgencyColor ?? theme.colors.urgent}14`,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                    border: `1px solid ${item.meta.urgencyColor ?? theme.colors.urgent}33`,
                  }}>
                    {item.meta.urgency === 'Act Now' ? '\uD83D\uDD34' : item.meta.urgency === 'Review Today' ? '\uD83D\uDFE1' : '\uD83D\uDFE2'} {item.meta.urgency}
                  </span>
                )}
                <span style={{ fontSize: '14px', color: theme.colors.textMuted, flexShrink: 0, transition: 'transform 0.2s ease', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>{'\u25B8'}</span>
              </div>

              {/* Expanded detail — full content */}
              {isExpanded && (
                <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {item.questionDomain && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: theme.colors.accent, background: theme.colors.accent + '15', padding: '2px 8px', borderRadius: '4px' }}>{item.questionDomain}</span>
                      <span style={{ fontSize: '11px', fontStyle: 'italic', color: theme.colors.textMuted + 'aa' }}>{item.questionLabel}</span>
                    </div>
                  )}
                  {item.meta && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
                      <span>{item.meta.sourceIcon} {item.meta.source}</span>
                      <span>Updated {item.meta.freshness}</span>
                    </div>
                  )}
                  {item.bullets?.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: '18px', color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, lineHeight: 1.5 }}>
                      {item.bullets.map((point) => (
                        <li key={point} style={{ marginBottom: '4px' }}>{point}</li>
                      ))}
                    </ul>
                  )}
                  {item.members && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {item.members.map((member) => (
                        <MiniMemberRow key={member.name} member={member} onNavigate={onNavigate} />
                      ))}
                    </div>
                  )}
                  {item.meta?.why && (
                    <div style={{ fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.textMuted }}>
                      Why this surfaced
                      <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary }}>{item.meta.why}</div>
                    </div>
                  )}
                  {item.meta?.metric && (
                    <div style={{ border: `1px solid ${theme.colors.border}`, borderRadius: theme.radius.sm, padding: '10px 12px', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                      <span style={{ fontSize: '22px', fontFamily: theme.fonts.mono, fontWeight: 700 }}>{item.meta.metric.value}</span>
                      <span style={{ fontSize: theme.fontSize.xs, color: theme.colors.textMuted }}>{item.meta.metric.label}</span>
                    </div>
                  )}
                  {item.evidenceSignals && <EvidenceStrip signals={item.evidenceSignals} compact />}
                  {/* Recommendation box */}
                  <div
                    style={{
                      borderLeft: `4px solid ${theme.colors.success}`,
                      background: `linear-gradient(135deg, ${theme.colors.success}0F 0%, ${theme.colors.success}08 100%)`,
                      padding: theme.spacing.md,
                      borderRadius: theme.radius.sm,
                      boxShadow: `0 1px 3px ${theme.colors.success}15`,
                    }}
                  >
                    <div style={{ fontSize: theme.fontSize.xs, textTransform: 'uppercase', letterSpacing: '0.08em', color: theme.colors.success, fontWeight: 700, marginBottom: '6px' }}>
                      Recommended Action
                    </div>
                    <div style={{ fontSize: theme.fontSize.sm, fontWeight: 600, color: theme.colors.textPrimary, lineHeight: 1.5 }}>
                      {item.recommendation}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', alignItems: 'center' }}>
                    {item.memberName && <QuickActions memberName={item.memberName} memberId={item.memberId} context={item.context} />}
                    <button
                      onClick={() => onNavigate(item.linkKey)}
                      style={{
                        padding: '8px 16px',
                        fontSize: theme.fontSize.sm,
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: theme.radius.md,
                        border: `2px solid ${theme.colors.accent}`,
                        background: theme.colors.white,
                        color: theme.colors.accent,
                        boxShadow: theme.shadow.sm,
                        transition: 'all 0.2s ease',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = theme.colors.accent;
                        e.currentTarget.style.color = theme.colors.white;
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = theme.shadow.md;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = theme.colors.white;
                        e.currentTarget.style.color = theme.colors.accent;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = theme.shadow.sm;
                      }}
                    >
                      {item.linkLabel}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Prove It: Board Report CTA */}
        <div
          onClick={() => onNavigate('board-report')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            marginTop: '4px',
            background: `linear-gradient(135deg, ${theme.colors.accent}08 0%, ${theme.colors.success}08 100%)`,
            border: `1.5px solid ${theme.colors.accent}30`,
            borderRadius: theme.radius.md,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.accent;
            e.currentTarget.style.boxShadow = theme.shadow.md;
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = `${theme.colors.accent}30`;
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <span style={{ fontSize: '20px' }}>{'\uD83D\uDCCA'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: theme.fontSize.sm, color: theme.colors.textPrimary }}>Prove It: What Was Prevented</div>
            <div style={{ fontSize: '12px', color: theme.colors.textMuted }}>Board-ready report — 14 members saved, $168K protected</div>
          </div>
          <span style={{ fontSize: '18px', color: theme.colors.accent, fontWeight: 700 }}>{'\u2192'}</span>
        </div>
      </div>
    </div>
  );
}
