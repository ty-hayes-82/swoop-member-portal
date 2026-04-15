/**
 * ValidationRulesConfig — Validation rules checklist with toggles, retry-on-fail, max retries.
 *
 * Extracted from EngineeringPanel.jsx (Step 5 cleanup).
 *
 * Props:
 *   rules    — { [ruleId]: { enabled: boolean, retryOnFail: boolean, maxRetries: number } }
 *   onChange — (ruleId: string, action: 'toggle' | 'update', field?: string, value?: any) => void
 */
import { useCallback } from 'react';

// ── Constants ───────────────────────────────────────────────────────────────

const VALIDATION_RULES = [
  { id: 'empathy_first',          label: 'Empathy First',          desc: 'Response must start with member\'s first name' },
  { id: 'no_forbidden_words',     label: 'No Forbidden Words',     desc: 'Block configurable word list' },
  { id: 'no_markdown',            label: 'No Markdown',            desc: 'No **, ##, or bullet points' },
  { id: 'response_length',        label: 'Response Length',        desc: 'Min/max word count bounds' },
  { id: 'asks_before_suggesting', label: 'Asks Before Suggesting', desc: 'Must ask a question before recommending' },
];

// ── Component ───────────────────────────────────────────────────────────────

export default function ValidationRulesConfig({ rules, onChange }) {
  const toggleRule = useCallback((ruleId) => {
    onChange(ruleId, 'toggle');
  }, [onChange]);

  const updateRuleRetry = useCallback((ruleId, field, value) => {
    onChange(ruleId, 'update', field, value);
  }, [onChange]);

  return (
    <section>
      <h4 className="mb-2 text-sm font-medium text-swoop-text-2">
        Validation Rules
      </h4>
      <div className="space-y-3">
        {VALIDATION_RULES.map((rule) => {
          const ruleState = rules[rule.id];
          const enabled = ruleState?.enabled || false;

          return (
            <div
              key={rule.id}
              className={`rounded-md border p-3 ${enabled ? 'border-blue-300 bg-blue-50' : 'border-swoop-border bg-swoop-row'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleRule(rule.id)}
                    className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-swoop-border'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-swoop-panel transition-transform ${enabled ? 'left-[18px]' : 'left-0.5'}`}
                    />
                  </button>
                  <div>
                    <span className="text-sm font-medium text-swoop-text">
                      {rule.label}
                    </span>
                    <p className="text-xs text-swoop-text-muted">{rule.desc}</p>
                  </div>
                </div>
              </div>

              {enabled && (
                <div className="mt-2 flex items-center gap-4 pl-11">
                  <label className="flex items-center gap-1.5 text-xs text-swoop-text-muted">
                    <input
                      type="checkbox"
                      checked={ruleState?.retryOnFail || false}
                      onChange={(e) => updateRuleRetry(rule.id, 'retryOnFail', e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-swoop-border"
                    />
                    Retry on fail
                  </label>
                  {ruleState?.retryOnFail && (
                    <label className="flex items-center gap-1.5 text-xs text-swoop-text-muted">
                      Max retries:
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateRuleRetry(rule.id, 'maxRetries', Math.max(1, (ruleState.maxRetries || 1) - 1))}
                          className="h-5 w-5 rounded border border-swoop-border text-xs"
                        >
                          -
                        </button>
                        <span className="w-4 text-center">{ruleState.maxRetries || 1}</span>
                        <button
                          type="button"
                          onClick={() => updateRuleRetry(rule.id, 'maxRetries', Math.min(3, (ruleState.maxRetries || 1) + 1))}
                          className="h-5 w-5 rounded border border-swoop-border text-xs"
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
  );
}
