import { useState } from 'react';
import { getCourtReservations, COURT_TYPES } from '@/services/operationsActivityService';

const STATUS_STYLES = {
  confirmed: 'bg-green-100 text-green-800',
  pending:   'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-500',
};

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const EMPTY_FORM = {
  memberSearch: '',
  courtType: 'Tennis',
  date: '',
  time: '',
  duration: '60',
  partySize: '2',
};

export default function CourtReservationsPanel() {
  const [reservations, setReservations] = useState(getCourtReservations);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.memberSearch.trim()) { setFormError('Member name is required.'); return; }
    if (!form.date) { setFormError('Date is required.'); return; }
    if (!form.time) { setFormError('Time is required.'); return; }
    setFormError('');
    const next = {
      id: `court_${Date.now()}`,
      memberName: form.memberSearch.trim(),
      memberId: null,
      courtType: form.courtType,
      date: form.date,
      time: form.time,
      duration: Number(form.duration),
      partySize: Number(form.partySize),
      status: 'confirmed',
    };
    setReservations(r => [next, ...r]);
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-swoop-text">Court Reservations</h2>
          <p className="text-sm text-swoop-text-muted mt-0.5">Upcoming tennis and pickleball bookings.</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="px-3 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Booking'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-swoop-border bg-swoop-panel p-4 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-swoop-text">New Court Booking</h3>
          {formError && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-3 py-1.5">{formError}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Member</label>
              <input
                name="memberSearch"
                value={form.memberSearch}
                onChange={handleChange}
                placeholder="Search member name..."
                className="px-3 py-1.5 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text placeholder:text-swoop-text-muted focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Court Type</label>
              <select
                name="courtType"
                value={form.courtType}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {COURT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Time</label>
              <input
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Duration (min)</label>
              <select
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-swoop-text-muted uppercase tracking-wide">Party Size</label>
              <select
                name="partySize"
                value={form.partySize}
                onChange={handleChange}
                className="px-3 py-1.5 rounded-lg border border-swoop-border bg-swoop-row text-sm text-swoop-text focus:outline-none focus:ring-2 focus:ring-brand-400"
              >
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n === 1 ? 'player' : 'players'}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-brand-500 text-white text-sm font-semibold cursor-pointer border-none hover:bg-brand-600 transition-colors"
            >
              Confirm Booking
            </button>
          </div>
        </form>
      )}

      <div className="rounded-xl border border-swoop-border bg-swoop-panel overflow-hidden">
        {reservations.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-swoop-text-muted">No reservations yet.</div>
        ) : (
          <div className="divide-y divide-swoop-border">
            {reservations.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3 hover:bg-swoop-row transition-colors">
                <span className="text-xl flex-shrink-0">{r.courtType === 'Tennis' ? '🎾' : '🏓'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-swoop-text">{r.memberName}</span>
                    <span className="text-xs text-swoop-text-muted">{r.courtType}</span>
                  </div>
                  <div className="text-sm text-swoop-text-muted mt-0.5">
                    {formatDate(r.date)} at {r.time} &middot; {r.duration} min &middot; {r.partySize} {r.partySize === 1 ? 'player' : 'players'}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase rounded-full px-2 py-0.5 flex-shrink-0 ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-500'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
