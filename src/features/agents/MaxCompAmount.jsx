/**
 * MaxCompAmount — Number input with $ prefix for max comp amount guardrail.
 *
 * Saves to behavioral_config.max_comp_amount via PATCH /api/agent-config.
 *
 * Props:
 *   agentId        — current agent slug
 *   clubId         — current club UUID
 *   maxCompAmount  — current value (number | null)
 *   onSaved        — callback after successful save
 */
import { useState, useCallback } from 'react';
import { apiFetch } from '@/services/apiClient';

const DEFAULT_AMOUNT = 50;

export default function MaxCompAmount({
  agentId,
  clubId,
  maxCompAmount,
  onSaved,
}) {
  const initial = maxCompAmount ?? DEFAULT_AMOUNT;
  const [amount, setAmount] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    // Allow empty for typing, otherwise parse
    if (val === '') {
      setAmount('');
    } else {
      const num = parseFloat(val);
      if (!Number.isNaN(num) && num >= 0) setAmount(num);
    }
    setSavedMsg('');
  }, []);

  const handleSave = useCallback(async () => {
    const value = amount === '' ? DEFAULT_AMOUNT : Number(amount);
    setSaving(true);
    setSavedMsg('');
    try {
      await apiFetch('/api/agent-config', {
        method: 'PATCH',
        body: JSON.stringify({
          agent_id: agentId,
          behavioral_config: { max_comp_amount: value },
        }),
      });
      setSavedMsg('Saved');
      onSaved?.();
    } catch (err) {
      setSavedMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [agentId, amount, onSaved]);

  const dirty = Number(amount) !== initial;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
        Max Comp Amount
      </label>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Agent will not offer complimentary items above this value without GM approval
      </p>

      <div className="flex items-center gap-3">
        <div className="relative w-32">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm font-medium">
            $
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={amount}
            onChange={handleChange}
            className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            dirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
          }`}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {savedMsg && (
          <span className={`text-sm ${savedMsg === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
            {savedMsg}
          </span>
        )}
      </div>
    </div>
  );
}
