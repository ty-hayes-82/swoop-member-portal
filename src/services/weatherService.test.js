// weatherService — service-layer test (SHIP_PLAN §2.1 Wave 2)
//
// weatherService is the gnarly one: _init() checks localStorage for a
// swoop_club_city before calling apiFetch, and in guided demo mode it
// bails out entirely. We mock apiClient and (when useful) wipe localStorage
// keys the init path reads.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const apiFetchMock = vi.fn();
vi.mock('./apiClient', () => ({
  apiFetch: (...args) => apiFetchMock(...args),
  getClubId: () => null,
}));

async function freshService() {
  vi.resetModules();
  return import('./weatherService');
}

beforeEach(() => {
  apiFetchMock.mockReset();
  try {
    localStorage.removeItem('swoop_club_city');
    localStorage.removeItem('swoop_club_state');
    localStorage.removeItem('swoop_club_id');
  } catch {}
});

afterEach(() => { vi.restoreAllMocks(); });

describe('weatherService — _init + getter contract', () => {
  it('_init() with a clubId fetches /api/weather and hydrates forecast cache', async () => {
    localStorage.setItem('swoop_club_id', 'club_abc');
    const payload = {
      current: { temp: 62, wind: 12, conditions: 'partly_cloudy' },
      hourly: [{ time: '2026-04-09T12:00:00Z', temp: 62, wind: 12 }],
      daily: [
        { date: '2026-04-09', high: 68, low: 52, wind: 15, conditions: 'sunny' },
        { date: '2026-04-10', high: 70, low: 54, wind: 10, conditions: 'sunny' },
      ],
      alerts: [{ type: 'Heat Advisory', severity: 'MODERATE', headline: 'Hot day' }],
      source: 'noaa',
      location: 'Test City',
    };
    apiFetchMock.mockResolvedValueOnce(payload);

    const svc = await freshService();
    await svc._init();

    expect(apiFetchMock).toHaveBeenCalledTimes(1);
    const [url] = apiFetchMock.mock.calls[0];
    expect(url).toContain('/api/weather?clubId=club_abc');

    // After hydration the getters return the API arrays.
    expect(svc.getHourlyForecast()).toBe(payload.hourly);
    const daily = svc.getDailyForecast(2);
    expect(daily).toHaveLength(2);
    expect(daily[0]).toBe(payload.daily[0]);
    expect(svc.getWeatherAlerts()).toBe(payload.alerts);
    expect(svc.getWeatherSource()).toBe('noaa');
    expect(svc.getWeatherLocation()).toBe('Test City');
  });

  it('_init() without clubId or city is a no-op (does not call apiFetch)', async () => {
    // No swoop_club_id, no swoop_club_city set.
    const svc = await freshService();
    await svc._init();
    expect(apiFetchMock).not.toHaveBeenCalled();

    // Static fallback still works (demo mode default).
    const daily = svc.getDailyForecast(3);
    expect(Array.isArray(daily)).toBe(true);
    // alerts fall back to the static wind advisory
    const alerts = svc.getWeatherAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('getDailyForecast() pre-_init returns static data in demo mode', async () => {
    const svc = await freshService();
    const daily = svc.getDailyForecast(5);
    expect(Array.isArray(daily)).toBe(true);
    // Static fallback maps from weatherData starting 2026-01-17.
    expect(daily.length).toBeGreaterThan(0);
    daily.forEach((d) => {
      expect(d.date).toBeTruthy();
      expect(Number.isFinite(d.high)).toBe(true);
    });
  });

  it('_init() swallows apiFetch rejection and leaves the service usable', async () => {
    localStorage.setItem('swoop_club_id', 'club_err');
    apiFetchMock.mockRejectedValueOnce(new Error('network boom'));

    const svc = await freshService();
    await expect(svc._init()).resolves.toBeUndefined();
    expect(apiFetchMock).toHaveBeenCalledTimes(1);

    // Drop the real clubId so subsequent reads go through demo mode static
    // fallback — we're asserting "init error doesn't poison the module", not
    // "live mode gracefully degrades to demo".
    localStorage.removeItem('swoop_club_id');
    expect(svc.getDailyForecast(3).length).toBeGreaterThan(0);
    expect(svc.getWeatherAlerts().length).toBeGreaterThan(0);
    expect(svc.getWeatherSource()).toBe('static');
  });

  it('getTomorrowForecast() derives from getDailyForecast()', async () => {
    const svc = await freshService();
    const tomorrow = svc.getTomorrowForecast();
    // In demo mode static fallback has multiple days, so tomorrow is non-null.
    expect(tomorrow).not.toBeNull();
    expect(tomorrow.date).toBeTruthy();
  });
});
