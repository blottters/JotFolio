import { useEffect, useMemo, useRef, useState } from 'react';
import './NotesWorkspaceView.css';
import { FRONTMATTER_EXTRAS_FIELD } from '../../lib/frontmatter.js';

const NOTE_TYPES = new Set(['note', 'journal', 'article', 'link', 'wiki', 'review']);

const toolbarButtons = [
  ['H1', 'H1'],
  ['H2', 'H2'],
  ['B', 'B'],
  ['I', 'I'],
  ['Link', '↗'],
  ['Code', '</>'],
  ['List', '☷'],
  ['Task', '☑'],
  ['Quote', '❝'],
  ['Image', '▧'],
  ['Table', '▦'],
];

const TOOLBAR_BREAKS_AFTER = new Set(['H2', 'I', 'Code', 'Task', 'Table']);

function noteTime(entry) {
  return Date.parse(entry?.modified || entry?.entry_date || entry?.date || '') || 0;
}

function noteLines(entry) {
  const body = String(entry?.notes || '').trimEnd();
  const text = body || '# Untitled\n\nStart writing...';
  return text.split('\n');
}

function selectedOr(value, fallback) {
  return value || fallback;
}

function prefixLines(text, marker, fallback) {
  const source = text || fallback;
  return source.split(/\r\n|\r|\n/).map(line => `${marker}${line || fallback}`).join('\n');
}

function toolbarText(label, selection) {
  switch (label) {
    case 'H1': return prefixLines(selection, '# ', 'Heading');
    case 'H2': return prefixLines(selection, '## ', 'Heading');
    case 'B': return `**${selectedOr(selection, 'text')}**`;
    case 'I': return `*${selectedOr(selection, 'text')}*`;
    case 'Link': return `[${selectedOr(selection, 'link text')}]()`;
    case 'Code': return `\`${selectedOr(selection, 'code')}\``;
    case 'List': return prefixLines(selection, '- ', 'List item');
    case 'Task': return prefixLines(selection, '- [ ] ', 'Task');
    case 'Quote': return prefixLines(selection, '> ', 'Quote');
    case 'Image': return `![${selectedOr(selection, 'alt text')}]()`;
    case 'Table': return '| Column 1 | Column 2 |\n| --- | --- |\n| Value | Value |';
    default: return selection;
  }
}

function normalizeWikiTitle(value) {
  return String(value || '').trim().toLowerCase();
}

function entryLinksToTitle(entry, title) {
  const normalized = normalizeWikiTitle(title);
  if (!normalized) return false;
  let linked = false;
  String(entry?.notes || '').replace(/\[\[([^\[\]\n]{1,160})\]\]/g, (_, raw) => {
    if (normalizeWikiTitle(raw) === normalized) linked = true;
    return '';
  });
  return linked;
}

function previewBlocks(text) {
  return String(text || '').split(/\r\n|\r|\n/).filter(line => line.trim()).map((line, index) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) return <h2 key={index}>{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('# ')) return <h1 key={index}>{trimmed.slice(2)}</h1>;
    if (trimmed.startsWith('- ')) return <p key={index}>{trimmed.slice(2)}</p>;
    if (trimmed === '---') return null;
    return <p key={index}>{trimmed}</p>;
  });
}

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function countSpaces(text) {
  return (String(text || '').match(/ /g) || []).length;
}

function formatBytes(size, text = '') {
  const n = Number(size) || new Blob([text]).size;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return 'Unknown';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function displayStatus(value) {
  if (!value) return 'Draft';
  return String(value).replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function dateInputValue(value) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.valueOf())) return '';
  return date.toISOString().slice(0, 10);
}

function copyText(value) {
  try { navigator.clipboard?.writeText(String(value || '')); } catch { /* clipboard may be unavailable in preview */ }
}

function normalizeEntryList({ entries, notes }) {
  const source = Array.isArray(entries) && entries.length ? entries : Array.isArray(notes) ? notes : [];
  return source.filter(entry => NOTE_TYPES.has(entry?.type || 'note'));
}

const PROPERTY_SKIP_KEYS = new Set([
  'id',
  'type',
  'title',
  'notes',
  'tags',
  'project',
  'status',
  'space',
  'starred',
  'links',
  'date',
  'created',
  'modified',
  'entry_date',
  '_path',
  'path',
  'size',
  'unresolvedTargets',
  FRONTMATTER_EXTRAS_FIELD,
]);

function displayPropertyValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (value == null || value === '') return '(empty)';
  return String(value);
}

function hasDisplayablePropertyValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value).length > 0;
  return value != null && value !== '';
}

function railProperties(entry) {
  const base = [
    ['Created', formatDate(entry?.date || entry?.created || entry?.entry_date)],
    ['Modified', formatDate(entry?.modified || entry?.date)],
    ['Type', displayStatus(entry?.type || 'note')],
  ];
  const extras = entry?.[FRONTMATTER_EXTRAS_FIELD] && typeof entry[FRONTMATTER_EXTRAS_FIELD] === 'object'
    ? entry[FRONTMATTER_EXTRAS_FIELD]
    : {};
  const custom = Object.entries({ ...(entry || {}), ...extras })
    .filter(([key, value]) => !PROPERTY_SKIP_KEYS.has(key) && !key.startsWith('_') && hasDisplayablePropertyValue(value))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => [key, displayPropertyValue(value)]);
  return [...base, ...custom];
}

function projectRefs(project = {}) {
  return [project.id, project.title, project._path, project.path, project.slug]
    .filter(Boolean)
    .map(value => String(value));
}

function matchingProject(projects, ref) {
  const target = String(ref || '').trim();
  if (!target) return null;
  return projects.find(project => projectRefs(project).includes(target)) || null;
}

function railTabItems({ backlinks, unresolved, tags }) {
  return [
    ['info', 'Info'],
    ['backlinks', `Backlinks ${backlinks.length}`],
    ['unresolved', `Unresolved ${unresolved.length}`],
    ['tags', 'Tags'],
    ['properties', 'Properties'],
  ];
}

export function NotesWorkspaceView({
  entries = [],
  notes,
  activeEntryId,
  selectedEntryId,
  onOpenEntry,
  onAdd,
  onRevealEntry,
  onOpenInConstellation,
  onCreateFromMissing,
  onUpdateEntry,
}) {
  const allEntries = Array.isArray(entries) && entries.length ? entries : Array.isArray(notes) ? notes : [];
  const noteEntries = useMemo(() => normalizeEntryList({ entries, notes }).sort((a, b) => noteTime(b) - noteTime(a)), [entries, notes]);
  const projectEntries = useMemo(
    () => allEntries.filter(entry => entry?.type === 'project').sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''))),
    [allEntries],
  );
  const preferredId = activeEntryId || selectedEntryId;
  const [localId, setLocalId] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [editorMenuOpen, setEditorMenuOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('edit');
  const [activeRailTab, setActiveRailTab] = useState('info');
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [draft, setDraft] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const activeEntry = noteEntries.find(entry => entry.id === (localId || preferredId)) || noteEntries[0] || null;
  const lines = noteLines(activeEntry ? { ...activeEntry, notes: draft } : activeEntry);
  const text = draft;
  const backlinks = activeEntry ? allEntries.filter(entry => (
    entry?.id !== activeEntry.id
    && ((entry?.links || []).includes(activeEntry.id) || entryLinksToTitle(entry, activeEntry.title))
  )) : [];
  const unresolved = Array.isArray(activeEntry?.unresolvedTargets) ? activeEntry.unresolvedTargets : [];
  const tags = activeEntry?.tags || [];

  useEffect(() => {
    setDraft(String(activeEntry?.notes || ''));
    setMoreOpen(false);
    setEditorMenuOpen(false);
    setEditorMode('edit');
    setActiveRailTab('info');
    setAddingTag(false);
    setTagDraft('');
  }, [activeEntry?.id, activeEntry?.notes]);

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const scheduleSave = (entry, next) => {
    if (!entry || !onUpdateEntry) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      onUpdateEntry(entry.id, { notes: next });
    }, 250);
  };

  const updateDraft = next => {
    setDraft(next);
    scheduleSave(activeEntry, next);
  };

  const applyToolbar = label => {
    const editor = editorRef.current;
    const start = editor?.selectionStart ?? draft.length;
    const end = editor?.selectionEnd ?? draft.length;
    const before = draft.slice(0, start);
    const selected = draft.slice(start, end);
    const after = draft.slice(end);
    const insert = toolbarText(label, selected);
    const next = `${before}${insert}${after}`;
    updateDraft(next);
    requestAnimationFrame(() => {
      editor?.focus();
      editor?.setSelectionRange(before.length, before.length + insert.length);
    });
  };

  const submitTag = () => {
    const nextTag = tagDraft.trim().replace(/^#/, '');
    if (!activeEntry || !nextTag) return;
    onUpdateEntry?.(activeEntry.id, { tags: [...new Set([...(activeEntry.tags || []), nextTag])] });
    setTagDraft('');
    setAddingTag(false);
  };

  const focusEditor = () => {
    if (editorMode !== 'edit') setEditorMode('edit');
    if (editorMode === 'edit') {
      editorRef.current?.focus();
      return;
    }
    requestAnimationFrame(() => editorRef.current?.focus());
  };

  const railTabs = railTabItems({ backlinks, unresolved, tags });
  const activeProject = matchingProject(projectEntries, activeEntry?.project);
  const projectSelectValue = activeProject?.id || activeEntry?.project || '';
  const entryDateValue = dateInputValue(activeEntry?.entry_date || activeEntry?.date || activeEntry?.created);

  if (!activeEntry) {
    return (
      <section className="jf-notes-workspace jf-notes-empty" role="region" aria-label="Notes Markdown Editor">
        <div className="jf-notes-empty-card">
          <h2>No notes yet.</h2>
          <p>Create a Markdown note to start building your vault.</p>
          <button type="button" className="jf-notes-primary" onClick={() => onAdd?.({ type: 'note', folder: 'Notes' })}>New Entry</button>
        </div>
      </section>
    );
  }

  const renderTagsSection = () => (
    <RailSection title="Tags">
      <div className="jf-notes-tags">
        {tags.map(tag => <span key={tag} className="jf-notes-tag">#{tag}</span>)}
        {addingTag ? (
          <input
            aria-label="Add note tag"
            value={tagDraft}
            onChange={event => setTagDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submitTag();
              }
              if (event.key === 'Escape') {
                setAddingTag(false);
                setTagDraft('');
              }
            }}
            autoFocus
          />
        ) : (
          <button type="button" className="jf-notes-tag-add" aria-label="Add tag" onClick={() => setAddingTag(true)}>+ Add tag</button>
        )}
      </div>
    </RailSection>
  );

  const renderBacklinksSection = () => (
    <RailSection title={`Backlinks (${backlinks.length})`}>
      {backlinks.slice(0, 3).map(entry => (
        <button key={entry.id} type="button" className="jf-notes-rail-row" onClick={() => { setLocalId(entry.id); onOpenEntry?.(entry.id); }}>
          <span aria-hidden="true">▧</span>
          <span>{entry.title || 'Untitled note'}</span>
        </button>
      ))}
      {backlinks.length > 3 && <div className="jf-notes-rail-more">+ {backlinks.length - 3} more backlinks</div>}
      {backlinks.length === 0 && <div className="jf-notes-rail-empty">No backlinks yet.</div>}
    </RailSection>
  );

  const renderUnresolvedSection = () => (
    <RailSection title={`Unresolved links (${unresolved.length})`}>
      {unresolved.slice(0, 4).map(item => (
        <div key={item.target || item} className="jf-notes-unresolved-row">
          <span aria-hidden="true">⊗</span>
          <span>{item.target || item}</span>
          {onCreateFromMissing && (
            <button type="button" onClick={() => onCreateFromMissing(item.target || item)}>Create</button>
          )}
        </div>
      ))}
      {unresolved.length === 0 && <div className="jf-notes-rail-empty">No unresolved links.</div>}
    </RailSection>
  );

  const renderPropertiesSection = () => (
    <RailSection title="Properties">
      <div className="jf-notes-properties">
        <label className="jf-notes-property jf-notes-property-control">
          <span>Status</span>
          <input
            key={`${activeEntry.id}-status-${activeEntry.status || ''}`}
            aria-label="Note status"
            defaultValue={activeEntry.status || ''}
            placeholder="draft"
            onBlur={event => {
              const next = event.target.value.trim();
              if (next !== String(activeEntry.status || '')) onUpdateEntry?.(activeEntry.id, { status: next });
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') event.currentTarget.blur();
              if (event.key === 'Escape') {
                event.currentTarget.value = activeEntry.status || '';
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <label className="jf-notes-property jf-notes-property-control">
          <span>Project</span>
          <select
            aria-label="Note project"
            value={projectSelectValue}
            onChange={event => onUpdateEntry?.(activeEntry.id, { project: event.target.value })}>
            <option value="">No project</option>
            {activeEntry.project && !activeProject && <option value={activeEntry.project}>Missing: {activeEntry.project}</option>}
            {projectEntries.map(project => (
              <option key={project.id} value={project.id}>{project.title || project.id}</option>
            ))}
          </select>
        </label>
        <label className="jf-notes-property jf-notes-property-control">
          <span>Entry date</span>
          <input
            aria-label="Note entry date"
            type="date"
            value={entryDateValue}
            onChange={event => onUpdateEntry?.(activeEntry.id, { entry_date: event.target.value })}
          />
        </label>
        {railProperties(activeEntry).map(([label, value]) => (
          <div key={label} className="jf-notes-property">
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </RailSection>
  );

  const renderFileSection = () => (
    <RailSection title="File">
      <div className="jf-notes-file-path">
        <span>{activeEntry._path || activeEntry.path || 'Notes/Untitled.md'}</span>
        <button type="button" aria-label="Copy local path" onClick={() => copyText(activeEntry._path || activeEntry.path)}>⧉</button>
      </div>
      <div className="jf-notes-file-size">{formatBytes(activeEntry.size, text)}</div>
    </RailSection>
  );

  const renderActionsSection = () => (
    <RailSection title="Actions">
      <div className="jf-notes-actions">
        <button type="button" onClick={() => onOpenInConstellation?.(activeEntry)}>Open in Constellation</button>
        <button type="button" onClick={() => onRevealEntry?.(activeEntry)}>Reveal in Vault</button>
        <button type="button" aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => setMoreOpen(open => !open)}>More</button>
      </div>
      {moreOpen && (
        <div className="jf-notes-actions-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => copyText(activeEntry.title)}>Copy title</button>
          <button type="button" role="menuitem" onClick={() => copyText(activeEntry._path || activeEntry.path)}>Copy local path</button>
        </div>
      )}
    </RailSection>
  );

  return (
    <section className={`jf-notes-workspace${fullscreen ? ' is-fullscreen' : ''}`} role="region" aria-label="Notes Markdown Editor">
      <main className="jf-notes-main" aria-label="Markdown editor">
        <div className="jf-notes-tabbar">
          <div className="jf-notes-open-tabs" role="tablist" aria-label="Open notes">
            <button type="button" className="jf-notes-tab is-active" role="tab" aria-selected="true">
              <span className="jf-notes-file-icon" aria-hidden="true">▣</span>
              <span className="jf-notes-tab-title">{activeEntry.title || 'Untitled Note.md'}</span>
              <span className="jf-notes-tab-close" aria-hidden="true">x</span>
            </button>
            <button type="button" className="jf-notes-tab-add" aria-label="New note tab" onClick={() => onAdd?.({ type: 'note', folder: 'Notes' })}>+</button>
          </div>
          <span className="jf-notes-tabbar-spacer" />
          <div className="jf-notes-mode-group" role="group" aria-label="Editor mode">
            <button type="button" className={`jf-notes-mode-button${editorMode === 'edit' ? ' is-active' : ''}`} aria-pressed={editorMode === 'edit'} onClick={() => setEditorMode('edit')}>Edit</button>
            <button type="button" className={`jf-notes-mode-button${editorMode === 'preview' ? ' is-active' : ''}`} aria-pressed={editorMode === 'preview'} onClick={() => setEditorMode('preview')}>Preview</button>
            <button type="button" className={`jf-notes-mode-button${activeRailTab === 'backlinks' ? ' is-active' : ''}`} aria-pressed={activeRailTab === 'backlinks'} onClick={() => setActiveRailTab('backlinks')}>Backlinks <span aria-hidden="true">⌄</span></button>
            <button type="button" className="jf-notes-mode-button" onClick={() => onAdd?.({ type: 'note', folder: 'Notes' })}>New Entry <span aria-hidden="true">⌄</span></button>
          </div>
          <div className="jf-notes-editor-more">
            <button type="button" className="jf-notes-icon-button" aria-label="More editor actions" aria-haspopup="menu" aria-expanded={editorMenuOpen} onClick={() => setEditorMenuOpen(open => !open)}>⋮</button>
            {editorMenuOpen && (
              <div className="jf-notes-actions-menu jf-notes-editor-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => copyText(activeEntry.title)}>Copy title</button>
                <button type="button" role="menuitem" onClick={() => copyText(activeEntry._path || activeEntry.path)}>Copy local path</button>
                {onRevealEntry && <button type="button" role="menuitem" onClick={() => { setEditorMenuOpen(false); onRevealEntry(activeEntry); }}>Reveal in Vault</button>}
              </div>
            )}
          </div>
        </div>

        <div className="jf-notes-toolbar" role="toolbar" aria-label="Markdown tools">
          {toolbarButtons.map(([label, textLabel]) => (
            <FragmentWithBreak key={label} breakAfter={TOOLBAR_BREAKS_AFTER.has(label)}>
              <button
                type="button"
                className="jf-notes-tool"
                aria-label={label}
                onMouseDown={event => event.preventDefault()}
                onClick={() => applyToolbar(label)}>
                {textLabel}
              </button>
            </FragmentWithBreak>
          ))}
          <span className="jf-notes-toolbar-spacer" />
          <button type="button" className="jf-notes-tool" aria-label="Focus editor" onClick={focusEditor}>↙</button>
          <button type="button" className="jf-notes-tool" aria-label="Fullscreen editor" aria-pressed={fullscreen} onClick={() => setFullscreen(active => !active)}>⛶</button>
        </div>

        <div className="jf-notes-editor-shell">
          <div className="jf-notes-editor-scroll">
            {editorMode === 'preview' ? (
              <div className="jf-notes-editor-code mgn-md" style={{ padding: '0 24px 24px 68px', whiteSpace: 'normal' }}>
                {previewBlocks(draft)}
              </div>
            ) : (
              <div
                className="jf-notes-editor-code"
                style={{ display: 'grid', gridTemplateColumns: '68px minmax(760px, 1fr)', whiteSpace: 'normal' }}>
                <div aria-hidden="true">
                  {lines.map((line, index) => (
                    <div className="jf-notes-line-number" key={`${index}-${line}`}>
                      {index + 1}
                    </div>
                  ))}
                </div>
                <textarea
                  ref={editorRef}
                  aria-label={`Markdown editor for ${activeEntry.title || 'Untitled Note'}`}
                  value={draft}
                  onChange={event => updateDraft(event.target.value)}
                  spellCheck
                  placeholder="Write in markdown..."
                  style={{
                    minHeight: '420px',
                    width: '100%',
                    boxSizing: 'border-box',
                    border: 0,
                    outline: 0,
                    resize: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    lineHeight: 'inherit',
                    padding: '0 24px 0 0',
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <footer className="jf-notes-statusbar">
          <span>{lines.length} lines</span>
          <span>{wordCount(text).toLocaleString()} words</span>
          <span>{formatBytes(activeEntry.size, text)}</span>
          <span className="jf-notes-status-push">Markdown</span>
          <span>Spaces: {countSpaces(text)}</span>
          <span className="jf-notes-live-dot" aria-hidden="true" />
          <span>Live</span>
        </footer>
      </main>

      <aside className="jf-notes-rail" aria-label="Selected note context">
        <div className="jf-notes-rail-tabs" role="tablist" aria-label="Note metadata">
          {railTabs.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={activeRailTab === id} className={activeRailTab === id ? 'is-active' : ''} onClick={() => setActiveRailTab(id)}>{label}</button>
          ))}
        </div>

        {activeRailTab === 'info' && (
          <>
            {renderTagsSection()}
            {renderBacklinksSection()}
            {renderUnresolvedSection()}
            {renderPropertiesSection()}
            {renderFileSection()}
            {renderActionsSection()}
          </>
        )}

        {activeRailTab === 'backlinks' && renderBacklinksSection()}

        {activeRailTab === 'unresolved' && renderUnresolvedSection()}

        {activeRailTab === 'tags' && renderTagsSection()}

        {activeRailTab === 'properties' && (
          renderPropertiesSection()
        )}
      </aside>
    </section>
  );
}

function RailSection({ title, children }) {
  return (
    <section className="jf-notes-rail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function FragmentWithBreak({ breakAfter, children }) {
  return (
    <>
      {children}
      {breakAfter && <span className="jf-notes-tool-separator" aria-hidden="true" />}
    </>
  );
}
