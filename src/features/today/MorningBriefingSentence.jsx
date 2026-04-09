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
import { shouldUseStatic } from '@/services/demoGate';
import { getDailyBriefing } from '@/services/briefingService';
import { getDailyForecast } from '@/services/weatherService';
import { getTodayTeeSheet } from '@/services/operationsService';
import { getShiftCoverage, getStaffingSummary } from '@/services/staffingService';

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

  // 1. Rounds booked (Tee Sheet)
  if (shouldUseStatic('tee-sheet')) {
    const briefing = getDailyBriefing();
    const rounds = briefing?.teeSheet?.roundsToday || 0;
    if (rounds > 0) {
      segments.push({ key: 'rounds', text: `${rounds} rounds booked` });
      sources.push('Tee Sheet');
    }
  }

  // 2. Weather
  if (shouldUseStatic('weather') !== false) {
    try {
      const daily = getDailyForecast(1);
      const today = Array.isArray(daily) ? daily[0] : null;
      const desc = describeWeather(today);
      if (desc) {
        segments.push({ key: 'weather', text: `Weather: ${desc}` });
        sources.push('Weather');
      }
    } catch { /* weather unavailable */ }
  }

  // 3. At-risk members on today's sheet (Tee Sheet ∩ Member CRM)
  if (shouldUseStatic('tee-sheet') && shouldUseStatic('members')) {
    const teeSheet = getTodayTeeSheet();
    const atRiskOnSheet = teeSheet.filter(t => (t.healthScore ?? 100) < 50).length;
    if (atRiskOnSheet > 0) {
      segments.push({
        key: 'at-risk',
        text: `${atRiskOnSheet} at-risk member${atRiskOnSheet === 1 ? '' : 's'} on today's tee sheet`,
        urgent: true,
      });
      if (!sources.includes('Member CRM')) sources.push('Member CRM');
    }
  }

  // 4. Staffing gap (Scheduling)
  if (shouldUseStatic('complaints')) {
    const coverage = getShiftCoverage();
    const todayGap = coverage
      .filter(s => (s.required ?? 0) - (s.scheduled ?? 0) > 0)
      .reduce((sum, s) => sum + ((s.required ?? 0) - (s.scheduled ?? 0)), 0);
    if (todayGap > 0) {
      segments.push({
        key: 'staffing',
        text: `Staffing gap: ${todayGap} short for projected post-round dining demand`,
        urgent: true,
      });
      sources.push('Scheduling');
      if (!sources.includes('POS')) sources.push('POS');
    } else {
      // Fall back to understaffed days indicator
      const summary = getStaffingSummary();
      if (summary?.understaffedDaysCount > 0) {
        segments.push({
          key: 'staffing',
          text: `${summary.understaffedDaysCount} understaffed shifts this month at risk`,
          urgent: false,
        });
        sources.push('Scheduling');
      }
    }
  }

  return { segments, sources };
}

export default function MorningBriefingSentence() {
  const { segments, sources } = useMemo(buildSegments, []);

  if (segments.length === 0) return null;

  // Build the synthesized sentence
  const sentence = segments.map(s => s.text).join('. ') + '.';

  // Choose variant based on urgency: any "urgent" segment elevates to warning style
  const hasUrgent = segments.some(s => s.urgent);
  const variant = hasUrgent ? 'warning' : 'insight';

  // Context line — emphasizes the cross-domain synthesis
  const context = sources.length >= 3
    ? `Cross-domain synthesis: ${sources.length} systems connected. No single source produces this view.`
    : null;

  return (
    <div className="fade-in-up">
      <StoryHeadline
        variant={variant}
        headline={sentence}
        context={context}
      />
      {sources.length > 0 && (
        <div className="-mt-2 mb-3 px-1">
          <EvidenceStrip systems={sources} compact />
        </div>
      )}
    </div>
  );
}
