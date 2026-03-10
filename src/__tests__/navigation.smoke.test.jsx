import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from '@/App.jsx';
import { NAV_ITEMS } from '@/config/navigation.js';

vi.mock('@/context/DataProvider', () => ({
  DataProvider: ({ children }) => <>{children}</>,
  useDataContext: () => ({ phase: 1, apiError: null }),
}));

const visibleRoutes = NAV_ITEMS.filter((item) => !item.hidden).map((item) => item.key);

describe('navigation smoke test', () => {
  visibleRoutes.forEach((routeKey) => {
    it(`renders ${routeKey} route without crashing`, async () => {
      window.location.hash = `#/${routeKey}`;
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      await act(async () => {
        root.render(<App />);
      });

      expect(container.textContent.length).toBeGreaterThan(0);

      await act(async () => {
        root.unmount();
      });
      container.remove();
    });
  });
});
