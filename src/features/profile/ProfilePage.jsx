/**
 * ProfilePage — User profile and account settings
 * Accessible via #/profile (from user dropdown menu)
 */
import { useState, useEffect } from 'react';

const SEND_MODES = [
  { value: 'local', label: 'Local (Phone/Desktop)', desc: 'Opens your default email app or SMS app to send. You control the send.' },
  { value: 'cloud', label: 'Cloud (SendGrid / Twilio)', desc: 'Sends automatically via SendGrid (email) and Twilio (SMS). No app needed.' },
];

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

  // Send mode: 'local' or 'cloud'
  const [emailSendMode, setEmailSendMode] = useState('local');
  const [smsSendMode, setSmsSendMode] = useState('local');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
      setUser(stored);
      setFormName(stored.name || '');
      setFormEmail(stored.email || '');
      setClubName(localStorage.getItem('swoop_club_name') || stored.clubName || '');
      setClubId(localStorage.getItem('swoop_club_id') || '');
      setDemoEmail(localStorage.getItem('swoop_demo_email') || '');
      setDemoPhone(localStorage.getItem('swoop_demo_phone') || '');
      setEmailSendMode(localStorage.getItem('swoop_email_send_mode') || 'local');
      setSmsSendMode(localStorage.getItem('swoop_sms_send_mode') || 'local');
    } catch {}
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = { ...user, name: formName, email: formEmail };
      localStorage.setItem('swoop_auth_user', JSON.stringify(updated));
      setUser(updated);

      // Persist demo overrides
      if (demoEmail) localStorage.setItem('swoop_demo_email', demoEmail);
      else localStorage.removeItem('swoop_demo_email');
      if (demoPhone) localStorage.setItem('swoop_demo_phone', demoPhone);
      else localStorage.removeItem('swoop_demo_phone');

      // Persist send modes
      localStorage.setItem('swoop_email_send_mode', emailSendMode);
      localStorage.setItem('swoop_sms_send_mode', smsSendMode);

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
          <input type="text" value={roleLabel} disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Club</label>
          <input type="text" value={clubName || (isDemo ? 'Demo Environment' : clubId)} disabled className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500" />
        </div>
      </div>

      {/* Send Mode Settings */}
      <div className="mb-8 p-4 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Message Delivery</h3>
        <p className="text-xs text-gray-400 mb-4">
          Choose how emails and texts are sent when you approve an action.
        </p>

        {/* Email send mode */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Email Delivery</label>
          <div className="flex gap-2">
            {SEND_MODES.map(mode => (
              <button
                key={mode.value}
                onClick={() => setEmailSendMode(mode.value)}
                className={`flex-1 p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                  emailSendMode === mode.value
                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{mode.value === 'local' ? '📱' : '☁️'}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{mode.label}</span>
                </div>
                <p className="text-[10px] text-gray-400 m-0">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* SMS send mode */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Text Message Delivery</label>
          <div className="flex gap-2">
            {SEND_MODES.map(mode => (
              <button
                key={mode.value}
                onClick={() => setSmsSendMode(mode.value)}
                className={`flex-1 p-3 rounded-lg border-2 text-left cursor-pointer transition-all ${
                  smsSendMode === mode.value
                    ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{mode.value === 'local' ? '📱' : '☁️'}</span>
                  <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{mode.label}</span>
                </div>
                <p className="text-[10px] text-gray-400 m-0">{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Demo override section */}
      <div className="mb-8 p-4 rounded-xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Test Overrides</h3>
        <p className="text-xs text-gray-400 mb-3">
          When testing actions, messages will be sent to these addresses instead of the member's real contact info.
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
