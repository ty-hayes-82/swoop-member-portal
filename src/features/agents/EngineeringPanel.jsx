/**
 * EngineeringPanel — Tier 3 admin panel for agent engineering controls.
 *
 * Sprint 5: Model selector, temperature slider, prefill, validation rules.
 * Only visible for role === 'swoop_admin'.
 */
import { useState, useEffect, useCallback } from 'react';
import { apiFetch, getClubId } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MODELS = [
  { id: 'claude-opus-4-20250514',    label: 'Claude Opus',   cost: '$$$', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { id: 'claude-sonnet-4-20250514',  label: 'Claude Sonnet', cost: '$$',  badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',  cost: '$',   badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
];

/** Default model recommendations per agent type. */
const MODEL_DEFAULTS = {
  'chief-of-staff':          'claude-opus-4-20250514',
  'personal-concierge':      'claude-opus-4-20250514',
  'member-service-recovery': 'claude-opus-4-20250514',
  'booking-agent':           'claude-haiku-4-5-20251001',
  'staffing-demand':         'claude-haiku-4-5-20251001',
  'member-risk-lifecycle':   'claude-sonnet-4-20250514',
  'service-recovery':        'claude-sonnet-4-20250514',
  'tomorrows-game-plan':     'claude-sonnet-4-20250514',
  'fb-intelligence':         'claude-sonnet-4-20250514',
  'board-report-compiler':   'claude-sonnet-4-20250514',
  'revenue-analyst':         'claude-sonnet-4-20250514',
  'growth-pipeline':         'claude-sonnet-4-20250514',
};

/** Recommended temperature zones [min, max] per agent type. */
const TEMP_ZONES = {
  'chief-of-staff':          [0.3, 0.5],
  'personal-concierge':      [0.5, 0.7],
  'member-service-recovery': [0.5, 0.7],
  'booking-agent':           [0.0, 0.2],
  'staffing-demand':         [0.1, 0.3],
  'member-risk-lifecycle':   [0.2, 0.4],
  'service-recovery':        [0.3, 0.5],
  'tomorrows-game-plan':     [0.2, 0.4],
  'fb-intelligence':         [0.2, 0.4],
  'board-report-compiler':   [0.2, 0.4],
  'revenue-analyst':         [0.2, 0.4],
  'growth-pipeline':         [0.2, 0.4],
};

const VALIDATION_RULES = [
  { id: 'empathy_first',          label: 'Empathy First',          desc: 'Response must start with member\'s first name' },
  { id: 'no_forbidden_words',     label: 'No Forbidden Words',     desc: 'Block configurable word list' },
  { id: 'no_markdown',            label: 'No Markdown',            desc: 'No **, ##, or bullet points' },
  { id: 'response_length',        label: 'Response Length',        desc: 'Min/max word count bounds' },
  { id: 'asks_before_suggesting', label: 'Asks Before Suggesting', desc: 'Must ask a question before recommending' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EngineeringPanel({ agentId, role }) {
  // Gate: only swoop_admin sees this panel
  if (role !== 'swoop_admin') return null;

  const [model, setModel] = useState(MODEL_DEFAULTS[agentId] || MODELS[1].id);
  const [temperature, setTemperature] = useState(0.3);
  const [maxTokens, setMaxTokens] = useState(600);
  const [prefill, setPrefill] = useState('');
  const [validationRules, setValidationRules] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load current config on mount
  useEffect(() => {
    async function load() {
      try {
        const clubId = getClubId();
        const config = await apiFetch(`/api/agent-config?clubId=${clubId}&agentId=${agentId}`);
        const overrides = config?.prompt_overrides || config?.config?.prompt_overrides || {};
        if (overrides.model) setModel(overrides.model);
        if (overrides.temperature != null) setTemperature(overrides.temperature);
        if (overrides.max_tokens) setMaxTokens(overrides.max_tokens);
        if (overrides.prefill) setPrefill(overrides.prefill);
        if (overrides.validation_rules) {
          const ruleMap = {};
          for (const r of overrides.validation_rules) {
            ruleMap[r.name] = { enabled: true, retryOnFail: r.retry_on_fail || false, maxRetries: r.max_retries || 1 };
          }
          setValidationRules(ruleMap);
        }
      } catch {
        // Config not found — use defaults
      }
    }
    load();
  }, [agentId]);

  const toggleRule = useCallback((ruleId) => {
    setValidationRules(prev => {
      const current = prev[ruleId];
      if (current?.enabled) {
        const next = { ...prev };
        delete next[ruleId];
        return next;
      }
      return { ...prev, [ruleId]: { enabled: true, retryOnFail: false, maxRetries: 1 } };
    });
  }, []);

  const updateRuleRetry = useCallback((ruleId, field, value) => {
    setValidationRules(prev => ({
      ...prev,
      [ruleId]: { ...prev[ruleId], [field]: value },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSaveStatus(null);

    const rulesArray = Object.entries(validationRules)
      .filter(([, v]) => v.enabled)
      .map(([name, v]) => ({
        name,
        retry_on_fail: v.retryOnFail,
        max_retries: v.maxRetries,
      }));

    const payload = {
      agent_id: agentId,
      prompt_overrides: {
        model,
        temperature,
        max_tokens: maxTokens,
        prefill: prefill || null,
        validation_rules: rulesArray,
      },
    };

    try {
      await apiFetch('/api/agent-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [agentId, model, temperature, maxTokens, prefill, validationRules]);

  const recommendedZone = TEMP_ZONES[agentId] || [0.2, 0.4];
  const defaultModel = MODEL_DEFAULTS[agentId] || MODELS[1].id;

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Engineering Controls
        </h3>
        <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
          Swoop Admin Only
        </span>
      </div>

      {/* ── Model Selector ─────────────────────────────────────────────── */}
      <section>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Model
        </label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.cost}){m.id === defaultModel ? ' — recommended' : ''}
            </option>
          ))}
        </select>
        <div className="mt-1 flex gap-2">
          {MODELS.map((m) => (
            <span
              key={m.id}
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${m.badge} ${m.id === model ? 'ring-2 ring-offset-1 ring-blue-500' : 'opacity-50'}`}
            >
              {m.cost}
            </span>
          ))}
        </div>
      </section>

      {/* ── Temperature Slider ─────────────────────────────────────────── */}
      <section>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Temperature: {temperature.toFixed(1)}
        </label>
        <div className="relative">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
          {/* Recommended zone indicator */}
          <div
            className="pointer-events-none absolute top-0 h-2 rounded bg-green-300/50 dark:bg-green-600/40"
            style={{
              left: `${recommendedZone[0] * 100}%`,
              width: `${(recommendedZone[1] - recommendedZone[0]) * 100}%`,
              marginTop: '6px',
            }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Recommended zone: {recommendedZone[0].toFixed(1)} - {recommendedZone[1].toFixed(1)} (shown in green)
        </p>
      </section>

      {/* ── Max Tokens ─────────────────────────────────────────────────── */}
      <section>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Max Tokens
        </label>
        <input
          type="number"
          min="100"
          max="8192"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value, 10) || 600)}
          className="w-32 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
      </section>

      {/* ── Prefill ────────────────────────────────────────────────────── */}
      <section>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Assistant Prefill
        </label>
        <textarea
          value={prefill}
          onChange={(e) => setPrefill(e.target.value)}
          placeholder="{member_first_name},"
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Supports interpolation: {'{member_first_name}'}, {'{member_last_name}'}
        </p>
      </section>

      {/* ── Validation Rules ───────────────────────────────────────────── */}
      <section>
        <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Validation Rules
        </h4>
        <div className="space-y-3">
          {VALIDATION_RULES.map((rule) => {
            const ruleState = validationRules[rule.id];
            const enabled = ruleState?.enabled || false;

            return (
              <div
                key={rule.id}
                className={`rounded-md border p-3 ${enabled ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRule(rule.id)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span
                        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'left-[18px]' : 'left-0.5'}`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {rule.label}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{rule.desc}</p>
                    </div>
                  </div>
                </div>

                {enabled && (
                  <div className="mt-2 flex items-center gap-4 pl-11">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <input
                        type="checkbox"
                        checked={ruleState?.retryOnFail || false}
                        onChange={(e) => updateRuleRetry(rule.id, 'retryOnFail', e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                      Retry on fail
                    </label>
                    {ruleState?.retryOnFail && (
                      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                        Max retries:
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateRuleRetry(rule.id, 'maxRetries', Math.max(1, (ruleState.maxRetries || 1) - 1))}
                            className="h-5 w-5 rounded border border-gray-300 text-xs dark:border-gray-600"
                          >
                            -
                          </button>
                          <span className="w-4 text-center">{ruleState.maxRetries || 1}</span>
                          <button
                            type="button"
                            onClick={() => updateRuleRetry(rule.id, 'maxRetries', Math.min(3, (ruleState.maxRetries || 1) + 1))}
                            className="h-5 w-5 rounded border border-gray-300 text-xs dark:border-gray-600"
                          >
                            +
                          </button>
                        </div>
                      </label>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Save Button ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Engineering Config'}
        </button>
        {saveStatus === 'saved' && (
          <span className="text-sm text-green-600 dark:text-green-400">Saved successfully</span>
        )}
        {saveStatus === 'error' && (
          <span className="text-sm text-red-600 dark:text-red-400">Save failed</span>
        )}
      </div>
    </div>
  );
}
