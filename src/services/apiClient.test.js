import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage
const mockStorage = {};
const localStorageMock = {
  getItem: vi.fn((key) => mockStorage[key] || null),
  setItem: vi.fn((key, val) => { mockStorage[key] = val; }),
  removeItem: vi.fn((key) => { delete mockStorage[key]; }),
};
vi.stubGlobal('localStorage', localStorageMock);

// Reset module cache between tests to pick up fresh localStorage values
let getClubId, isDemo;

beforeEach(async () => {
  Object.keys(mockStorage).forEach(k => delete mockStorage[k]);
  vi.resetModules();
  const mod = await import('./apiClient.js');
  getClubId = mod.getClubId;
  isDemo = mod.isDemo;
});

describe('getClubId', () => {
  it('returns null when no club ID stored', () => {
    expect(getClubId()).toBeNull();
  });

  it('returns stored club ID from swoop_club_id', () => {
    mockStorage['swoop_club_id'] = 'club_123';
    expect(getClubId()).toBe('club_123');
  });

  it('falls back to user object clubId', () => {
    mockStorage['swoop_auth_user'] = JSON.stringify({ clubId: 'club_456' });
    expect(getClubId()).toBe('club_456');
  });

  it('prefers swoop_club_id over user object', () => {
    mockStorage['swoop_club_id'] = 'club_primary';
    mockStorage['swoop_auth_user'] = JSON.stringify({ clubId: 'club_fallback' });
    expect(getClubId()).toBe('club_primary');
  });
});

describe('isDemo', () => {
  it('returns falsy when no user stored', () => {
    // isDemo returns undefined (not strictly false) when user is null,
    // because the last expression is user?.clubId?.startsWith('demo_').
    // Callers use this in boolean contexts, so any falsy value is correct.
    expect(isDemo()).toBeFalsy();
  });

  it('returns true when user clubId is demo', () => {
    mockStorage['swoop_auth_user'] = JSON.stringify({ clubId: 'demo', userId: 'demo' });
    expect(isDemo()).toBe(true);
  });

  it('returns true when user userId is demo', () => {
    mockStorage['swoop_auth_user'] = JSON.stringify({ clubId: 'club_123', userId: 'demo' });
    expect(isDemo()).toBe(true);
  });

  it('returns false for real club user', () => {
    mockStorage['swoop_auth_user'] = JSON.stringify({ clubId: 'club_123', userId: 'usr_456' });
    expect(isDemo()).toBe(false);
  });
});
