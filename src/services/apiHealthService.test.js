// apiHealthService — unit tests for the rollup transformer.
//
// Mocks `fetch` to return canned /api/health bodies and asserts the
// `getHealthRollup()` shape. PRODUCT-FINALIZATION criterion 7 lock-in.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getHealthRollup, getHealthSnapshot, _clearHealthCache } from './apiHealthService';

const FAKE_OK_BODY = {
  status: 'ok',
  timestamp: '2026-04-09T19:00:00.000Z',
  version: '2.0.0',
  db: 'ok',
  dbLatencyMs: 42,
  uptimeSec: 100,
  node: 'v20.0.0',
  responseTimeMs: 50,
  integrations: {
    weather: { status: 'ok', lastSync: '2026-04-09T18:00:00.000Z', ageMin: 60 },
    audit:   { status: 'ok', rows: 12, oldestRow: '2026-03-15T00:00:00.000Z' },
  },
};

const FAKE_DEGRADED_BODY = {
  ...FAKE_OK_BODY,
  status: 'degraded',
  integrations: {
    weather: { status: 'stale', lastSync: '2026-04-05T18:00:00.000Z', ageMin: 5760 },
    audit:   { status: 'unknown', rows: null, oldestRow: null },
  },
};

const FAKE_EMPTY_BODY = {
  ...FAKE_OK_BODY,
  integrations: {
    weather: { status: 'unknown', lastSync: null, ageMin: null },
    audit:   { status: 'ok', rows: 0, oldestRow: null },
  },
};

describe('apiHealthService', () => {
  beforeEach(() => {
    _clearHealthCache();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    _clearHealthCache();
  });

  describe('getHealthSnapshot', () => {
    it('returns parsed body on a 200', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => FAKE_OK_BODY,
      });
      const snap = await getHealthSnapshot({ forceRefresh: true });
      expect(snap).toEqual(FAKE_OK_BODY);
    });

    it('returns null on network error', async () => {
      global.fetch.mockRejectedValueOnce(new Error('boom'));
      const snap = await getHealthSnapshot({ forceRefresh: true });
      expect(snap).toBeNull();
    });

    it('returns null on non-2xx', async () => {
      global.fetch.mockResolvedValueOnce({ ok: false });
      const snap = await getHealthSnapshot({ forceRefresh: true });
      expect(snap).toBeNull();
    });

    it('caches across calls within TTL', async () => {
      global.fetch.mockResolvedValue({ ok: true, json: async () => FAKE_OK_BODY });
      await getHealthSnapshot({ forceRefresh: true });
      await getHealthSnapshot();
      await getHealthSnapshot();
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getHealthRollup', () => {
    it('returns ok rollup with both integrations green', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => FAKE_OK_BODY });
      const r = await getHealthRollup();
      expect(r.overall).toBe('ok');
      expect(r.db.status).toBe('ok');
      expect(r.db.latencyMs).toBe(42);
      expect(r.integrations).toHaveLength(2);
      expect(r.integrations[0].name).toBe('Weather sync');
      expect(r.integrations[0].status).toBe('ok');
      expect(r.integrations[0].badge).toBe('✓');
      expect(r.integrations[0].hint).toContain('synced');
      expect(r.integrations[1].name).toBe('Cross-club audit purge');
      expect(r.integrations[1].rows).toBe(12);
    });

    it('returns degraded rollup when an integration is stale', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => FAKE_DEGRADED_BODY });
      const r = await getHealthRollup();
      expect(r.overall).toBe('degraded');
      const weather = r.integrations.find(i => i.key === 'weather');
      expect(weather.status).toBe('stale');
      expect(weather.badge).toBe('!');
      expect(weather.hint).toContain('Stale');
    });

    it('returns unknown rollup when network fails', async () => {
      global.fetch.mockRejectedValueOnce(new Error('boom'));
      const r = await getHealthRollup();
      expect(r.overall).toBe('unknown');
      expect(r.db.status).toBe('unknown');
      expect(r.integrations).toEqual([]);
      expect(r.fetchedAt).toBeNull();
    });

    it('handles empty (fresh-DB) state without crashing', async () => {
      global.fetch.mockResolvedValueOnce({ ok: true, json: async () => FAKE_EMPTY_BODY });
      const r = await getHealthRollup();
      expect(r.overall).toBe('ok');
      const weather = r.integrations.find(i => i.key === 'weather');
      expect(weather.status).toBe('unknown');
      expect(weather.badge).toBe('?');
      expect(weather.hint).toContain('No sync data');
      const audit = r.integrations.find(i => i.key === 'audit');
      expect(audit.status).toBe('ok');
      expect(audit.rows).toBe(0);
    });
  });
});
