/**
 * QuickClubSetup — minimal 1-screen setup for new clubs.
 * Just club name + city + state → you're in.
 *
 * Shows after Google sign-in when the user's club has a placeholder name
 * (e.g. "John's Club"), or as a standalone entry point.
 */
import { useState } from 'react';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
];

const inputClasses = 'h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800';

export default function QuickClubSetup({ onComplete, existingClubId }) {
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = clubName.trim().length >= 2 && city.trim().length >= 2 && state;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('swoop_auth_token');
      const res = await fetch('/api/quick-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          club_id: existingClubId,
          club_name: clubName.trim(),
          city: city.trim(),
          state,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Setup failed');
        setLoading(false);
        return;
      }

      // Update localStorage with the real club name
      try {
        const user = JSON.parse(localStorage.getItem('swoop_auth_user') || '{}');
        user.clubName = clubName.trim();
        user.clubId = data.clubId || existingClubId;
        localStorage.setItem('swoop_auth_user', JSON.stringify(user));
        localStorage.setItem('swoop_club_name', clubName.trim());
        if (data.clubId) localStorage.setItem('swoop_club_id', data.clubId);
      } catch {}

      if (onComplete) onComplete(data);
    } catch (err) {
      setError('Connection error — please try again');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Swoop</div>
          <p className="text-gray-500 dark:text-gray-400">Let's set up your club in 30 seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Club Name
            </label>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="e.g. Pine Valley Golf Club"
              className={inputClasses}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Clementon"
                className={inputClasses}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className={inputClasses}
              >
                <option value="">--</option>
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full h-11 rounded-lg text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </button>

          <p className="text-xs text-center text-gray-400 dark:text-gray-500">
            You can add more details, invite your team, and import data after setup.
          </p>
        </form>
      </div>
    </div>
  );
}
