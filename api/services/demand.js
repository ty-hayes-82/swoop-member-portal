/**
 * Weather Demand Multiplier Model
 *
 * Computes how weather conditions shift demand for golf and F&B.
 * Initial multipliers are rule-based; over time they can be calibrated
 * against weather_daily_log correlated with actual close_outs data.
 */

/**
 * Compute weather-adjusted demand modifiers.
 * @param {{ precipProb?: number, gusts?: number, wind?: number, high?: number, conditions?: string }} forecast
 * @returns {{ golfModifier: number, fbModifier: number, summary: string }}
 */
export function computeWeatherModifier(forecast) {
  if (!forecast) return { golfModifier: 1.0, fbModifier: 1.0, summary: 'No forecast data' };

  let golfMod = 1.0;
  let fbMod = 1.0;
  const factors = [];

  // Precipitation impact
  const precipProb = forecast.precipProb || 0;
  if (precipProb > 60) {
    golfMod *= 0.5;
    fbMod *= 1.3;  // Indoor dining surge
    factors.push(`${precipProb}% rain: -50% golf, +30% indoor dining`);
  } else if (precipProb > 30) {
    golfMod *= 0.8;
    fbMod *= 1.1;
    factors.push(`${precipProb}% rain chance: -20% golf, +10% dining`);
  }

  // Wind impact
  const gusts = forecast.gusts || forecast.wind || 0;
  if (gusts > 25) {
    golfMod *= 0.6;
    fbMod *= 1.2;
    factors.push(`${gusts}mph gusts: -40% golf, +20% indoor dining`);
  } else if (gusts > 15) {
    golfMod *= 0.85;
    fbMod *= 1.1;
    factors.push(`${gusts}mph gusts: -15% golf, +10% dining`);
  }

  // Temperature impact
  const high = forecast.high || forecast.temp || 72;
  if (high < 40) {
    golfMod *= 0.4;
    fbMod *= 0.7;
    factors.push(`${high}°F cold: -60% golf, -30% dining`);
  } else if (high < 50) {
    golfMod *= 0.7;
    fbMod *= 0.9;
    factors.push(`${high}°F cool: -30% golf, -10% dining`);
  } else if (high > 100) {
    golfMod *= 0.7;
    fbMod *= 1.1;
    factors.push(`${high}°F extreme heat: -30% golf, +10% dining`);
  } else if (high > 90) {
    golfMod *= 0.85;
    fbMod *= 1.05;
    factors.push(`${high}°F hot: -15% golf`);
  }

  // Thunderstorm probability
  if ((forecast.thunderstormProb || 0) > 50) {
    golfMod *= 0.3;
    fbMod *= 1.2;
    factors.push('Thunderstorm risk: major golf reduction');
  }

  // Clamp values
  golfMod = Math.max(0.1, Math.min(1.5, golfMod));
  fbMod = Math.max(0.3, Math.min(2.0, fbMod));

  const summary = factors.length > 0
    ? factors.join('; ')
    : 'No weather disruptions — standard demand expected';

  return {
    golfModifier: Math.round(golfMod * 100) / 100,
    fbModifier: Math.round(fbMod * 100) / 100,
    summary,
  };
}

/**
 * Compute staffing needs based on demand forecast.
 * @param {{ roundsBooked: number, events: number, forecast: object }} params
 * @returns {{ expectedRounds, postRoundDiners, outlets: Array, recommendation: string }}
 */
export function computeStaffingNeed({ roundsBooked, events = 0, forecast }) {
  const { golfModifier, fbModifier, summary } = computeWeatherModifier(forecast);
  const expectedRounds = Math.round(roundsBooked * golfModifier);
  const baseConversion = 0.35; // 35% of golfers dine post-round
  const postRoundDiners = Math.round(expectedRounds * baseConversion * fbModifier);
  const eventCovers = events * 20; // rough estimate per event

  // Per-outlet staffing (simple model: 1 server per ~15 covers)
  const totalCovers = postRoundDiners + eventCovers;
  const grillServers = Math.max(2, Math.ceil(totalCovers * 0.5 / 15));
  const terraceServers = Math.max(1, Math.ceil(totalCovers * 0.3 / 15));
  const poolBarServers = Math.max(1, Math.ceil(totalCovers * 0.2 / 15));

  const outlets = [
    { name: 'Grill Room', recommended: grillServers, share: 0.5 },
    { name: 'Terrace', recommended: terraceServers, share: 0.3 },
    { name: 'Pool Bar', recommended: poolBarServers, share: 0.2 },
  ];

  // Build recommendation text
  let recommendation;
  if (golfModifier < 0.6) {
    recommendation = `Weather significantly reduces expected rounds to ${expectedRounds}. Fewer outdoor staff needed but prepare for indoor overflow — recommend ${grillServers} servers in Grill Room.`;
  } else if (golfModifier < 0.85) {
    recommendation = `Weather moderately impacts play (${expectedRounds} expected from ${roundsBooked} booked). Adjust staffing accordingly — ${grillServers} servers recommended for Grill Room.`;
  } else if (fbModifier > 1.1) {
    recommendation = `Good weather for golf (${expectedRounds} expected) but dining demand elevated. Recommend ${grillServers} servers in Grill Room for post-round surge.`;
  } else {
    recommendation = `Standard conditions — ${expectedRounds} rounds expected, standard staffing of ${grillServers}/${terraceServers}/${poolBarServers} across outlets.`;
  }

  return {
    expectedRounds,
    postRoundDiners,
    totalCovers,
    golfModifier,
    fbModifier,
    weatherSummary: summary,
    outlets,
    recommendation,
  };
}
