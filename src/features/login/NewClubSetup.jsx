/**
 * NewClubSetup — 4-step wizard for onboarding a new club
 * Steps: Club Info → Admin Account → Upload Data → Ready
 *
 * Uses TailAdmin-style layout: centered form with max-w-md mx-auto
 */
import { useState, useRef } from 'react';

const TEMPLATES = [
  { file: 'swoop-template-members-only.xlsx', label: 'Members Only', desc: '20 members — test health scores and at-risk detection', sheets: '1 sheet', color: '#3b82f6' },
  { file: 'swoop-template-members-rounds.xlsx', label: 'Members + Rounds', desc: '25 members, 80 rounds — adds golf engagement analysis', sheets: '2 sheets', color: '#8b5cf6' },
  { file: 'swoop-template-members-rounds-fb.xlsx', label: 'Members + Rounds + F&B', desc: '30 members, 100 rounds, 150 transactions — unlocks revenue signals', sheets: '3 sheets', color: '#039855' },
  { file: 'swoop-template-full.xlsx', label: 'Full Dataset', desc: '40 members, 120 rounds, 200 transactions, 15 complaints — everything', sheets: '4 sheets', color: '#ff8b00' },
];

const STEP_LABELS = ['Club Info', 'Admin Account', 'Upload Data', 'Ready'];

const inputClasses = 'h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:border-gray-700 dark:focus:border-brand-800';

export default function NewClubSetup({ onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Created club data
  const [clubId, setClubId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Step 2 state
  const [uploadResults, setUploadResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const fileInputRef = useRef(null);

  // ─── Step 0: Validate Club Info & advance ───
  const handleClubInfoNext = () => {
    if (!clubName.trim()) { setError('Club name is required'); return; }
    setError(null);
    setStep(1);
  };

  // ─── Step 1: Create Club with Admin Account ───
  const handleCreateClub = async () => {
    if (!adminName.trim()) { setError('Your name is required'); return; }
    if (!adminEmail.trim()) { setError('Email is required'); return; }
    if (!adminPassword || adminPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/onboard-club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubName: clubName.trim(),
          city: city.trim() || 'Unknown',
          state: state.trim() || 'US',
          zip: zip.trim() || '00000',
          memberCount: parseInt(memberCount) || 50,
          courseCount: 1,
          outletCount: 3,
          adminEmail: adminEmail.trim(),
          adminName: adminName.trim(),
          adminPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create club'); setLoading(false); return; }
      setClubId(data.clubId);
      setUserId(data.userId);
      if (data.token) {
        localStorage.setItem('swoop_auth_token', data.token);
        localStorage.setItem('swoop_club_id', data.clubId);
        localStorage.setItem('swoop_club_name', clubName.trim());
        localStorage.setItem('swoop_auth_user', JSON.stringify(data.user));
      }
      setStep(2);
    } catch {
      setError('Connection error. Check your network and try again.');
    }
    setLoading(false);
  };

  // ─── Step 2: Upload Data ───
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls') {
      setError(`Invalid file type ".${ext}" — please upload an .xlsx file. Download a template above to get the correct format.`);
      return;
    }
    setUploading(true);
    setError(null);
    setUploadedFileName(file.name);
    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const results = { members: 0, rounds: 0, transactions: 0, complaints: 0 };
      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(ws);
        if (rows.length === 0) continue;
        const cols = Object.keys(rows[0]).map(c => c.toLowerCase());
        let importType = null;
        if (sheetName.toLowerCase().includes('member') || cols.includes('first_name')) importType = 'members';
        else if (sheetName.toLowerCase().includes('round') || cols.includes('round_date')) importType = 'rounds';
        else if (sheetName.toLowerCase().includes('transaction') || cols.includes('total_amount')) importType = 'transactions';
        else if (sheetName.toLowerCase().includes('complaint') || cols.includes('category') && cols.includes('description')) importType = 'complaints';
        if (!importType) continue;
        const res = await fetch('/api/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clubId, importType, rows, uploadedBy: userId || 'setup-wizard' }),
        });
        const result = await res.json();
        results[importType] = result.success || rows.length;
      }
      setUploadResults(results);
      if (results.members > 0) {
        try { await fetch(`/api/compute-health-scores?clubId=${clubId}`, { method: 'POST' }); } catch { /* non-critical */ }
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    }
    setUploading(false);
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
    onComplete?.(user);
  };

  return (
    <div className="relative flex flex-col justify-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 font-sans px-6 py-12">
      <div className="w-full max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-gray-800 dark:text-white/90">Set Up Your Club</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-7">
          {STEP_LABELS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-error-50 border border-error-500/30 text-error-700 text-sm font-medium dark:bg-error-500/10 dark:text-error-400">
            {error}
          </div>
        )}

        {/* ─── Step 0: Club Info ─── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Club Name *</label>
              <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Pine Valley Country Club" className={inputClasses} />
            </div>
            <div className="grid grid-cols-[1fr_80px_100px] gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Scottsdale" className={inputClasses} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">State</label>
                <input value={state} onChange={e => setState(e.target.value)} placeholder="AZ" maxLength={2} className={inputClasses} />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">ZIP</label>
                <input value={zip} onChange={e => setZip(e.target.value)} placeholder="85255" className={inputClasses} />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Estimated Members</label>
              <input type="number" value={memberCount} onChange={e => setMemberCount(e.target.value)} placeholder="300" className={inputClasses} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={onBack} className="px-5 py-3 rounded-lg text-sm font-semibold text-gray-700 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
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
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Create your admin account</p>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Your Name *</label>
              <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Sarah Mitchell" className={inputClasses} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Email *</label>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="sarah@pinevalleycc.com" className={inputClasses} />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">Password *</label>
              <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min 8 characters" className={inputClasses} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setError(null); setStep(0); }} className="px-5 py-3 rounded-lg text-sm font-semibold text-gray-700 bg-white ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">
                Back
              </button>
              <button onClick={handleCreateClub} disabled={loading} className={`flex-1 py-3 rounded-lg text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 transition ${loading ? 'opacity-70 cursor-wait' : ''}`}>
                {loading ? 'Setting up...' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Upload Data ─── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="px-4 py-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400">
              Club created! Upload your data or skip for now.
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              Download a template, fill in your data, and upload it. Start with Members Only to test quickly.
            </p>

            {/* Template downloads */}
            <div className="space-y-2">
              {TEMPLATES.map((t) => (
                <a
                  key={t.file}
                  href={`/templates/${t.file}`}
                  download
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition no-underline text-gray-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600"
                >
                  <span className="text-xl">📥</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: t.color }}>{t.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{t.desc}</div>
                  </div>
                  <span className="text-xs text-gray-400 font-semibold shrink-0">{t.sheets}</span>
                </a>
              ))}
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 rounded-lg border-2 border-dashed text-center cursor-pointer transition-colors ${
                uploadedFileName
                  ? 'border-success-500/40 bg-success-50/30 dark:bg-success-500/5'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              {uploading ? (
                <div className="text-sm text-brand-500 font-semibold">Uploading and processing...</div>
              ) : uploadedFileName ? (
                <>
                  <div className="text-2xl mb-2">✅</div>
                  <div className="text-sm font-semibold text-success-600">{uploadedFileName}</div>
                  <div className="text-xs text-gray-400 mt-1">Click to upload a different file</div>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">📄</div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">Click to upload XLSX file</div>
                  <div className="text-xs text-gray-400 mt-1">Multi-sheet files auto-detected</div>
                </>
              )}
            </div>

            {/* Upload results */}
            {uploadResults && (
              <div className="px-4 py-3 rounded-lg bg-success-50 border border-success-200 dark:bg-success-500/10 dark:border-success-500/30">
                <div className="text-sm font-bold text-success-600 dark:text-success-400 mb-1">Upload Complete</div>
                <div className="flex gap-3 flex-wrap text-xs text-gray-700 dark:text-gray-300">
                  {uploadResults.members > 0 && <span>{uploadResults.members} members</span>}
                  {uploadResults.rounds > 0 && <span>{uploadResults.rounds} rounds</span>}
                  {uploadResults.transactions > 0 && <span>{uploadResults.transactions} transactions</span>}
                  {uploadResults.complaints > 0 && <span>{uploadResults.complaints} complaints</span>}
                </div>
              </div>
            )}

            <div className="pt-1">
              <button
                onClick={() => setStep(3)}
                className={`w-full py-3 rounded-lg text-sm font-bold transition ${
                  uploadResults
                    ? 'bg-brand-500 text-white hover:bg-brand-600'
                    : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700'
                }`}
              >
                {uploadResults ? 'Continue' : 'Skip for Now'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Ready ─── */}
        {step === 3 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white/90">
              {clubName} is ready!
            </h2>

            {uploadResults ? (
              <div className="text-left p-4 rounded-lg bg-gray-50 border border-gray-200 dark:bg-white/[0.03] dark:border-gray-700">
                <div className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">What you can see now:</div>
                <div className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {uploadResults.members > 0 && <div>✅ Health scores & at-risk members</div>}
                  {uploadResults.rounds > 0 && <div>✅ Golf engagement & pace analysis</div>}
                  {uploadResults.transactions > 0 && <div>✅ Revenue signals & spend patterns</div>}
                  {uploadResults.complaints > 0 && <div>✅ Complaint tracking & follow-through</div>}
                  {!uploadResults.transactions && <div className="text-gray-400">📎 Upload F&B data later to unlock revenue insights</div>}
                  {!uploadResults.complaints && <div className="text-gray-400">📎 Upload complaints later to track service follow-through</div>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No data uploaded yet. You can upload data from Admin &gt; CSV Import anytime.
              </p>
            )}

            <button onClick={handleFinish} className="w-full py-3.5 rounded-lg bg-brand-500 text-white text-base font-bold hover:bg-brand-600 transition">
              Open Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
