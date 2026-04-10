// useServiceCache — hook unit tests (SHIP_PLAN §2.3 pilot)
import React, { act } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRoot } from 'react-dom/client';

// React 18 requires this global flag for act() to work in test environments.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Hoisted mock for useCurrentClub so we can swap clubId between tests.
let mockClubId = 'club_A';
vi.mock('./useCurrentClub', () => ({
  useCurrentClub: () => mockClubId,
}));

import { useServiceCache, __resetServiceCache } from './useServiceCache';

function mountHook(hookFn) {
  const result = { current: null };
  function Probe() {
    result.current = hookFn();
    return null;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  return {
    result,
    async render() {
      await act(async () => {
        root.render(<Probe />);
      });
    },
    async flush() {
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
    },
    async unmount() {
      await act(async () => { root.unmount(); });
      container.remove();
    },
  };
}

beforeEach(() => {
  __resetServiceCache();
  mockClubId = 'club_A';
});

describe('useServiceCache', () => {
  it('returns isLoading:true then isLoading:false with data', async () => {
    let resolve;
    const fetcher = vi.fn(() => new Promise(r => { resolve = r; }));
    const h = mountHook(() => useServiceCache('k1', fetcher));

    await h.render();
    // Fetcher is in-flight — loading should still be true, data undefined.
    expect(h.result.current.isLoading).toBe(true);
    expect(h.result.current.data).toBeUndefined();

    await act(async () => { resolve({ value: 42 }); });
    await h.flush();

    expect(h.result.current.isLoading).toBe(false);
    expect(h.result.current.data).toEqual({ value: 42 });
    expect(h.result.current.error).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);

    await h.unmount();
  });

  it('dedupes concurrent calls with the same key', async () => {
    let resolve;
    const fetcher = vi.fn(() => new Promise(r => { resolve = r; }));

    const h1 = mountHook(() => useServiceCache('shared', fetcher));
    const h2 = mountHook(() => useServiceCache('shared', fetcher));

    await h1.render();
    await h2.render();

    // Both subscribed to the same in-flight promise; only one fetch dispatched.
    expect(fetcher).toHaveBeenCalledTimes(1);

    await act(async () => { resolve({ shared: true }); });
    await h1.flush();
    await h2.flush();

    expect(h1.result.current.data).toEqual({ shared: true });
    expect(h2.result.current.data).toEqual({ shared: true });
    expect(fetcher).toHaveBeenCalledTimes(1);

    await h1.unmount();
    await h2.unmount();
  });

  it('resets cache and refetches when clubIdScoped and clubId changes', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ club: 'A' })
      .mockResolvedValueOnce({ club: 'B' });

    mockClubId = 'club_A';
    const h1 = mountHook(() => useServiceCache('scoped', fetcher, { clubIdScoped: true }));
    await h1.render();
    await h1.flush();
    expect(h1.result.current.data).toEqual({ club: 'A' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await h1.unmount();

    // Switch tenants — new mount should NOT reuse club_A cache entry.
    mockClubId = 'club_B';
    const h2 = mountHook(() => useServiceCache('scoped', fetcher, { clubIdScoped: true }));
    await h2.render();
    await h2.flush();
    expect(h2.result.current.data).toEqual({ club: 'B' });
    expect(fetcher).toHaveBeenCalledTimes(2);
    await h2.unmount();
  });
});
