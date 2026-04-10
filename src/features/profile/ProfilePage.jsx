/**
 * ProfilePage — User profile and account settings
 * Accessible via #/profile (from user dropdown menu)
 */
import { useState, useEffect } from 'react';
import { getGoogleStatus, getGoogleAuthUrl, disconnectGoogle, clearGoogleStatusCache } from '@/services/googleService';
import SourceBadge from '@/components/ui/SourceBadge';

// Role → feature access map. "scope" drives the Role & Club Permissions card.
// Must stay in sync with the navigation/router feature gates.
const ROLE_PERMISSIONS = {
  swoop_admin: {
    label: 'Swoop Admin',
    scope: 'Full access across every club in the platform',
    features: [
      { name: 'Today View', access: 'full' },
      { name: 'Members & Health Scores', access: 'full' },
      { name: 'Tee Sheet', access: 'full' },
      { name: 'Service & Complaints', access: 'full' },
      { name: 'Revenue Page', access: 'full' },
      { name: 'Automations Inbox', access: 'full' },
      { name: 'Board Report', access: 'full' },
      { name: 'Admin Hub & Data Health', access: 'full' },
      { name: 'Cross-club operations (audited)', access: 'full' },
    ],
  },
  gm: {
    label: 'General Manager',
    scope: 'Full access within your own club',
    features: [
      { name: 'Today View', access: 'full' },
      { name: 'Members & Health Scores', access: 'full' },
      { name: 'Tee Sheet', access: 'full' },
      { name: 'Service & Complaints', access: 'full' },
      { name: 'Revenue Page', access: 'full' },
      { name: 'Automations Inbox', access: 'full' },
      { name: 'Board Report', access: 'full' },
      { name: 'Admin Hub & Data Health', access: 'full' },
      { name: 'Cross-club operations', access: 'none' },
    ],
  },
  assistant_gm: {
    label: 'Assistant GM',
    scope: 'Full operational access; reduced admin privileges',
    features: [
      { name: 'Today View', access: 'full' },
      { name: 'Members & Health Scores', access: 'full' },
      { name: 'Tee Sheet', access: 'full' },
      { name: 'Service & Complaints', access: 'full' },
      { name: 'Revenue Page', access: 'full' },
      { name: 'Automations Inbox', access: 'full' },
      { name: 'Board Report', access: 'view' },
      { name: 'Admin Hub & Data Health', access: 'view' },
      { name: 'Cross-club operations', access: 'none' },
    ],
  },
  demo: {
    label: 'Demo / Viewer',
    scope: 'Read-only walk-through of demo data',
    features: [
      { name: 'Today View', access: 'view' },
      { name: 'Members & Health Scores', access: 'view' },
      { name: 'Tee Sheet', access: 'view' },
      { name: 'Service & Complaints', access: 'view' },
      { name: 'Revenue Page', access: 'view' },
      { name: 'Automations Inbox', access: 'view' },
      { name: 'Board Report', access: 'view' },
      { name: 'Admin Hub & Data Health', access: 'view' },
      { name: 'Cross-club operations', access: 'none' },
    ],
  },
};

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.gm;
}

const SEND_MODES = [
  { value: 'local', label: 'Local (Phone/Desktop)', desc: 'Opens your default email app or SMS app to send. You control the send.' },
  { value: 'cloud', label: 'Cloud (SendGrid / Twilio)', desc: 'Sends automatically via SendGrid (email) and Twilio (SMS). No app needed.' },
];

const EMAIL_SEND_MODES = [
  ...SEND_MODES,
  { value: 'gmail', label: 'Gmail Draft', desc: 'AI generates a draft and opens it in Gmail for you to review and send.' },
  { value: 'gmail_api', label: 'Gmail API Draft', desc: 'AI generates a draft and saves it directly to your Gmail Drafts folder. Requires Google connection.', requiresGoogle: true },
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

  // Google connection
  const [googleStatus, setGoogleStatus] = useState({ connected: false });
  const [googleLoading, setGoogleLoading] = useState(false);

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

    // Check Google connection status
    getGoogleStatus().then(s => setGoogleStatus(s || { connected: false })).catch(() => {});

    // Handle redirect back from Google OAuth
    const params = new URLSearchParams(window.location.search || window.location.hash?.split('?')[1] || '');
    if (params.get('google_connected') === 'true') {
      clearGoogleStatusCache();
      getGoogleStatus().then(s => setGoogleStatus(s || { connected: false })).catch(() => {});
    }
  }, []);

  const handleGoogleConnect = () => {
    window.location.href = getGoogleAuthUrl();
  };

  const handleGoogleDisconnect = async () => {
    setGoogleLoading(true);
    try {
      await disconnectGoogle();
      setGoogleStatus({ connected: false });
      // Reset to gmail compose mode if currently using gmail_api
      if (emailSendMode === 'gmail_api') setEmailSendMode('gmail');
    } catch {}
    setGoogleLoading(false);
  };

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
      <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 font-bold text-xl">
          {initials}
        </div>
        <div>
          <div className="font-semibold text-gray-800 dark:text-white/90">{formName || 'Club Manager'}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{roleLabel}</div>
          <div className="text-xs text-gray-400 mt-0.5">{clubName || (isDemo ? 'Demo Environment' : 'Connected Club')}</div>
        </div>
      </div>

      {/* Your Role & Club Permissions */}
      <div className="mb-8 p-4 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Role & Club Permissions</h3>
          <SourceBadge system="Member CRM" size="xs" />
        </div>
        <p className="text-xs text-gray-400 mb-3">{getRolePermissions(user.role).scope}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {getRolePermissions(user.role).features.map((f) => {
            const icon = f.access === 'full' ? '✅' : f.access === 'view' ? '👁' : '🚫';
            const color = f.access === 'full'
              ? 'text-success-700 dark:text-success-400'
              : f.access === 'view'
                ? 'text-gray-600 dark:text-gray-400'
                : 'text-gray-400 dark:text-gray-600';
            const suffix = f.access === 'view' ? ' (view only)' : f.access === 'none' ? ' (no access)' : '';
            return (
              <div
                key={f.name}
                className={`flex items-center gap-2 text-xs px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 ${color}`}
                title={`Access: ${f.access}`}
              >
                <span className="shrink-0 text-sm leading-none">{icon}</span>
                <span className="font-medium">{f.name}{suffix}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-[10px] text-gray-400 italic leading-snug">
          Permissions are derived from your assigned role ({roleLabel}). Contact your Swoop admin if you need a higher access level.
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

      {/* Google Integration */}
      <div className="mb-8 p-4 rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Google Integration</h3>
        <p className="text-xs text-gray-400 mb-4">
          Connect your Google account to create Gmail drafts and Google Calendar events directly from Swoop.
        </p>
        {googleStatus.connected ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-success-50 border border-success-200 dark:bg-success-500/10 dark:border-success-500/30">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-success-500 text-sm font-semibold">Connected</span>
                {googleStatus.googleEmail && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{googleStatus.googleEmail}</span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {googleStatus.scopes?.calendar && 'Calendar'}{googleStatus.scopes?.calendar && googleStatus.scopes?.gmail && ' + '}{googleStatus.scopes?.gmail && 'Gmail'}
              </div>
            </div>
            <button
              onClick={handleGoogleDisconnect}
              disabled={googleLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-red-200 bg-red-50 text-red-600 dark:bg-red-500/10 dark:border-red-500/30 disabled:opacity-50"
            >
              {googleLoading ? 'Disconnecting...' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleGoogleConnect}
            className="w-full p-3 rounded-lg border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 cursor-pointer hover:border-brand-400 hover:text-brand-500 transition-all dark:border-gray-600 dark:text-gray-400 dark:hover:border-brand-500 dark:hover:text-brand-400"
          >
            Connect Google Account (Calendar + Gmail)
          </button>
        )}
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
          <div className="flex gap-2 flex-wrap">
            {EMAIL_SEND_MODES.map(mode => {
              const disabled = mode.requiresGoogle && !googleStatus.connected;
              return (
                <button
                  key={mode.value}
                  onClick={() => !disabled && setEmailSendMode(mode.value)}
                  disabled={disabled}
                  className={`flex-1 min-w-[140px] p-3 rounded-lg border-2 text-left transition-all ${
                    disabled
                      ? 'border-gray-200 opacity-50 cursor-not-allowed dark:border-gray-700'
                      : emailSendMode === mode.value
                        ? 'border-brand-500 bg-brand-500/5 cursor-pointer dark:bg-brand-500/10'
                        : 'border-gray-200 hover:border-gray-300 cursor-pointer dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm">{mode.value === 'local' ? '📱' : mode.value === 'gmail_api' ? '📨' : mode.value === 'gmail' ? '✉' : '☁️'}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">{mode.label}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 m-0">{mode.desc}</p>
                </button>
              );
            })}
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
