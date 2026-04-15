/**
 * PreviewModal — Scenario selector, run button, and results display
 * for testing agent configurations.
 *
 * Extracted from ConfigPreviewButton.jsx (Step 5 cleanup).
 *
 * Props:
 *   isOpen   — boolean
 *   onClose  — () => void
 *   agentId  — string
 *   config   — current agent config object (passed as config_override to test endpoint)
 */
import { useState, useCallback } from 'react';
import { apiFetch, getClubId } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// QA scenario dataset — 10 representative scenarios
// ---------------------------------------------------------------------------

const QA_SCENARIOS = [
  {
    id: 'complaint_slow_service',
    label: 'Complaint: Slow dining service',
    type: 'complaint',
    input: 'We waited 40 minutes and nobody even checked on us at dinner last night.',
    must_contain: ['name', 'empathy'],
    must_not_contain: ['unfortunately', 'I apologize'],
  },
  {
    id: 'booking_tee_time',
    label: 'Booking: Saturday tee time',
    type: 'booking',
    input: 'Can you book me a tee time for Saturday morning around 8?',
    must_contain: ['Saturday'],
    must_not_contain: ['unfortunately'],
  },
  {
    id: 'greeting_returning',
    label: 'Greeting: Returning member',
    type: 'greeting',
    input: 'Hey, it\'s been a while! What\'s happening at the club this weekend?',
    must_contain: [],
    must_not_contain: ['unfortunately'],
  },
  {
    id: 'grief_spouse',
    label: 'Grief: Lost spouse',
    type: 'grief',
    input: 'My husband Richard passed away last month. We used to love the wine dinners together.',
    must_contain: ['Richard'],
    must_not_contain: ['book', 'reservation', 'tee time', 'event'],
  },
  {
    id: 're_engagement_lapsed',
    label: 'Re-engagement: Lapsed member',
    type: 're-engagement',
    input: 'I haven\'t been to the club in months. Not sure it\'s worth it anymore.',
    must_contain: [],
    must_not_contain: ['unfortunately'],
  },
  {
    id: 'corporate_dinner',
    label: 'Corporate: Client dinner',
    type: 'corporate',
    input: 'I need to host a dinner for 8 clients next Thursday. Need to impress them.',
    must_contain: ['private', 'wine'],
    must_not_contain: [],
  },
  {
    id: 'complaint_billing',
    label: 'Complaint: Billing error',
    type: 'complaint',
    input: 'I was charged twice for my guest fees last month. This is ridiculous.',
    must_contain: [],
    must_not_contain: ['unfortunately'],
  },
  {
    id: 'booking_dining',
    label: 'Booking: Dining reservation',
    type: 'booking',
    input: 'Table for 4 Friday night, around 7. Somewhere quiet if possible.',
    must_contain: ['Friday'],
    must_not_contain: [],
  },
  {
    id: 'greeting_new_member',
    label: 'Greeting: New member orientation',
    type: 'greeting',
    input: 'Hi, we just joined last week. Still figuring everything out!',
    must_contain: ['welcome'],
    must_not_contain: [],
  },
  {
    id: 'complaint_course_conditions',
    label: 'Complaint: Course conditions',
    type: 'complaint',
    input: 'The greens on holes 7 and 12 were in terrible shape today. Not what I expect here.',
    must_contain: [],
    must_not_contain: ['unfortunately'],
  },
];

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateResponse(response, scenario) {
  const lower = (response || '').toLowerCase();
  const failures = [];

  for (const term of scenario.must_contain || []) {
    if (!lower.includes(term.toLowerCase())) {
      failures.push(`Missing required term: "${term}"`);
    }
  }

  for (const term of scenario.must_not_contain || []) {
    if (lower.includes(term.toLowerCase())) {
      failures.push(`Contains forbidden term: "${term}"`);
    }
  }

  return { passed: failures.length === 0, failures };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PreviewModal({ isOpen, onClose, agentId, config }) {
  const [selectedScenario, setSelectedScenario] = useState(QA_SCENARIOS[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const scenario = QA_SCENARIOS.find(s => s.id === selectedScenario) || QA_SCENARIOS[0];

  const runTest = useCallback(async () => {
    setLoading(true);
    setResult(null);
    try {
      const clubId = getClubId();
      const res = await apiFetch('/api/agent-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          agent_id: agentId,
          scenario_id: scenario.id,
          scenario_input: scenario.input,
          config_override: config,
        }),
      });

      if (res?.response) {
        const validation = validateResponse(res.response, scenario);
        setResult({
          response: res.response,
          tool_calls: res.tool_calls || [],
          ...validation,
        });
      } else {
        // Stub: simulate a response when the endpoint doesn't exist yet
        const stubResponse = `[Test endpoint not yet implemented. This is a preview stub for scenario: "${scenario.label}"]`;
        setResult({
          response: stubResponse,
          tool_calls: [],
          passed: null,
          failures: ['Test endpoint not available — showing stub response'],
        });
      }
    } catch {
      setResult({
        response: null,
        tool_calls: [],
        passed: false,
        failures: ['API request failed. The test endpoint may not be deployed yet.'],
      });
    } finally {
      setLoading(false);
    }
  }, [agentId, scenario, config]);

  const handleClose = useCallback(() => {
    setResult(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal content */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-swoop-panel shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-swoop-border bg-swoop-panel px-6 py-4">
          <h3 className="text-lg font-semibold text-swoop-text">
            Test Configuration
          </h3>
          <button
            onClick={handleClose}
            className="text-swoop-text-label hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Scenario selector */}
          <div>
            <label className="block text-sm font-medium text-swoop-text-2 mb-1">
              Select Scenario
            </label>
            <select
              value={selectedScenario}
              onChange={(e) => { setSelectedScenario(e.target.value); setResult(null); }}
              className="w-full rounded-md border border-swoop-border bg-swoop-panel px-3 py-2 text-sm text-swoop-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {QA_SCENARIOS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Scenario preview */}
          <div className="rounded-lg bg-swoop-row border border-swoop-border p-3">
            <p className="text-xs font-medium text-swoop-text-muted uppercase tracking-wide mb-1">
              Member says:
            </p>
            <p className="text-sm text-swoop-text italic">
              "{scenario.input}"
            </p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {scenario.must_contain.length > 0 && (
                <span className="text-xs text-green-600">
                  Must include: {scenario.must_contain.join(', ')}
                </span>
              )}
              {scenario.must_not_contain.length > 0 && (
                <span className="text-xs text-red-600">
                  Must avoid: {scenario.must_not_contain.join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Run button */}
          <button
            onClick={runTest}
            disabled={loading}
            className="w-full px-4 py-2.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running test...
              </span>
            ) : (
              'Run Test'
            )}
          </button>

          {/* Results */}
          {result && (
            <div className="space-y-3">
              {/* Pass/fail badge */}
              {result.passed !== null && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                  result.passed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {result.passed ? 'PASS' : 'FAIL'}
                </div>
              )}

              {/* Failures */}
              {result.failures?.length > 0 && (
                <div className="text-sm text-red-600 space-y-1">
                  {result.failures.map((f, i) => (
                    <p key={i}>{f}</p>
                  ))}
                </div>
              )}

              {/* Agent response */}
              {result.response && (
                <div className="rounded-lg bg-swoop-row border border-swoop-border p-3">
                  <p className="text-xs font-medium text-swoop-text-muted uppercase tracking-wide mb-1">
                    Agent Response:
                  </p>
                  <p className="text-sm text-swoop-text whitespace-pre-wrap">
                    {result.response}
                  </p>
                </div>
              )}

              {/* Tool calls */}
              {result.tool_calls?.length > 0 && (
                <div className="rounded-lg bg-swoop-row border border-swoop-border p-3">
                  <p className="text-xs font-medium text-swoop-text-muted uppercase tracking-wide mb-1">
                    Tool Calls:
                  </p>
                  <ul className="space-y-1">
                    {result.tool_calls.map((tc, i) => (
                      <li key={i} className="text-sm text-swoop-text-2 font-mono">
                        {tc.name || tc}({tc.input ? JSON.stringify(tc.input) : ''})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
