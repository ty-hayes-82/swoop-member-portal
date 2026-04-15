/**
 * ToolPermissionsPanel — "Permissions" tab in the agent config drawer.
 *
 * Shows all tools for the current agent grouped by category (Read / Write / Communicate).
 * Each tool has a three-state toggle: Auto-execute / Requires Approval / Disabled.
 * Only visible to admin and swoop_admin roles.
 *
 * Props:
 *   agentId         — current agent slug
 *   clubId          — current club UUID
 *   toolPermissions — current { denied: string[], requires_approval: string[], auto_execute: string[] }
 *   tools           — array of tool objects from the registry
 *   userRole        — 'admin' | 'swoop_admin' | 'gm' | ...
 *   onSaved         — callback after successful save
 */
import { useState, useMemo, useCallback } from 'react';
import { apiFetch } from '@/services/apiClient';

// ---------------------------------------------------------------------------
// Permission states
// ---------------------------------------------------------------------------

const STATES = {
  auto_execute:      { label: 'Auto',     color: 'bg-green-500',  textColor: 'text-white' },
  requires_approval: { label: 'Approval', color: 'bg-yellow-400', textColor: 'text-swoop-text' },
  denied:            { label: 'Disabled', color: 'bg-red-500',    textColor: 'text-white' },
};

const STATE_ORDER = ['auto_execute', 'requires_approval', 'denied'];

// ---------------------------------------------------------------------------
// Category helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS = {
  read:        'Read',
  write:       'Write',
  communicate: 'Communicate',
};

const CATEGORY_ORDER = ['read', 'write', 'communicate'];

function groupByCategory(tools) {
  const groups = {};
  for (const tool of tools) {
    const cat = tool.category || 'read';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(tool);
  }
  return groups;
}

// ---------------------------------------------------------------------------
// Risk badge
// ---------------------------------------------------------------------------

function RiskBadge({ level }) {
  const styles = {
    low:    'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high:   'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[level] || styles.low}`}>
      {level}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Three-state toggle
// ---------------------------------------------------------------------------

function PermissionToggle({ value, onChange }) {
  return (
    <div className="flex rounded-md overflow-hidden border border-swoop-border">
      {STATE_ORDER.map((state) => {
        const meta = STATES[state];
        const active = value === state;
        return (
          <button
            key={state}
            type="button"
            onClick={() => onChange(state)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              active
                ? `${meta.color} ${meta.textColor}`
                : 'bg-swoop-row text-swoop-text-muted hover:bg-gray-200'
            }`}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ToolPermissionsPanel({
  agentId,
  clubId,
  toolPermissions = {},
  tools = [],
  userRole,
  onSaved,
}) {
  // Gate: only admin / swoop_admin
  if (!['admin', 'swoop_admin'].includes(userRole)) return null;

  // Build initial permission map from saved config
  const initialPerms = useMemo(() => {
    const map = {};
    const denied = new Set(toolPermissions.denied || []);
    const approval = new Set(toolPermissions.requires_approval || []);

    for (const tool of tools) {
      if (denied.has(tool.name)) {
        map[tool.name] = 'denied';
      } else if (approval.has(tool.name)) {
        map[tool.name] = 'requires_approval';
      } else {
        map[tool.name] = tool.riskLevel === 'high' ? 'requires_approval' : 'auto_execute';
      }
    }
    return map;
  }, [tools, toolPermissions]);

  const [perms, setPerms] = useState(initialPerms);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const grouped = useMemo(() => groupByCategory(tools), [tools]);

  const handleChange = useCallback((toolName, state) => {
    setPerms((prev) => ({ ...prev, [toolName]: state }));
    setSavedMsg('');
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setSavedMsg('');

    // Convert map back to the three arrays
    const denied = [];
    const requires_approval = [];
    const auto_execute = [];

    for (const [name, state] of Object.entries(perms)) {
      if (state === 'denied') denied.push(name);
      else if (state === 'requires_approval') requires_approval.push(name);
      else auto_execute.push(name);
    }

    try {
      await apiFetch('/api/agent-config', {
        method: 'PATCH',
        body: JSON.stringify({
          agent_id: agentId,
          tool_permissions: { denied, requires_approval, auto_execute },
        }),
      });
      setSavedMsg('Saved');
      onSaved?.();
    } catch (err) {
      setSavedMsg(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  }, [agentId, perms, onSaved]);

  const dirty = JSON.stringify(perms) !== JSON.stringify(initialPerms);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-swoop-text">Tool Permissions</h3>
        <div className="flex items-center gap-3">
          {savedMsg && (
            <span className={`text-sm ${savedMsg === 'Saved' ? 'text-green-600' : 'text-red-600'}`}>
              {savedMsg}
            </span>
          )}
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
        </div>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const catTools = grouped[cat];
        if (!catTools?.length) return null;
        return (
          <div key={cat}>
            <h4 className="text-sm font-semibold text-swoop-text-muted uppercase tracking-wide mb-3">
              {CATEGORY_LABELS[cat] || cat}
            </h4>
            <div className="space-y-2">
              {catTools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-swoop-row border border-swoop-border"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-swoop-text">
                        {tool.displayName}
                      </span>
                      <RiskBadge level={tool.riskLevel} />
                    </div>
                    <p className="text-xs text-swoop-text-muted mt-0.5 truncate">
                      {tool.description}
                    </p>
                  </div>
                  <PermissionToggle
                    value={perms[tool.name]}
                    onChange={(state) => handleChange(tool.name, state)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
