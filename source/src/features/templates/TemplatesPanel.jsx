import { useState, useEffect, useMemo, useId } from 'react';
import { getTemplateIncoming, getTemplateOutgoing } from '../../lib/templates/templateBacklinks.js';
import { ICON } from '../../lib/types.js';

// TemplatesPanel manages Markdown files in templates/. It is intentionally
// vault-adapter agnostic: the parent owns all reads/writes.
export function TemplatesPanel({
  templates,
  onCreate,
  onApplyToActive,
  onSave,
  activeEntryId,
  entries = [],
  onOpenEntry,
}) {
  const list = Array.isArray(templates) ? templates : [];
  const [selectedId, setSelectedId] = useState(list[0]?.id || null);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [saving, setSaving] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (list.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!list.some(t => t.id === selectedId)) setSelectedId(list[0].id);
  }, [list, selectedId]);

  const selected = useMemo(
    () => list.find(t => t.id === selectedId) || null,
    [list, selectedId],
  );

  useEffect(() => {
    setDraftBody(selected?.body || '');
  }, [selected?.id, selected?.body]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.path.toLowerCase().includes(q) ||
      String(t.body || '').toLowerCase().includes(q),
    );
  }, [list, query]);

  const dirty = !!selected && draftBody !== (selected.body || '');
  const variables = ['{{date}}', '{{date:dddd, MMMM D, YYYY}}', '{{time}}', '{{title}}'];
  const frontmatterKeys = selected?.frontmatter && typeof selected.frontmatter === 'object'
    ? Object.keys(selected.frontmatter)
    : [];
  const incoming = useMemo(
    () => selected ? getTemplateIncoming(entries, selected) : [],
    [entries, selected],
  );
  const outgoing = useMemo(
    () => selected ? getTemplateOutgoing(entries, selected, draftBody) : { resolved: [], unresolved: [] },
    [entries, selected, draftBody],
  );

  const submitDraft = () => {
    const name = draftName.trim();
    if (!name) return;
    onCreate?.({ name });
    setDraftName('');
    setCreating(false);
  };

  const saveSelected = async () => {
    if (!selected || !dirty || saving) return;
    setSaving(true);
    try {
      await onSave?.(selected, draftBody);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      color: 'var(--tx)', fontFamily: 'var(--fn)', minHeight: 0,
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px', borderBottom: '1px solid var(--br)',
        background: 'var(--bg)', flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.35 }}>
            ▣ Templates
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>
            templates/ folder · {list.length} {list.length === 1 ? 'template' : 'templates'}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        {creating ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input
              id={inputId}
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              placeholder="daily-note"
              aria-label="New template name"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); submitDraft(); }
                else if (e.key === 'Escape') { setCreating(false); setDraftName(''); }
              }}
              style={inputStyle({ minWidth: 190 })}
            />
            <button type="button" disabled={!draftName.trim()} onClick={submitDraft} style={primaryButton(!draftName.trim())}>Create</button>
            <button type="button" onClick={() => { setCreating(false); setDraftName(''); }} style={ghostButton()}>Cancel</button>
          </div>
        ) : (
          <button type="button" onClick={() => setCreating(true)} style={primaryButton(false)}>+ New template</button>
        )}
      </header>

      <div style={{
        display: 'grid', gridTemplateColumns: '260px minmax(360px, 1fr) 260px',
        flex: 1, minHeight: 0,
      }}>
        <aside style={{
          borderRight: '1px solid var(--br)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', minHeight: 0,
        }}>
          <div style={{ padding: 10, borderBottom: '1px solid var(--br)', flexShrink: 0 }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search templates..."
              aria-label="Search templates"
              style={inputStyle({ width: '100%' })}
            />
          </div>
          <div role="listbox" aria-label="Templates" style={{ overflowY: 'auto', padding: '6px 0', minHeight: 0 }}>
            {list.length === 0 ? (
              <EmptyTemplateState />
            ) : filtered.length === 0 ? (
              <div style={{ padding: 16, color: 'var(--t3)', fontSize: 12 }}>No templates match that search.</div>
            ) : filtered.map(t => {
              const active = t.id === selectedId;
              const preview = firstMeaningfulLine(t.body);
              return (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setSelectedId(t.id)}
                  style={{
                    width: '100%', textAlign: 'left', border: 'none',
                    borderLeft: `3px solid ${active ? 'var(--ac)' : 'transparent'}`,
                    borderBottom: '1px solid var(--br)',
                    background: active ? 'var(--b2)' : 'transparent',
                    color: active ? 'var(--tx)' : 'var(--t2)',
                    cursor: 'pointer', padding: '9px 12px 9px 11px',
                    fontFamily: 'var(--fn)', display: 'block',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ color: active ? 'var(--ac)' : 'var(--t3)', flexShrink: 0 }}>▣</span>
                    <span style={{ fontSize: 13, fontWeight: active ? 800 : 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.name}.md
                    </span>
                  </div>
                  {preview && (
                    <div style={{ marginTop: 4, marginLeft: 21, color: 'var(--t3)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preview}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
          {selected ? (
            <>
              <div style={{
                padding: '11px 14px', borderBottom: '1px solid var(--br)',
                display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.name}.md
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.path}
                  </div>
                </div>
                <button type="button" onClick={() => setDraftBody(selected.body || '')} disabled={!dirty || saving} style={ghostButton(!dirty || saving)}>Reset</button>
                <button type="button" onClick={saveSelected} disabled={!dirty || saving} style={primaryButton(!dirty || saving)}>
                  {saving ? 'Saving...' : dirty ? 'Save template' : 'Saved'}
                </button>
                <button
                  type="button"
                  disabled={!activeEntryId}
                  onClick={() => onApplyToActive?.({ ...selected, body: draftBody })}
                  style={ghostButton(!activeEntryId)}
                  title={activeEntryId ? '' : 'Open an entry first to apply this template'}
                >
                  Apply to active entry
                </button>
              </div>
              <textarea
                aria-label={`Edit template ${selected.name}`}
                value={draftBody}
                onChange={e => setDraftBody(e.target.value)}
                spellCheck={false}
                style={{
                  flex: 1, minHeight: 0, resize: 'none', border: 'none',
                  outline: 'none', padding: '18px 20px', background: 'var(--bg)',
                  color: 'var(--t2)', fontSize: 12, lineHeight: 1.75,
                  fontFamily: '"JetBrains Mono","Courier New",monospace',
                  tabSize: 2,
                }}
              />
            </>
          ) : (
            <div style={{ margin: 'auto', color: 'var(--t3)', fontSize: 13 }}>
              Select a template to preview and edit it.
            </div>
          )}
        </main>

        <aside style={{
          borderLeft: '1px solid var(--br)', background: 'var(--b2)',
          overflowY: 'auto', minHeight: 0,
        }}>
          <SideSection title="Template help">
            <div style={helpText}>
              Templates are plain markdown files. Use variables and apply a template into the entry you are editing.
            </div>
          </SideSection>
          <SideSection title="Variables">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {variables.map(v => <code key={v} style={codePill}>{v}</code>)}
            </div>
          </SideSection>
          <SideSection title={`Backlinks${incoming.length ? ` (${incoming.length})` : ''}`}>
            {incoming.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {incoming.map(({ entry, reasons }) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenEntry?.(entry.id)}
                    style={entryButtonStyle}
                  >
                    <span aria-hidden="true" style={{ flexShrink: 0 }}>{ICON[entry.type] || '•'}</span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={entryTitleStyle}>{entry.title || 'Untitled'}</span>
                      <span style={entryMetaStyle}>{reasons.map(formatReason).join(' + ')}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div style={helpText}>
                No incoming references yet. Apply this template to an entry, or link to it with <code style={inlineCode}>[[{selected?.name || 'template-name'}]]</code>.
              </div>
            )}
          </SideSection>
          <SideSection title={`Outgoing links${outgoing.resolved.length || outgoing.unresolved.length ? ` (${outgoing.resolved.length + outgoing.unresolved.length})` : ''}`}>
            {outgoing.resolved.length || outgoing.unresolved.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {outgoing.resolved.map(({ entry }) => (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onOpenEntry?.(entry.id)}
                    style={entryButtonStyle}
                  >
                    <span aria-hidden="true" style={{ flexShrink: 0 }}>{ICON[entry.type] || '•'}</span>
                    <span style={entryTitleStyle}>{entry.title || 'Untitled'}</span>
                  </button>
                ))}
                {outgoing.unresolved.map(link => (
                  <div key={link.target} style={missingLinkStyle}>
                    <span aria-hidden="true">?</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.target}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={helpText}>No wiki links in this template body.</div>
            )}
          </SideSection>
          <SideSection title="Selected file">
            {selected ? (
              <div style={{ ...helpText, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span><strong>Name:</strong> {selected.name}.md</span>
                <span><strong>Path:</strong> {selected.path}</span>
                <span><strong>Frontmatter:</strong> {frontmatterKeys.length ? frontmatterKeys.join(', ') : 'none'}</span>
                <span><strong>Status:</strong> {dirty ? 'unsaved changes' : 'saved'}</span>
              </div>
            ) : (
              <div style={helpText}>No template selected.</div>
            )}
          </SideSection>
        </aside>
      </div>
    </div>
  );
}

function formatReason(reason) {
  if (reason === 'applied') return 'applied template';
  if (reason === 'linked') return 'linked to template';
  return reason;
}

function EmptyTemplateState() {
  return (
    <div style={{ padding: 16, color: 'var(--t3)', fontSize: 12, lineHeight: 1.55 }}>
      No templates yet. Create one and it will be saved as{' '}
      <code style={{ fontFamily: 'monospace' }}>templates/name.md</code>.
    </div>
  );
}

function SideSection({ title, children }) {
  return (
    <section style={{ padding: '14px 14px 16px', borderBottom: '1px solid var(--br)' }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.6, color: 'var(--t3)', textTransform: 'uppercase', marginBottom: 9 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function inputStyle(extra = {}) {
  return {
    padding: '7px 10px',
    background: 'var(--bg)',
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    color: 'var(--tx)',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    outline: 'none',
    ...extra,
  };
}

function primaryButton(disabled) {
  return {
    padding: '7px 12px',
    background: disabled ? 'var(--br)' : 'var(--ac)',
    color: disabled ? 'var(--t3)' : 'var(--act)',
    border: '1px solid transparent',
    borderRadius: 'var(--rd)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  };
}

function ghostButton(disabled = false) {
  return {
    padding: '7px 10px',
    background: 'transparent',
    color: disabled ? 'var(--t3)' : 'var(--tx)',
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    whiteSpace: 'nowrap',
  };
}

function firstMeaningfulLine(body) {
  return String(body || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(line => line && !line.startsWith('---')) || '';
}

const helpText = {
  color: 'var(--t2)',
  fontSize: 12,
  lineHeight: 1.55,
};

const codePill = {
  display: 'inline-block',
  padding: '5px 7px',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  background: 'var(--bg)',
  color: 'var(--tx)',
  fontFamily: '"JetBrains Mono","Courier New",monospace',
  fontSize: 11,
};

const inlineCode = {
  fontFamily: '"JetBrains Mono","Courier New",monospace',
  fontSize: 11,
  color: 'var(--tx)',
};

const entryButtonStyle = {
  width: '100%',
  padding: '7px 9px',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  background: 'var(--bg)',
  color: 'var(--tx)',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  textAlign: 'left',
};

const entryTitleStyle = {
  display: 'block',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 700,
};

const entryMetaStyle = {
  display: 'block',
  marginTop: 2,
  color: 'var(--t3)',
  fontSize: 10,
};

const missingLinkStyle = {
  padding: '7px 9px',
  border: '1px dashed var(--t3)',
  borderRadius: 'var(--rd)',
  color: 'var(--t2)',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  gap: 7,
};
