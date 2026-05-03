import { useState, useId, useEffect, useRef } from "react";
import { IconButton } from '../primitives/IconButton.jsx';

// How long the "click again to confirm" state persists before auto-disarming.
const RESCAN_CONFIRM_TIMEOUT_MS = 10000;

// ── Keyword Rules Panel ───────────────────────────────────────────────────
// Settings tab UI for the user-curated keyword library. Renders the rule list,
// inline add/edit form, and empty state. State lives upstream — App.jsx owns
// load/save and passes `rules` + `onRulesChange` down.
//
// Rule shape mirrors `parseRules.js`:
//   { tag: string, triggers: string[], links: string[] }

const RULES_FILE_PATH = '_jotfolio/keyword-rules.yaml';

// ── shared style tokens (mirrors SettingsPanel.jsx visual language) ───────
const sectionHeader = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: 2,
  color: 'var(--t3)',
  textTransform: 'uppercase',
  marginBottom: 8,
  marginTop: 16,
  display: 'block',
};

const inputStyle = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 12,
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  background: 'var(--b2)',
  color: 'var(--tx)',
  fontFamily: 'var(--fn)',
  outline: 'none',
  boxSizing: 'border-box',
};

const buttonPrimary = {
  padding: '7px 14px',
  fontSize: 12,
  border: 'none',
  borderRadius: 'var(--rd)',
  background: 'var(--ac)',
  color: 'var(--act)',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontWeight: 700,
};

const buttonGhost = {
  padding: '7px 14px',
  fontSize: 12,
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  background: 'transparent',
  color: 'var(--t2)',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontWeight: 600,
};

// Tag chip — accent-tinted, the primary identifier of the rule.
const tagChipStyle = {
  fontSize: 11,
  fontWeight: 700,
  padding: '3px 9px',
  background: 'var(--ac)',
  color: 'var(--act)',
  border: '1px solid var(--ac)',
  borderRadius: 99,
  fontFamily: 'var(--fn)',
};

// Trigger chip — muted surface fill, mirrors DetailPanel tag rendering.
const triggerChipStyle = {
  fontSize: 11,
  padding: '3px 8px',
  background: 'var(--b2)',
  border: '1px solid var(--br)',
  borderRadius: 99,
  color: 'var(--t2)',
  fontFamily: 'var(--fn)',
};

// Link chip — outlined, accent-colored text. Distinct from trigger and tag.
const linkChipStyle = {
  fontSize: 11,
  padding: '3px 8px',
  background: 'transparent',
  border: '1px solid var(--ac)',
  borderRadius: 99,
  color: 'var(--ac)',
  fontFamily: 'var(--fn)',
};

// ── helpers ───────────────────────────────────────────────────────────────
function splitCsv(value) {
  return String(value || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function joinCsv(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}

function normalizeTagInput(raw) {
  // Strip a leading '#' if the user typed it; keep everything else verbatim.
  const trimmed = String(raw || '').trim();
  return trimmed.startsWith('#') ? trimmed.slice(1).trim() : trimmed;
}

// ── inline form (used for both Add and Edit) ──────────────────────────────
function RuleForm({ initial, existingTags, onSave, onCancel }) {
  const [tag, setTag] = useState(initial?.tag || '');
  const [triggersText, setTriggersText] = useState(joinCsv(initial?.triggers));
  const [linksText, setLinksText] = useState(joinCsv(initial?.links));
  const [error, setError] = useState('');
  const ids = { tag: useId(), triggers: useId(), links: useId() };

  const handleSave = () => {
    const cleanTag = normalizeTagInput(tag);
    if (!cleanTag) {
      setError('Tag is required');
      return;
    }
    const triggers = splitCsv(triggersText);
    if (triggers.length === 0) {
      setError('Add at least one trigger word');
      return;
    }
    const links = splitCsv(linksText);
    // Reject collision with another tag, but allow editing the same rule in place.
    const collides = existingTags.some(t => t === cleanTag && t !== initial?.tag);
    if (collides) {
      setError(`A rule for "${cleanTag}" already exists`);
      return;
    }
    onSave({ tag: cleanTag, triggers, links });
  };

  return (
    <div style={{
      padding: 12,
      background: 'var(--b2)',
      border: '1px solid var(--br)',
      borderRadius: 'var(--rd)',
      marginBottom: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div>
        <label htmlFor={ids.tag} style={{ ...sectionHeader, marginTop: 0 }}>Tag</label>
        <input id={ids.tag} type="text" value={tag} onChange={e => setTag(e.target.value)}
          placeholder="deep work" spellCheck={false} autoComplete="off"
          style={inputStyle} />
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, lineHeight: 1.4 }}>
          Tag name. Spaces allowed. The leading # is added automatically when displayed.
        </div>
      </div>
      <div>
        <label htmlFor={ids.triggers} style={{ ...sectionHeader, marginTop: 0 }}>Triggers</label>
        <input id={ids.triggers} type="text" value={triggersText} onChange={e => setTriggersText(e.target.value)}
          placeholder="React, JSX, useState" spellCheck={false} autoComplete="off"
          style={inputStyle} />
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, lineHeight: 1.4 }}>
          Comma-separated. Word-boundary match, case-insensitive.
        </div>
      </div>
      <div>
        <label htmlFor={ids.links} style={{ ...sectionHeader, marginTop: 0 }}>Links (optional)</label>
        <input id={ids.links} type="text" value={linksText} onChange={e => setLinksText(e.target.value)}
          placeholder="Frontend Stack" spellCheck={false} autoComplete="off"
          style={inputStyle} />
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4, lineHeight: 1.4 }}>
          Comma-separated wikilink targets to attach when this rule fires.
        </div>
      </div>
      {error && (
        <div role="alert" style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} style={buttonGhost}>Cancel</button>
        <button type="button" onClick={handleSave} style={buttonPrimary}>Save</button>
      </div>
    </div>
  );
}

// ── one row in the rule list ──────────────────────────────────────────────
function RuleRow({ rule, onEdit, onDelete }) {
  return (
    <div style={{
      padding: '10px 0',
      borderBottom: '1px solid var(--br)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={tagChipStyle}>#{rule.tag}</span>
        <div style={{ flex: 1 }} />
        <IconButton onClick={onEdit} label={`Edit rule ${rule.tag}`} style={{ fontSize: 12, padding: '2px 8px', color: 'var(--t2)' }}>Edit</IconButton>
        <IconButton onClick={onDelete} label={`Delete rule ${rule.tag}`} style={{ fontSize: 16, padding: '0 6px', color: 'var(--t3)' }}>×</IconButton>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
        {rule.triggers.map(t => (
          <span key={t} style={triggerChipStyle}>{t}</span>
        ))}
      </div>
      {rule.links?.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
          {rule.links.map(l => (
            <span key={l} style={linkChipStyle}>[[{l}]]</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── empty state ───────────────────────────────────────────────────────────
function EmptyState({ onAdd }) {
  return (
    <div style={{ padding: '24px 4px', textAlign: 'left' }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)', marginBottom: 6 }}>
        No rules yet.
      </div>
      <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 12 }}>
        Authored rules live in <code style={{ fontSize: 11, color: 'var(--t3)' }}>{RULES_FILE_PATH}</code> inside your vault — editable here or in any text editor.
      </div>
      <button type="button" onClick={onAdd} style={buttonPrimary}>+ Add your first rule</button>
    </div>
  );
}

// ── main panel ────────────────────────────────────────────────────────────
export function KeywordRulesPanel({ rules, onRulesChange, onRescanVault, entryCount = 0 }) {
  const ruleList = Array.isArray(rules?.rules) ? rules.rules : [];
  const [editingTag, setEditingTag] = useState(null); // tag being edited, or '__new__' for add form
  const [rescanArmed, setRescanArmed] = useState(false);
  const rescanTimerRef = useRef(null);
  const existingTags = ruleList.map(r => r.tag);

  // Clear any pending auto-disarm timer. Used on confirm, cancel, and unmount.
  const clearRescanTimer = () => {
    if (rescanTimerRef.current) {
      clearTimeout(rescanTimerRef.current);
      rescanTimerRef.current = null;
    }
  };

  // Always clear the timer when the panel unmounts so it never fires into a stale closure.
  useEffect(() => clearRescanTimer, []);

  const armRescan = () => {
    clearRescanTimer();
    setRescanArmed(true);
    rescanTimerRef.current = setTimeout(() => {
      setRescanArmed(false);
      rescanTimerRef.current = null;
    }, RESCAN_CONFIRM_TIMEOUT_MS);
  };

  const cancelRescan = () => {
    clearRescanTimer();
    setRescanArmed(false);
  };

  const confirmRescan = () => {
    clearRescanTimer();
    setRescanArmed(false);
    if (onRescanVault) onRescanVault();
  };

  const hasCount = entryCount > 0;
  const idleLabel = hasCount
    ? `Apply rules to existing entries (${entryCount} total)`
    : 'Apply rules to existing entries';
  const armedLabel = `Click again to confirm — scans ${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}`;
  // Warning-tinted variant for the armed state — same shape as buttonPrimary, distinct color.
  const buttonArmed = {
    ...buttonPrimary,
    background: '#f59e0b',
    color: '#1f1300',
  };

  const closeForm = () => setEditingTag(null);

  const upsertRule = (originalTag, nextRule) => {
    const isNew = originalTag === '__new__';
    let nextList;
    if (isNew) {
      nextList = [...ruleList, nextRule];
    } else {
      nextList = ruleList.map(r => (r.tag === originalTag ? nextRule : r));
    }
    onRulesChange({ rules: nextList });
    closeForm();
  };

  const deleteRule = (tag) => {
    const nextList = ruleList.filter(r => r.tag !== tag);
    onRulesChange({ rules: nextList });
    if (editingTag === tag) closeForm();
  };

  const startAdd = () => setEditingTag('__new__');
  const startEdit = (tag) => setEditingTag(tag);

  const editingRule = editingTag && editingTag !== '__new__'
    ? ruleList.find(r => r.tag === editingTag)
    : null;

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginTop: 8, marginBottom: 4 }}>
        Auto-tag entries on save when their title, notes, or URL contains a trigger word.
      </div>
      <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4, marginBottom: 4 }}>
        Stored in <code style={{ fontSize: 11 }}>{RULES_FILE_PATH}</code>.
      </div>

      <span style={sectionHeader}>Rules</span>

      {ruleList.length === 0 && editingTag !== '__new__' && (
        <EmptyState onAdd={startAdd} />
      )}

      {ruleList.map(rule => (
        editingTag === rule.tag ? (
          <RuleForm key={rule.tag}
            initial={rule}
            existingTags={existingTags}
            onSave={next => upsertRule(rule.tag, next)}
            onCancel={closeForm} />
        ) : (
          <RuleRow key={rule.tag}
            rule={rule}
            onEdit={() => startEdit(rule.tag)}
            onDelete={() => deleteRule(rule.tag)} />
        )
      ))}

      {editingTag === '__new__' && (
        <RuleForm
          initial={null}
          existingTags={existingTags}
          onSave={next => upsertRule('__new__', next)}
          onCancel={closeForm} />
      )}

      {ruleList.length > 0 && editingTag !== '__new__' && (
        <button type="button" onClick={startAdd}
          style={{ ...buttonGhost, width: '100%', marginTop: 12 }}>
          + Add rule
        </button>
      )}

      <div style={{ borderTop: '1px solid var(--br)', marginTop: 18, paddingTop: 4 }}>
        <span style={sectionHeader}>Apply</span>
        <div style={{ fontSize: 12, color: 'var(--t2)', lineHeight: 1.5, marginBottom: 10 }}>
          Re-scan all entries against the current rules. Adds new auto-tags; respects existing opt-outs.
        </div>
        {rescanArmed ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button"
              onClick={confirmRescan}
              disabled={!onRescanVault}
              title={onRescanVault ? undefined : 'Re-scan handler not wired'}
              style={{ ...buttonArmed, flex: 1, opacity: onRescanVault ? 1 : 0.5, cursor: onRescanVault ? 'pointer' : 'default' }}>
              {armedLabel}
            </button>
            <button type="button" onClick={cancelRescan} style={buttonGhost}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button"
            onClick={armRescan}
            disabled={!onRescanVault}
            title={onRescanVault ? undefined : 'Re-scan handler not wired'}
            style={{ ...buttonPrimary, width: '100%', opacity: onRescanVault ? 1 : 0.5, cursor: onRescanVault ? 'pointer' : 'default' }}>
            {idleLabel}
          </button>
        )}
      </div>
    </div>
  );
}
