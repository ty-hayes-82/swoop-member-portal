/**
 * NewClubSetup — 4-step wizard for onboarding a new club
 * Steps: Club Info → Admin Account → Upload Data → Ready
 *
 * Uses TailAdmin-style layout: centered form with max-w-md mx-auto
 */
import { useState } from 'react';
import { refreshWeatherForLocation } from '@/services/weatherService';

const TEMPLATES = [
  { file: 'swoop-template-members-only.xlsx', label: 'Members Only', desc: '20 members — test health scores and at-risk detection', sheets: '1 sheet', color: '#3b82f6' },
  { file: 'swoop-template-members-rounds.xlsx', label: 'Members + Rounds', desc: '25 members, 80 rounds — adds golf engagement analysis', sheets: '2 sheets', color: '#8b5cf6' },
  { file: 'swoop-template-members-rounds-fb.xlsx', label: 'Members + Rounds + F&B', desc: '30 members, 100 rounds, 150 transactions — unlocks revenue signals', sheets: '3 sheets', color: '#039855' },
  { file: 'swoop-template-full.xlsx', label: 'Full Dataset', desc: '40 members, 120 rounds, 200 transactions, 15 complaints — everything', sheets: '4 sheets', color: '#F3922D' },
];

const STEP_LABELS = ['Club Info', 'Admin Account', 'Upload Data', 'Ready'];

const inputClasses = 'h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-swoop-text-label focus:outline-hidden focus:ring-3 bg-transparent text-swoop-text border-swoop-border focus:border-brand-300 focus:ring-brand-500/20';

export default function NewClubSetup({ onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // When the user's email already exists, switch to sign-in mode
  const [existingAccountMode, setExistingAccountMode] = useState(false);

  // Step 0 state — club info
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [memberCount, setMemberCount] = useState('');

  // Step 1 state — admin account
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Pre-fill from current session if user is already signed in
  const _prefillFromSession = () => {
    try {
      const u = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
      if (u.name && !adminName) setAdminName(u.name);
      if (u.email && !adminEmail) setAdminEmail(u.email);
    } catch {}
  };

  // Created club data
  const [clubId, setClubId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  // ─── Step 0: Validate Club Info & advance ───
  const handleClubInfoNext = () => {
    if (!clubName.trim()) { setError('Club name is required'); return; }
    setError(null);
    _prefillFromSession();
    setStep(1);
  };

  // ─── Step 1: Submit (create new account OR link existing) ───
  const handleCreateClub = async () => {
    if (!existingAccountMode && !adminName.trim()) { setError('Your name is required'); return; }
    if (!adminEmail.trim()) { setError('Email is required'); return; }
    if (existingAccountMode && !adminPassword) { setError('Password required to link existing account'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboard-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName: clubName.trim(),
          city: city.trim() || null,
          state: state.trim() || null,
          zip: zip.trim() || null,
          memberCount: parseInt(memberCount) || null,
          courseCount: 1,
          outletCount: 3,
          adminEmail: adminEmail.trim(),
          adminName: adminName.trim(),
          adminPassword,
          linkToExistingUser: existingAccountMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Email already exists — offer to link via existing account instead
        if (res.status === 409) {
          setExistingAccountMode(true);
          setAdminPassword('');
          setError(null);
          setLoading(false);
          return;
        }
        setError(data.error || 'Failed to create club');
        setLoading(false);
        return;
      }
      setClubId(data.clubId);
      setUserId(data.userId);
      if (data.generatedPassword) setGeneratedPassword(data.generatedPassword);
      if (data.token) {
        localStorage.setItem('swoop_auth_token', data.token);
        localStorage.setItem('swoop_club_id', data.clubId);
        localStorage.setItem('swoop_club_name', clubName.trim());
        localStorage.setItem('swoop_auth_user', JSON.stringify(data.user));
        if (city.trim()) {
          localStorage.setItem('swoop_club_city', city.trim());
          localStorage.setItem('swoop_club_state', state.trim() || '');
        }
      }
      setStep(2);
    } catch {
      setError('Connection error. Check your network and try again.');
    }
    setLoading(false);
  };

  // ─── Step 3: Go to Dashboard ───
  const handleFinish = () => {
    const user = {
      userId: userId || 'admin', clubId, name: adminName.trim() || 'Club Admin',
      clubName: clubName.trim(),
      email: adminEmail.trim() || 'admin@club.com', role: 'gm', title: 'General Manager',
    };
    localStorage.setItem('swoop_auth_user', JSON.stringify(user));
    localStorage.setItem('swoop_club_id', clubId);
    localStorage.setItem('swoop_club_name', clubName.trim());
    // Store city/state so weather fetches use the club's actual location
    // (replaces any stale location from a prior session).
    if (city.trim()) {
      localStorage.setItem('swoop_club_city', city.trim());
      localStorage.setItem('swoop_club_state', state.trim() || '');
    } else {
      localStorage.removeItem('swoop_club_city');
      localStorage.removeItem('swoop_club_state');
    }
    // Notify AuthProvider so useCurrentClub / useAuth pick up the new session
    // without a page reload — otherwise the header falls back to "demo".
    window.dispatchEvent(new Event('swoop:auth-changed'));
    // Kick off a fresh weather fetch for the new location so Today View
    // shows this club's forecast instead of the previous session's data.
    refreshWeatherForLocation();
    onComplete?.(user);
  };

  return (
    <div className="relative flex flex-col justify-center w-full min-h-screen bg-swoop-row font-sans px-6 py-12">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-swoop-text">Set Up Your Club</h1>
          <p className="text-sm text-swoop-text-muted mt-1">
            Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-7">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-swoop-border'}`} />
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-error-50 border border-error-500/30 text-error-700 text-sm font-medium">
            {error}
          </div>
        )}

        {/* ─── Step 0: Club Info ─── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">Club Name *</label>
              <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Pine Valley Country Club" className={inputClasses} />
            </div>
            <div className="grid grid-cols-[1fr_80px_100px] gap-3">
              <div>
                <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Scottsdale" className={inputClasses} />
              </div>
              <div>
                <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">State</label>
                <input value={state} onChange={e => setState(e.target.value)} placeholder="AZ" maxLength={2} className={inputClasses} />
              </div>
              <div>
                <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">ZIP</label>
                <input value={zip} onChange={e => setZip(e.target.value)} placeholder="85255" className={inputClasses} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">Estimated Members</label>
              <input type="number" value={memberCount} onChange={e => setMemberCount(e.target.value)} placeholder="300" className={inputClasses} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onBack} className="px-5 py-3 rounded-lg text-sm font-semibold text-swoop-text-2 bg-swoop-panel ring-1 ring-inset ring-gray-300 hover:bg-swoop-row-hover transition">
                Back
              </button>
              <button onClick={handleClubInfoNext} className="flex-1 py-3 rounded-lg text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 transition">
                Next
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 1: Admin Account ─── */}
        {step === 1 && (
          <div className="space-y-4">
            {existingAccountMode ? (
              <div className="px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <p className="font-semibold mb-0.5">You already have a Swoop account</p>
                <p className="text-xs font-normal">Sign in with your existing password to link <strong>{clubName}</strong> to your account. Your previous club data won't be affected.</p>
              </div>
            ) : (
              <p className="text-sm font-semibold text-swoop-text-2">Create your admin account</p>
            )}

            {!existingAccountMode && (
              <div>
                <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">Your Name *</label>
                <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Sarah Mitchell" className={inputClasses} />
              </div>
            )}

            <div>
              <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">Email *</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => { setAdminEmail(e.target.value); if (existingAccountMode) setExistingAccountMode(false); }}
                placeholder="sarah@pinevalleycc.com"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-swoop-text-2 block mb-1.5">
                {existingAccountMode ? 'Your Password *' : 'Password'}
                {!existingAccountMode && <span className="text-swoop-text-label font-normal ml-1">(optional — we'll generate one)</span>}
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                placeholder={existingAccountMode ? 'Enter your Swoop password' : 'Leave blank to auto-generate'}
                className={inputClasses}
                autoFocus={existingAccountMode}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setError(null); setExistingAccountMode(false); setStep(0); }} className="px-5 py-3 rounded-lg text-sm font-semibold text-swoop-text-2 bg-swoop-panel ring-1 ring-inset ring-gray-300 hover:bg-swoop-row-hover transition">
                Back
              </button>
              <button onClick={handleCreateClub} disabled={loading} className={`flex-1 py-3 rounded-lg text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 transition ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                {loading ? 'Setting up...' : existingAccountMode ? 'Sign In & Create Club' : 'Next'}
              </button>
            </div>
            {existingAccountMode && (
              <p className="text-xs text-center text-swoop-text-label">
                Wrong email?{' '}
                <button className="text-brand-500 underline bg-transparent border-none cursor-pointer p-0 text-xs" onClick={() => { setExistingAccountMode(false); setAdminPassword(''); }}>
                  Use a different email
                </button>
              </p>
            )}
          </div>
        )}

        {/* ─── Step 2: Upload Data ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
              Club created! Download a template to prepare your data, then run the Import Wizard.
            </div>
            <p className="text-sm text-swoop-text-2 font-medium">
              The Import Wizard auto-maps Jonas columns, validates every row, and shows a dry-run preview before anything hits your database.
            </p>

            {/* Template downloads */}
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <a
                  key={t.file}
                  href={`/templates/${t.file}`}
                  download
                  className="flex items-center gap-3 p-3 rounded-lg border border-swoop-border hover:border-swoop-border transition no-underline text-swoop-text-2"
                >
                  <span className="text-xl">📥</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-xs text-swoop-text-muted">{t.desc}</div>
                  </div>
                  <span className="text-xs text-swoop-text-label font-semibold shrink-0">{t.sheets}</span>
                </a>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <a
                href="#/csv-import"
                className="w-full text-center py-3 rounded-lg text-sm font-bold no-underline bg-brand-500 text-white hover:bg-brand-600 transition"
              >
                Open Import Wizard
              </a>
              <button
                onClick={() => setStep(3)}
                className="w-full py-3 rounded-lg text-sm font-bold bg-swoop-panel text-swoop-text-2 ring-1 ring-inset ring-gray-300 hover:bg-swoop-row-hover transition"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Ready ─── */}
        {step === 3 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-swoop-text">
              {clubName} is ready!
            </h2>
            {generatedPassword && (
              <div className="text-left px-4 py-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-800 mb-1">Save your auto-generated password</p>
                <p className="font-mono text-sm font-bold text-amber-900 tracking-wide">{generatedPassword}</p>
                <p className="text-xs text-amber-700 mt-1">You'll need this to sign back in. You can change it in Admin settings.</p>
              </div>
            )}
            <p className="text-sm text-swoop-text-muted">
              No data uploaded yet. You can upload data from Admin &gt; CSV Import anytime.
            </p>
            <button onClick={handleFinish} className="w-full py-3.5 rounded-lg bg-brand-500 text-white text-base font-bold hover:bg-brand-600 transition">
              Open Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
