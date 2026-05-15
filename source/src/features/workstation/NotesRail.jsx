import { useMemo, useState } from 'react';
import { ICON, displayStatus } from '../../lib/types.js';
import { normalizeTags } from '../../lib/storage.js';
import { FRONTMATTER_EXTRAS_FIELD } from '../../lib/frontmatter.js';
import { buildVaultIndex, getBacklinks } from '../../lib/index/vaultIndex.js';

const tabButtonBase = {
  minHeight: 31,
  padding: '0 10px',
  borderRadius: 7,
  fontFamily: 'var(--fn)',
  fontSize: 12,
  fontWeight: 760,
  cursor: 'pointer',
};

const sectionStyle = {
  borderTop: '1px solid rgba(118,137,160,.16)',
  paddingTop: 16,
  marginTop: 16,
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '96px minmax(0,1fr)',
  gap: 10,
  alignItems: 'start',
  padding: '7px 0',
  borderBottom: '1px solid rgba(118,137,160,.12)',
  fontSize: 12,
};

const pillStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 24,
  border: '1px solid rgba(118,137,160,.18)',
  borderRadius: 999,
  background: 'rgba(255,255,255,.035)',
  color: 'var(--t2)',
  fontFamily: 'var(--fn)',
  fontSize: 12,
  padding: '0 8px',
};

const HIDDEN_PROPERTY_KEYS = new Set([
  'id',
  'type',
  'title',
  'notes',
  'tags',
  'links',
  'date',
  'created',
  'modified',
  '_path',
  'unresolvedTargets',
  FRONTMATTER_EXTRAS_FIELD,
  '_manualLinks',
]);

function tabStyle(active) {
  return {
    ...tabButtonBase,
    border: `1px solid ${active ? 'rgba(77,141,255,.56)' : 'rgba(118,137,160,.16)'}`,
    background: active ? 'rgba(77,141,255,.14)' : 'rgba(255,255,255,.025)',
    color: active ? '#dbeafe' : 'var(--t2)',
  };
}

function normalizeEntries(entry, entries) {
  const list = Array.isArray(entries) ? entries : [];
  if (!entry?.id || list.some(item => item?.id === entry.id)) return list;
  return [entry, ...list];
}

function fileMetaFor(path, fileMetaByPath) {
  if (!path || !fileMetaByPath) return null;
  if (fileMetaByPath instanceof Map) return fileMetaByPath.get(path) || null;
  return fileMetaByPath[path] || null;
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(value) {
  if (!value) return '';
  const parsed = typeof value === 'number' ? new Date(value) : new Date(String(value));
  if (Number.isNaN(parsed.valueOf())) return String(value);
  return parsed.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function displayFileSize(entry, meta) {
  if (meta?.size != null) return formatBytes(meta.size);
  if (entry?.file_size) return String(entry.file_size);
  if (entry?.size != null) return formatBytes(entry.size);
  return 'Unknown';
}

function formatPropertyValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (value == null || value === '') return '(empty)';
  return String(value);
}

function visibleProperties(entry) {
  if (!entry || typeof entry !== 'object') return [];
  const extras = entry[FRONTMATTER_EXTRAS_FIELD] && typeof entry[FRONTMATTER_EXTRAS_FIELD] === 'object'
    ? entry[FRONTMATTER_EXTRAS_FIELD]
    : {};
  const properties = {};
  for (const [key, value] of Object.entries(entry)) {
    if (HIDDEN_PROPERTY_KEYS.has(key) || key.startsWith('_')) continue;
    properties[key] = value;
  }
  for (const [key, value] of Object.entries(extras)) {
    if (HIDDEN_PROPERTY_KEYS.has(key) || key.startsWith('_')) continue;
    properties[key] = value;
  }
  return Object.entries(properties).sort(([a], [b]) => a.localeCompare(b));
}

function InfoRow({ label, children }) {
  return (
    <div style={rowStyle}>
      <span style={{ color: 'var(--t3)', fontWeight: 720 }}>{label}</span>
      <span style={{ color: 'var(--tx)', minWidth: 0, overflowWrap: 'anywhere' }}>{children}</span>
    </div>
  );
}

function EmptyState({ children }) {
  return <div style={{ color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }}>{children}</div>;
}

function RailButton({ children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: 36,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        border: '1px solid rgba(118,137,160,.16)',
        borderRadius: 7,
        background: 'rgba(255,255,255,.025)',
        color: 'var(--tx)',
        cursor: 'pointer',
        fontFamily: 'var(--fn)',
        fontSize: 12,
        textAlign: 'left',
        padding: '7px 9px',
      }}
    >
      {children}
    </button>
  );
}

export function NotesRail({
  entry,
  entries = [],
  fileMetaByPath,
  onOpenEntry,
  onNavigate,
  onUpdateEntry,
  onCreateFromMissing,
  onRevealEntry,
}) {
  const [activeTab, setActiveTab] = useState('info');
  const [tagDraft, setTagDraft] = useState('');
  const [message, setMessage] = useState('');
  const indexEntries = useMemo(() => normalizeEntries(entry, entries), [entry, entries]);
  const index = useMemo(() => buildVaultIndex(indexEntries), [indexEntries]);
  const resolvedEntry = entry?.id ? (index.byId.get(entry.id) || entry) : null;
  const backlinks = resolvedEntry?.id ? getBacklinks(index, resolvedEntry.id) : [];
  const unresolved = Array.isArray(resolvedEntry?.unresolvedTargets) ? resolvedEntry.unresolvedTargets : [];
  const tags = Array.isArray(resolvedEntry?.tags) ? resolvedEntry.tags : [];
  const properties = visibleProperties(resolvedEntry);
  const meta = fileMetaFor(resolvedEntry?._path, fileMetaByPath);

  if (!resolvedEntry) {
    return (
      <aside aria-label="Note details" style={{ color: 'var(--t3)', fontSize: 13 }}>
        Select a note to see metadata.
      </aside>
    );
  }

  const copyText = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard?.writeText(value);
      setMessage(`${label} copied`);
    } catch {
      setMessage(String(value));
    }
  };

  const addTag = () => {
    const next = normalizeTags([...tags, tagDraft]);
    setTagDraft('');
    if (next.join('\n') === tags.join('\n')) return;
    onUpdateEntry?.(resolvedEntry.id, { tags: next });
  };

  const tabs = [
    ['info', 'Info'],
    ['backlinks', `Backlinks ${backlinks.length}`],
    ['unresolved', `Unresolved ${unresolved.length}`],
    ['tags', `Tags ${tags.length}`],
    ['properties', 'Properties'],
  ];

  return (
    <aside aria-label="Note details" style={{ width: '100%', color: 'var(--tx)' }}>
      <div style={{ display: 'flex', alignItems: 'start', gap: 12 }}>
        <span aria-hidden="true" style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', border: '1px solid rgba(118,137,160,.18)', borderRadius: 7, background: 'rgba(255,255,255,.035)' }}>{ICON[resolvedEntry.type] || ICON.note}</span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: 18, fontWeight: 840, lineHeight: 1.25 }}>{resolvedEntry.title || 'Untitled note'}</h2>
          <span style={{ display: 'block', marginTop: 6, color: 'var(--t3)', fontSize: 12 }}>{resolvedEntry._path || 'Not saved to vault yet'}</span>
        </span>
      </div>

      <div role="tablist" aria-label="Note detail sections" style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 18 }}>
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={activeTab === id} onClick={() => setActiveTab(id)} style={tabStyle(activeTab === id)}>
            {label}
          </button>
        ))}
      </div>

      <section style={sectionStyle}>
        {activeTab === 'info' && (
          <>
            <InfoRow label="Local path">{resolvedEntry._path || 'Not saved to vault yet'}</InfoRow>
            <InfoRow label="File size">{displayFileSize(resolvedEntry, meta)}</InfoRow>
            <InfoRow label="Modified">{formatDateTime(meta?.mtime || resolvedEntry.modified) || 'Unknown'}</InfoRow>
            <InfoRow label="Created">{formatDateTime(resolvedEntry.created || resolvedEntry.date || resolvedEntry.entry_date) || 'Unknown'}</InfoRow>
            <InfoRow label="Status">{displayStatus(resolvedEntry.status) || 'None'}</InfoRow>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button type="button" onClick={() => copyText(resolvedEntry._path, 'Local path')} style={pillStyle}>Copy path</button>
              {onRevealEntry && <button type="button" onClick={() => onRevealEntry(resolvedEntry)} style={pillStyle}>Reveal in Vault</button>}
            </div>
            {message && <div aria-live="polite" style={{ color: 'var(--t3)', fontSize: 12, marginTop: 10 }}>{message}</div>}
          </>
        )}

        {activeTab === 'backlinks' && (
          <div style={{ display: 'grid', gap: 7 }}>
            {backlinks.length ? backlinks.map(item => (
              <RailButton key={item.id} ariaLabel={`Open backlink ${item.title || 'Untitled'}`} onClick={() => onOpenEntry?.(item.id)}>
                <span aria-hidden="true">{ICON[item.type] || ICON.note}</span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || 'Untitled'}</span>
              </RailButton>
            )) : <EmptyState>No backlinks yet.</EmptyState>}
          </div>
        )}

        {activeTab === 'unresolved' && (
          <div style={{ display: 'grid', gap: 7 }}>
            {unresolved.length ? unresolved.map(item => (
              <div key={`${item.target}-${item.line || ''}`} style={{ border: '1px dashed rgba(245,158,11,.42)', borderRadius: 7, padding: '8px 9px', color: 'var(--t2)', fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span aria-hidden="true" style={{ color: '#f59e0b' }}>?</span>
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.target || item}</span>
                  {onCreateFromMissing && <button type="button" aria-label={`Create note for ${item.target || item}`} onClick={() => onCreateFromMissing(item.target || item)} style={{ ...pillStyle, cursor: 'pointer' }}>Create</button>}
                </div>
                {item.line && <div style={{ marginTop: 5, color: 'var(--t3)' }}>Line {item.line}</div>}
              </div>
            )) : <EmptyState>No unresolved links.</EmptyState>}
          </div>
        )}

        {activeTab === 'tags' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {tags.length ? tags.map(tag => (
                <button key={tag} type="button" aria-label={`Open tag ${tag}`} onClick={() => onNavigate?.(`tag:${tag}`)} style={{ ...pillStyle, cursor: 'pointer' }}>#{tag}</button>
              )) : <EmptyState>No tags yet.</EmptyState>}
            </div>
            <div style={{ display: 'flex', gap: 7, marginTop: 13 }}>
              <input
                aria-label="New tag"
                value={tagDraft}
                onChange={event => setTagDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag"
                style={{ flex: 1, minWidth: 0, minHeight: 34, border: '1px solid var(--br)', borderRadius: 7, background: 'rgba(255,255,255,.025)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 12, padding: '0 10px' }}
              />
              <button type="button" onClick={addTag} style={{ ...pillStyle, cursor: 'pointer' }}>Add tag</button>
            </div>
          </div>
        )}

        {activeTab === 'properties' && (
          <div aria-label="Note properties" style={{ display: 'grid', gap: 0 }}>
            {properties.length ? properties.map(([key, value]) => (
              <InfoRow key={key} label={key}>{formatPropertyValue(value)}</InfoRow>
            )) : <EmptyState>No extra properties.</EmptyState>}
          </div>
        )}
      </section>
    </aside>
  );
}
