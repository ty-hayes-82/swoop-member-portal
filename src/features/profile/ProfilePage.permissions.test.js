import { describe, it, expect } from 'vitest';
import { getRolePermissions } from './ProfilePage';

// Locks in the role → permissions map surfaced by the "Your Role & Club
// Permissions" card (PRODUCT-FINALIZATION criterion 2 #3). If a feature
// flips its access level for a role, this test should fail loudly so the
// docs/UI and actual nav gating stay in sync.

describe('getRolePermissions', () => {
  it('returns 9 features for gm, all full except cross-club', () => {
    const perms = getRolePermissions('gm');
    expect(perms.features).toHaveLength(9);
    const crossClub = perms.features.find((f) => f.name.startsWith('Cross-club'));
    expect(crossClub.access).toBe('none');
    const others = perms.features.filter((f) => !f.name.startsWith('Cross-club'));
    others.forEach((f) => expect(f.access).toBe('full'));
  });

  it('returns 9 features for swoop_admin with cross-club full access', () => {
    const perms = getRolePermissions('swoop_admin');
    expect(perms.features).toHaveLength(9);
    const crossClub = perms.features.find((f) => f.name.startsWith('Cross-club'));
    expect(crossClub.access).toBe('full');
    perms.features.forEach((f) => expect(f.access).toBe('full'));
  });

  it('gives assistant_gm view-only access to Board Report and Admin Hub', () => {
    const perms = getRolePermissions('assistant_gm');
    const board = perms.features.find((f) => f.name === 'Board Report');
    const admin = perms.features.find((f) => f.name === 'Admin Hub & Data Health');
    expect(board.access).toBe('view');
    expect(admin.access).toBe('view');
    const crossClub = perms.features.find((f) => f.name.startsWith('Cross-club'));
    expect(crossClub.access).toBe('none');
  });

  it('gives the demo role view-only access across everything except cross-club', () => {
    const perms = getRolePermissions('demo');
    const nonCrossClub = perms.features.filter((f) => !f.name.startsWith('Cross-club'));
    nonCrossClub.forEach((f) => expect(f.access).toBe('view'));
    const crossClub = perms.features.find((f) => f.name.startsWith('Cross-club'));
    expect(crossClub.access).toBe('none');
  });

  it('falls back to gm permissions for an unknown role', () => {
    const unknown = getRolePermissions('super_intern_3000');
    const gm = getRolePermissions('gm');
    expect(unknown).toBe(gm);
  });
});
