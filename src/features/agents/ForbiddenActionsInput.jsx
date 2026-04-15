/**
 * ForbiddenActionsInput — Tag input for forbidden agent actions.
 *
 * Free-text input with autocomplete suggestions. Tags display with X to remove.
 * Saves to behavioral_config.forbidden_actions[] via PATCH /api/agent-config.
 *
 * Props:
 *   agentId          — current agent slug
 *   clubId           — current club UUID
 *   forbiddenActions — string[] current values
 *   onSaved          — callback after successful save
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { apiFetch } from '@/services/apiClient';

const SUGGESTIONS = [
  'offer_refund',
  'cancel_membership',
  'override_waitlist',
  'send_mass_email',
  'modify_dues',
  'delete_member',
];

export default function ForbiddenActionsInput({
  agentId,
  clubId,
  forbiddenActions = [],
  onSaved,
}) {
  const [tags, setTags] = useState(forbiddenActions);
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const inputRef = useRef(null);
  const wrapperRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = SUGGESTIONS.filter(
    (s) => !tags.includes(s) && s.toLowerCase().includes(input.toLowerCase()),
  );

  const addTag = useCallback((tag) => {
    const normalized = tag.trim().toLowerCase().replace(/\s+/g, '_');
    if (!normalized) return;
    setTags((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
    setInput('');
    setSavedMsg('');
    inputRef.current?.focus();
  }, []);

  const removeTag = useCallback((tag) => {
    setTags((prev) => prev.filter((t) => t !== tag));
    setSavedMsg('');
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && input.trim()) {
        e.preventDefault();
        addTag(input);
      } else if (e.key === 'Backspace' && !input && tags.length) {
        removeTag(tags[tags.length - 1]);
      }
    },
    [input, tags, addTag, removeTag],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSavedMsg('');
    try {
      await apiFetch('/api/agent-config', {
        method: 'PATCH',
        body: JSON.stringify({
          agent_id: agentId,
          behavioral_config: { forbidden_actions: tags },
        }),
      });
      setSavedMsg('Saved');
      onSaved?.();
    } catch (err) {
      setSavedMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [agentId, tags, onSaved]);

  const dirty = JSON.stringify(tags) !== JSON.stringify(forbiddenActions);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-swoop-text">
        Forbidden Actions
      </label>
      <p className="text-xs text-swoop-text-muted">
        Actions the agent must never perform. Type to add or pick from suggestions.
      </p>

      <div ref={wrapperRef} className="relative">
        {/* Tag area + input */}
        <div className="flex flex-wrap gap-2 p-2 rounded-lg border border-swoop-border bg-swoop-panel min-h-[42px]">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-red-900"
              >
                x
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder={tags.length ? '' : 'e.g. offer_refund'}
            className="flex-1 min-w-[120px] bg-transparent text-sm text-swoop-text outline-none placeholder-gray-400"
          />
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-swoop-panel border border-swoop-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => {
                    addTag(s);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-swoop-text-2 hover:bg-swoop-row-hover"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Save row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={handleSave}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            dirty
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-swoop-border text-swoop-text-label cursor-not-allowed'
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
