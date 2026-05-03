import { useState, useEffect, useMemo, useId } from 'react';

// TemplatesPanel — manages the user's templates folder.
//
// Two columns: left list of templates, right preview pane. Parent owns
// vault writes; this component is render-only and signals intent through
// callbacks. "+ New template" prompts the parent to create a new file
// (parent decides path/slug/initial body). "Apply to active note" hands
// the selected Template back to the parent. "Edit selected" tells the
// parent to open the template path in the editor.
//
// Styling mirrors BaseExplorer's palette (var(--ac), var(--bg), var(--br),
// var(--tx), var(--t2), var(--t3), var(--rd), var(--fn)).

export function TemplatesPanel({
  templates,
  onCreate,
  onApplyToActive,
  onEdit,
  activeEntryId,
}) {
  const list = Array.isArray(templates) ? templates : [];
  const [selectedId, setSelectedId] = useState(list[0]?.id || null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const inputId = useId();

  // Keep selection valid as the underlying list changes (creates / deletes
  // upstream). If the previously selected template vanishes, fall back to
  // the first available; if there are none, clear selection.
  useEffect(() => {
    if (list.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!list.some(t => t.id === selectedId)) {
      setSelectedId(list[0].id);
    }
  }, [list, selectedId]);

  const selected = useMemo(
    () => list.find(t => t.id === selectedId) || null,
    [list, selectedId],
  );

  const submitDraft = () => {
    const name = draftName.trim();
    if (!name) return;
    onCreate?.({ name });
    setDraftName('');
    setCreating(false);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      color: 'var(--tx)', fontFamily: 'var(--fn)',
    }}>
      <header style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px', borderBottom: '1px solid var(--br)',
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Template Library</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>Create reusable note starters. Apply inserts the selected template into the active entry.</div>
        </div>
        <div style={{ flex: 1 }} />
        {creating ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              id={inputId}
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              placeholder="Template name"
              aria-label="New template name"
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); submitDraft(); }
                else if (e.key === 'Escape') { setCreating(false); setDraftName(''); }
              }}
              style={{
                padding: '6px 10px', background: 'var(--bg)',
                border: '1px solid var(--ac)', borderRadius: 'var(--rd)',
                color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 13,
                minWidth: 180,
              }}
            />
            <button
              type="button"
              disabled={!draftName.trim()}
              onClick={submitDraft}
              style={primaryButton(!draftName.trim())}
            >Create</button>
            <button
              type="button"
              onClick={() => { setCreating(false); setDraftName(''); }}
              style={ghostButton()}
            >Cancel</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            style={primaryButton(false)}
          >+ New template</button>
        )}
      </header>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <aside style={{
          width: 240, borderRight: '1px solid var(--br)', overflowY: 'auto',
          padding: '6px 0',
        }}>
          {list.length === 0 ? (
            <div style={{
              padding: '16px 18px', color: 'var(--t3)', fontSize: 12,
              lineHeight: 1.5,
            }}>
              No templates yet. Create a reusable note starter with the button above. It will be
              saved as <code style={{ fontFamily: 'monospace' }}>templates/&lt;name&gt;.md</code>.
            </div>
          ) : list.map(t => {
            const active = t.id === selectedId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedId(t.id)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px', border: 'none',
                  background: active ? 'var(--ac)' : 'transparent',
                  color: active ? 'var(--act)' : 'var(--tx)',
                  cursor: 'pointer', fontSize: 13, fontFamily: 'var(--fn)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {t.name}
              </button>
            );
          })}
        </aside>

        <section style={{
          flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0,
        }}>
          {selected ? (
            <>
              <div style={{
                padding: '10px 18px', borderBottom: '1px solid var(--br)',
                display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>
                    {selected.name}
                  </div>
                  <div style={{
                    fontSize: 11, color: 'var(--t3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{selected.path}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit?.(selected)}
                  style={ghostButton()}
                >Edit file</button>
                <button
                  type="button"
                  disabled={!activeEntryId}
                  onClick={() => onApplyToActive?.(selected)}
                  style={primaryButton(!activeEntryId)}
                  title={activeEntryId ? '' : 'Open a note first to apply this template'}
                >Insert into active entry</button>
              </div>
              <pre style={{
                flex: 1, margin: 0, padding: '14px 18px', overflow: 'auto',
                fontSize: 12, fontFamily: 'monospace',
                color: 'var(--t2)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                background: 'var(--bg)',
              }}>{selected.body || ''}</pre>
            </>
          ) : (
            <div style={{
              padding: 30, color: 'var(--t3)', fontSize: 13, textAlign: 'center',
              margin: 'auto',
            }}>
              Select a template on the left to preview its body.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function primaryButton(disabled) {
  return {
    padding: '6px 12px',
    background: disabled ? 'var(--br)' : 'var(--ac)',
    color: disabled ? 'var(--t3)' : 'var(--act)',
    border: 'none', borderRadius: 'var(--rd)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--fn)', fontSize: 12, fontWeight: 700,
  };
}

function ghostButton() {
  return {
    padding: '6px 10px', background: 'transparent',
    color: 'var(--tx)', border: '1px solid var(--br)',
    borderRadius: 'var(--rd)', cursor: 'pointer',
    fontFamily: 'var(--fn)', fontSize: 12,
  };
}
