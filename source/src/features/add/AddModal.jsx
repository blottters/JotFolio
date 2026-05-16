import { useMemo, useRef, useState } from "react";
import { STATUSES, today } from '../../lib/types.js';
import { TYPE_FOLDER } from '../../lib/frontmatter.js';
import { isSafeUrl, normalizeTags, pickEntryFields, withAlpha } from '../../lib/storage.js';
import { useEscapeKey, useAutoFocus } from '../../lib/hooks.js';

const ASSET_ROOT = '/jotfolio-assets/icons';

const CAPTURE_TYPES = [
  { id: 'note', label: 'Note', asset: 'entry-note.svg', accent: '#5aa7ff' },
  { id: 'journal', label: 'Journal', asset: 'entry-journal.svg', accent: '#4ade80' },
  { id: 'article', label: 'Article', asset: 'entry-article.svg', accent: '#f59e0b' },
  { id: 'podcast', label: 'Podcast', asset: 'entry-podcast.svg', accent: '#a855f7' },
  { id: 'video', label: 'Video', asset: 'entry-video.svg', accent: '#ef4444' },
  { id: 'link', label: 'Link', asset: 'entry-link.svg', accent: '#22c55e' },
  { id: 'project', label: 'Project', asset: 'entry-project.svg', accent: '#7ddc9e' },
  { id: 'task', label: 'Task', asset: 'entry-task.svg', accent: '#ffb86b' },
  { id: 'canvas', label: 'Canvas', asset: 'entry-canvas.svg', accent: '#f97316' },
  { id: 'raw', label: 'Raw', asset: 'entry-raw.svg', accent: '#94a3b8' },
];

const CONTENT_TABS = ['Markdown', 'Link', 'Transcript', 'Attachment', 'Canvas'];

const TEMPLATE_OPTIONS = {
  'Research Note': title => `# ${title || 'Research Note'}\n\n## Summary\n\n\n## Key points\n- \n\n## Source\n\n\n## Next action\n- `,
  'Meeting Notes': title => `# ${title || 'Meeting Notes'}\n\n## Attendees\n- \n\n## Decisions\n- \n\n## Follow-ups\n- [ ] `,
  'Project Brief': title => `# ${title || 'Project Brief'}\n\n## Goal\n\n\n## Scope\n\n\n## Milestones\n- `,
  'Daily Journal': title => `# ${title || 'Daily Journal'}\n\n## Wins\n- \n\n## Notes\n\n\n## Tomorrow\n- `,
};

const DEFAULT_TAGS = [];
const DEFAULT_TAG_SUGGESTIONS = ['research', 'local-first', 'productivity', 'design', 'planning', 'ideas', 'capture'];

function supportedType(type) {
  return CAPTURE_TYPES.some(item => item.id === type) ? type : 'note';
}

function defaultTitleFor(type) {
  if (type === 'project') return 'Untitled Project';
  if (type === 'task') return 'Untitled Task';
  if (type === 'canvas') return 'New Canvas';
  if (type === 'raw') return 'Untitled Capture';
  if (type === 'journal') return `Journal ${today()}`;
  return 'Untitled Note';
}

function defaultTemplateFor(type) {
  if (type === 'journal') return 'Daily Journal';
  if (type === 'project') return 'Project Brief';
  if (type === 'task') return 'Meeting Notes';
  return 'Research Note';
}

function bucketLabelFor(type) {
  const bucket = type === 'canvas' ? 'canvases' : TYPE_FOLDER[type] || 'notes';
  return bucket.charAt(0).toUpperCase() + bucket.slice(1);
}

function sanitizeFileName(value, type) {
  const fallback = defaultTitleFor(type);
  const clean = String(value || fallback)
    .replace(/[<>:"/\\|?*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean || fallback;
}

function pathFor(title, type) {
  const extension = type === 'canvas' ? '.canvas.json' : '.md';
  const bucket = type === 'canvas' ? 'canvases' : TYPE_FOLDER[type] || 'notes';
  return `${bucket}/${sanitizeFileName(title, type)}${extension}`;
}

function normalizeProjectContext(projectContext) {
  if (!projectContext) return null;
  if (typeof projectContext === 'string') return { id: projectContext, title: projectContext, path: '' };
  const id = String(projectContext.id || projectContext.title || '').trim();
  const title = String(projectContext.title || projectContext.id || '').trim();
  if (!id && !title) return null;
  return {
    id: id || title,
    title: title || id,
    path: projectContext.path || projectContext._path || '',
    tags: Array.isArray(projectContext.tags) ? projectContext.tags : [],
  };
}

function inputStyle(extra = {}) {
  return {
    width: '100%',
    minHeight: 42,
    boxSizing: 'border-box',
    border: '1px solid rgba(118, 137, 160, 0.22)',
    borderRadius: 7,
    background: 'rgba(12, 17, 23, 0.46)',
    color: 'var(--tx)',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    outline: 'none',
    padding: '9px 12px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.025)',
    ...extra,
  };
}

function fieldLabelStyle(extra = {}) {
  return {
    display: 'block',
    marginBottom: 6,
    color: 'var(--t2)',
    fontSize: 12,
    fontWeight: 700,
    ...extra,
  };
}

function modalButtonStyle(kind = 'quiet') {
  const isPrimary = kind === 'primary';
  return {
    minHeight: 40,
    padding: '0 18px',
    borderRadius: 7,
    border: isPrimary ? '1px solid rgba(76, 150, 255, 0.72)' : '1px solid rgba(118, 137, 160, 0.22)',
    background: isPrimary
      ? 'linear-gradient(180deg, #3f8ff2 0%, #2f73c8 100%)'
      : 'rgba(16, 23, 31, 0.62)',
    color: isPrimary ? '#fff' : 'var(--tx)',
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    fontWeight: isPrimary ? 800 : 650,
    boxShadow: isPrimary ? '0 14px 26px rgba(47, 115, 200, 0.22)' : 'none',
  };
}

function iconPath(asset) {
  return `${ASSET_ROOT}/entry-types/${asset}`;
}

export function AddModal({
  initialType = 'note',
  initialSpace = '',
  initialTitle = '',
  existingUrls,
  allTags,
  projectContext,
  quickCapture = false,
  onImportFile,
  onClose,
  onAdd,
  onCreateCanvas,
  entries,
  suggestTagsFromText,
}) {
  const projectTarget = normalizeProjectContext(projectContext);
  const startingType = supportedType(initialType);
  const quickNote = quickCapture && startingType === 'note';
  const [type, setType] = useState(startingType);
  const [form, setForm] = useState({
    title: initialTitle,
    url: '',
    notes: '',
  });
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [tagDraft, setTagDraft] = useState('');
  const [template, setTemplate] = useState(defaultTemplateFor(startingType));
  const [contentTab, setContentTab] = useState('Markdown');
  const [urlError, setUrlError] = useState('');
  const [dupWarning, setDupWarning] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const titleInputRef = useRef(null);
  const contentRef = useRef(null);

  useEscapeKey(true, () => tryClose(), { includeEditableTargets: true });
  useAutoFocus(titleInputRef);

  const tagSuggestions = useMemo(() => {
    const source = [...DEFAULT_TAG_SUGGESTIONS, ...(allTags || [])];
    return [...new Set(source.map(tag => String(tag).trim().toLowerCase()).filter(Boolean))];
  }, [allTags]);

  const localPathPreview = useMemo(
    () => pathFor(form.title, type),
    [form.title, type]
  );

  const setField = key => event => {
    setDirty(true);
    setConfirmDiscard(false);
    if (key === 'url') {
      setUrlError('');
      setDupWarning(null);
    }
    setForm(previous => ({ ...previous, [key]: event.target.value }));
  };

  const tryClose = () => {
    if (dirty) {
      setConfirmDiscard(true);
      return;
    }
    onClose();
  };

  const chooseType = nextType => {
    setType(nextType);
    setDirty(true);
    setConfirmDiscard(false);
    setStatusMessage('');
    setTemplate(defaultTemplateFor(nextType));
  };

  const addTag = value => {
    const clean = String(value || '').trim().replace(/^#/, '').toLowerCase();
    if (!clean) return;
    setTags(previous => previous.includes(clean) ? previous : [...previous, clean]);
    setTagDraft('');
    setDirty(true);
  };

  const removeTag = tag => {
    setTags(previous => previous.filter(item => item !== tag));
    setDirty(true);
  };

  // MiniLM Phase 2: tag suggestions via semantic neighbours.
  // 1. Embed (title + notes) of the draft via suggestTagsFromText
  // 2. suggestTagsFromText returns top-10 most-similar existing entries
  // 3. Count tag frequencies across those neighbours
  // 4. Take the 5 most common tags NOT already on the draft
  // Pure local: the embed runs in WASM, no network.
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [suggestingTags, setSuggestingTags] = useState(false);
  const [tagSuggestNotice, setTagSuggestNotice] = useState('');

  const handleSuggestTags = async () => {
    const draftText = `${form.title || ''}\n${form.notes || ''}`.trim();
    if (!draftText) {
      setTagSuggestNotice('Add a title or notes first so we can find similar entries.');
      setSuggestedTags([]);
      return;
    }
    if (typeof suggestTagsFromText !== 'function') {
      setTagSuggestNotice('Semantic index not available.');
      setSuggestedTags([]);
      return;
    }
    setSuggestingTags(true);
    setTagSuggestNotice('');
    try {
      const neighbours = await suggestTagsFromText(draftText, 10);
      if (!Array.isArray(neighbours) || neighbours.length === 0) {
        setTagSuggestNotice('No semantically similar notes found yet.');
        setSuggestedTags([]);
        return;
      }
      const idToEntry = new Map((entries || []).map(e => [e.id, e]));
      const counts = new Map();
      for (const { id } of neighbours) {
        const neighbour = idToEntry.get(id);
        if (!neighbour) continue;
        for (const raw of (neighbour.tags || [])) {
          const t = String(raw || '').trim().toLowerCase();
          if (!t) continue;
          if (tags.includes(t)) continue;
          counts.set(t, (counts.get(t) || 0) + 1);
        }
      }
      const ranked = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);
      setSuggestedTags(ranked);
      if (ranked.length === 0) setTagSuggestNotice('Similar notes have no new tags to add.');
    } catch (err) {
      console.warn('[AddModal] suggest tags failed', err);
      setTagSuggestNotice('Could not run tag suggestions.');
      setSuggestedTags([]);
    } finally {
      setSuggestingTags(false);
    }
  };

  const applySuggestedTag = tag => {
    addTag(tag);
    setSuggestedTags(previous => previous.filter(item => item !== tag));
  };

  const applyTemplate = () => {
    const templateBody = TEMPLATE_OPTIONS[template]?.(form.title) || '';
    setForm(previous => ({ ...previous, notes: templateBody }));
    setContentTab('Markdown');
    setDirty(true);
    setStatusMessage(`${template} applied`);
    requestAnimationFrame(() => contentRef.current?.focus());
  };

  const openSourceUrl = () => {
    const url = form.url.trim();
    if (!url || !isSafeUrl(url)) {
      setUrlError('Use a full http(s) source URL.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const copyLocalPath = async () => {
    try {
      await navigator.clipboard?.writeText(localPathPreview);
      setStatusMessage('Local path copied');
    } catch {
      setStatusMessage(localPathPreview);
    }
  };

  const onDrop = async event => {
    event.preventDefault();
    const droppedUrl = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');
    if (droppedUrl) {
      if (isSafeUrl(droppedUrl)) {
        setForm(previous => ({ ...previous, url: droppedUrl }));
        setUrlError('');
      } else {
        setUrlError('Only http(s) URLs are accepted.');
      }
    }

    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    const importedPath = onImportFile ? await onImportFile(file) : null;
    const attachmentLine = importedPath ? `[${file.name}](${importedPath})` : file.name;
    setContentTab('Attachment');
    setForm(previous => ({
      ...previous,
      title: previous.title || file.name.replace(/\.[^.]+$/, ''),
      notes: previous.notes ? `${previous.notes}\nAttachment: ${attachmentLine}` : `Attachment: ${attachmentLine}`,
    }));
    setDirty(true);
    setStatusMessage('Attachment added');
  };

  const buildPayload = destination => {
    const status = STATUSES[type]?.[0] || 'captured';
    const sourceLine = form.url.trim() ? `Source: ${form.url.trim()}` : '';
    const body = [
      form.notes.trim(),
      sourceLine,
    ].filter(Boolean).join('\n\n');
    const projectValue = projectTarget?.id || '';
    const spaceValue = String(initialSpace || '').trim();
    const projectTags = projectTarget ? ['project', ...projectTarget.tags] : [];
    const safeForm = {
      title: form.title.trim() || defaultTitleFor(type),
      url: form.url.trim(),
      notes: body,
      tags: normalizeTags(projectTarget ? [...tags, ...projectTags] : tags),
      status,
      entry_date: today(),
      project: projectValue,
      space: spaceValue,
    };
    return {
      type,
      ...pickEntryFields(safeForm, type),
      tags: safeForm.tags,
      project: safeForm.project,
      space: safeForm.space,
      ...(projectTarget ? {
        project_title: projectTarget.title,
        project_path: projectTarget.path,
      } : {}),
    };
  };

  const saveEntry = async (destination = 'inbox', ignoreDuplicate = false) => {
    if (type === 'canvas' && onCreateCanvas) {
      await onCreateCanvas(form.title.trim() || 'New Canvas');
      onClose();
      return;
    }

    const url = form.url.trim();
    if (url && !isSafeUrl(url)) {
      setUrlError('URL must start with http:// or https://.');
      return;
    }
    if (!ignoreDuplicate && url && existingUrls?.has(url)) {
      setDupWarning(destination);
      return;
    }

    onAdd(buildPayload(destination));
  };

  const onFormKeyDown = event => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      saveEntry('inbox');
    }
  };

  const activeType = CAPTURE_TYPES.find(item => item.id === type) || CAPTURE_TYPES[0];
  const canSaveToProject = Boolean(projectTarget);
  const primarySaveLabel = type === 'raw' ? 'Save to Inbox' : `Create ${activeType.label}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="capture-modal-title"
      onClick={event => {
        if (event.target === event.currentTarget) tryClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 320,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        background: 'rgba(3, 7, 11, 0.72)',
      }}
    >
      <div
        onDrop={onDrop}
        onDragOver={event => event.preventDefault()}
        onKeyDown={onFormKeyDown}
        style={{
          width: 'min(968px, calc(100vw - 28px))',
          maxHeight: 'calc(100vh - 36px)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid rgba(118, 137, 160, 0.26)',
          borderRadius: 9,
          background: 'linear-gradient(180deg, #1d242c 0%, #171e25 48%, #151b21 100%)',
          color: 'var(--tx)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.035)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: 58,
            padding: '0 30px',
            borderBottom: '1px solid rgba(118, 137, 160, 0.16)',
          }}
        >
          <h2 id="capture-modal-title" style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: 0 }}>
            Capture / New Entry
          </h2>
          {dirty && (
            <span aria-live="polite" style={{ marginLeft: 12, fontSize: 11, color: 'var(--t3)', fontWeight: 700 }}>
              Unsaved
            </span>
          )}
          <button
            type="button"
            aria-label="Close capture"
            onClick={tryClose}
            style={{
              marginLeft: 'auto',
              border: 'none',
              background: 'transparent',
              color: 'var(--t2)',
              cursor: 'pointer',
              fontSize: 24,
              lineHeight: 1,
              fontFamily: 'var(--fn)',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '20px 32px 22px', minHeight: 0 }}>
          {!quickNote && (
            <>
              <div style={{ marginBottom: 12, color: 'var(--tx)', fontSize: 12, fontWeight: 700 }}>Choose entry type</div>
              <div
                role="radiogroup"
                aria-label="Entry type"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))',
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                {CAPTURE_TYPES.map(item => {
                  const selected = item.id === type;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseType(item.id)}
                      style={{
                        height: 96,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 9,
                        border: `1px solid ${selected ? item.accent : 'rgba(118, 137, 160, 0.19)'}`,
                        borderRadius: 8,
                        background: selected ? withAlpha(item.accent, 0.08) : 'rgba(14, 20, 27, 0.46)',
                        color: 'var(--tx)',
                        cursor: 'pointer',
                        fontFamily: 'var(--fn)',
                        fontSize: 13,
                        fontWeight: 750,
                        boxShadow: selected ? `0 0 0 1px ${withAlpha(item.accent, 0.16)} inset` : 'none',
                      }}
                    >
                      <img src={iconPath(item.asset)} alt="" aria-hidden="true" style={{ width: 27, height: 27 }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="capture-title" style={fieldLabelStyle()}>Title</label>
              <input
                ref={titleInputRef}
                id="capture-title"
                value={form.title}
                onChange={setField('title')}
                placeholder={defaultTitleFor(type)}
                style={inputStyle()}
              />
            </div>

            {!quickNote && (
              <div>
                <label htmlFor="capture-source-url" style={fieldLabelStyle()}>Source URL</label>
                <div style={{ display: 'flex' }}>
                  <input
                    id="capture-source-url"
                    value={form.url}
                    onChange={setField('url')}
                    aria-invalid={!!urlError}
                    style={inputStyle({ borderTopRightRadius: 0, borderBottomRightRadius: 0 })}
                  />
                  <button
                    type="button"
                    aria-label="Open source URL"
                    onClick={openSourceUrl}
                    style={{
                      width: 54,
                      border: '1px solid rgba(118, 137, 160, 0.22)',
                      borderLeft: 'none',
                      borderRadius: '0 7px 7px 0',
                      background: 'rgba(12, 17, 23, 0.46)',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={`${ASSET_ROOT}/actions/link-entry.svg`} alt="" aria-hidden="true" style={{ width: 20, height: 20 }} />
                  </button>
                </div>
                {urlError && <div role="alert" style={{ marginTop: 6, color: '#f87171', fontSize: 12 }}>{urlError}</div>}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(240px, 0.9fr)', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <label htmlFor="capture-tag-input" style={{ ...fieldLabelStyle(), margin: 0 }}>Tags</label>
                  {typeof suggestTagsFromText === 'function' && (
                    <button
                      type="button"
                      onClick={handleSuggestTags}
                      disabled={suggestingTags}
                      style={{
                        marginLeft: 'auto',
                        padding: '3px 9px',
                        fontSize: 11,
                        border: '1px dashed rgba(118, 137, 160, 0.42)',
                        borderRadius: 99,
                        background: 'transparent',
                        color: suggestingTags ? 'var(--t3)' : 'var(--ac)',
                        cursor: suggestingTags ? 'wait' : 'pointer',
                        fontFamily: 'var(--fn)',
                      }}
                    >
                      {suggestingTags ? 'Thinking…' : '✨ Suggest tags'}
                    </button>
                  )}
                </div>
                {suggestedTags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => applySuggestedTag(tag)}
                        style={{
                          padding: '3px 9px',
                          fontSize: 11,
                          border: '1px dashed rgba(96, 165, 250, 0.55)',
                          borderRadius: 99,
                          background: 'rgba(96, 165, 250, 0.10)',
                          color: 'var(--tx)',
                          cursor: 'pointer',
                          fontFamily: 'var(--fn)',
                        }}
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
                {tagSuggestNotice && (
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 6 }}>{tagSuggestNotice}</div>
                )}
                <div
                  style={{
                    minHeight: 44,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    flexWrap: 'wrap',
                    border: '1px solid rgba(118, 137, 160, 0.22)',
                    borderRadius: 7,
                    background: 'rgba(12, 17, 23, 0.46)',
                    padding: '6px 8px',
                  }}
                >
                  {tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove ${tag} tag`}
                      style={{
                        minHeight: 25,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        border: '1px solid rgba(118, 137, 160, 0.22)',
                        borderRadius: 7,
                        background: 'rgba(35, 45, 57, 0.76)',
                        color: 'var(--tx)',
                        fontSize: 12,
                        fontFamily: 'var(--fn)',
                        cursor: 'pointer',
                        padding: '0 9px',
                      }}
                    >
                      {tag} <span style={{ color: 'var(--t3)' }}>x</span>
                    </button>
                  ))}
                  <input
                    id="capture-tag-input"
                    value={tagDraft}
                    list="capture-tag-suggestions"
                    onChange={event => setTagDraft(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ',') {
                        event.preventDefault();
                        addTag(tagDraft);
                      }
                    }}
                    onBlur={() => addTag(tagDraft)}
                    aria-label="Add tag"
                    style={{
                      flex: '1 1 90px',
                      minWidth: 80,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      color: 'var(--tx)',
                      fontFamily: 'var(--fn)',
                      fontSize: 13,
                    }}
                  />
                  <datalist id="capture-tag-suggestions">
                    {tagSuggestions.map(tag => <option key={tag} value={tag} />)}
                  </datalist>
                  <button
                    type="button"
                    aria-label="Add suggested tag"
                    onClick={() => addTag(tagSuggestions.find(tag => !tags.includes(tag)))}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--t3)',
                      cursor: 'pointer',
                      fontFamily: 'var(--fn)',
                      fontSize: 15,
                    }}
                  >
                    ⌄
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="capture-template" style={fieldLabelStyle()}>Template</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <select
                    id="capture-template"
                    value={template}
                    onChange={event => {
                      setTemplate(event.target.value);
                      setDirty(true);
                    }}
                    style={inputStyle({ appearance: 'auto' })}
                  >
                    {Object.keys(TEMPLATE_OPTIONS).map(option => <option key={option}>{option}</option>)}
                  </select>
                  <button
                    type="button"
                    aria-label="Apply selected template"
                    onClick={applyTemplate}
                    style={{ ...modalButtonStyle('quiet'), width: 46, padding: 0 }}
                  >
                    <img src={`${ASSET_ROOT}/actions/apply-template.svg`} alt="" aria-hidden="true" style={{ width: 19, height: 19 }} />
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.82fr) minmax(300px, 1.18fr)', gap: 14 }}>
              <div>
                <label htmlFor="capture-folder" style={fieldLabelStyle()}>Vault bucket</label>
                <input
                  id="capture-folder"
                  value={bucketLabelFor(type)}
                  readOnly
                  style={inputStyle({ color: 'var(--t2)' })}
                />
              </div>

              <div>
                <label htmlFor="capture-local-path" style={fieldLabelStyle()}>Local path preview</label>
                <div style={{ display: 'flex' }}>
                  <input
                    id="capture-local-path"
                    value={localPathPreview}
                    readOnly
                    style={inputStyle({ borderTopRightRadius: 0, borderBottomRightRadius: 0, color: 'var(--t2)' })}
                  />
                  <button
                    type="button"
                    aria-label="Copy local path"
                    onClick={copyLocalPath}
                    style={{
                      width: 54,
                      border: '1px solid rgba(118, 137, 160, 0.22)',
                      borderLeft: 'none',
                      borderRadius: '0 7px 7px 0',
                      background: 'rgba(12, 17, 23, 0.46)',
                      cursor: 'pointer',
                    }}
                  >
                    <img src={`${ASSET_ROOT}/actions/copy-local-path.svg`} alt="" aria-hidden="true" style={{ width: 19, height: 19 }} />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div style={fieldLabelStyle({ marginBottom: 8 })}>Content capture</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {CONTENT_TABS.map(tab => {
                  const active = tab === contentTab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setContentTab(tab);
                        setDirty(true);
                      }}
                      style={{
                        minHeight: 35,
                        padding: '0 15px',
                        border: `1px solid ${active ? activeType.accent : 'rgba(118, 137, 160, 0.20)'}`,
                        borderRadius: 7,
                        background: active ? withAlpha(activeType.accent, 0.08) : 'rgba(14, 20, 27, 0.42)',
                        color: active ? '#dbeafe' : 'var(--t2)',
                        fontFamily: 'var(--fn)',
                        fontSize: 13,
                        fontWeight: active ? 750 : 650,
                        cursor: 'pointer',
                      }}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
              <textarea
                ref={contentRef}
                value={form.notes}
                onChange={setField('notes')}
                placeholder={
                  contentTab === 'Markdown' ? 'Start writing or paste your content...' :
                  contentTab === 'Link' ? 'Paste the key excerpt or link notes...' :
                  contentTab === 'Transcript' ? 'Paste or dictate the transcript...' :
                  contentTab === 'Attachment' ? 'Drop a file here or describe the attachment...' :
                  'Sketch the canvas idea, nodes, or relationships...'
                }
                style={inputStyle({
                  minHeight: 170,
                  resize: 'vertical',
                  lineHeight: 1.55,
                })}
              />
            </div>
          </div>

          {dupWarning && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid #f59e0b',
                borderRadius: 8,
                background: withAlpha('#f59e0b', 0.08),
                padding: '10px 12px',
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1 }}>That source URL is already in the vault.</span>
              <button type="button" onClick={() => setDupWarning(null)} style={modalButtonStyle('quiet')}>Dismiss</button>
              <button type="button" onClick={() => saveEntry(dupWarning, true)} style={modalButtonStyle('primary')}>Save anyway</button>
            </div>
          )}

          {confirmDiscard && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid #ef4444',
                borderRadius: 8,
                background: withAlpha('#ef4444', 0.08),
                padding: '10px 12px',
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1 }}>Discard this capture? Your changes will be lost.</span>
              <button type="button" onClick={() => setConfirmDiscard(false)} style={modalButtonStyle('quiet')}>Keep editing</button>
              <button type="button" onClick={onClose} style={modalButtonStyle('primary')}>Discard</button>
            </div>
          )}
        </div>

        <div
          style={{
            minHeight: 70,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 32px',
            borderTop: '1px solid rgba(118, 137, 160, 0.16)',
            background: 'rgba(14, 19, 25, 0.66)',
          }}
        >
          <button type="button" onClick={tryClose} style={modalButtonStyle('quiet')}>Cancel</button>
          <span aria-live="polite" style={{ marginLeft: 4, color: 'var(--t3)', fontSize: 12, flex: 1 }}>
            {statusMessage}
          </span>
          <button type="button" onClick={applyTemplate} style={modalButtonStyle('quiet')}>Apply Template</button>
          <button
            type="button"
            onClick={() => saveEntry('project')}
            disabled={!canSaveToProject}
            style={{
              ...modalButtonStyle('quiet'),
              opacity: canSaveToProject ? 1 : 0.45,
              cursor: canSaveToProject ? 'pointer' : 'not-allowed',
            }}
          >
            Save to Project
          </button>
          <button type="button" onClick={() => saveEntry('inbox')} style={modalButtonStyle('primary')}>{primarySaveLabel}</button>
        </div>
      </div>
    </div>
  );
}
