import { useState, useMemo, useEffect, useCallback } from 'react';
import { theme } from '@/config/theme';
import { memberArchetypes } from '@/data/members';
import {
  outreachCategories,
  defaultOutreachActions,
  archetypePlaybooks,
  getAllActionsForArchetype,
} from '@/data/outreach';
import PageTransition from '@/components/ui/PageTransition';
import { StoryHeadline } from '@/components/ui';
import { useApp } from '@/context/AppContext';

const STORAGE_KEY = 'swoop_outreach_playbooks';

const EFFORT_BADGE = {
  low: { label: 'Low Effort', color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
  medium: { label: 'Medium', color: '#ca8a04', bg: 'rgba(202,138,4,0.08)' },
  high: { label: 'High Effort', color: '#ea580c', bg: 'rgba(234,88,12,0.08)' },
};
const IMPACT_BADGE = {
  medium: { label: 'Medium Impact', color: '#6b7280', bg: 'rgba(107,114,128,0.08)' },
  high: { label: 'High Impact', color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  'very-high': { label: 'Very High', color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
};

// Load saved playbooks from localStorage, falling back to defaults
function loadPlaybooks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  // Build defaults from archetypePlaybooks
  const defaults = {};
  Object.entries(archetypePlaybooks).forEach(([arch, pb]) => {
    const allForArch = getAllActionsForArchetype(arch);
    defaults[arch] = {
      enabled: pb.topActions, // IDs of enabled actions (ordered)
      disabled: allForArch.filter(a => !pb.topActions.includes(a.id)).map(a => a.id),
    };
  });
  return defaults;
}

function savePlaybooks(playbooks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(playbooks));
  } catch (e) { /* ignore */ }
}

const OWNER_OPTIONS = ['GM', 'Membership Director', 'Head Golf Professional', 'F&B Director', 'Club Manager', 'Events Director', 'Assistant GM', 'Controller'];

const CUSTOM_ACTIONS_KEY = 'swoop_custom_actions';
const CUSTOMIZATIONS_KEY = 'swoop_action_customizations';

function loadCustomActions() {
  try { const s = localStorage.getItem(CUSTOM_ACTIONS_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
function saveCustomActions(actions) {
  try { localStorage.setItem(CUSTOM_ACTIONS_KEY, JSON.stringify(actions)); } catch {}
}
function loadCustomizations() {
  try { const s = localStorage.getItem(CUSTOMIZATIONS_KEY); return s ? JSON.parse(s) : {}; } catch { return {}; }
}
function saveCustomizations(c) {
  try { localStorage.setItem(CUSTOMIZATIONS_KEY, JSON.stringify(c)); } catch {}
}

// Merge base action with per-archetype customizations
function getCustomizedAction(action, archetype, customizations) {
  const key = `${archetype}::${action.id}`;
  const overrides = customizations[key];
  if (!overrides) return action;
  return { ...action, ...overrides };
}

function ActionEditModal({ action, archetype, onSave, onClose }) {
  const [form, setForm] = useState({
    label: action.label,
    description: action.description,
    effort: action.effort,
    impact: action.impact,
    defaultOwner: action.defaultOwner,
  });

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: '16px', width: '480px', maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '28px', zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f0f' }}>Edit Action</div>
            <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>Customizing for {archetype}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>{'\u00D7'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Action Title</label>
            <input value={form.label} onChange={e => update('label', e.target.value)} style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e4e4e7', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontFamily: theme.fonts.sans }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box', fontFamily: theme.fonts.sans }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Effort Level</label>
              <select value={form.effort} onChange={e => update('effort', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Impact</label>
              <select value={form.impact} onChange={e => update('impact', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                <option value="medium">Medium Impact</option>
                <option value="high">High Impact</option>
                <option value="very-high">Very High</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Assigned To</label>
              <select value={form.defaultOwner} onChange={e => update('defaultOwner', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                {OWNER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f4f4f5' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#fff', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => onSave(form)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 8px rgba(37,99,235,0.3)' }}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

function CreateActionModal({ archetype, onSave, onClose }) {
  const [form, setForm] = useState({
    label: '',
    description: '',
    category: 'personal',
    effort: 'medium',
    impact: 'high',
    defaultOwner: 'Membership Director',
  });

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: '16px', width: '480px', maxWidth: '95vw',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', padding: '28px', zIndex: 1,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f0f0f' }}>Create Custom Action</div>
            <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>Add a new action unique to your club</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280', padding: '4px' }}>{'\u00D7'}</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Action Title</label>
            <input value={form.label} onChange={e => update('label', e.target.value)} placeholder="e.g., Club Anniversary Celebration" style={{ width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e4e4e7', borderRadius: '8px', outline: 'none', boxSizing: 'border-box', fontFamily: theme.fonts.sans }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Description</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Describe what this action does and when to use it..." style={{ width: '100%', padding: '8px 12px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', outline: 'none', resize: 'vertical', lineHeight: 1.5, boxSizing: 'border-box', fontFamily: theme.fonts.sans }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Category</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                {outreachCategories.map(c => <option key={c.key} value={c.key}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Assigned To</label>
              <select value={form.defaultOwner} onChange={e => update('defaultOwner', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                {OWNER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Effort Level</label>
              <select value={form.effort} onChange={e => update('effort', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#3f3f46', marginBottom: '4px' }}>Impact</label>
              <select value={form.impact} onChange={e => update('impact', e.target.value)} style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid #e4e4e7', borderRadius: '8px', background: '#fff', fontFamily: theme.fonts.sans }}>
                <option value="medium">Medium</option><option value="high">High</option><option value="very-high">Very High</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f4f4f5' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#fff', color: '#6b7280', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (!form.label.trim()) return; onSave(form); }} disabled={!form.label.trim()} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: form.label.trim() ? 'linear-gradient(135deg, #22c55e, #16a34a)' : '#e4e4e7', color: form.label.trim() ? '#fff' : '#a1a1aa', fontSize: '13px', fontWeight: 700, cursor: form.label.trim() ? 'pointer' : 'default' }}>Create Action</button>
        </div>
      </div>
    </div>
  );
}

export default function OutreachPlaybooks() {
  const { showToast } = useApp();
  const [selectedArchetype, setSelectedArchetype] = useState('Die-Hard Golfer');
  const [playbooks, setPlaybooks] = useState(loadPlaybooks);
  const [hasChanges, setHasChanges] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingAction, setEditingAction] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customActions, setCustomActions] = useState(loadCustomActions);
  const [customizations, setCustomizations] = useState(loadCustomizations);

  const archData = memberArchetypes.find(a => a.archetype === selectedArchetype);
  const playbook = archetypePlaybooks[selectedArchetype];

  // Ensure every archetype has an entry
  useEffect(() => {
    if (!playbooks[selectedArchetype]) {
      const allForArch = getAllActionsForArchetype(selectedArchetype);
      const defaults = archetypePlaybooks[selectedArchetype];
      const enabled = defaults ? defaults.topActions : allForArch.slice(0, 5).map(a => a.id);
      const disabled = allForArch.filter(a => !enabled.includes(a.id)).map(a => a.id);
      setPlaybooks(prev => ({ ...prev, [selectedArchetype]: { enabled, disabled } }));
    }
  }, [selectedArchetype, playbooks]);

  const allActions = useMemo(() => [...defaultOutreachActions, ...customActions], [customActions]);

  const current = playbooks[selectedArchetype] || { enabled: [], disabled: [] };
  const enabledActions = useMemo(
    () => current.enabled.map(id => {
      const base = allActions.find(a => a.id === id);
      return base ? getCustomizedAction(base, selectedArchetype, customizations) : null;
    }).filter(Boolean),
    [current.enabled, allActions, selectedArchetype, customizations]
  );
  const disabledActions = useMemo(
    () => current.disabled.map(id => {
      const base = allActions.find(a => a.id === id);
      return base ? getCustomizedAction(base, selectedArchetype, customizations) : null;
    }).filter(Boolean),
    [current.disabled, allActions, selectedArchetype, customizations]
  );

  const updatePlaybook = useCallback((enabled, disabled) => {
    setPlaybooks(prev => ({
      ...prev,
      [selectedArchetype]: { enabled, disabled },
    }));
    setHasChanges(true);
  }, [selectedArchetype]);

  const toggleAction = useCallback((actionId) => {
    const isEnabled = current.enabled.includes(actionId);
    if (isEnabled) {
      updatePlaybook(
        current.enabled.filter(id => id !== actionId),
        [...current.disabled, actionId]
      );
    } else {
      updatePlaybook(
        [...current.enabled, actionId],
        current.disabled.filter(id => id !== actionId)
      );
    }
  }, [current, updatePlaybook]);

  const moveAction = useCallback((actionId, direction) => {
    const list = [...current.enabled];
    const idx = list.indexOf(actionId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= list.length) return;
    [list[idx], list[newIdx]] = [list[newIdx], list[idx]];
    updatePlaybook(list, current.disabled);
  }, [current, updatePlaybook]);

  const handleSave = () => {
    savePlaybooks(playbooks);
    saveCustomActions(customActions);
    saveCustomizations(customizations);
    setHasChanges(false);
    showToast(`Playbook saved for ${selectedArchetype}`, 'info');
  };

  const handleEditAction = (action) => {
    if (editMode) setEditingAction(action);
  };

  const handleSaveEdit = (formData) => {
    const key = `${selectedArchetype}::${editingAction.id}`;
    setCustomizations(prev => ({ ...prev, [key]: formData }));
    setHasChanges(true);
    setEditingAction(null);
    showToast(`Updated "${formData.label}" for ${selectedArchetype}`, 'info');
  };

  const handleCreateAction = (formData) => {
    const newAction = {
      id: `custom-${Date.now()}`,
      category: formData.category,
      label: formData.label,
      description: formData.description,
      defaultOwner: formData.defaultOwner,
      effort: formData.effort,
      impact: formData.impact,
      applicableArchetypes: ['all'],
    };
    setCustomActions(prev => [...prev, newAction]);
    updatePlaybook([...current.enabled, newAction.id], current.disabled);
    setShowCreateModal(false);
    showToast(`Created "${newAction.label}" and added to playbook`, 'success');
  };

  const handleReset = () => {
    const allForArch = getAllActionsForArchetype(selectedArchetype);
    const defaults = archetypePlaybooks[selectedArchetype];
    const enabled = defaults ? defaults.topActions : allForArch.slice(0, 5).map(a => a.id);
    const disabled = allForArch.filter(a => !enabled.includes(a.id)).map(a => a.id);
    updatePlaybook(enabled, disabled);
    showToast(`Reset to defaults for ${selectedArchetype}`, 'info');
  };

  return (
    <PageTransition>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <StoryHeadline
          variant="info"
          headline="Every archetype needs a different playbook. Choose the right touch for the right member."
          context="Select actions, reorder priorities, and save per archetype. Your customizations persist across sessions."
        />

        {/* Archetype Selector */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7', borderRadius: '14px',
          padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>
            Select Archetype
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {memberArchetypes.map(arch => {
              const isActive = selectedArchetype === arch.archetype;
              const hasSaved = playbooks[arch.archetype] &&
                JSON.stringify(playbooks[arch.archetype]) !==
                JSON.stringify(loadPlaybooks()[arch.archetype]);
              return (
                <button
                  key={arch.archetype}
                  onClick={() => { setSelectedArchetype(arch.archetype); setEditMode(false); }}
                  style={{
                    padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s', position: 'relative',
                    border: isActive ? '2px solid #2563eb' : '1px solid #e4e4e7',
                    background: isActive ? 'rgba(37,99,235,0.06)' : '#fafafa',
                    color: isActive ? '#2563eb' : '#3f3f46',
                    boxShadow: isActive ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                  }}
                >
                  {arch.archetype}
                  <span style={{ fontSize: '11px', color: isActive ? '#2563eb' : '#a1a1aa', marginLeft: '6px' }}>
                    ({arch.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Archetype Profile */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7', borderRadius: '14px',
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            padding: '24px 28px', borderBottom: '1px solid #e4e4e7',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.03), rgba(124,58,237,0.02))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f0f0f', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {selectedArchetype}
                </h2>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  {playbook?.description || 'Configure the outreach playbook for this archetype.'}
                </p>
              </div>
              {archData && (
                <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f0f0f', fontFamily: "'JetBrains Mono', monospace" }}>{archData.count}</div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Members</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '24px', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                      color: archData.trend >= 0 ? '#16a34a' : '#dc2626',
                    }}>
                      {archData.trend >= 0 ? '+' : ''}{archData.trend}
                    </div>
                    <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Trend</div>
                  </div>
                </div>
              )}
            </div>
            {archData && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                {[
                  { label: 'Golf', value: archData.golf, color: '#16a34a' },
                  { label: 'Dining', value: archData.dining, color: '#f59e0b' },
                  { label: 'Events', value: archData.events, color: '#7c3aed' },
                  { label: 'Email', value: archData.email, color: '#2563eb' },
                ].map(stat => (
                  <div key={stat.label} style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{stat.label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: stat.color, fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</span>
                    </div>
                    <div style={{ height: '4px', background: '#f4f4f5', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: stat.value + '%', background: stat.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div style={{
            padding: '16px 28px', borderBottom: '1px solid #e4e4e7',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: hasChanges ? 'rgba(37,99,235,0.02)' : '#fafafa',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setEditMode(!editMode)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.15s',
                  border: editMode ? '1.5px solid #2563eb' : '1.5px solid #d4d4d8',
                  background: editMode ? 'rgba(37,99,235,0.06)' : '#fff',
                  color: editMode ? '#2563eb' : '#3f3f46',
                }}
              >
                {editMode ? '\u2713 Editing' : '\u270E Edit Playbook'}
              </button>
              {editMode && (
                <button
                  onClick={handleReset}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                    cursor: 'pointer', border: '1px solid #e4e4e7', background: '#fff', color: '#6b7280',
                  }}
                >
                  Reset to Defaults
                </button>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {hasChanges && (
                <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>
                  Unsaved changes
                </span>
              )}
              {(editMode || hasChanges) && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  title={!hasChanges ? 'Make changes to enable saving' : undefined}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                    cursor: hasChanges ? 'pointer' : 'default',
                    border: 'none',
                    background: hasChanges
                      ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                      : '#e4e4e7',
                    color: hasChanges ? '#fff' : '#a1a1aa',
                    boxShadow: hasChanges ? '0 2px 8px rgba(34,197,94,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  Save Playbook
                </button>
              )}
            </div>
          </div>

          {/* Active Actions */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f0f', margin: '0 0 4px' }}>
                  Active Playbook
                </h3>
                <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
                  {enabledActions.length} actions enabled for {selectedArchetype} members
                  {editMode && ' \u2014 click action to edit, arrows to reorder, \u00D7 to remove'}
                </p>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', background: 'rgba(22,163,74,0.06)', padding: '4px 12px', borderRadius: '6px' }}>
                {enabledActions.length} active
              </span>
            </div>

            {enabledActions.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#a1a1aa', fontSize: '13px', border: '1px dashed #e4e4e7', borderRadius: '10px' }}>
                No actions enabled. Click Edit Playbook and add actions below.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {enabledActions.map((action, idx) => (
                  <PlaybookActionRow
                    key={action.id}
                    action={action}
                    index={idx}
                    total={enabledActions.length}
                    editMode={editMode}
                    isEnabled={true}
                    onToggle={() => toggleAction(action.id)}
                    onMoveUp={() => moveAction(action.id, -1)}
                    onMoveDown={() => moveAction(action.id, 1)}
                    onEdit={() => handleEditAction(action)}
                  />
                ))}
              </div>
            )}

            {/* Available (disabled) actions */}
            {editMode && disabledActions.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#6b7280', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Available Actions
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#a1a1aa' }}>
                    Click + to add to playbook
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {disabledActions.map(action => (
                    <PlaybookActionRow
                      key={action.id}
                      action={action}
                      editMode={true}
                      isEnabled={false}
                      onToggle={() => toggleAction(action.id)}
                      onEdit={() => handleEditAction(action)}
                    />
                  ))}
                  <button
                    onClick={() => setShowCreateModal(true)}
                    style={{
                      padding: '12px 16px', borderRadius: '10px', border: '2px dashed #d4d4d8',
                      background: '#fafafa', color: '#6b7280', fontSize: '13px', fontWeight: 600,
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    + Create Custom Action
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick reference of all categories */}
        <div style={{
          background: '#fff', border: '1px solid #e4e4e7', borderRadius: '14px',
          padding: '24px 28px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f0f0f', margin: '0 0 4px' }}>
            Action Library
          </h3>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '0 0 16px' }}>
            {defaultOutreachActions.length} actions across {outreachCategories.length} categories
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {outreachCategories.map(cat => {
              const catActions = defaultOutreachActions.filter(a => a.category === cat.key);
              const enabledCount = catActions.filter(a => current.enabled.includes(a.id)).length;
              return (
                <div key={cat.key} style={{ borderRadius: '10px', border: '1px solid #f4f4f5', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: cat.color }}>{cat.label}</span>
                    <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                      {enabledCount}/{catActions.length} active
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {catActions.map(a => {
                      const isActive = current.enabled.includes(a.id);
                      return (
                        <span
                          key={a.id}
                          onClick={editMode ? () => toggleAction(a.id) : undefined}
                          style={{
                            fontSize: '12px', padding: '4px 10px', borderRadius: '6px',
                            fontWeight: 500, transition: 'all 0.15s',
                            cursor: editMode ? 'pointer' : 'default',
                            background: isActive ? 'rgba(22,163,74,0.08)' : '#f4f4f5',
                            color: isActive ? '#16a34a' : '#a1a1aa',
                            border: isActive ? '1px solid rgba(22,163,74,0.2)' : '1px solid transparent',
                            textDecoration: isActive ? 'none' : 'line-through',
                          }}
                        >
                          {isActive && '\u2713 '}{a.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {editingAction && (
        <ActionEditModal
          action={editingAction}
          archetype={selectedArchetype}
          onSave={handleSaveEdit}
          onClose={() => setEditingAction(null)}
        />
      )}
      {showCreateModal && (
        <CreateActionModal
          archetype={selectedArchetype}
          onSave={handleCreateAction}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </PageTransition>
  );
}

function PlaybookActionRow({ action, index, total, editMode, isEnabled, onToggle, onMoveUp, onMoveDown, onEdit }) {
  const [hovered, setHovered] = useState(false);
  const category = outreachCategories.find(c => c.key === action.category);
  const effort = EFFORT_BADGE[action.effort] || EFFORT_BADGE.medium;
  const impact = IMPACT_BADGE[action.impact] || IMPACT_BADGE.medium;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: isEnabled ? '14px 16px' : '10px 14px',
        borderRadius: '10px',
        border: isEnabled
          ? (index != null && index < 2 ? '1px solid rgba(37,99,235,0.2)' : '1px solid #e4e4e7')
          : '1px dashed #e4e4e7',
        background: hovered
          ? (isEnabled ? '#fafbff' : '#f9fafb')
          : (isEnabled ? '#fff' : '#fafafa'),
        transition: 'all 0.15s',
        opacity: isEnabled ? 1 : 0.7,
      }}
    >
      {/* Priority number or add button */}
      {isEnabled && index != null ? (
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: index === 0 ? '#2563eb' : index === 1 ? '#7c3aed' : '#f4f4f5',
          color: index < 2 ? '#fff' : '#6b7280',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700, flexShrink: 0,
        }}>
          {index + 1}
        </div>
      ) : (
        <button
          onClick={onToggle}
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            color: '#16a34a', fontSize: '16px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, lineHeight: 1,
          }}
        >+</button>
      )}

      {/* Category icon */}
      <div style={{
        width: '36px', height: '36px', borderRadius: '8px',
        background: category ? category.color + '12' : '#f4f4f5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', flexShrink: 0,
        border: `1px solid ${category ? category.color + '20' : '#e4e4e7'}`,
      }}>
        {category?.icon || '\u2728'}
      </div>

      {/* Content — click to edit in edit mode */}
      <div
        onClick={editMode && onEdit ? (e) => { e.stopPropagation(); onEdit(); } : undefined}
        style={{ flex: 1, minWidth: 0, cursor: editMode && onEdit ? 'pointer' : 'default' }}
        title={editMode ? 'Click to edit this action' : undefined}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f0f0f', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {action.label}
          {editMode && onEdit && <span style={{ fontSize: '10px', color: '#a1a1aa' }}>&#9998;</span>}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {action.description}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: effort.color, background: effort.bg, padding: '2px 6px', borderRadius: '3px' }}>
            {effort.label}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: impact.color, background: impact.bg, padding: '2px 6px', borderRadius: '3px' }}>
            {impact.label}
          </span>
          <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{action.defaultOwner}</span>
        </div>
      </div>

      {/* Edit controls */}
      {editMode && isEnabled && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            style={{
              width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #e4e4e7',
              background: index === 0 ? '#f9f9f9' : '#fff', color: index === 0 ? '#d4d4d8' : '#3f3f46',
              cursor: index === 0 ? 'default' : 'pointer', fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >{'\u25B2'}</button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            style={{
              width: '24px', height: '24px', borderRadius: '4px', border: '1px solid #e4e4e7',
              background: index === total - 1 ? '#f9f9f9' : '#fff', color: index === total - 1 ? '#d4d4d8' : '#3f3f46',
              cursor: index === total - 1 ? 'default' : 'pointer', fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >{'\u25BC'}</button>
        </div>
      )}

      {/* Remove button */}
      {editMode && isEnabled && (
        <button
          onClick={onToggle}
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: hovered ? '#fef2f2' : '#fff', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: '14px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0, lineHeight: 1,
            transition: 'all 0.15s',
          }}
        >{'\u00D7'}</button>
      )}
    </div>
  );
}
