const AT_RISK_LEVELS = new Set(['At Risk', 'Critical']);

const toNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const normalizeHealthScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric <= 1) return Math.round(numeric * 100);
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

export const deriveRiskLevel = (score) => {
  if (score >= 70) return 'Healthy';
  if (score >= 50) return 'Watch';
  if (score >= 30) return 'At Risk';
  return 'Critical';
};

export const isAtRiskLevel = (riskLevel) => AT_RISK_LEVELS.has(riskLevel);

export const normalizeWaitlistEntry = (entry = {}) => {
  const healthScore = normalizeHealthScore(entry?.healthScore ?? entry?.health_score);
  const explicitRisk = typeof entry?.riskLevel === 'string' ? entry.riskLevel : entry?.risk_level;
  const normalizedRisk = explicitRisk || deriveRiskLevel(healthScore);
  const normalizedPriority = String(entry?.retentionPriority ?? entry?.retention_priority ?? 'NORMAL').toUpperCase();

  return {
    ...entry,
    healthScore,
    riskLevel: normalizedRisk,
    retentionPriority: normalizedPriority === 'HIGH' ? 'HIGH' : 'NORMAL',
    daysWaiting: Math.max(0, toNumber(entry?.daysWaiting ?? entry?.days_waiting)),
    memberValueAnnual: Math.max(
      0,
      toNumber(entry?.memberValueAnnual ?? entry?.member_value_annual ?? entry?.annualDues ?? entry?.annual_dues, 0),
    ),
  };
};

export const summarizeWaitlistEntries = (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      total: 0,
      highPriority: 0,
      atRisk: 0,
      critical: 0,
      avgDaysWaiting: 0,
      riskScoredToday: 0,
      atRiskDuesExposed: 0,
    };
  }

  const normalized = entries.map((entry) => normalizeWaitlistEntry(entry));
  const total = normalized.length;
  const highPriority = normalized.filter((entry) => entry.retentionPriority === 'HIGH').length;
  const atRiskRows = normalized.filter((entry) => isAtRiskLevel(entry.riskLevel));
  const critical = normalized.filter((entry) => entry.riskLevel === 'Critical').length;
  const riskScoredToday = normalized.filter((entry) => Number.isFinite(entry.healthScore) && entry.healthScore > 0).length;
  const avgDaysWaiting = Math.round(
    normalized.reduce((sum, entry) => sum + toNumber(entry.daysWaiting), 0) / Math.max(total, 1),
  );
  const atRiskDuesExposed = Math.round(
    atRiskRows.reduce((sum, entry) => sum + toNumber(entry.memberValueAnnual), 0),
  );

  return {
    total,
    highPriority,
    atRisk: atRiskRows.length,
    critical,
    avgDaysWaiting,
    riskScoredToday,
    atRiskDuesExposed,
  };
};
