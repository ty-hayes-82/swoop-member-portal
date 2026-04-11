/**
 * BrandVoicePanel — Configure brand voice notes, greeting style, and response length.
 *
 * Saves to behavioral_config.brand_voice_notes, behavioral_config.greeting_style,
 * and behavioral_config.response_length via PATCH /api/agent-config.
 */
import { useState, useCallback, useEffect } from 'react';
import { apiFetch, getClubId } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_VOICE_NOTES_CHARS = 500;

const GREETING_OPTIONS = [
  { value: 'first_name',   label: 'First name',                  description: 'Always use the member\'s first name (e.g., "James")' },
  { value: 'formal_legacy', label: 'Formal for Legacy members',   description: 'Use "Mr./Ms." for Legacy tier, first name for others' },
  { value: 'always_formal', label: 'Always formal',               description: 'Always use "Mr./Ms. Last Name" for all members' },
];

const LENGTH_OPTIONS = [
  { value: 'concise',   label: 'Concise (1-2 sentences)',   description: 'Brief, text-message style' },
  { value: 'standard',  label: 'Standard (2-3 sentences)',  description: 'Balanced detail and brevity' },
  { value: 'detailed',  label: 'Detailed (full context)',   description: 'Thorough responses with background' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BrandVoicePanel({ agentId, behavioralConfig = {}, onConfigUpdated }) {
  const [voiceNotes, setVoiceNotes] = useState(behavioralConfig.brand_voice_notes || '');
  const [greetingStyle, setGreetingStyle] = useState(behavioralConfig.greeting_style || 'first_name');
  const [responseLength, setResponseLength] = useState(behavioralConfig.response_length || 'standard');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);

  // Sync from props when config reloads
  useEffect(() => {
    setVoiceNotes(behavioralConfig.brand_voice_notes || '');
    setGreetingStyle(behavioralConfig.greeting_style || 'first_name');
    setResponseLength(behavioralConfig.response_length || 'standard');
  }, [behavioralConfig]);

  // ---- Save to DB --------------------------------------------------------

  const save = useCallback(async (patch) => {
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
          behavioral_config: patch,
        }),
      });
      if (!res) throw new Error('Save failed');
      setLastSaved(Date.now());
      onConfigUpdated?.(res);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }, [agentId, onConfigUpdated]);

  const saveVoiceNotes = useCallback(() => {
    save({ brand_voice_notes: voiceNotes });
  }, [voiceNotes, save]);

  const saveGreetingStyle = useCallback((value) => {
    setGreetingStyle(value);
    save({ greeting_style: value });
  }, [save]);

  const saveResponseLength = useCallback((value) => {
    setResponseLength(value);
    save({ response_length: value });
  }, [save]);

  // ---- Render ------------------------------------------------------------

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Brand Voice</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Customize how the agent communicates to match your club's brand and culture.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {lastSaved && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-700 dark:text-green-300">
          Saved successfully.
        </div>
      )}

      {/* ---- Brand voice notes ---- */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Brand Voice Notes
        </label>
        <textarea
          value={voiceNotes}
          onChange={(e) => {
            if (e.target.value.length <= MAX_VOICE_NOTES_CHARS) {
              setVoiceNotes(e.target.value);
            }
          }}
          placeholder="e.g., Always acknowledge member tenure. For 10+ year members, say 'As one of our most valued long-standing members...' Never use the word 'unfortunately.'"
          rows={4}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {voiceNotes.length}/{MAX_VOICE_NOTES_CHARS} characters
          </span>
          <button
            onClick={saveVoiceNotes}
            disabled={saving}
            className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Notes'}
          </button>
        </div>
      </div>

      {/* ---- Greeting style ---- */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Greeting Style
        </legend>
        <div className="space-y-2">
          {GREETING_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                greetingStyle === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input
                type="radio"
                name="greeting_style"
                value={opt.value}
                checked={greetingStyle === opt.value}
                onChange={() => saveGreetingStyle(opt.value)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* ---- Response length ---- */}
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Response Length
        </legend>
        <div className="space-y-2">
          {LENGTH_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                responseLength === opt.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <input
                type="radio"
                name="response_length"
                value={opt.value}
                checked={responseLength === opt.value}
                onChange={() => saveResponseLength(opt.value)}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.description}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
