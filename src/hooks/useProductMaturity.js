import { useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'swoop_first_use_date';
const ONBOARDING_DAYS = 30;
const POWER_DAYS = 180;

export function useProductMaturity() {
  const [firstUseDate, setFirstUseDate] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return new Date(stored);
      const now = new Date();
      localStorage.setItem(STORAGE_KEY, now.toISOString());
      return now;
    } catch {
      return new Date();
    }
  });

  const maturity = useMemo(() => {
    const now = new Date();
    const daysSinceFirst = Math.floor((now - firstUseDate) / (1000 * 60 * 60 * 24));
    if (daysSinceFirst < ONBOARDING_DAYS) return 'onboarding';
    if (daysSinceFirst < POWER_DAYS) return 'active';
    return 'power';
  }, [firstUseDate]);

  const daysActive = useMemo(() => {
    return Math.floor((new Date() - firstUseDate) / (1000 * 60 * 60 * 24));
  }, [firstUseDate]);

  const isOnboarding = maturity === 'onboarding';
  const isActive = maturity === 'active';
  const isPower = maturity === 'power';

  // Allow manual override for demo purposes
  const setMaturityOverride = (level) => {
    const daysMap = { onboarding: 0, active: ONBOARDING_DAYS + 1, power: POWER_DAYS + 1 };
    const daysAgo = daysMap[level] ?? 0;
    const fakeDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    localStorage.setItem(STORAGE_KEY, fakeDate.toISOString());
    setFirstUseDate(fakeDate);
  };

  return { maturity, daysActive, isOnboarding, isActive, isPower, setMaturityOverride };
}
