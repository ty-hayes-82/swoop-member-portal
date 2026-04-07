/**
 * SettingsTab — Global AI and outreach configuration for Automations
 * Controls: AI model, brand voice/tone, outreach templates, example guidance,
 * auto-approve defaults, and message preview.
 */
import { useState, useEffect, useCallback } from 'react';

const AI_MODELS = [
  { value: 'claude-sonnet', label: 'Claude Sonnet 4', desc: 'Fast, cost-effective. Best for routine actions and high-volume outreach.', provider: 'Anthropic' },
  { value: 'claude-opus', label: 'Claude Opus 4', desc: 'Most capable. Best for nuanced member situations and complex reasoning.', provider: 'Anthropic' },
  { value: 'claude-haiku', label: 'Claude Haiku 4', desc: 'Ultra-fast, lowest cost. Good for simple notifications and alerts.', provider: 'Anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', desc: 'OpenAI flagship. Strong general-purpose model.', provider: 'OpenAI' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast and affordable. Good for standard outreach.', provider: 'OpenAI' },
];

const TONE_PRESETS = [
  { value: 'warm-professional', label: 'Warm & Professional', desc: 'Friendly but polished. The gold standard for private club communication.', example: 'Dear Michael, I wanted to personally reach out to see how things have been going at the club lately...' },
  { value: 'casual-friendly', label: 'Casual & Friendly', desc: 'Relaxed and approachable. Great for younger demographics and social events.', example: 'Hey Michael! Just checking in - we haven\'t seen you around the club recently and wanted to make sure everything\'s good...' },
  { value: 'formal-executive', label: 'Formal & Executive', desc: 'Traditional and dignified. Best for board members, legacy members, and official communications.', example: 'Dear Mr. Preston, On behalf of the management team, I am writing to express our sincere appreciation for your continued membership...' },
  { value: 'energetic-enthusiastic', label: 'Energetic & Enthusiastic', desc: 'Upbeat and motivating. Good for event invitations and reactivation campaigns.', example: 'Michael! We have something exciting coming up that I know you\'ll love - our annual Member Appreciation BBQ is this Saturday...' },
  { value: 'empathetic-supportive', label: 'Empathetic & Supportive', desc: 'Understanding and caring. Best for service recovery and complaint follow-ups.', example: 'Dear Michael, I understand your recent experience at the club fell short of what you deserve, and I want you to know that I take this personally...' },
  { value: 'custom', label: 'Custom Voice', desc: 'Define your own tone with a custom description.', example: '' },
];

const DEFAULT_EXAMPLES = [
  { label: 'Service Recovery', text: 'When a member complains about slow service at the grill: "Dear [Name], I personally want to apologize for the wait you experienced. Your time at the club should be nothing but enjoyable. I\'ve spoken with our F&B director, and we\'d love to welcome you back with a complimentary dinner for two. Please call me directly at [phone] - I want to make sure your next visit exceeds expectations."' },
  { label: 'Re-engagement', text: 'When a member hasn\'t visited in 30+ days: "Hi [Name], We\'ve missed seeing you around the club! I know life gets busy, but I wanted to let you know we have some great things happening this month - [upcoming event]. I\'d love to set aside a tee time for you this weekend. Just say the word."' },
  { label: 'New Member Welcome', text: 'For members in their first 90 days: "Welcome to the family, [Name]! I hope you\'re settling in well. I wanted to personally introduce you to [similar member] - I think you two would really hit it off on the course. Also, don\'t miss our [upcoming event] this [day] - it\'s a great way to meet other members."' },
];

// localStorage key prefix
const SETTINGS_KEY = 'swoop_automation_settings';

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch { return {}; }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export default function SettingsTab() {
  const [settings, setSettings] = useState(() => {
    const stored = loadSettings();
    return {
      aiModel: stored.aiModel || 'claude-sonnet',
      tone: stored.tone || 'warm-professional',
      customToneDesc: stored.customToneDesc || '',
      temperature: stored.temperature ?? 0.7,
      maxTokens: stored.maxTokens ?? 500,
      autoApproveEnabled: stored.autoApproveEnabled ?? false,
      autoApproveThreshold: stored.autoApproveThreshold ?? 0.85,
      examples: stored.examples || DEFAULT_EXAMPLES.map(e => ({ ...e })),
      clubSignoff: stored.clubSignoff || '',
      senderTitle: stored.senderTitle || 'General Manager',
    };
  });

  const [saved, setSaved] = useState(false);

  const update = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectedTone = TONE_PRESETS.find(t => t.value === settings.tone);
  const selectedModel = AI_MODELS.find(m => m.value === settings.aiModel);

  return (
    <div className="flex flex-col gap-8 w-full">

      {/* AI Model Selection */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">AI Model</h3>
        <p className="text-xs text-gray-400 mb-3">Choose the AI model that powers agent recommendations and message drafting.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {AI_MODELS.map(model => (
            <button
              key={model.value}
              onClick={() => update('aiModel', model.value)}
              className={`p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                settings.aiModel === model.value
                  ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-bold text-gray-800 dark:text-white/90">{model.label}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-800">{model.provider}</span>
              </div>
              <p className="text-[10px] text-gray-400 m-0 leading-snug">{model.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Advanced Model Parameters */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Model Parameters</h3>
        <p className="text-xs text-gray-400 mb-3">Fine-tune how the AI generates responses.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Temperature: {settings.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.1"
              value={settings.temperature}
              onChange={e => update('temperature', parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Precise (0)</span>
              <span>Creative (1.5)</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Max Response Length: {settings.maxTokens} tokens
            </label>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={settings.maxTokens}
              onChange={e => update('maxTokens', parseInt(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Brief (100)</span>
              <span>Detailed (2000)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Voice / Tone */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Brand Voice & Tone</h3>
        <p className="text-xs text-gray-400 mb-3">Define how all AI-generated outreach sounds. This tone applies to emails, texts, and internal action descriptions.</p>
        <div className="space-y-2 mb-3">
          {TONE_PRESETS.map(tone => (
            <button
              key={tone.value}
              onClick={() => update('tone', tone.value)}
              className={`w-full p-3 rounded-xl border-2 text-left cursor-pointer transition-all ${
                settings.tone === tone.value
                  ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-500/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="text-xs font-bold text-gray-800 dark:text-white/90">{tone.label}</div>
              <p className="text-[10px] text-gray-400 m-0 mt-0.5">{tone.desc}</p>
            </button>
          ))}
        </div>

        {/* Custom tone description */}
        {settings.tone === 'custom' && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Describe your club's voice
            </label>
            <textarea
              value={settings.customToneDesc}
              onChange={e => update('customToneDesc', e.target.value)}
              placeholder="e.g., We're a historic club with a modern attitude. Our tone is confident but never stuffy — think country club meets craft brewery. We use first names, avoid jargon, and always sound like we genuinely care."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90 resize-none"
            />
          </div>
        )}

        {/* Tone preview */}
        {selectedTone?.example && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
            <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Preview</div>
            <p className="text-xs text-gray-700 dark:text-gray-300 m-0 leading-relaxed italic">"{selectedTone.example}"</p>
          </div>
        )}
      </section>

      {/* Sender Identity */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Sender Identity</h3>
        <p className="text-xs text-gray-400 mb-3">How outreach messages are signed.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Title / Role</label>
            <input
              type="text"
              value={settings.senderTitle}
              onChange={e => update('senderTitle', e.target.value)}
              placeholder="General Manager"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Custom Sign-off</label>
            <input
              type="text"
              value={settings.clubSignoff}
              onChange={e => update('clubSignoff', e.target.value)}
              placeholder="e.g., See you at the club!"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
            />
          </div>
        </div>
      </section>

      {/* Example Guidance for LLM */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Example Messages</h3>
        <p className="text-xs text-gray-400 mb-3">
          Provide real examples of great outreach from your club. The AI uses these as guidance to match your style and quality bar.
        </p>
        <div className="space-y-3">
          {settings.examples.map((ex, i) => (
            <div key={i} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={ex.label}
                  onChange={e => {
                    const next = [...settings.examples];
                    next[i] = { ...next[i], label: e.target.value };
                    update('examples', next);
                  }}
                  placeholder="Category (e.g., Service Recovery)"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none flex-1"
                />
                <button
                  onClick={() => {
                    const next = settings.examples.filter((_, j) => j !== i);
                    update('examples', next);
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 cursor-pointer bg-transparent border-none p-1"
                  title="Remove example"
                >
                  &times;
                </button>
              </div>
              <textarea
                value={ex.text}
                onChange={e => {
                  const next = [...settings.examples];
                  next[i] = { ...next[i], text: e.target.value };
                  update('examples', next);
                }}
                placeholder="Paste an example email or text message that represents your best outreach..."
                rows={3}
                className="w-full px-3 py-2 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border-none outline-none resize-none"
              />
            </div>
          ))}
          <button
            onClick={() => update('examples', [...settings.examples, { label: '', text: '' }])}
            className="text-xs font-semibold text-brand-500 cursor-pointer bg-transparent border border-dashed border-brand-300 rounded-lg px-4 py-2 hover:bg-brand-50 dark:hover:bg-brand-500/5 transition-colors w-full"
          >
            + Add Example
          </button>
        </div>
      </section>

      {/* Auto-Approve Defaults */}
      <section>
        <h3 className="text-sm font-bold text-gray-800 dark:text-white/90 mb-1">Auto-Approve</h3>
        <p className="text-xs text-gray-400 mb-3">
          When enabled, agent actions above the confidence threshold are executed automatically without requiring your approval.
        </p>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => update('autoApproveEnabled', !settings.autoApproveEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
              settings.autoApproveEnabled ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              settings.autoApproveEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`} />
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {settings.autoApproveEnabled ? 'Auto-approve is ON' : 'Auto-approve is OFF (manual review for all actions)'}
          </span>
        </div>
        {settings.autoApproveEnabled && (
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Confidence Threshold: {Math.round(settings.autoApproveThreshold * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="0.99"
              step="0.01"
              value={settings.autoApproveThreshold}
              onChange={e => update('autoApproveThreshold', parseFloat(e.target.value))}
              className="w-full accent-brand-500"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>More actions auto-approved (50%)</span>
              <span>Only high-confidence (99%)</span>
            </div>
          </div>
        )}
      </section>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-lg font-bold text-sm text-white cursor-pointer disabled:opacity-50"
        style={{ background: '#ff8b00' }}
      >
        {saved ? 'Saved!' : 'Save Settings'}
      </button>
    </div>
  );
}
