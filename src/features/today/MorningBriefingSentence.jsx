// MorningBriefingSentence — Pillar 1 (SEE IT) hero synthesis banner
// Renders the cross-domain morning briefing in a single sentence:
// "220 rounds booked. Weather: 82°F, clear. 3 at-risk members on today's tee sheet.
//  Staffing gap: 2 servers short for projected post-round dining demand."
//
// This is the Layer 3 difference made tangible: tee sheet + weather + member health + staffing
// synthesized in one place. No single source system can produce this sentence.

import { useMemo } from 'react';
import StoryHeadline from '@/components/ui/StoryHeadline';
import EvidenceStrip from '@/components/ui/EvidenceStrip';
import { getDailyBriefing } from '@/services/briefingService';
import { getDailyForecast } from '@/services/weatherService';
import { getTodayTeeSheet } from '@/services/operationsService';
import { getShiftCoverage, getStaffingSummary } from '@/services/staffingService';
import { getLeakageData } from '@/services/revenueService';
import { getMemberSummary } from '@/services/memberService';
import { useNavigation } from '@/context/NavigationContext';

function describeWeather(forecast) {
  if (!forecast) return null;
  const temp = forecast.high ?? forecast.tempHigh ?? forecast.temp;
  if (temp == null) return null;
  const cond = (forecast.condition || forecast.summary || '').toLowerCase();
  let label = 'clear';
  if (cond.includes('rain') || cond.includes('storm')) label = 'rain';
  else if (cond.includes('snow')) label = 'snow';
  else if (cond.includes('cloud') || cond.includes('overcast')) label = 'cloudy';
  else if (cond.includes('wind')) label = 'windy';
  return `${Math.round(temp)}°F, ${label}`;
}

function buildSegments() {
  const segments = [];
  const sources = [];

  // 1. Rounds booked (Tee Sheet) — returns 0 when data not loaded
  const briefing = getDailyBriefing();
  const rounds = briefing?.teeSheet?.roundsToday || 0;
  if (rounds > 0) {
    segments.push({ key: 'rounds', text: `${rounds} rounds booked` });
    sources.push('Tee Sheet');
  }

  // 2. Weather
  try {
    const daily = getDailyForecast(1);
    const today = Array.isArray(daily) ? daily[0] : null;
    const desc = describeWeather(today);
    if (desc) {
      segments.push({ key: 'weather', text: `Weather: ${desc}` });
      sources.push('Weather');
    }
  } catch { /* weather unavailable */ }

  // 3. At-risk members on today's sheet (Tee Sheet ∩ Member CRM)
  const teeSheet = getTodayTeeSheet();
  const atRiskList = teeSheet.filter(t => (t.healthScore ?? 100) < 50);
  const atRiskOnSheet = atRiskList.length;
  if (atRiskOnSheet > 0) {
    const duesAtRisk = atRiskList.reduce((sum, t) => sum + (t.duesAnnual || 0), 0);
    const dueText = duesAtRisk > 0 ? ` ($${Math.round(duesAtRisk / 1000)}K dues)` : '';

    // Surface the top at-risk member name + tee time from briefing data
    const atRiskTeetimes = briefing?.todayRisks?.atRiskTeetimes;
    const topMember = Array.isArray(atRiskTeetimes) && atRiskTeetimes.length > 0
      ? atRiskTeetimes.sort((a, b) => (a.health ?? 100) - (b.health ?? 100))[0]
      : null;
    const topMemberText = topMember
      ? ` — ${topMember.name} tees off at ${topMember.time}`
      : '';

    segments.push({
      key: 'at-risk',
      text: `${atRiskOnSheet} at-risk member${atRiskOnSheet === 1 ? '' : 's'} on today's tee sheet${dueText}${topMemberText}`,
      urgent: true,
    });
    if (!sources.includes('Member CRM')) sources.push('Member CRM');
  }

  // 4. Staffing gap (Scheduling) — with dollar exposure from revenue leakage
  const coverage = getShiftCoverage();
  const todayGap = coverage
    .filter(s => (s.required ?? 0) - (s.scheduled ?? 0) > 0)
    .reduce((sum, s) => sum + ((s.required ?? 0) - (s.scheduled ?? 0)), 0);

  const leakage = getLeakageData();
  const staffingDollarExposure = leakage?.STAFFING_LOSS || 0;
  const dollarText = staffingDollarExposure > 0
    ? ` — $${staffingDollarExposure.toLocaleString()}/mo at risk`
    : '';

  if (todayGap > 0) {
    segments.push({
      key: 'staffing',
      text: `Staffing gap: ${todayGap} short for projected post-round dining demand${dollarText}`,
      urgent: true,
    });
    sources.push('Scheduling');
    if (!sources.includes('POS')) sources.push('POS');
  } else {
    const summary = getStaffingSummary();
    if (summary?.understaffedDaysCount > 0) {
      segments.push({
        key: 'staffing',
        text: `${summary.understaffedDaysCount} understaffed shifts this month at risk${dollarText}`,
        urgent: false,
      });
      sources.push('Scheduling');
    }
  }

  return { segments, sources };
}

export default function MorningBriefingSentence() {
  const { navigate } = useNavigation();
  const { segments, sources } = useMemo(buildSegments, []);

  if (segments.length === 0) return null;

  const hasAtRisk = segments.some(s => s.key === 'at-risk');
  const handleScrollToAlerts = () => {
    const el = document.getElementById('today-member-alerts')
      || document.querySelector('[data-section="member-alerts"]');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // JSX (not a plain string) so the at-risk segment can be a clickable scroll target to Member Alerts.
  const sentence = (
    <>
      {segments.map((s, i) => {
        const isLast = i === segments.length - 1;
        const suffix = isLast ? '.' : '. ';
        if (s.key === 'at-risk') {
          return (
            <span key={s.key}>
              <button
                type="button"
                onClick={handleScrollToAlerts}
                className="font-serif text-lg text-brand-500 font-normal leading-snug bg-transparent border-none cursor-pointer p-0 m-0 underline decoration-dotted underline-offset-4 hover:decoration-solid focus-visible:ring-2 focus-visible:ring-brand-500"
                title="Jump to Priority Member Alerts"
              >
                {s.text}
              </button>
              {suffix}
            </span>
          );
        }
        return <span key={s.key}>{s.text}{suffix}</span>;
      })}
    </>
  );

  // Choose variant based on urgency: any "urgent" segment elevates to warning style
  const hasUrgent = segments.some(s => s.urgent);
  const variant = hasUrgent ? 'warning' : 'insight';

  // Context line — emphasizes the cross-domain synthesis
  const context = sources.length >= 3
    ? `Cross-domain synthesis: ${sources.length} systems connected. No single source produces this view.`
    : null;

  // Cross-pillar bridge: if any segment carries dollar exposure, link to Revenue
  const hasDollarExposure = segments.some(s => /\$/.test(s.text));

  return (
    // #today-briefing is the scroll target for DemoStoriesLauncher.handleStartStory — do not rename.
    <div id="today-briefing" data-story="briefing" className="fade-in-up">
      {sources.length >= 3 && (
        <div className="flex items-center gap-2 mb-1 px-1">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: 'rgba(167,139,250,0.15)', color: '#8b5cf6' }}
          >
            ⬢ LAYER 3 · {sources.length} SYSTEMS
          </span>
          <span className="text-[10px] text-gray-400 italic">Cross-domain synthesis no single vendor can produce</span>
        </div>
      )}
      <StoryHeadline
        variant={variant}
        headline={sentence}
        context={context}
      />
      {sources.length > 0 && (
        <div className="-mt-2 mb-2 px-1 flex items-center justify-between gap-2 flex-wrap">
          <EvidenceStrip systems={sources} compact />
          <div className="flex gap-2 flex-wrap">
            {hasAtRisk && (
              <button
                type="button"
                onClick={handleScrollToAlerts}
                className="text-[11px] font-bold text-error-500 bg-error-500/[0.06] border border-error-500/20 px-3 py-1 rounded-md cursor-pointer hover:bg-error-500/[0.12] whitespace-nowrap"
              >
                View at-risk alerts ↓
              </button>
            )}
            {hasDollarExposure && (
              <button
                type="button"
                onClick={() => navigate('revenue')}
                className="text-[11px] font-bold text-brand-500 bg-brand-500/[0.06] border border-brand-500/20 px-3 py-1 rounded-md cursor-pointer hover:bg-brand-500/[0.12] whitespace-nowrap"
              >
                See full revenue breakdown →
              </button>
            )}
          </div>
        </div>
      )}
      {/* Trust math — how is this computed? */}
      <details className="px-1 mb-2">
        <summary className="text-[11px] text-gray-500 cursor-pointer list-none flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300">
          <span className="opacity-60">ⓘ</span>
          <span className="font-semibold">How is this computed?</span>
        </summary>
        <div className="mt-2 ml-4 text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed border-l-2 border-gray-200 dark:border-gray-700 pl-3">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Today's briefing computed from:</div>
          <ul className="m-0 p-0 list-none space-y-1">
            {segments.map(s => (
              <li key={s.key} className="flex items-start gap-1.5">
                <span className="text-gray-400">•</span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 italic text-gray-500">
            Each segment cross-references {sources.length} source system{sources.length === 1 ? '' : 's'}: {sources.join(', ')}.
            No single system can produce this sentence on its own.
          </div>
        </div>
      </details>
    </div>
  );
}
