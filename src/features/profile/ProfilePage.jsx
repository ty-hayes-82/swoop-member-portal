/**
 * ProfilePage — User profile and account settings
 * Accessible via #/profile (from user dropdown menu)
 */
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState({ name: '', email: '', role: '' });
  const [clubName, setClubName] = useState('');
  const [clubId, setClubId] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');

  // Demo override fields
  const [demoEmail, setDemoEmail] = useState('');
  const [demoPhone, setDemoPhone] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
      setUser(stored);
      setFormName(stored.name || '');
      setFormEmail(stored.email || '');
      setClubName(localStorage.getItem('swoop_club_name') || stored.clubName || '');
      setClubId(localStorage.getItem('swoop_club_id') || '');
      setDemoEmail(localStorage.getItem('demoOverrideEmail') || '');
      setDemoPhone(localStorage.getItem('demoOverridePhone') || '');
    } catch {}
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Update localStorage
      const updated = { ...user, name: formName, email: formEmail };
      localStorage.setItem('swoop_auth_user', JSON.stringify(updated));
      setUser(updated);

      // Persist demo overrides
      if (demoEmail) localStorage.setItem('demoOverrideEmail', demoEmail);
      else localStorage.removeItem('demoOverrideEmail');
      if (demoPhone) localStorage.setItem('demoOverridePhone', demoPhone);
      else localStorage.removeItem('demoOverridePhone');

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const isDemo = clubId === 'demo';
  const initials = (formName || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = {
    gm: 'General Manager',
    assistant_gm: 'Assistant GM',
    swoop_admin: 'Swoop Admin',
    viewer: 'Viewer',
  }[user.role] || user.role || 'Club Manager';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <h1 className="text-xl font-bold text-gray-800 dark:text-white/90 mb-1">My Profile</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Manage your account details and preferences.
      </p>

      {/* Avatar + role summary */}
      <div className="flex items-center gap-4 mb-8 p-4 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 font-bold text-xl">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-gray-800 dark:text-white/90">{formName || 'Club Manager'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}</div>
          <div className="text-xs text-gray-400 mt-0.5">{clubName || (isDemo ? 'Demo Environment' : 'Connected Club')}</div>
        </div>
      </div>

      {/* Profile form */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white/90"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
          <input
            type="email"
            value={formEmail}
            onChange={(e) => setFormEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white/90"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Role</label>
          <input
            type="text"
            value={roleLabel}
            disabled
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Club</label>
          <input
            type="text"
            value={clubName || (isDemo ? 'Demo Environment' : clubId)}
            disabled
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
          />
        </div>
      </div>

      {/* Demo override section */}
      <div className="mb-8 p-4 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Demo Mode Overrides</h3>
        <p className="text-xs text-gray-400 mb-3">
          When testing actions (emails, SMS), messages will be sent to these addresses instead of the member's.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Override Email</label>
            <input
              type="email"
              value={demoEmail}
              onChange={(e) => setDemoEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Override Phone (SMS)</label>
            <input
              type="tel"
              value={demoPhone}
              onChange={(e) => setDemoPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSaveProfile}
        disabled={saving}
        className="w-full py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-50"
        style={{ background: '#ff8b00' }}
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  );
}
