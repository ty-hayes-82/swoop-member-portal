/**
 * CustomExamplesPanel — CRUD interface for few-shot learning examples.
 *
 * Each example is a scenario-type-tagged (complaint, booking, greeting, etc.)
 * conversation pair: member input + ideal agent response. Up to 20 examples
 * per agent. Saves to behavioral_config.custom_examples[] via PATCH /api/agent-config.
 */
import { useState, useCallback } from 'react';
import { apiFetch, getClubId } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_EXAMPLES = 20;

const SCENARIO_TYPES = [
  { value: 'complaint',      label: 'Complaint' },
  { value: 'booking',        label: 'Booking' },
  { value: 'greeting',       label: 'Greeting' },
  { value: 'grief',          label: 'Grief' },
  { value: 're-engagement',  label: 'Re-engagement' },
  { value: 'corporate',      label: 'Corporate' },
];

const SCENARIO_BADGE_COLORS = {
  complaint:      'bg-red-100 text-red-700',
  booking:        'bg-blue-100 text-blue-700',
  greeting:       'bg-green-100 text-green-700',
  grief:          'bg-purple-100 text-purple-700',
  're-engagement': 'bg-amber-100 text-amber-700',
  corporate:      'bg-indigo-100 text-indigo-700',
};

const EMPTY_FORM = { scenario: 'complaint', input: '', ideal_response: '' };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text, max = 120) {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CustomExamplesPanel({ agentId, examples = [], onConfigUpdated }) {
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingIndex, setEditingIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [error, setError] = useState(null);

  const isEditing = editingIndex !== null;
  const atLimit = examples.length >= MAX_EXAMPLES;

  const persistExamples = useCallback(async (updatedExamples) => {
    setSaving(true);
    setError(null);
    try {
      const clubId = getClubId();
      const res = await apiFetch('/api/agent-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_id: clubId,
          agent_id: agentId,
          behavioral_config: { custom_examples: updatedExamples },
        }),
      });
      if (!res) throw new Error('Save failed');
      onConfigUpdated?.(res);
    } catch (err) {
      setError(err.message || 'Failed to save examples');
    } finally {
      setSaving(false);
    }
  }, [agentId, onConfigUpdated]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!form.input.trim() || !form.ideal_response.trim()) return;

    let updated;
    if (isEditing) {
      updated = examples.map((ex, i) => (i === editingIndex ? { ...form } : ex));
    } else {
      if (atLimit) return;
      updated = [...examples, { ...form }];
    }

    persistExamples(updated);
    setForm({ ...EMPTY_FORM });
    setEditingIndex(null);
  }, [form, isEditing, editingIndex, examples, atLimit, persistExamples]);

  const startEdit = useCallback((index) => {
    setForm({ ...examples[index] });
    setEditingIndex(index);
    setDeleteConfirm(null);
  }, [examples]);

  const cancelEdit = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setEditingIndex(null);
  }, []);

  const confirmDelete = useCallback((index) => {
    setDeleteConfirm(index);
  }, []);

  const executeDelete = useCallback((index) => {
    const updated = examples.filter((_, i) => i !== index);
    persistExamples(updated);
    setDeleteConfirm(null);
    if (editingIndex === index) cancelEdit();
  }, [examples, editingIndex, persistExamples, cancelEdit]);

  return (
    <div className="space-y-6">
      {/* Header + count */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-swoop-text">
          Custom Examples
        </h3>
        <span className="text-sm text-swoop-text-muted">
          {examples.length}/{MAX_EXAMPLES} examples
        </span>
      </div>

      <p className="text-sm text-swoop-text-muted">
        Teach the agent how to respond to specific scenarios using few-shot examples.
        Each example pairs a member message with your ideal agent response.
      </p>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ---- Form ---- */}
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-swoop-border bg-swoop-row p-4">
        <div>
          <label className="block text-sm font-medium text-swoop-text-2 mb-1">
            Scenario Type
          </label>
          <select
            value={form.scenario}
            onChange={(e) => setForm(prev => ({ ...prev, scenario: e.target.value }))}
            className="w-full rounded-md border border-swoop-border bg-swoop-panel px-3 py-2 text-sm text-swoop-text focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {SCENARIO_TYPES.map(st => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-swoop-text-2 mb-1">
            Member Input
          </label>
          <textarea
            value={form.input}
            onChange={(e) => setForm(prev => ({ ...prev, input: e.target.value }))}
            placeholder='e.g., "We waited 40 minutes and nobody checked on us."'
            rows={3}
            className="w-full rounded-md border border-swoop-border bg-swoop-panel px-3 py-2 text-sm text-swoop-text placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-swoop-text-2 mb-1">
            Ideal Response
          </label>
          <textarea
            value={form.ideal_response}
            onChange={(e) => setForm(prev => ({ ...prev, ideal_response: e.target.value }))}
            placeholder='e.g., "James, ugh — 40 minutes with nobody checking on you? That\'s completely unacceptable. I just filed this with our F&B director."'
            rows={3}
            className="w-full rounded-md border border-swoop-border bg-swoop-panel px-3 py-2 text-sm text-swoop-text placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || (!isEditing && atLimit) || !form.input.trim() || !form.ideal_response.trim()}
            className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : isEditing ? 'Update Example' : 'Add Example'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="px-4 py-2 text-sm font-medium rounded-md border border-swoop-border text-swoop-text-2 hover:bg-swoop-row-hover transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ---- Example cards ---- */}
      {examples.length === 0 ? (
        <p className="text-sm text-swoop-text-label italic">
          No examples yet. Add your first example above to start training the agent.
        </p>
      ) : (
        <div className="space-y-3">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="rounded-lg border border-swoop-border bg-swoop-panel p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${SCENARIO_BADGE_COLORS[ex.scenario] || 'bg-swoop-row text-swoop-text-2'}`}>
                  {ex.scenario}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(i)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  {deleteConfirm === i ? (
                    <span className="flex gap-1">
                      <button
                        onClick={() => executeDelete(i)}
                        className="text-xs text-red-600 hover:underline font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs text-swoop-text-muted hover:underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => confirmDelete(i)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="text-sm text-swoop-text-2">
                <span className="font-medium text-swoop-text-muted">Member: </span>
                {truncate(ex.input)}
              </div>
              <div className="text-sm text-swoop-text-2">
                <span className="font-medium text-swoop-text-muted">Response: </span>
                {truncate(ex.ideal_response)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
