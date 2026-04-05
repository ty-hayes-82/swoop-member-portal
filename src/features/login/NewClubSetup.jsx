/**
 * NewClubSetup — 4-step wizard for onboarding a new club
 * Steps: Club Info → Course Setup → Upload Data → Ready
 */
import { useState, useRef } from 'react';
const TEMPLATES = [
  { file: 'swoop-template-members-only.xlsx', label: 'Members Only', desc: '20 members — test health scores and at-risk detection', sheets: '1 sheet', color: '#3b82f6' },
  { file: 'swoop-template-members-rounds.xlsx', label: 'Members + Rounds', desc: '25 members, 80 rounds — adds golf engagement analysis', sheets: '2 sheets', color: '#8b5cf6' },
  { file: 'swoop-template-members-rounds-fb.xlsx', label: 'Members + Rounds + F&B', desc: '30 members, 100 rounds, 150 transactions — unlocks revenue signals', sheets: '3 sheets', color: '#16a34a' },
  { file: 'swoop-template-full.xlsx', label: 'Full Dataset', desc: '40 members, 120 rounds, 200 transactions, 15 complaints — everything', sheets: '4 sheets', color: '#ff8b00' },
];

const STEP_LABELS = ['Club Info', 'Course', 'Upload Data', 'Ready'];

export default function NewClubSetup({ onComplete, onBack }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 0 state — club info + admin account
  const [clubName, setClubName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Created club data
  const [clubId, setClubId] = useState(null);
  const [userId, setUserId] = useState(null);

  // Step 2 state
  const [courseName, setCourseName] = useState('');
  const [holes, setHoles] = useState('18');
  const [par, setPar] = useState('72');

  // Step 3 state
  const [uploadResults, setUploadResults] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const fileInputRef = useRef(null);

  // ─── Step 1: Create Club ───
  const handleCreateClub = async () => {
    if (!clubName.trim()) { setError('Club name is required'); return; }
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
      setStep(1);
    } catch {
      setError('Connection error. Check your network and try again.');
    }
    setLoading(false);
  };

  // ─── Step 2: Course Setup (optional) ───
  const handleCourseSetup = async () => {
    if (courseName.trim()) {
      // Save course — inline POST (no dedicated endpoint yet, skip if fails)
      try {
        await fetch('/api/onboard-club', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clubId, step: 'course_setup', courseName: courseName.trim(), holes: parseInt(holes), par: parseInt(par) }),
        });
      } catch { /* non-critical */ }
    }
    setStep(2);
  };

  // ─── Step 3: Upload Data ───
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File type validation
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

        // Auto-detect import type by sheet name or column headers
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

      // Trigger health score computation if members were imported
      if (results.members > 0) {
        try {
          await fetch(`/api/compute-health-scores?clubId=${clubId}`, { method: 'POST' });
        } catch { /* non-critical */ }
      }
    } catch (err) {
      setError(`Upload error: ${err.message}`);
    }
    setUploading(false);
  };

  // ─── Step 4: Go to Dashboard ───
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

  // ─── Shared styles ───
  const inputStyle = {
    width: '100%', padding: '10px 14px', fontSize: '14px',
    border: '1px solid #E5E7EB', borderRadius: '10px',
    outline: 'none', boxSizing: 'border-box', background: '#F9FAFB',
  };
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' };
  const btnPrimary = {
    padding: '12px 24px', borderRadius: '10px', border: 'none',
    background: '#ff8b00', color: '#fff', fontSize: '14px',
    fontWeight: 700, cursor: 'pointer',
  };
  const btnSecondary = {
    padding: '12px 24px', borderRadius: '10px',
    border: '1px solid #E5E7EB', background: '#fff',
    color: '#374151', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#F8F9FA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 520, padding: '40px',
        background: '#fff', borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #E5E7EB',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F0F0F' }}>Set Up Your Club</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
            Step {step + 1} of {STEP_LABELS.length}: {STEP_LABELS[step]}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '28px' }}>
          {STEP_LABELS.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: '4px', borderRadius: '2px',
              background: i <= step ? '#ff8b00' : '#E5E7EB',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FEE2E2', color: '#991B1B', fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* ─── Step 0: Club Info ─── */}
        {step === 0 && (
          <div className="flex flex-col gap-3.5">
            <div>
              <label style={labelStyle}>Club Name *</label>
              <input value={clubName} onChange={e => setClubName(e.target.value)} placeholder="Pine Valley Country Club" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px', gap: '10px' }}>
              <div>
                <label style={labelStyle}>City</label>
                <input value={city} onChange={e => setCity(e.target.value)} placeholder="Scottsdale" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>State</label>
                <input value={state} onChange={e => setState(e.target.value)} placeholder="AZ" maxLength={2} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ZIP</label>
                <input value={zip} onChange={e => setZip(e.target.value)} placeholder="85255" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Estimated Members</label>
              <input type="number" value={memberCount} onChange={e => setMemberCount(e.target.value)} placeholder="300" style={inputStyle} />
            </div>
            <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '14px', marginTop: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '10px' }}>Admin Account</div>
              <div className="flex flex-col gap-3.5">
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input value={adminName} onChange={e => setAdminName(e.target.value)} placeholder="Sarah Mitchell" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} placeholder="sarah@pinevalleycc.com" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="Min 8 characters" style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={onBack} style={btnSecondary}>Back</button>
              <button onClick={handleCreateClub} disabled={loading} style={{ ...btnPrimary, flex: 1, opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Setting up...' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 1: Course Setup ─── */}
        {step === 1 && (
          <div className="flex flex-col gap-3.5">
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#F0F9FF', border: '1px solid #BAE6FD', fontSize: '13px', color: '#0369A1' }}>
              Club created! Now set up your course (optional).
            </div>
            <div>
              <label style={labelStyle}>Course Name</label>
              <input value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Championship Course" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Holes</label>
                <select value={holes} onChange={e => setHoles(e.target.value)} style={inputStyle}>
                  <option value="18">18 Holes</option>
                  <option value="9">9 Holes</option>
                  <option value="27">27 Holes</option>
                  <option value="36">36 Holes</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Par</label>
                <input type="number" value={par} onChange={e => setPar(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>Skip</button>
              <button onClick={handleCourseSetup} style={{ ...btnPrimary, flex: 1 }}>Save & Continue</button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Upload Data ─── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
              Download a template, fill in your data, and upload it. Start with Members Only to test quickly.
            </div>

            {/* Template downloads */}
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((t) => (
                <a
                  key={t.file}
                  href={`/templates/${t.file}`}
                  download
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '10px',
                    border: `1px solid ${t.color}25`, background: `${t.color}06`,
                    textDecoration: 'none', color: '#374151',
                  }}
                >
                  <span className="text-xl">📥</span>
                  <div className="flex-1">
                    <div style={{ fontSize: '13px', fontWeight: 700, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280' }}>{t.desc}</div>
                  </div>
                  <span className="text-[11px] text-gray-400 font-semibold">{t.sheets}</span>
                </a>
              ))}
            </div>

            {/* Upload area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '24px', borderRadius: '10px',
                border: `2px dashed ${uploadedFileName ? '#16a34a40' : '#D1D5DB'}`,
                background: uploadedFileName ? '#F0FDF408' : '#FAFAFA',
                textAlign: 'center', cursor: 'pointer',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              {uploading ? (
                <div style={{ fontSize: '14px', color: '#ff8b00', fontWeight: 600 }}>Uploading and processing...</div>
              ) : uploadedFileName ? (
                <>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>{uploadedFileName}</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Click to upload a different file</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Click to upload XLSX file</div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>Multi-sheet files auto-detected</div>
                </>
              )}
            </div>

            {/* Upload results */}
            {uploadResults && (
              <div style={{ padding: '14px 16px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', marginBottom: '6px' }}>Upload Complete</div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '12px', color: '#374151' }}>
                  {uploadResults.members > 0 && <span>{uploadResults.members} members</span>}
                  {uploadResults.rounds > 0 && <span>{uploadResults.rounds} rounds</span>}
                  {uploadResults.transactions > 0 && <span>{uploadResults.transactions} transactions</span>}
                  {uploadResults.complaints > 0 && <span>{uploadResults.complaints} complaints</span>}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={() => setStep(3)} style={{ ...(uploadResults ? btnPrimary : btnSecondary), flex: 1 }}>
                {uploadResults ? 'Continue' : 'Skip for Now'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 3: Ready ─── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
            <div className="text-5xl">🎉</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F0F0F' }}>
              {clubName} is ready!
            </div>

            {uploadResults ? (
              <div style={{ textAlign: 'left', padding: '16px', borderRadius: '10px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#374151', marginBottom: '8px' }}>What you can see now:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#374151' }}>
                  {uploadResults.members > 0 && <div>✅ Health scores & at-risk members</div>}
                  {uploadResults.rounds > 0 && <div>✅ Golf engagement & pace analysis</div>}
                  {uploadResults.transactions > 0 && <div>✅ Revenue signals & spend patterns</div>}
                  {uploadResults.complaints > 0 && <div>✅ Complaint tracking & follow-through</div>}
                  {!uploadResults.transactions && <div className="text-gray-400">📎 Upload F&B data later to unlock revenue insights</div>}
                  {!uploadResults.complaints && <div className="text-gray-400">📎 Upload complaints later to track service follow-through</div>}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                No data uploaded yet. You can upload data from Admin &gt; CSV Import anytime.
              </div>
            )}

            <button onClick={handleFinish} style={{ ...btnPrimary, width: '100%', fontSize: '16px', padding: '14px' }}>
              Open Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
