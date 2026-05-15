import { useEffect, useMemo, useState } from 'react';
import { ICON, displayStatus } from '../../lib/types.js';
import { buildVaultIndex, getBacklinks } from '../../lib/index/vaultIndex.js';
import { normalizeTags } from '../../lib/storage.js';
import { NotesRail } from './NotesRail.jsx';

const pageStyle = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
  padding: 18,
  background: 'var(--bg)',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 16,
  flexWrap: 'wrap',
};

const titleStyle = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  color: 'var(--tx)',
};

const subStyle = {
  fontSize: 12,
  color: 'var(--t3)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))',
  gap: 12,
};

const cardStyle = {
  background: 'var(--b1)',
  border: '1px solid var(--br)',
  borderRadius: 'var(--rd)',
  padding: 12,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.025)',
};

const rowButtonStyle = {
  width: '100%',
  border: '1px solid var(--br)',
  background: 'var(--b1)',
  color: 'var(--tx)',
  borderRadius: 'var(--rd)',
  padding: '10px 12px',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 44,
};

const pillStyle = {
  fontSize: 11,
  lineHeight: 1,
  border: '1px solid var(--br)',
  color: 'var(--t2)',
  background: 'var(--b2)',
  borderRadius: 999,
  padding: '4px 7px',
  whiteSpace: 'nowrap',
};

function PanelShell({ title, count, action, children }) {
  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{title}</h2>
        {count != null && <span style={subStyle}>{count} item{count === 1 ? '' : 's'}</span>}
        <div style={{ marginLeft: 'auto' }}>{action}</div>
      </div>
      {children}
    </div>
  );
}

function SmallButton({ children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        border: '1px solid var(--br)',
        background: 'var(--b2)',
        color: 'var(--tx)',
        borderRadius: 'var(--rd)',
        padding: '7px 10px',
        fontFamily: 'var(--fn)',
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}>
      {children}
    </button>
  );
}

function TextActionButton({ children, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        border: 'none',
        background: 'transparent',
        color: 'var(--t3)',
        padding: 0,
        fontFamily: 'var(--fn)',
        fontSize: 12,
        fontWeight: 500,
        cursor: 'pointer',
      }}>
      {children}
    </button>
  );
}

function EmptyStateCard({ title, detail, action }) {
  return (
    <div style={{ ...cardStyle, borderStyle: 'dashed', padding: 18, color: 'var(--t2)' }}>
      <div style={{ fontSize: 14, fontWeight: 850, color: 'var(--tx)', marginBottom: 6 }}>{title}</div>
      {detail && <div style={{ fontSize: 13, lineHeight: 1.5, maxWidth: 560 }}>{detail}</div>}
      {action && <div style={{ marginTop: 12 }}>{action}</div>}
    </div>
  );
}

function SegmentedControl({ label, value, options, onChange }) {
  return (
    <div aria-label={label} role="group" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange?.(option.value)}
            style={{
              border: '1px solid var(--br)',
              background: selected ? 'var(--ac)' : 'var(--b2)',
              color: selected ? 'white' : 'var(--t2)',
              borderRadius: 999,
              padding: '6px 10px',
              fontFamily: 'var(--fn)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 22, fontWeight: 850, color: 'var(--tx)' }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>{label}</div>
    </div>
  );
}

function Section({ title, action, children, empty = 'Nothing here right now.' }) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : !!children;
  return (
    <section style={{ ...cardStyle, minHeight: 96 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--tx)' }}>{title}</h3>
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {hasChildren ? children : <div style={{ fontSize: 12, color: 'var(--t3)' }}>{empty}</div>}
    </section>
  );
}

function RailPlainSection({ title, action, children, empty = 'Nothing here right now.' }) {
  const hasChildren = Array.isArray(children) ? children.some(Boolean) : !!children;
  return (
    <section data-rail-variant="plain" style={{ minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '0 2px' }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--tx)' }}>{title}</h3>
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {hasChildren ? children : <div style={{ fontSize: 12, color: 'var(--t3)', padding: '2px' }}>{empty}</div>}
    </section>
  );
}

function FadedRailCard({ title, children }) {
  const sideFade = 'linear-gradient(to top, rgba(255,255,255,.30) 0%, rgba(255,255,255,.30) 24%, rgba(255,255,255,.13) 62%, rgba(255,255,255,.035) 100%)';
  return (
    <section
      data-rail-variant="faded-today"
      style={{
        ...cardStyle,
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.025))',
      }}>
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,.14), rgba(255,255,255,.30) 50%, rgba(255,255,255,.14))' }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: '100%', background: sideFade }} />
      <span aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 0, width: 1, height: '100%', background: sideFade }} />
      <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.075) 50%, transparent)' }} />
      <div style={{ position: 'relative' }}>
        <h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800, color: 'var(--tx)' }}>{title}</h3>
        {children}
      </div>
    </section>
  );
}

function EntryButton({ entry, onOpenEntry, meta }) {
  if (!entry) return null;
  const icon = ICON[entry.type] || '□';
  const metaParts = Array.isArray(meta) ? meta.filter(Boolean) : [];
  return (
    <button
      type="button"
      aria-label={`Open ${entry.title || 'entry'}`}
      onClick={() => onOpenEntry?.(entry.id)}
      style={{ ...rowButtonStyle, marginBottom: 8 }}>
      <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }}>{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title || 'Untitled'}</span>
        {metaParts.length > 0 ? (
          <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
            {metaParts.map(part => <span key={part} style={pillStyle}>{part}</span>)}
          </span>
        ) : meta && <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>}
      </span>
    </button>
  );
}

function RailEntryRow({ entry, onOpenEntry, meta }) {
  if (!entry) return null;
  const icon = ICON[entry.type] || '□';
  const metaParts = Array.isArray(meta) ? meta.filter(Boolean) : [];
  return (
    <button
      type="button"
      data-rail-row="divider"
      aria-label={`Open ${entry.title || 'entry'}`}
      onClick={() => onOpenEntry?.(entry.id)}
      style={{
        width: '100%',
        border: 'none',
        borderTop: '1px solid rgba(255,255,255,.08)',
        background: 'transparent',
        color: 'var(--tx)',
        padding: '12px 2px',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'var(--fn)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        minHeight: 56,
      }}>
      <span aria-hidden="true" style={{ width: 20, flexShrink: 0, textAlign: 'center' }}>{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 760, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title || 'Untitled'}</span>
        {metaParts.length > 0 ? (
          <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
            {metaParts.map(part => <span key={part} style={pillStyle}>{part}</span>)}
          </span>
        ) : meta && <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meta}</span>}
      </span>
    </button>
  );
}

function Tags({ values = [] }) {
  return values.length ? (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {values.slice(0, 5).map(value => <span key={value} style={pillStyle}>#{value}</span>)}
    </div>
  ) : null;
}

function textMatch(value, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return String(value || '').toLowerCase().includes(q);
}

function entryDate(entry, prefer) {
  if (prefer === 'modified') {
    return entry?.modified?.slice?.(0, 10) || entry?.updated?.slice?.(0, 10) || entry?.entry_date || entry?.date?.slice?.(0, 10) || '';
  }
  return entry?.entry_date || entry?.date?.slice?.(0, 10) || entry?.modified?.slice?.(0, 10) || '';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function isOverdue(row) {
  // overdue = open task with due date earlier than today
  if (!row?.entry || row.entry.completed) return false;
  const due = row.entry.due ? String(row.entry.due).slice(0, 10) : '';
  return Boolean(due) && due < todayISO();
}

function startOfWeekISO(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // Monday-start
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

function withinThisWeek(target) {
  // target can be a row (with .entry) or an entry
  const entry = target?.entry || target;
  const stamps = [entry?.modified, entry?.completed_at, entry?.date, entry?.entry_date, entry?.updated];
  const stamp = stamps.find(Boolean);
  if (!stamp) return false;
  const day = String(stamp).slice(0, 10);
  return day >= startOfWeekISO() && day <= todayISO();
}

function wordCount(text) {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

function formatRelativeTime(stamp) {
  if (!stamp) return '';
  const parsed = typeof stamp === 'number' ? new Date(stamp) : new Date(stamp);
  if (Number.isNaN(parsed.valueOf())) return '';
  const diff = Date.now() - parsed.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return parsed.toISOString().slice(0, 10);
}

function entryStamp(entry) {
  const raw = entry?.date || entry?.captured_at || entry?.capturedAt || entry?.entry_date || entry?.modified || entry?.updated;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.valueOf()) ? parsed : null;
}

function entryTimestamp(entry) {
  return entryStamp(entry)?.getTime() || 0;
}

function captureDayLabel(entry) {
  const stamp = entryStamp(entry);
  if (!stamp) return 'No date';
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  const entryKey = stamp.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (entryKey === todayKey) return 'Today';
  if (entryKey === yesterday.toISOString().slice(0, 10)) return 'Yesterday';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(stamp);
}

function captureTimeLabel(entry) {
  const stamp = entryStamp(entry);
  return stamp ? new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(stamp) : '';
}

function hostFromUrl(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function lowerCaptureText(entry) {
  return [
    entry?.title,
    entry?.notes,
    entry?.source,
    entry?.source_app,
    entry?.source_name,
    entry?.source_type,
    entry?.mime,
    entry?.url,
    entry?.source_url,
    entry?._path,
  ].filter(Boolean).join(' ').toLowerCase();
}

function captureHasFile(entry) {
  const text = lowerCaptureText(entry);
  return Boolean(entry?.attachment || entry?.file || entry?.file_name || entry?.filename || entry?.mime || /\.(png|jpe?g|gif|webp|pdf|mp3|m4a|wav|mov|mp4)$/i.test(entry?._path || '') || /screenshot|image|audio|voice|pdf|file|clip/.test(text));
}

function captureHasLink(entry) {
  return Boolean(entry?.url || entry?.source_url || /https?:\/\//i.test(String(entry?.notes || '')));
}

function captureIsMedia(entry) {
  const text = lowerCaptureText(entry);
  return /audio|voice|podcast|image|screenshot|video|media|mp3|m4a|wav|png|jpg|jpeg|mov|mp4/.test(text);
}

function captureKind(entry) {
  const text = lowerCaptureText(entry);
  if (/audio|voice|podcast|mp3|m4a|wav/.test(text)) return 'audio';
  if (/screenshot|image|png|jpg|jpeg|webp/.test(text)) return 'image';
  if (/article|readwise|highlight|web clipping|producthunt|medium|url|link|https?:/.test(text) || captureHasLink(entry)) return 'article';
  if (/clip|clipboard|web clip/.test(text)) return 'clip';
  return 'entry';
}

function captureSource(entry) {
  const host = hostFromUrl(entry?.source_url || entry?.url);
  const source = entry?.source || entry?.source_app || entry?.source_name || entry?.source_type || host || inferSourceName(entry);
  const meta = [
    entry?.duration,
    entry?.file_size || entry?.size,
    entry?.mime,
    entry?.source_detail,
    host && source !== host ? host : '',
  ].filter(Boolean).join(' · ');
  return { source, meta };
}

function inferSourceName(entry) {
  const kind = captureKind(entry);
  if (kind === 'audio') return 'Voice Memos';
  if (kind === 'image') return 'macOS Screenshot';
  if (kind === 'article') return 'Web Clipper';
  if (kind === 'clip') return 'Clipboard';
  return 'Quick Capture';
}

function captureIcon(entry) {
  const kind = captureKind(entry);
  if (kind === 'audio') return { glyph: '≋', label: 'AUDIO', color: '#a855f7', bg: 'rgba(168,85,247,.16)' };
  if (kind === 'image') return { glyph: '▧', label: 'IMAGE', color: '#4d8dff', bg: 'rgba(77,141,255,.15)' };
  if (kind === 'article') return { glyph: 'P', label: 'ARTICLE', color: '#f97316', bg: 'rgba(249,115,22,.18)' };
  if (kind === 'clip') return { glyph: '▤', label: 'CLIP', color: '#facc15', bg: 'rgba(250,204,21,.14)' };
  return { glyph: '◇', label: 'ENTRY', color: '#9aa7b8', bg: 'rgba(154,167,184,.12)' };
}

function tagTone(tag) {
  const key = String(tag || '').toLowerCase();
  if (key.includes('research')) return { color: '#52d273', bg: 'rgba(82,210,115,.13)' };
  if (key.includes('design') || key.includes('ui')) return { color: '#6ea8ff', bg: 'rgba(110,168,255,.13)' };
  if (key.includes('product')) return { color: '#a78bfa', bg: 'rgba(167,139,250,.13)' };
  if (key.includes('strategy') || key.includes('planning')) return { color: '#c2a8ff', bg: 'rgba(194,168,255,.12)' };
  if (key.includes('urgent') || key.includes('risk')) return { color: '#ff7b72', bg: 'rgba(255,123,114,.12)' };
  return { color: 'var(--t2)', bg: 'rgba(255,255,255,.055)' };
}

function taskState(row) {
  return row?.dueState || (row?.entry?.completed ? 'done' : row?.entry?.due ? 'upcoming' : 'unscheduled');
}

const captureKinds = [
  { id: 'note', label: 'Note', description: 'Write down a thought or idea', icon: '▣', type: 'note', category: 'notes' },
  { id: 'task', label: 'Task', description: 'Capture an action or to-do', icon: '✓', type: 'task', category: 'tasks' },
  { id: 'screenshot', label: 'Screenshot', description: 'Capture and annotate', icon: '□', type: 'raw', category: 'screenshots' },
  { id: 'voice', label: 'Voice Note', description: 'Record a quick voice note', icon: '≋', type: 'raw', category: 'voice' },
  { id: 'web', label: 'Web Clip', description: 'Save a link or article', icon: '◎', type: 'link', category: 'links' },
];

const captureFilterOptions = [
  ['all', 'All Captures', ''],
  ['notes', 'Notes', '▣'],
  ['tasks', 'Tasks', '✓'],
  ['links', 'Links', '⌁'],
  ['voice', 'Voice', '≋'],
  ['screenshots', 'Screenshots', '□'],
];

function formatCommandCenterDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

const focusModes = {
  'deep-work': {
    label: 'Deep Work',
    accent: '#4d8dff',
    dot: '#38d06b',
    intro: 'Deep Work focus is active. Let’s build something meaningful.',
  },
  planning: {
    label: 'Planning',
    accent: '#a855f7',
    dot: '#a855f7',
    intro: 'Planning mode: Map the path forward. Set priorities and break down your work.',
  },
  capture: {
    label: 'Capture',
    accent: '#a855f7',
    dot: '#a855f7',
    intro: 'Capture mode: Quick capture anything. We’ll help you organize it later.',
  },
  review: {
    label: 'Review',
    accent: '#4d8dff',
    dot: '#4d8dff',
    intro: 'Review mode: Reflect on progress. Close loops and plan what’s next.',
  },
};

function resolveFocusMode(mode) {
  return focusModes[mode] ? mode : 'deep-work';
}

function focusIntroParts(modeKey, mode) {
  if (modeKey === 'deep-work') {
    return { lead: mode.label, rest: mode.intro.replace(`${mode.label} `, '') };
  }
  return { lead: `${mode.label} mode:`, rest: mode.intro.replace(`${mode.label} mode: `, '') };
}

const commandCenterStateKey = 'jf-command-center-mode-state';

const commandCenterDefaults = {
  deepWork: {
    activeTab: 'Deep Work Hub',
    sessionGoals: [
      { label: 'Refine core principle statements', done: true },
      { label: 'Map principles to user outcomes', done: true },
      { label: 'Draft practical applications', done: false },
      { label: 'Review with team', done: false },
    ],
    lastAction: '',
  },
  planning: {
    priorities: [
      { label: 'Review PRD draft', done: true },
      { label: 'Design walkthrough', done: true },
      { label: 'Metrics review', done: false },
      { label: 'Update roadmap', done: false },
    ],
    selectedTimeBlock: 'Mon 11',
    lastAction: '',
  },
  capture: {
    routedItems: [],
    selectedRoute: '',
    quickKind: 'note',
    draft: '',
    filter: 'all',
    capturedRows: [],
    lastAction: '',
  },
  review: {
    reflection: {
      wentWell: ['PRD draft completed and reviewed', 'User interviews provided strong insights', 'Design system audit is on track'],
      improve: ['Design walkthrough was delayed', 'Metrics review needs deeper analysis', 'Update roadmap is still pending'],
      next: ['Finalize PRD and share', 'Prepare for design walkthrough', 'Deep dive into metrics'],
    },
    goals: [
      { title: 'Launch JotFolio 2.0', value: 68, meta: 'May 30' },
      { title: 'Improve user research process', value: 50, meta: 'Jun 15' },
      { title: 'Build AI onboarding flow', value: 80, meta: 'May 25' },
      { title: 'Design system v2', value: 30, meta: 'Jun 10' },
    ],
    lastAction: '',
  },
};

function mergeCommandCenterState(saved = {}) {
  return {
    deepWork: { ...commandCenterDefaults.deepWork, ...(saved.deepWork || {}) },
    planning: { ...commandCenterDefaults.planning, ...(saved.planning || {}) },
    capture: { ...commandCenterDefaults.capture, ...(saved.capture || {}) },
    review: {
      ...commandCenterDefaults.review,
      ...(saved.review || {}),
      reflection: {
        ...commandCenterDefaults.review.reflection,
        ...(saved.review?.reflection || {}),
      },
    },
  };
}

function readCommandCenterState() {
  if (typeof window === 'undefined') return commandCenterDefaults;
  try {
    const raw = window.localStorage?.getItem(commandCenterStateKey);
    return raw ? mergeCommandCenterState(JSON.parse(raw)) : commandCenterDefaults;
  } catch {
    return commandCenterDefaults;
  }
}

function useCommandCenterModeState() {
  const [state, setState] = useState(readCommandCenterState);
  useEffect(() => {
    try {
      window.localStorage?.setItem(commandCenterStateKey, JSON.stringify(state));
    } catch {
      /* local persistence is optional */
    }
  }, [state]);
  const updateMode = (mode, updater) => {
    setState(prev => {
      const current = prev[mode] || {};
      const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
      return { ...prev, [mode]: next };
    });
  };
  return [state, updateMode];
}

export function CommandCenterView({ model = {}, userName = 'Gavin', focusMode = 'deep-work', onFocusModeChange, onNavigate, onAdd, onQuickCapture, onOpenEntry }) {
  const [localFocusMode, setLocalFocusMode] = useState(focusMode);
  const modeKey = resolveFocusMode(onFocusModeChange ? focusMode : localFocusMode);
  const mode = focusModes[modeKey];
  const intro = focusIntroParts(modeKey, mode);
  const [modeState, updateModeState] = useCommandCenterModeState();
  const handleFocusModeChange = value => {
    setLocalFocusMode(value);
    onFocusModeChange?.(value);
  };
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const shiftDate = days => {
    setSelectedDate(current => {
      const next = new Date(current);
      next.setDate(next.getDate() + days);
      return next;
    });
  };

  return (
    <div style={{ ...pageStyle, padding: '30px 32px 36px', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 26, paddingBottom: 22, borderBottom: '1px solid var(--br)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.14, fontWeight: 760, letterSpacing: 0, color: 'var(--tx)' }}>
            Good morning, {userName}
          </h1>
          <div style={{ marginTop: 9, fontSize: 14, fontWeight: 400, color: 'var(--t2)' }}>
            <strong style={{ color: mode.accent, fontWeight: 800 }}>{intro.lead}</strong> {intro.rest}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, color: 'var(--t2)', fontSize: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" aria-label="Previous day" onClick={() => shiftDate(-1)} style={dateStepButtonStyle()}>‹</button>
            <span style={{ minWidth: 112, textAlign: 'center', color: 'var(--tx)' }}>{formatCommandCenterDate(selectedDate)}</span>
            <button type="button" aria-label="Next day" onClick={() => shiftDate(1)} style={dateStepButtonStyle()}>›</button>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: mode.dot, boxShadow: `0 0 0 3px ${mode.dot}22` }} />
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Focus mode</span>
            <select aria-label="Focus mode" value={modeKey} onChange={event => handleFocusModeChange(event.target.value)} style={{ height: 30, border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'var(--b1)', color: 'var(--t2)', fontFamily: 'var(--fn)', fontSize: 12, padding: '0 8px', outline: 'none' }}>
              <option value="deep-work">Focus: Deep Work</option>
              <option value="planning">Focus: Planning</option>
              <option value="capture">Focus: Capture</option>
              <option value="review">Focus: Review</option>
            </select>
          </label>
        </div>
      </div>

      {modeKey === 'planning' && <PlanningCommandCenter accent={mode.accent} state={modeState.planning} model={model} onStateChange={updater => updateModeState('planning', updater)} onModeChange={handleFocusModeChange} onNavigate={onNavigate} onAdd={onAdd} onOpenEntry={onOpenEntry} />}
      {modeKey === 'capture' && <CaptureCommandCenter accent={mode.accent} state={modeState.capture} recentCaptures={model.recentCaptures || []} onStateChange={updater => updateModeState('capture', updater)} onNavigate={onNavigate} onAdd={onAdd} onQuickCapture={onQuickCapture} onOpenEntry={onOpenEntry} />}
      {modeKey === 'review' && <ReviewCommandCenter accent={mode.accent} state={modeState.review} model={model} onStateChange={updater => updateModeState('review', updater)} onNavigate={onNavigate} onAdd={onAdd} onOpenEntry={onOpenEntry} />}
      {modeKey === 'deep-work' && <DeepWorkCommandCenter accent={mode.accent} state={modeState.deepWork} model={model} onStateChange={updater => updateModeState('deepWork', updater)} onNavigate={onNavigate} onAdd={onAdd} onOpenEntry={onOpenEntry} />}
    </div>
  );
}

function OverviewMetricCard({ icon, label, value, detail, color }) {
  return (
    <div style={{ ...cardStyle, minHeight: 92, display: 'grid', gridTemplateColumns: '36px 1fr', gap: 12, alignItems: 'center' }}>
      <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 99, display: 'grid', placeItems: 'center', color, background: `${color}22`, boxShadow: `0 0 0 1px ${color}33 inset`, fontWeight: 850 }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--t2)', fontSize: 12, marginBottom: 5 }}>{label}</span>
        <span style={{ display: 'block', color: 'var(--tx)', fontSize: 24, lineHeight: 1, fontWeight: 760 }}>{value}</span>
        {detail && <span style={{ display: 'block', color, fontSize: 11, marginTop: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail}</span>}
      </span>
    </div>
  );
}

function ModeActionTiles({ actions, onNavigate, onAdd }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(actions.length, 5)},minmax(0,1fr))`, gap: 10 }}>
      {actions.map(action => (
        <button key={action.label} type="button" aria-label={action.label} onClick={() => action.onClick ? action.onClick() : action.section ? onNavigate?.(action.section) : onAdd?.(action.type)} style={{ ...cardStyle, minHeight: 64, cursor: 'pointer', color: 'var(--tx)', fontFamily: 'var(--fn)', fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span aria-hidden="true" style={{ color: action.color, fontSize: 18 }}>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}

function MiniProgressRow({ title, value, color = 'var(--ac)', meta }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 40px 100px', gap: 10, alignItems: 'center', padding: '7px 0' }}>
      <span style={{ color: 'var(--tx)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
      <span style={{ color: 'var(--t2)', fontSize: 12, textAlign: 'right' }}>{value}%</span>
      <ProgressLine value={value} compact color={color} />
      {meta && <span style={{ gridColumn: '1 / -1', color: 'var(--t3)', fontSize: 11 }}>{meta}</span>}
    </div>
  );
}

function DeepWorkCommandCenter({ accent, state, model = {}, onStateChange, onNavigate, onAdd, onOpenEntry }) {
  const activeTab = state?.activeTab || 'Deep Work Hub';
  const goals = state?.sessionGoals || commandCenterDefaults.deepWork.sessionGoals;
  const toggleGoal = index => onStateChange(current => ({
    ...current,
    sessionGoals: goals.map((goal, goalIndex) => goalIndex === index ? { ...goal, done: !goal.done } : goal),
    lastAction: 'Session goals updated',
  }));

  // Live deep-work data
  const recentEntries = Array.isArray(model.recentEntries) ? model.recentEntries : [];
  const projectRowsModel = Array.isArray(model.projectRows) ? model.projectRows : [];

  // Pinned = starred entries, by recency (top 4)
  const allEntries = recentEntries.concat(projectRowsModel.map(row => row.entry).filter(Boolean));
  const seenIds = new Set();
  const pinnedEntries = allEntries
    .filter(entry => entry?.starred)
    .filter(entry => {
      if (seenIds.has(entry.id)) return false;
      seenIds.add(entry.id);
      return true;
    })
    .sort((a, b) => entryTimestamp(b) - entryTimestamp(a))
    .slice(0, 4);

  // Current focus = most-recently-modified note
  const focusEntry = recentEntries
    .filter(entry => entry.type === 'note')
    .sort((a, b) => entryTimestamp(b) - entryTimestamp(a))[0] || null;

  // Build a vault index for backlinks if we have entries
  const vaultIndex = useMemo(() => recentEntries.length ? buildVaultIndex(recentEntries) : null, [recentEntries]);
  const focusBacklinks = focusEntry && vaultIndex ? getBacklinks(vaultIndex, focusEntry.id).slice(0, 3) : [];
  const focusUnresolvedRaw = focusEntry?.unresolvedLinks || focusEntry?.unresolvedTargets || [];
  // Normalize: both strings and { target, line } shapes show up depending on source.
  const focusUnresolved = (Array.isArray(focusUnresolvedRaw) ? focusUnresolvedRaw : [])
    .map(item => (typeof item === 'string' ? item : item?.target || item?.label || ''))
    .filter(Boolean)
    .slice(0, 3);
  const focusRelatedMemory = focusEntry
    ? recentEntries
        .filter(entry => (entry.type === 'wiki' || entry.type === 'review') && Array.isArray(entry.links) && entry.links.includes(focusEntry.id))
        .slice(0, 3)
    : [];

  const wordsInFocus = focusEntry ? wordCount(focusEntry.notes || focusEntry.body || focusEntry.content) : 0;
  const focusPrimaryTag = (focusEntry?.tags || [])[0];

  const activeProjectsDW = projectRowsModel.filter(row => row.entry?.status !== 'archived' && row.entry?.status !== 'done');

  const openEntryOrFallback = (entry, fallback) => {
    if (entry?.id && onOpenEntry) onOpenEntry(entry.id);
    else if (fallback) onNavigate?.(fallback);
  };

  return (
    <>
      <SectionHeader title="Pinned" action={<TextActionButton ariaLabel="Open pinned entries" onClick={() => onNavigate?.('starred')}>View all pinned</TextActionButton>} />
      {pinnedEntries.length === 0 ? (
        <div style={{ marginBottom: 24, padding: '14px 16px', border: '1px dashed var(--br)', borderRadius: 'var(--rd)', color: 'var(--t3)', fontSize: 13 }}>
          Star entries to pin them to your Deep Work hub.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 16, marginBottom: 24 }}>
          {pinnedEntries.map(entry => {
            const isProject = entry.type === 'project';
            const matchingRow = projectRowsModel.find(row => row.entry?.id === entry.id);
            const progress = isProject ? Math.round(matchingRow?.progress || 0) : null;
            const desc = entry.notes || entry.summary || entry.body || '';
            const card = {
              type: isProject ? 'Project' : entry.type === 'note' ? 'Note' : (entry.type ? entry.type.charAt(0).toUpperCase() + entry.type.slice(1) : 'Entry'),
              title: entry.title || 'Untitled',
              description: typeof desc === 'string' ? desc.slice(0, 96) : '',
              progress,
              color: accent,
              time: formatRelativeTime(entry.modified || entry.date || entry.entry_date),
            };
            return <ReferencePinnedCard key={entry.id} card={card} onOpen={() => openEntryOrFallback(entry, isProject ? 'projects' : 'note')} />;
          })}
        </div>
      )}
      <ModeTabs active={activeTab} items={['Deep Work Hub', 'Active Projects', 'Backlinks', 'Smart Views']} accent={accent} onSelect={tab => onStateChange({ activeTab: tab, lastAction: `Opened ${tab}` })} />
      {activeTab === 'Deep Work Hub' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginTop: 14 }}>
            <section style={{ ...cardStyle, padding: 18 }}>
              <SectionHeader title="Current Focus" />
              {focusEntry ? (
                <>
                  <button type="button" onClick={() => onOpenEntry?.(focusEntry.id)} style={{ width: '100%', border: 'none', background: 'transparent', padding: 0, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--fn)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px solid var(--br)' }}>
                      <span aria-hidden="true" style={{ color: 'var(--t3)', fontSize: 22 }}>▤</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong style={{ color: 'var(--tx)', fontSize: 17 }}>{focusEntry.title || 'Untitled note'}</strong>
                          {focusPrimaryTag && <span style={{ ...pillStyle, color: accent, background: `${accent}1f` }}>#{focusPrimaryTag}</span>}
                        </div>
                        {(focusEntry.notes || focusEntry.summary) && <div style={{ color: 'var(--t2)', fontSize: 12, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(focusEntry.notes || focusEntry.summary).slice(0, 120)}</div>}
                        {focusEntry._path && <div style={{ color: 'var(--t3)', fontSize: 12, marginTop: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{focusEntry._path}</div>}
                      </div>
                    </div>
                  </button>
                  <div style={{ marginTop: 14, display: 'flex', gap: 18, color: 'var(--t2)', fontSize: 12 }}>
                    <span><strong style={{ color: 'var(--tx)' }}>{wordsInFocus.toLocaleString()}</strong> word{wordsInFocus === 1 ? '' : 's'}</span>
                    <span>Last edited <strong style={{ color: 'var(--tx)' }}>{formatRelativeTime(focusEntry.modified || focusEntry.date || focusEntry.entry_date) || 'just now'}</strong></span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '20px 4px', color: 'var(--t3)', fontSize: 13 }}>Create a note to set your current focus.</div>
              )}
            </section>
            <section style={{ ...cardStyle, padding: 18 }}>
              <SectionHeader title="Session Goals" />
              {goals.map((goal, index) => <GoalLine key={goal.label} done={goal.done} label={goal.label} color={accent} onToggle={() => toggleGoal(index)} />)}
            </section>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 12, marginBottom: 22 }}>
            <MiniListCard
              title={`Related Backlinks (${focusBacklinks.length})`}
              items={focusBacklinks.map(entry => ({ id: entry.id, label: entry.title || entry._path || 'Untitled' }))}
              empty={focusEntry ? 'No backlinks yet.' : 'Pick a focus note to see backlinks.'}
              color="#52d273"
              onItemClick={item => item?.id && onOpenEntry?.(item.id)}
            />
            <MiniListCard
              title={`Unresolved Links (${focusUnresolved.length})`}
              items={focusUnresolved.map(label => ({ label }))}
              empty={focusEntry ? 'No unresolved references.' : 'Pick a focus note to see unresolved references.'}
              color="#facc15"
              onItemClick={() => onNavigate?.('graph')}
            />
            <MiniListCard
              title={`Related Memory (${focusRelatedMemory.length})`}
              items={focusRelatedMemory.map(entry => ({ id: entry.id, label: entry.title || entry._path || 'Untitled' }))}
              empty={focusEntry ? 'No related memory entries.' : 'Pick a focus note to see related memory.'}
              color="#a855f7"
              onItemClick={item => item?.id ? onOpenEntry?.(item.id) : onNavigate?.('graph')}
            />
          </div>
        </>
      )}
      {state?.lastAction && <StatusLine tone={accent}>{state.lastAction}</StatusLine>}
      {activeTab === 'Active Projects' && (
        activeProjectsDW.length === 0
          ? <div style={{ marginTop: 14, padding: 14, border: '1px dashed var(--br)', borderRadius: 'var(--rd)', color: 'var(--t3)' }}>No active projects yet.</div>
          : <ModePanelList
              title="Active Projects"
              rows={activeProjectsDW.map(row => [row.entry?.title || 'Untitled project', `${Math.round(row.progress || 0)}% · ${formatRelativeTime(row.lastActivity) || 'No activity'}`, accent])}
              onOpen={() => onNavigate?.('projects')}
            />
      )}
      {activeTab === 'Backlinks' && (
        focusBacklinks.length === 0
          ? <div style={{ marginTop: 14, padding: 14, border: '1px dashed var(--br)', borderRadius: 'var(--rd)', color: 'var(--t3)' }}>No backlinks for the current focus.</div>
          : <ModePanelList
              title="Backlinks"
              rows={focusBacklinks.map(entry => [entry.title || 'Untitled', 'Open in Constellation', '#52d273'])}
              onOpen={() => onNavigate?.('graph')}
            />
      )}
      {activeTab === 'Smart Views' && <ModePanelList title="Smart Views" rows={['Current focus notes', 'Unresolved links', 'Recent memory', 'Project sources'].map(item => [item, 'Open search view', accent])} onOpen={() => onNavigate?.('search')} />}
      <SectionHeader title="Quick Actions" />
      <ModeActionTiles
        actions={[
          { label: 'New Note', type: 'note', icon: '▤', color: accent },
          { label: 'Open Current', onClick: () => focusEntry?.id ? onOpenEntry?.(focusEntry.id) : onNavigate?.('note'), icon: '▣', color: '#3ddc84' },
          { label: 'Review Backlinks', section: 'graph', icon: '⌘', color: '#2dd4bf' },
          { label: 'Compile to Memory', section: 'raw', icon: '☑', color: '#a855f7' },
          { label: 'Templates', section: 'templates', icon: '◇', color: '#a3adb9' },
        ]}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />
    </>
  );
}

function PlanningCommandCenter({ accent, state, model = {}, onStateChange, onModeChange, onNavigate, onAdd, onOpenEntry }) {
  const priorities = state?.priorities || commandCenterDefaults.planning.priorities;
  const togglePriority = index => onStateChange(current => ({
    ...current,
    priorities: priorities.map((item, itemIndex) => itemIndex === index ? { ...item, done: !item.done } : item),
    lastAction: 'Priorities saved',
  }));
  const setPlanningStatus = message => onStateChange(current => ({ ...current, lastAction: message }));

  // Live metrics
  const projectRows = Array.isArray(model.projectRows) ? model.projectRows : [];
  const taskRows = Array.isArray(model.taskRows) ? model.taskRows : [];
  const calendarDays = model.calendarDays && typeof model.calendarDays === 'object' ? model.calendarDays : {};
  const activeProjects = projectRows.filter(row => row.entry?.status !== 'done' && row.entry?.status !== 'archived').length;
  const openTasks = taskRows.filter(row => row.statusKey !== 'done' && !row.isDone && !row.entry?.completed).length;
  const highPriorityOpen = taskRows.filter(row => (row.priorityRank === 0 || row.priorityRank === 1) && !row.isDone && !row.entry?.completed).length;
  const today = todayISO();

  // Upcoming deadlines (tasks + projects with future due dates)
  const dueCandidates = [
    ...taskRows.map(row => row.entry),
    ...projectRows.map(row => row.entry),
  ].filter((entry, idx, arr) => entry && entry.due && arr.findIndex(e => e?.id === entry.id) === idx)
    .filter(entry => String(entry.due).slice(0, 10) >= today)
    .sort((a, b) => String(a.due).localeCompare(String(b.due)));
  const upcomingDeadlines = dueCandidates.slice(0, 5);

  // This week's days: Monday-Sunday from start-of-week ISO
  const weekStart = new Date(startOfWeekISO());
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = new Intl.DateTimeFormat('en-US', { weekday: 'short', day: 'numeric' }).format(d);
    const bucket = calendarDays[iso] || { entries: [], tasks: [] };
    const firstItem = [...(bucket.entries || []), ...(bucket.tasks || [])][0];
    return { iso, label, firstItem };
  });
  const selectedTimeBlock = state?.selectedTimeBlock || weekDays[0]?.iso;

  // Calendar items count = entries+tasks across the week
  const weekItemCount = weekDays.reduce((sum, day) => {
    const bucket = calendarDays[day.iso] || { entries: [], tasks: [] };
    return sum + (bucket.entries?.length || 0) + (bucket.tasks?.length || 0);
  }, 0);
  const nextDeadline = upcomingDeadlines[0];
  const nextDeadlineLabel = nextDeadline ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(String(nextDeadline.due).slice(0, 10))) : '—';

  const projectsById = Object.fromEntries(projectRows.map(row => [row.entry?.id, row.entry]).filter(([id]) => id));

  return (
    <>
      <SectionHeader title="Planning Overview" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14, marginBottom: 22 }}>
        <OverviewMetricCard icon="▭" label="Active Projects" value={String(activeProjects)} detail={activeProjects === 1 ? '1 in flight' : `${activeProjects} in flight`} color={accent} />
        <OverviewMetricCard icon="✓" label="Open Tasks" value={String(openTasks)} detail={`${highPriorityOpen} high priority`} color={accent} />
        <OverviewMetricCard icon="□" label="Upcoming Deadlines" value={String(dueCandidates.length)} detail={nextDeadline ? `Next: ${nextDeadlineLabel}` : 'None'} color={accent} />
        <OverviewMetricCard icon="◷" label="Calendar Items" value={String(weekItemCount)} detail="This week" color={accent} />
      </div>
      <SectionHeader title="Plan Your Work" action={<TextActionButton onClick={() => onNavigate?.('calendar')}>View calendar</TextActionButton>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 22 }}>
        <PlanningStepCard number="1" title="Define Priorities" body="Focus on what matters most this week." action="Save Priorities" accent={accent} items={priorities} onToggleItem={togglePriority} onAction={() => setPlanningStatus('Priorities saved')} />
        <PlanningStepCard number="2" title="Break Down Work" body="Decompose projects into actionable tasks." action="View All Tasks" accent={accent} progressRows={projectRows.slice(0, 3).map(row => ({ name: row.entry?.title || 'Untitled project', value: row.progress || 0, color: accent }))} onAction={() => onNavigate?.('tasks')} />
        <PlanningStepCard number="3" title="Schedule Time" body="Block focused time for deep work." action="View Time Blocks" accent={accent} scheduleRows={weekDays.slice(0, 3).map(day => [day.label, day.firstItem?.title || 'Open'])} onAction={() => onNavigate?.('calendar')} />
        <PlanningStepCard number="4" title="Review & Adjust" body="Check progress and adjust the plan." action="Start Review" accent={accent} review onAction={() => onModeChange?.('review')} />
      </div>
      {state?.lastAction && <StatusLine tone={accent}>{state.lastAction}</StatusLine>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16, marginBottom: 22 }}>
        <section style={{ ...cardStyle, padding: 14 }}>
          <SectionHeader title="Upcoming Deadlines" action={<TextActionButton onClick={() => onNavigate?.('calendar')}>View all</TextActionButton>} />
          {upcomingDeadlines.length === 0 ? (
            <EmptyLine>No upcoming deadlines.</EmptyLine>
          ) : upcomingDeadlines.map(entry => {
            const dueIso = String(entry.due).slice(0, 10);
            const projectTitle = projectsById[entry.project]?.title || (typeof entry.project === 'string' ? entry.project : entry.type === 'project' ? 'Project' : 'Task');
            const color = dueIso === today ? '#f59e0b' : 'var(--t2)';
            const dueLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dueIso));
            return <DeadlineRow key={entry.id} row={[entry.title || 'Untitled', projectTitle, dueLabel, color]} onOpen={() => onOpenEntry ? onOpenEntry(entry.id) : onNavigate?.('calendar')} />;
          })}
        </section>
        <section style={{ ...cardStyle, padding: 14 }}>
          <SectionHeader title="This Week’s Time Blocks" action={<TextActionButton onClick={() => onNavigate?.('calendar')}>View calendar</TextActionButton>} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', border: '1px solid var(--br)', borderRadius: 7, overflow: 'hidden' }}>
            {weekDays.map((day, index) => (
              <button key={day.iso} type="button" onClick={() => {
                onStateChange(current => ({ ...current, selectedTimeBlock: day.iso, lastAction: `Selected ${day.label}` }));
                if (day.firstItem?.id && onOpenEntry) onOpenEntry(day.firstItem.id);
              }} style={{ padding: 10, minHeight: 70, border: 'none', borderLeft: index ? '1px solid var(--br)' : 'none', background: selectedTimeBlock === day.iso ? `${accent}33` : 'transparent', fontFamily: 'var(--fn)', textAlign: 'left', cursor: 'pointer' }}>
                <strong style={{ color: 'var(--tx)', fontSize: 13 }}>{day.label}</strong>
                <div style={{ color: 'var(--t3)', fontSize: 11, marginTop: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{day.firstItem?.title || 'Open'}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
      <SectionHeader title="Quick Planning Actions" />
      <ModeActionTiles
        actions={[
          { label: 'New Project', type: 'project', icon: '▭', color: accent },
          { label: 'New Task', type: 'task', icon: '☑', color: '#4d8dff' },
          { label: 'Plan Time Block', section: 'calendar', icon: '◷', color: '#22c55e' },
          { label: 'Set Reminder', onClick: () => { setPlanningStatus('Reminder task started'); onAdd?.('task'); }, icon: '♢', color: '#f59e0b' },
          { label: 'Create Milestone', onClick: () => { setPlanningStatus('Milestone task started'); onAdd?.('task'); }, icon: '⚑', color: '#ec4899' },
        ]}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />
    </>
  );
}

function captureEntryToCommandRow(entry) {
  const kind = captureKind(entry);
  const label = kind === 'audio' ? 'Voice' : kind === 'image' ? 'Screenshot' : kind === 'article' ? 'Web Clip' : kind === 'clip' ? 'Clip' : 'Capture';
  const category = kind === 'audio' ? 'voice' : kind === 'image' ? 'screenshots' : kind === 'article' ? 'links' : 'notes';
  const icon = kind === 'audio' ? 'wave' : kind === 'image' ? 'thumb' : kind === 'article' ? 'p' : 'note';
  return {
    id: entry.id,
    entryId: entry.id,
    title: entry.title || 'Untitled capture',
    label,
    time: captureTimeLabel(entry),
    kind,
    category,
    icon,
  };
}

function CaptureCommandCenter({ accent, state, recentCaptures = [], onStateChange, onNavigate, onAdd, onQuickCapture, onOpenEntry }) {
  const selectedKind = state?.quickKind || 'note';
  const selectedFilter = state?.filter || 'all';
  const draft = state?.draft || '';
  const selected = captureKinds.find(kind => kind.id === selectedKind) || captureKinds[0];
  const localRows = state?.capturedRows || [];
  const realRows = recentCaptures.map(captureEntryToCommandRow);
  const capturedRows = [...localRows, ...realRows];
  const visibleRows = selectedFilter === 'all'
    ? capturedRows
    : capturedRows.filter(row => row.category === selectedFilter);
  const setCaptureStatus = message => onStateChange(current => ({ ...current, lastAction: message }));
  const updateDraft = value => onStateChange(current => ({ ...current, draft: value }));
  const selectKind = kind => onStateChange(current => ({ ...current, quickKind: kind.id, lastAction: `${kind.label} capture selected` }));
  const appendToDraft = value => onStateChange(current => ({ ...current, draft: `${current.draft || ''}${value}`, lastAction: 'Capture helper inserted' }));
  const buildPayload = text => {
    const title = text.split(/\n/)[0].trim().slice(0, 80) || `${selected.label} capture`;
    const tags = ['capture', selected.category].filter(Boolean);
    if (selected.type === 'task') return { type: 'task', title, notes: text, status: 'open', tags, priority: 'normal' };
    if (selected.type === 'link') {
      const url = text.match(/https?:\/\/\S+/)?.[0] || '';
      return { type: 'link', title, url, notes: text, status: 'active', tags };
    }
    if (selected.type === 'raw') return { type: 'raw', title, notes: text, status: 'captured', tags, source: selected.label };
    return { type: 'note', title, notes: text, status: 'draft', tags };
  };
  const captureNow = () => {
    const text = draft.trim();
    if (!text) {
      setCaptureStatus(`Opened ${selected.label} capture`);
      onAdd?.({ type: selected.type, quickCapture: true });
      return;
    }
    const row = {
      id: `local-${Date.now()}`,
      title: text.split(/\n/)[0].trim().slice(0, 80),
      label: selected.label,
      time: 'Just now',
      kind: selected.id,
      category: selected.category,
      icon: selected.id === 'web' ? 'p' : selected.id === 'voice' ? 'wave' : selected.id === 'screenshot' ? 'thumb' : 'note',
    };
    const payload = buildPayload(text);
    onQuickCapture?.(payload);
    onStateChange(current => ({
      ...current,
      draft: '',
      capturedRows: [row, ...(current.capturedRows || [])].slice(0, 8),
      filter: 'all',
      lastAction: `Captured ${row.title}`,
    }));
  };
  return (
    <>
      <SectionHeader title="Quick Capture" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,minmax(0,1fr))', gap: 14, marginBottom: 16 }}>
        {captureKinds.map(kind => <CaptureKindCard key={kind.id} kind={kind} active={kind.id === selectedKind} accent={accent} onSelect={() => selectKind(kind)} />)}
      </div>
      <section style={{ ...cardStyle, padding: 0, marginBottom: 22, overflow: 'hidden' }}>
        <textarea
          aria-label="Quick capture text"
          value={draft}
          onChange={event => updateDraft(event.target.value)}
          onKeyDown={event => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              captureNow();
            }
          }}
          placeholder="What's on your mind?"
          style={{ width: '100%', minHeight: 74, resize: 'vertical', border: 'none', outline: 'none', boxSizing: 'border-box', background: 'transparent', color: 'var(--tx)', padding: '18px 18px 8px', fontFamily: 'var(--fn)', fontSize: 15, lineHeight: 1.45 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '8px 18px 16px' }}>
          {/* Only show helpers that actually insert something into the draft. Removed Attach/Suggest until a real file picker and suggestion engine are wired in. */}
          {[
            ['List', '\n- ', '☷'],
            ['Link', '[link](https://)', '⌁'],
            ['Tag', ' #', '#'],
            ['Mention', ' @', '@'],
          ].map(([label, value, icon]) => (
            <button key={label} type="button" aria-label={label} onClick={() => appendToDraft(value)} style={{ border: 'none', background: 'transparent', color: 'var(--t2)', fontSize: 18, fontFamily: 'var(--fn)', cursor: 'pointer' }}>{icon}</button>
          ))}
          <button type="button" onClick={captureNow} style={{ marginLeft: 'auto', minHeight: 38, minWidth: 148, border: `1px solid ${accent}66`, borderRadius: 7, background: `linear-gradient(180deg, ${accent}, #6f3bb9)`, color: '#fff', fontFamily: 'var(--fn)', fontSize: 14, fontWeight: 750, cursor: 'pointer', boxShadow: `0 10px 24px ${accent}24` }}>
            Capture <span style={{ marginLeft: 18, opacity: .78 }}>⌘↵</span>
          </button>
        </div>
      </section>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {captureFilterOptions.map(([id, label, icon]) => <CaptureFilterChip key={id} id={id} label={label} icon={icon} active={selectedFilter === id} accent={accent} onClick={() => onStateChange(current => ({ ...current, filter: id, lastAction: `${label} shown` }))} />)}
        <TextActionButton onClick={() => onNavigate?.('raw')}>View all</TextActionButton>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr .98fr', gap: 18, alignItems: 'stretch' }}>
        <section style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px 8px' }}><SectionHeader title="Captured Today" /></div>
          {visibleRows.length === 0 ? (
            <div style={{ padding: '6px 16px 14px', color: 'var(--t3)', fontSize: 13 }}>Nothing captured yet.</div>
          ) : visibleRows.map(row => <CapturedTodayRow key={row.id} row={row} onOpen={() => row.entryId ? onOpenEntry?.(row.entryId) : onNavigate?.('raw')} />)}
          <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px 16px', color: 'var(--t3)', fontSize: 13 }}>
            <span style={{ flex: 1, textAlign: 'center' }}>{capturedRows.length} captures</span>
            <TextActionButton onClick={() => onNavigate?.('raw')}>View all captures</TextActionButton>
          </div>
        </section>
        <section style={{ ...cardStyle, padding: 24, display: 'grid', placeItems: 'center', textAlign: 'center', minHeight: 290 }}>
          <div>
            <div style={{ position: 'relative', width: 84, height: 72, margin: '0 auto 20px', color: accent }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: '15px 8px 0', border: `3px solid ${accent}99`, borderRadius: 12, display: 'grid', placeItems: 'center', fontSize: 32 }}>▱</span>
              <span style={{ position: 'absolute', top: 0, right: 2, width: 26, height: 26, borderRadius: 99, background: '#7c4bd4', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{capturedRows.length}</span>
            </div>
            <h3 style={{ margin: '0 0 10px', fontSize: 22, color: 'var(--tx)' }}>Capture Inbox</h3>
            <p style={{ margin: 0, color: 'var(--t2)', fontSize: 14, lineHeight: 1.55 }}>All new captures land here.</p>
            <p style={{ margin: '10px 0 24px', color: 'var(--t3)', fontSize: 13 }}>Review and organize when you’re ready.</p>
            <button type="button" onClick={() => onNavigate?.('raw')} style={{ minHeight: 40, minWidth: 222, border: `1px solid ${accent}66`, borderRadius: 7, background: `linear-gradient(180deg, ${accent}, #6f3bb9)`, color: '#fff', fontFamily: 'var(--fn)', fontSize: 14, cursor: 'pointer' }}>Open Capture Inbox</button>
          </div>
        </section>
      </div>
      {state?.lastAction && <StatusLine tone={accent}>{state.lastAction}</StatusLine>}
    </>
  );
}

function ReviewCommandCenter({ accent, state, model = {}, onStateChange, onNavigate, onAdd, onOpenEntry }) {
  const [editingReflection, setEditingReflection] = useState(false);
  const reflection = state?.reflection || commandCenterDefaults.review.reflection;
  const goals = state?.goals || commandCenterDefaults.review.goals;
  const addReflection = key => onStateChange(current => ({
    ...current,
    reflection: {
      ...(current.reflection || reflection),
      [key]: [...((current.reflection || reflection)[key] || []), key === 'next' ? 'New next step to refine' : 'New review note'],
    },
    lastAction: key === 'next' ? 'Next step added' : 'Reflection note added',
  }));
  const updateReflectionItem = (key, index, value) => onStateChange(current => ({
    ...current,
    reflection: {
      ...(current.reflection || reflection),
      [key]: ((current.reflection || reflection)[key] || []).map((item, itemIndex) => itemIndex === index ? value : item),
    },
    lastAction: 'Reflection saved',
  }));
  const addGoal = () => onStateChange(current => ({
    ...current,
    goals: [...(current.goals || goals), { title: `New goal ${goals.length + 1}`, value: 0, meta: 'No date' }],
    lastAction: 'Goal added',
  }));
  const setReviewStatus = message => onStateChange(current => ({ ...current, lastAction: message }));

  // Live review metrics — goals here come from local state (no done flag); use value (0-100) for progress.
  const goalsAdvancing = goals.filter(goal => (goal.value || 0) > 0).length;
  const goalsCompleted = goals.filter(goal => (goal.value || 0) >= 100).length;
  const goalsAvg = goals.length > 0 ? Math.round(goals.reduce((sum, goal) => sum + (goal.value || 0), 0) / goals.length) : 0;

  const taskRows = Array.isArray(model.taskRows) ? model.taskRows : [];
  const tasksCompletedThisWeek = taskRows.filter(row => (row.isDone || row.entry?.completed) && withinThisWeek(row)).length;
  const tasksOpenedThisWeek = taskRows.filter(row => withinThisWeek(row)).length;
  const notesThisWeek = (Array.isArray(model.recentEntries) ? model.recentEntries : []).filter(entry => entry.type === 'note' && withinThisWeek(entry)).length;

  const momentumRatio = tasksOpenedThisWeek > 0 ? tasksCompletedThisWeek / tasksOpenedThisWeek : 0;
  const momentumLabel = tasksOpenedThisWeek === 0 ? '—' : momentumRatio >= 0.66 ? 'High' : momentumRatio >= 0.33 ? 'Medium' : 'Low';
  const momentumDetail = tasksOpenedThisWeek === 0 ? 'No data yet' : `${tasksCompletedThisWeek} of ${tasksOpenedThisWeek} done`;

  // Notes to review = recently-modified notes (top 5)
  const notesEntries = Array.isArray(model.recentEntries) ? model.recentEntries : [];
  const notesToReview = notesEntries.filter(entry => entry.type === 'note').slice(0, 5);

  // Projects health (top 5 active)
  const projectRowsModel = Array.isArray(model.projectRows) ? model.projectRows : [];
  const projectsHealth = projectRowsModel.filter(row => row.entry?.status !== 'archived').slice(0, 5);

  return (
    <>
      <SectionHeader title="Review Overview" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 22 }}>
        <OverviewMetricCard icon="★" label="Goals Progress" value={`${goalsAvg}%`} detail={`${goalsCompleted} / ${goals.length} complete`} color={accent} />
        <OverviewMetricCard icon="◎" label="Goals Advancing" value={`${goalsAdvancing} / ${goals.length}`} detail="Have progress" color={accent} />
        <OverviewMetricCard icon="☑" label="Tasks Completed" value={String(tasksCompletedThisWeek)} detail="This week" color={accent} />
        <OverviewMetricCard icon="↗" label="Momentum" value={momentumLabel} detail={momentumDetail} color={accent} />
      </div>
      <SectionHeader title="Weekly Reflection" action={<TextActionButton onClick={() => { setEditingReflection(open => !open); setReviewStatus(editingReflection ? 'Reflection locked' : 'Reflection editing enabled'); }}>{editingReflection ? 'Done Editing' : 'Edit Reflection'}</TextActionButton>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 }}>
        <ReflectionCard title="What went well" accent="#22c55e" items={reflection.wentWell} action="Add note" editing={editingReflection} onChange={(index, value) => updateReflectionItem('wentWell', index, value)} onAction={() => addReflection('wentWell')} />
        <ReflectionCard title="What could improve" accent={accent} items={reflection.improve} action="Add note" editing={editingReflection} onChange={(index, value) => updateReflectionItem('improve', index, value)} onAction={() => addReflection('improve')} />
        <ReflectionCard title="What’s next" accent={accent} items={reflection.next} action="Add next step" editing={editingReflection} onChange={(index, value) => updateReflectionItem('next', index, value)} onAction={() => addReflection('next')} />
      </div>
      {state?.lastAction && <StatusLine tone={accent}>{state.lastAction}</StatusLine>}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 22 }}>
        <section style={{ ...cardStyle, padding: 14 }}>
          <SectionHeader title="Goals & Commitments" action={<TextActionButton onClick={() => onNavigate?.('projects')}>View all</TextActionButton>} />
          {goals.map(row => <MiniProgressRow key={row.title} title={row.title} value={row.value} meta={row.meta} color={accent} />)}
          <button type="button" onClick={addGoal} style={{ marginTop: 8, border: 'none', background: 'transparent', color: accent, fontFamily: 'var(--fn)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>+ New Goal</button>
        </section>
        <section style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--br)' }}><SectionHeader title="Notes to Review" action={<TextActionButton onClick={() => onNavigate?.('note')}>View all</TextActionButton>} /></div>
          {notesToReview.length === 0 ? (
            <div style={{ padding: 14 }}><EmptyLine>No notes yet.</EmptyLine></div>
          ) : notesToReview.map(entry => {
            const primaryTag = (entry.tags || [])[0];
            const tagLabel = primaryTag ? `#${primaryTag}` : '';
            const tagColor = primaryTag ? tagTone(primaryTag).color : 'var(--t3)';
            const time = formatRelativeTime(entry.modified || entry.date || entry.entry_date);
            return <ReferenceNoteRow key={entry.id} title={entry.title || 'Untitled note'} tag={tagLabel} time={time} color={tagColor} onOpen={() => onOpenEntry ? onOpenEntry(entry.id) : onNavigate?.('note')} />;
          })}
        </section>
        <section style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 14, borderBottom: '1px solid var(--br)' }}><SectionHeader title="Projects Health" action={<TextActionButton onClick={() => onNavigate?.('projects')}>View all</TextActionButton>} /></div>
          {projectsHealth.length === 0 ? (
            <div style={{ padding: 14 }}><EmptyLine>No projects yet.</EmptyLine></div>
          ) : projectsHealth.map(row => {
            const project = row.entry;
            const completion = `${Math.round(row.progress || 0)}%`;
            const changed = row.lastActivity ? formatRelativeTime(row.lastActivity) : 'No recent activity';
            return <ReferenceProjectRow key={project.id} title={project.title || 'Untitled project'} completion={completion} changed={changed} color={accent} favorite={!!project.starred} onOpen={() => onOpenEntry ? onOpenEntry(project.id) : onNavigate?.('projects')} />;
          })}
        </section>
      </div>
      <SectionHeader title="Review Actions" />
      <ModeActionTiles
        actions={[
          { label: 'Weekly Review Note', type: 'journal', icon: '▤', color: accent },
          { label: 'Close Completed Tasks', onClick: () => { setReviewStatus('Opened Tasks to close completed work'); onNavigate?.('tasks'); }, icon: '✓', color: accent },
          { label: 'Plan Next Week', section: 'calendar', icon: '□', color: accent },
          { label: 'Update Goals', section: 'projects', icon: '◎', color: accent },
          { label: 'Export Report', section: 'settings', icon: '⇱', color: accent },
        ]}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />
    </>
  );
}

function ModeTabs({ active, items, accent, onSelect }) {
  return (
    <div role="tablist" aria-label="Command Center mode sections" style={{ display: 'flex', gap: 28, borderBottom: '1px solid var(--br)' }}>
      {items.map(item => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={item === active}
          onClick={() => onSelect?.(item)}
          style={{
            border: 'none',
            borderBottom: item === active ? `2px solid ${accent}` : '2px solid transparent',
            background: 'transparent',
            color: item === active ? accent : 'var(--t2)',
            padding: '0 0 10px',
            fontFamily: 'var(--fn)',
            fontSize: 14,
            fontWeight: item === active ? 720 : 550,
            cursor: 'pointer',
          }}>
          {item}
        </button>
      ))}
    </div>
  );
}

function GoalLine({ done, label, color, onToggle }) {
  return (
    <button type="button" onClick={onToggle} style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', color: 'var(--t2)', fontSize: 13, fontFamily: 'var(--fn)', textAlign: 'left', cursor: onToggle ? 'pointer' : 'default' }}>
      <span aria-hidden="true" style={{ width: 15, height: 15, borderRadius: 99, border: `1px solid ${done ? '#3ddc84' : color}`, background: done ? '#3ddc84' : 'transparent', color: '#06111f', display: 'grid', placeItems: 'center', fontSize: 10 }}>{done ? '✓' : ''}</span>
      <span>{label}</span>
    </button>
  );
}

function MiniListCard({ title, items = [], color, onItemClick, empty = 'Nothing here yet.' }) {
  return (
    <section style={{ ...cardStyle, padding: 16 }}>
      <SectionHeader title={title} />
      {items.length === 0 ? (
        <div style={{ padding: '6px 0', color: 'var(--t3)', fontSize: 13 }}>{empty}</div>
      ) : items.map((item, index) => {
        const isObj = item && typeof item === 'object';
        const label = isObj ? item.label : item;
        const key = isObj && item.id ? item.id : `${label}-${index}`;
        return (
          <button key={key} type="button" onClick={() => onItemClick?.(item)} style={{ width: '100%', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', color: 'var(--t2)', fontSize: 13, fontFamily: 'var(--fn)', textAlign: 'left', cursor: onItemClick ? 'pointer' : 'default' }}>
            <span aria-hidden="true" style={{ color }}>⌁</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          </button>
        );
      })}
    </section>
  );
}

function ModePanelList({ title, rows, onOpen }) {
  return (
    <section style={{ ...cardStyle, padding: 0, overflow: 'hidden', marginTop: 14, marginBottom: 22 }}>
      <div style={{ padding: 14, borderBottom: '1px solid var(--br)' }}><SectionHeader title={title} /></div>
      {rows.map(([title, meta, color]) => (
        <button key={title} type="button" onClick={onOpen} style={{ ...plainListButton(), minHeight: 50 }}>
          <span aria-hidden="true" style={{ width: 20, color }}>▣</span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span style={{ display: 'block', color: 'var(--tx)', fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            <span style={{ display: 'block', color: 'var(--t3)', fontSize: 11, marginTop: 3 }}>{meta}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

function PlanningStepCard({ number, title, body, action, accent, items, onToggleItem, progressRows, scheduleRows, review, onAction }) {
  return (
    <section style={{ ...cardStyle, padding: 16, minHeight: 214, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{ width: 24, height: 24, borderRadius: 99, background: `${accent}55`, color: 'var(--tx)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800 }}>{number}</span>
        <h3 style={{ margin: 0, color: 'var(--tx)', fontSize: 15 }}>{title}</h3>
      </div>
      <p style={{ margin: '0 0 12px 34px', color: 'var(--t2)', fontSize: 13, lineHeight: 1.45 }}>{body}</p>
      {items && <div style={{ marginTop: 4 }}>{items.map((item, index) => <GoalLine key={item.label || item} done={!!item.done} label={item.label || item} color={accent} onToggle={() => onToggleItem?.(index)} />)}</div>}
      {progressRows && progressRows.length > 0 && (
        <div>
          {progressRows.map(row => <MiniProgressRow key={row.name} title={row.name} value={row.value} color={row.color} />)}
        </div>
      )}
      {progressRows && progressRows.length === 0 && <EmptyLine>No projects yet.</EmptyLine>}
      {scheduleRows && scheduleRows.length > 0 && (
        <div>
          {scheduleRows.map(row => (
            <div key={row[0]} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--t2)', fontSize: 13, padding: '7px 0', gap: 10 }}>
              <span style={{ flexShrink: 0 }}>{row[0]}</span>
              <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{row[1]}</span>
            </div>
          ))}
        </div>
      )}
      {review && <div style={{ color: 'var(--t2)', fontSize: 13, lineHeight: 1.6 }}>Compare last week's plan with what shipped. Capture wins, gaps, and next steps.</div>}
      <button type="button" onClick={onAction} style={{ marginTop: 'auto', minHeight: 34, border: `1px solid ${accent}66`, borderRadius: 6, background: 'transparent', color: '#e9d5ff', fontFamily: 'var(--fn)', cursor: 'pointer' }}>{action}</button>
    </section>
  );
}

function DeadlineRow({ row, onOpen }) {
  const [title, project, date, color] = row;
  return (
    <button type="button" onClick={onOpen} style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--br)', background: 'transparent', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center', padding: '9px 0', fontFamily: 'var(--fn)', textAlign: 'left', cursor: 'pointer' }}>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--tx)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ ...pillStyle, display: 'inline-block', marginTop: 4 }}>{project}</span>
      </span>
      <span style={{ color, fontSize: 12, fontWeight: 650 }}>{date}</span>
    </button>
  );
}

function CaptureQueueRow({ row, routed, onOpen, onRoute }) {
  const [title, meta, color] = row;
  return (
    <div style={{ ...plainListButton(), minHeight: 58, cursor: 'default' }}>
      <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 6, background: `${color}22`, color, display: 'grid', placeItems: 'center' }}>▧</span>
      <button type="button" onClick={onOpen} aria-label={`Open capture ${title}`} style={{ all: 'unset', minWidth: 0, flex: 1, cursor: 'pointer' }}>
        <span style={{ display: 'block', color: 'var(--tx)', fontSize: 13, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ display: 'block', color: 'var(--t3)', fontSize: 11, marginTop: 4 }}>{meta}</span>
      </button>
      <button type="button" onClick={onRoute} aria-label={`Route ${title}`} style={{ border: 'none', background: 'transparent', color: routed ? '#22c55e' : color, fontSize: 12, fontWeight: 700, fontFamily: 'var(--fn)', cursor: 'pointer' }}>{routed ? 'Routed' : 'Route'}</button>
    </div>
  );
}

function CaptureKindCard({ kind, active, accent, onSelect }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={active} style={{ ...cardStyle, minHeight: 96, padding: 16, display: 'grid', gridTemplateColumns: '38px 1fr', gap: 13, alignItems: 'start', textAlign: 'left', color: 'var(--tx)', fontFamily: 'var(--fn)', cursor: 'pointer', borderColor: active ? `${accent}88` : 'var(--br)', background: active ? `linear-gradient(180deg, ${accent}18, rgba(255,255,255,.025))` : 'var(--b1)' }}>
      <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color: accent, background: `${accent}1c`, boxShadow: `0 0 0 1px ${accent}36 inset`, fontSize: 23 }}>{kind.icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 750, marginBottom: 6 }}>{kind.label}</span>
        <span style={{ display: 'block', color: 'var(--t2)', fontSize: 13, lineHeight: 1.38 }}>{kind.description}</span>
      </span>
    </button>
  );
}

function CaptureFilterChip({ id, label, icon, active, accent, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} style={{ minHeight: 38, border: `1px solid ${active ? accent : 'var(--br)'}`, borderRadius: 7, background: active ? `${accent}12` : 'rgba(255,255,255,.02)', color: active ? 'var(--tx)' : 'var(--t2)', padding: '0 14px', display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--fn)', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', boxShadow: active ? `0 0 0 1px ${accent}22 inset` : 'none' }}>
      {icon && <span aria-hidden="true" style={{ color: active ? accent : 'var(--t3)' }}>{icon}</span>}
      {label}
    </button>
  );
}

function CapturedTodayRow({ row, onOpen }) {
  const icon = row.icon === 'thumb' ? '▤' : row.icon === 'wave' ? '≋' : row.icon === 'p' ? 'P' : '▤';
  const background = row.icon === 'p' || row.icon === 'note' ? '#f97316' : 'rgba(255,255,255,.08)';
  const color = row.icon === 'p' || row.icon === 'note' ? '#15100a' : 'var(--t2)';
  return (
    <button type="button" onClick={onOpen} aria-label={`Open ${row.title}`} style={{ ...plainListButton(), minHeight: 56 }}>
      <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 5, background, color, display: 'grid', placeItems: 'center', fontWeight: 850, border: '1px solid rgba(255,255,255,.10)' }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ color: 'var(--tx)', fontSize: 15, fontWeight: 650, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.title}</span>
        <span style={{ ...pillStyle, flexShrink: 0 }}>{row.label}</span>
      </span>
      <span style={{ color: 'var(--t3)', fontSize: 13, whiteSpace: 'nowrap' }}>{row.time}</span>
    </button>
  );
}

function RoutingSuggestion({ row, selected, onApply }) {
  const [count, label, color] = row;
  return (
    <button type="button" onClick={onApply} style={{ width: '100%', border: 'none', borderBottom: '1px solid var(--br)', background: selected ? `${color}18` : 'transparent', color: 'var(--tx)', padding: '11px 0', fontFamily: 'var(--fn)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'var(--t2)' }}>{label}</span>
      <span style={{ color, fontSize: 12 }}>{count}</span>
    </button>
  );
}

function ReflectionCard({ title, accent, items, action, editing, onChange, onAction }) {
  return (
    <section style={{ ...cardStyle, padding: 16 }}>
      <h3 style={{ margin: '0 0 12px', color: 'var(--tx)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true" style={{ color: accent }}>◎</span>
        {title}
      </h3>
      <ul style={{ margin: '0 0 16px 18px', padding: 0, color: 'var(--t2)', fontSize: 13, lineHeight: 1.8 }}>
        {items.map((item, index) => (
          <li key={`${item}-${index}`}>
            {editing ? (
              <input
                aria-label={`${title} item ${index + 1}`}
                value={item}
                onChange={event => onChange?.(index, event.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid var(--br)', borderRadius: 6, background: 'rgba(255,255,255,.035)', color: 'var(--tx)', padding: '5px 7px', fontFamily: 'var(--fn)', fontSize: 12 }}
              />
            ) : item}
          </li>
        ))}
      </ul>
      <button type="button" onClick={onAction} style={{ width: '100%', minHeight: 34, border: `1px solid ${accent}88`, borderRadius: 6, background: 'transparent', color: accent, fontFamily: 'var(--fn)', fontWeight: 700, cursor: 'pointer' }}>{action}</button>
    </section>
  );
}

function StatusLine({ children, tone }) {
  return (
    <div role="status" style={{ margin: '0 0 14px', color: tone, background: `${tone}14`, border: `1px solid ${tone}26`, borderRadius: 7, padding: '8px 10px', fontSize: 12, fontWeight: 650 }}>
      {children}
    </div>
  );
}

function ReferencePinnedCard({ card, onOpen }) {
  return (
    <button type="button" aria-label={`Open ${card.title}`} onClick={onOpen} style={{ ...cardStyle, minHeight: 132, textAlign: 'left', cursor: 'pointer', fontFamily: 'var(--fn)', color: 'var(--tx)', padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 12 }}>{card.type}</div>
      <div style={{ fontSize: 14, fontWeight: 650, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.title}</div>
      <div style={{ fontSize: 12, fontWeight: 400, color: 'var(--t2)', minHeight: 34, lineHeight: 1.4, overflow: 'hidden' }}>{card.description}</div>
      {card.progress != null ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>{card.progress}%</div>
          <ProgressLine value={card.progress} color={card.color} />
        </div>
      ) : <div style={{ marginTop: 12, fontSize: 12, color: 'var(--t3)' }}>{card.time}</div>}
    </button>
  );
}

function ReferenceNoteRow({ title, tag, time, color, onOpen }) {
  return (
    <button type="button" aria-label={`Open ${title}`} onClick={onOpen} style={{ ...plainListButton(), minHeight: 41 }}>
      <span aria-hidden="true" style={{ width: 18, height: 18, borderRadius: 4, border: `1px solid ${color}`, color, display: 'grid', placeItems: 'center', fontSize: 11, flexShrink: 0 }}>▤</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{title}</span>
      <span style={{ ...pillStyle, color, background: 'rgba(255,255,255,.035)' }}>{tag}</span>
      <span style={{ width: 112, textAlign: 'right', color: 'var(--t3)', fontSize: 12, fontWeight: 500 }}>{time}</span>
    </button>
  );
}

function ReferenceProjectRow({ title, completion, changed, color, favorite, onOpen }) {
  const value = Number(String(completion).replace('%', '')) || 0;
  return (
    <button type="button" aria-label={`Open ${title}`} onClick={onOpen} style={{ ...plainListButton(), minHeight: 48 }}>
      <span aria-hidden="true" style={{ width: 22, color }}>{favorite ? '★' : '▣'}</span>
      <span style={{ flex: 1, fontWeight: 600 }}>{title}</span>
      <span style={{ color: 'var(--t2)', width: 42 }}>{completion}</span>
      <span style={{ width: 92 }}><ProgressLine value={value} compact color={color} /></span>
      <span style={{ color: 'var(--t3)', fontSize: 12, fontWeight: 500, width: 96, textAlign: 'right' }}>{changed}</span>
    </button>
  );
}

function dateStepButtonStyle() {
  return {
    width: 30,
    height: 30,
    border: '1px solid var(--br)',
    borderRadius: 'var(--rd)',
    background: 'var(--b1)',
    color: 'var(--t2)',
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 18,
    lineHeight: 1,
  };
}

function SectionHeader({ title, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
      <h2 style={{ margin: 0, fontSize: 17, lineHeight: 1.2, fontWeight: 700, color: 'var(--tx)' }}>{title}</h2>
      {action && (
        <span style={{ marginLeft: 'auto', color: 'var(--t3)', fontSize: 12 }}>
          {typeof action === 'string' ? action : action}
        </span>
      )}
    </div>
  );
}

function ProgressLine({ value = 50, compact = false, color = 'var(--ac)' }) {
  return (
    <div style={{ height: compact ? 5 : 4, marginTop: compact ? 0 : 12, borderRadius: 99, background: 'rgba(255,255,255,.10)', overflow: 'hidden' }}>
      <div style={{ width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`, height: '100%', background: color }} />
    </div>
  );
}

function CompactRow({ entry, onOpenEntry, meta }) {
  return (
    <button type="button" aria-label={`Open ${entry.title || 'entry'}`} onClick={() => onOpenEntry?.(entry.id)} style={{ ...plainListButton(), minHeight: 44 }}>
      <span style={{ width: 22, color: 'var(--ac)' }}>{ICON[entry.type] || '□'}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 750 }}>{entry.title || 'Untitled'}</span>
      {(entry.tags || []).slice(0, 1).map(tag => <span key={tag} style={pillStyle}>#{tag}</span>)}
      <span style={{ width: 96, textAlign: 'right', color: 'var(--t3)', fontSize: 12 }}>{meta}</span>
    </button>
  );
}

function EmptyLine({ children }) {
  return <div style={{ padding: 14, color: 'var(--t3)', fontSize: 13 }}>{children}</div>;
}

function plainListButton() {
  return {
    width: '100%',
    border: 'none',
    borderBottom: '1px solid var(--br)',
    background: 'transparent',
    color: 'var(--tx)',
    padding: '0 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 14,
    textAlign: 'left',
  };
}

function iconButtonStyleLike() {
  return {
    width: 30,
    height: 30,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    background: 'var(--b2)',
    color: 'var(--t2)',
    fontFamily: 'var(--fn)',
    cursor: 'pointer',
  };
}

function progressNumber(value, fallback = 0) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const match = value.match(/\d+/);
    if (match) return Number(match[0]);
  }
  return fallback;
}

const searchTabs = [
  ['all', 'All'],
  ['entries', 'Entries'],
  ['projects', 'Projects'],
  ['notes', 'Notes'],
  ['tags', 'Tags'],
  ['spaces', 'Spaces'],
  ['smartViews', 'Smart Views'],
  ['backlinks', 'Backlinks'],
  ['canvases', 'Canvases'],
  ['templates', 'Templates'],
  ['memory', 'Memory'],
];

function formatSearchDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return String(value);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function titleCase(value) {
  return String(value || 'Entry').replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function entryPath(entry) {
  if (entry?._path) return entry._path;
  const typeFolder = entry?.type === 'project' ? 'Projects' : entry?.type === 'task' ? 'Tasks' : entry?.type === 'raw' ? 'Inbox' : 'Notes';
  return `/Vault/${typeFolder}/${entry?.title || 'Untitled'}.md`;
}

function entrySize(entry) {
  const bytes = new Blob([JSON.stringify(entry || {})]).size;
  return `${Math.max(0.4, bytes / 1024).toFixed(1)} KB`;
}

function entryRow(entry, group = 'entry') {
  return {
    id: `entry:${entry.id}`,
    group,
    kind: 'entry',
    source: entry,
    title: entry.title || 'Untitled',
    path: entryPath(entry),
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    date: entryDate(entry),
    icon: ICON[entry.type] || '▣',
    typeLabel: titleCase(entry.type),
  };
}

function tagRow(tag) {
  return {
    id: `tag:${tag.id || tag.name}`,
    group: 'tags',
    kind: 'tag',
    source: tag,
    title: `#${tag.name}`,
    path: `${tag.count || 0} entr${tag.count === 1 ? 'y' : 'ies'}`,
    tags: (tag.relatedTags || []).map(item => item.name).slice(0, 3),
    date: '',
    icon: '#',
    typeLabel: 'Tag',
  };
}

function canvasRow(canvas) {
  return {
    id: `canvas:${canvas.id}`,
    group: 'canvases',
    kind: 'canvas',
    source: canvas,
    title: canvas.name || 'Untitled Canvas',
    path: canvas.path || `/Vault/Canvases/${canvas.name || canvas.id}.canvas.json`,
    tags: ['canvas'],
    date: canvas.updated || canvas.date || '',
    icon: '◇',
    typeLabel: 'Canvas',
  };
}

function spaceSearchRow(space) {
  return {
    id: `space:${space.id || space.name}`,
    group: 'spaces',
    kind: 'space',
    source: space,
    title: space.name || space.id || 'Untitled Space',
    path: `${space.count || space.entries?.length || 0} entr${(space.count || space.entries?.length || 0) === 1 ? 'y' : 'ies'}`,
    tags: Array.isArray(space.tags) ? space.tags : [],
    date: space.recentEntry?.modified || space.recentEntry?.date || '',
    icon: '▧',
    typeLabel: 'Space',
  };
}

function smartViewRow(base) {
  return {
    id: `smartView:${base.id}`,
    group: 'smartViews',
    kind: 'smartView',
    source: base,
    title: base.name || 'Untitled Smart View',
    path: base.description || base.path || `/Vault/Smart Views/${base.name || base.id}.json`,
    tags: ['smart-view'],
    date: base.updated || base.modified || '',
    icon: '⌕',
    typeLabel: 'Smart View',
  };
}

function templateRow(template) {
  return {
    id: `template:${template.id || template.name}`,
    group: 'templates',
    kind: 'template',
    source: template,
    title: template.name || 'Untitled Template',
    path: template.description || template.path || `/Vault/Templates/${template.name || template.id}.md`,
    tags: ['template'],
    date: template.updated || template.modified || '',
    icon: '◇',
    typeLabel: 'Template',
  };
}

function searchRowLists(results = {}, backlinks = []) {
  const entries = (results.entries || []).map(item => entryRow(item, 'entries'));
  const projects = (results.projects || []).map(item => entryRow(item, 'projects'));
  const tasks = (results.tasks || []).map(item => entryRow(item, 'entries'));
  const memory = (results.memories || []).map(item => entryRow(item, 'memory'));
  const notes = [...(results.entries || []), ...(results.memories || [])]
    .filter(item => ['note', 'journal', 'article', 'link', 'wiki', 'review'].includes(item.type))
    .map(item => entryRow(item, 'notes'));
  return {
    entries: [...entries, ...tasks],
    projects,
    notes,
    tags: (results.tags || []).map(tagRow),
    spaces: (results.spaces || []).map(spaceSearchRow),
    smartViews: (results.smartViews || []).map(smartViewRow),
    backlinks: backlinks.map(item => entryRow(item, 'backlinks')),
    canvases: (results.canvases || []).map(canvasRow),
    templates: (results.templates || []).map(templateRow),
    memory,
  };
}

function searchCounts(lists, totalCount) {
  return {
    all: totalCount,
    entries: lists.entries.length,
    projects: lists.projects.length,
    notes: lists.notes.length,
    tags: lists.tags.length,
    spaces: lists.spaces.length,
    smartViews: lists.smartViews.length,
    backlinks: lists.backlinks.length,
    canvases: lists.canvases.length,
    templates: lists.templates.length,
    memory: lists.memory.length,
  };
}

function searchSectionsForTab(tab, lists) {
  if (tab === 'all') {
    return [
      ['Entries', lists.entries.slice(0, 4), lists.entries.length, 'entries'],
      ['Projects', lists.projects.slice(0, 3), lists.projects.length, 'projects'],
      ['Notes', lists.notes.slice(0, 3), lists.notes.length, 'notes'],
      ['Spaces', lists.spaces.slice(0, 3), lists.spaces.length, 'spaces'],
      ['Smart Views', lists.smartViews.slice(0, 3), lists.smartViews.length, 'smartViews'],
      ['Templates', lists.templates.slice(0, 3), lists.templates.length, 'templates'],
    ];
  }
  return [[titleCase(tab), lists[tab] || [], (lists[tab] || []).length, tab]];
}

function allVisibleSearchRows(sections) {
  return sections.flatMap(([, rows]) => rows);
}

function openSearchRow(row, { onOpenEntry, onNavigate }) {
  if (!row) return;
  if (row.kind === 'entry') onOpenEntry?.(row.source.id);
  if (row.kind === 'tag') onNavigate?.(`tag:${row.source.name}`);
  if (row.kind === 'canvas') onNavigate?.(`canvas:${row.source.id}`);
  if (row.kind === 'space') onNavigate?.(`space:${row.source.id || row.source.name}`);
  if (row.kind === 'smartView') onNavigate?.(`base:${row.source.id}`);
  if (row.kind === 'template') onNavigate?.('templates');
}

function SearchResultSection({ title, rows, count, tabId, activeId, onSelect, onOpen, onViewAll }) {
  return (
    <section style={{ borderTop: '1px solid rgba(118,137,160,.16)', paddingTop: 14, marginTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: 'var(--tx)' }}>{title}</h2>
        {count > rows.length && (
          <button type="button" onClick={() => onViewAll?.(tabId)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--t3)', fontFamily: 'var(--fn)', fontSize: 12, cursor: 'pointer' }}>
            View all ({count})
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: '14px 6px', color: 'var(--t3)', fontSize: 13 }}>No matches.</div>
      ) : rows.map((row, index) => (
        <SearchResultRow key={`${tabId}-${row.id}-${index}`} row={row} selected={activeId === row.id} onSelect={onSelect} onOpen={onOpen} />
      ))}
    </section>
  );
}

function SearchResultRow({ row, selected, onSelect, onOpen }) {
  return (
    <button
      type="button"
      aria-label={`Select ${row.title}`}
      onClick={() => onSelect?.(row)}
      onDoubleClick={() => onOpen?.(row)}
      style={{
        width: '100%',
        minHeight: 54,
        display: 'grid',
        gridTemplateColumns: '30px minmax(0, 1fr) minmax(160px, auto) 100px',
        alignItems: 'center',
        gap: 11,
        border: 'none',
        borderBottom: '1px solid rgba(118,137,160,.14)',
        borderRadius: selected ? 4 : 0,
        background: selected ? 'linear-gradient(90deg, rgba(54,130,224,.34), rgba(54,130,224,.16))' : 'transparent',
        color: 'var(--tx)',
        cursor: 'pointer',
        fontFamily: 'var(--fn)',
        textAlign: 'left',
        padding: '7px 8px 7px 12px',
      }}
    >
      <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 5, display: 'grid', placeItems: 'center', color: row.group === 'projects' ? '#58a6ff' : row.group === 'memory' ? '#a855f7' : row.group === 'tags' ? '#dbeafe' : '#f59e0b', border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.045)', fontSize: 14 }}>{row.icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 760, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{row.title}</span>
        <span style={{ display: 'block', marginTop: 3, color: 'var(--t3)', fontSize: 12, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{row.path}</span>
      </span>
      <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', minWidth: 0 }}>
        {row.tags.slice(0, 3).map(tag => <span key={tag} style={pillStyle}>#{tag}</span>)}
      </span>
      <span style={{ color: 'var(--t3)', fontSize: 12, textAlign: 'right', whiteSpace: 'nowrap' }}>{formatSearchDate(row.date)}</span>
    </button>
  );
}

function SearchDetailRail({ row, backlinks, unresolved, onOpenEntry, onNavigate, onRevealEntry, onClearSelection, onOpenInConstellation }) {
  const [message, setMessage] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  if (!row) {
    return (
      <aside style={searchRailStyle}>
        <div style={{ color: 'var(--t3)', fontSize: 13 }}>Select a result to see context.</div>
      </aside>
    );
  }
  const entry = row.kind === 'entry' ? row.source : null;
  const copyText = async (value, label) => {
    try {
      await navigator.clipboard?.writeText(value);
      setMessage(`${label} copied`);
    } catch {
      setMessage(value);
    }
  };
  return (
    <aside style={searchRailStyle}>
      <div style={{ display: 'flex', alignItems: 'start', gap: 12, marginBottom: 22 }}>
        <span aria-hidden="true" style={{ width: 25, height: 25, display: 'grid', placeItems: 'center', color: '#dbeafe', fontSize: 20 }}>{row.icon}</span>
        <span style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--tx)', lineHeight: 1.25 }}>{row.title}</h2>
          <span style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', color: 'var(--t3)', fontSize: 12 }}>
            <span>{row.kind === 'entry' ? 'Entry' : titleCase(row.kind)}</span>
            <span style={{ ...pillStyle, margin: 0 }}>{row.typeLabel}</span>
          </span>
        </span>
        <button type="button" aria-label="Close selected result" onClick={() => onClearSelection?.()} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 22 }}>×</button>
      </div>

      <SearchRailSection title="Info">
        <InfoLine label="Local path" value={row.path} />
        {entry && <InfoLine label="Last modified" value={formatSearchDate(entry.modified || entry.date || entry.entry_date)} />}
        {entry && <InfoLine label="Created" value={formatSearchDate(entry.created || entry.entry_date || entry.date)} />}
        {entry && <InfoLine label="Size" value={entrySize(entry)} />}
        {entry && <InfoLine label="Status" value={<span><span style={{ color: '#22c55e' }}>●</span> {displayStatus(entry.status) || 'OK'}</span>} />}
      </SearchRailSection>

      {row.tags.length > 0 && (
        <SearchRailSection title="Tags">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {row.tags.map(tag => (
              <button key={tag} type="button" onClick={() => onNavigate?.(`tag:${tag}`)} style={{ ...pillStyle, border: 'none', cursor: 'pointer' }}>#{tag}</button>
            ))}
          </div>
        </SearchRailSection>
      )}

      {entry && (
        <SearchRailSection title={`Backlinks (${backlinks.length})`}>
          {backlinks.slice(0, 3).map(item => (
            <button key={item.id} type="button" onClick={() => onOpenEntry?.(item.id)} style={searchRailListButton()}>
              <span style={{ color: '#58a6ff' }}>{ICON[item.type] || '▣'}</span>
              <span>{item.title || 'Untitled'}</span>
            </button>
          ))}
          {backlinks.length > 3 && <div style={{ color: 'var(--t3)', fontSize: 12, paddingTop: 5 }}>+ {backlinks.length - 3} more</div>}
          {backlinks.length === 0 && <div style={{ color: 'var(--t3)', fontSize: 12 }}>No backlinks yet.</div>}
        </SearchRailSection>
      )}

      {entry && (
        <SearchRailSection title={`Unresolved links (${unresolved.length})`}>
          {unresolved.slice(0, 4).map(item => (
            <div key={item.target || item} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '5px 0', color: 'var(--t2)', fontSize: 13 }}>
              <span style={{ color: '#f97316' }}>⊗</span>
              <span>{item.target || item}</span>
            </div>
          ))}
          {unresolved.length === 0 && <div style={{ color: 'var(--t3)', fontSize: 12 }}>No unresolved links.</div>}
        </SearchRailSection>
      )}

      <SearchRailSection title="Actions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <SearchActionButton primary onClick={() => openSearchRow(row, { onOpenEntry, onNavigate })}>{searchOpenLabel(row)} ↗</SearchActionButton>
          {entry ? <SearchActionButton onClick={() => onRevealEntry?.(entry)}>Reveal in Vault</SearchActionButton> : <SearchActionButton onClick={() => copyText(row.path, 'Path')}>Copy Path</SearchActionButton>}
          <SearchActionButton onClick={() => copyText(row.path, 'Local path')}>Copy Local path</SearchActionButton>
          <SearchActionButton onClick={() => {
            if (entry && onOpenInConstellation) onOpenInConstellation(entry);
            else onNavigate?.('graph');
          }}>Open in Constellation</SearchActionButton>
        </div>
        <div style={{ position: 'relative', marginTop: 10 }}>
          <SearchActionButton onClick={() => setMoreOpen(open => !open)}>More ⌄</SearchActionButton>
          {moreOpen && (
            <div style={{ position: 'absolute', right: 0, top: 40, zIndex: 2, minWidth: 170, border: '1px solid var(--br)', borderRadius: 8, background: '#151c24', boxShadow: '0 18px 42px rgba(0,0,0,.35)', padding: 6 }}>
              <button type="button" onClick={() => copyText(row.title, 'Title')} style={moreMenuButtonStyle}>Copy title</button>
              <button type="button" onClick={() => copyText(row.id, 'Result id')} style={moreMenuButtonStyle}>Copy result id</button>
              {row.kind === 'entry' && <button type="button" onClick={() => onNavigate?.('raw')} style={moreMenuButtonStyle}>Open Inbox</button>}
            </div>
          )}
        </div>
        {message && <div aria-live="polite" style={{ marginTop: 10, color: 'var(--t3)', fontSize: 12 }}>{message}</div>}
      </SearchRailSection>
    </aside>
  );
}

const searchRailStyle = {
  width: 420,
  flexShrink: 0,
  minHeight: 0,
  overflowY: 'auto',
  borderLeft: '1px solid rgba(118,137,160,.18)',
  background: 'rgba(7,12,18,.96)',
  padding: '30px 28px',
  boxSizing: 'border-box',
};

function SearchRailSection({ title, children }) {
  return (
    <section style={{ borderTop: '1px solid rgba(118,137,160,.14)', paddingTop: 18, marginTop: 18 }}>
      <h3 style={{ margin: '0 0 12px', color: 'var(--tx)', fontSize: 14, fontWeight: 800 }}>{title}</h3>
      {children}
    </section>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '96px 1fr', gap: 14, padding: '7px 0', fontSize: 13 }}>
      <span style={{ color: 'var(--t3)' }}>{label}</span>
      <span style={{ color: 'var(--tx)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function SearchActionButton({ children, primary = false, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      minHeight: 38,
      border: primary ? '1px solid rgba(73,143,242,.75)' : '1px solid rgba(118,137,160,.18)',
      borderRadius: 7,
      background: primary ? 'linear-gradient(180deg, #357ee9, #2667cf)' : 'rgba(24,32,42,.78)',
      color: primary ? '#fff' : 'var(--tx)',
      fontFamily: 'var(--fn)',
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      padding: '0 12px',
      textAlign: 'center',
    }}>{children}</button>
  );
}

function searchOpenLabel(row) {
  if (row?.kind === 'canvas') return 'Open Canvas';
  if (row?.kind === 'tag') return 'Open Tag';
  if (row?.kind === 'space') return 'Open Space';
  if (row?.kind === 'smartView') return 'Open Smart View';
  if (row?.kind === 'template') return 'Open Template';
  return 'Open Entry';
}

function searchRailListButton() {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minHeight: 28,
    border: 'none',
    background: 'transparent',
    color: 'var(--t2)',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left',
  };
}

const moreMenuButtonStyle = {
  width: '100%',
  minHeight: 30,
  border: 'none',
  background: 'transparent',
  color: 'var(--t2)',
  textAlign: 'left',
  cursor: 'pointer',
  fontFamily: 'var(--fn)',
  fontSize: 13,
  borderRadius: 6,
  padding: '0 9px',
};

export function GlobalSearchView({ query, setQuery, results, entries = [], onOpenEntry, onNavigate, onQuickSwitcher, onCommandPalette, onRevealEntry, onOpenInConstellation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [explicitlyDeselected, setExplicitlyDeselected] = useState(false);
  const vaultIndex = useMemo(() => buildVaultIndex(entries), [entries]);
  const provisionalRows = useMemo(() => searchRowLists(results, []), [results]);
  const firstSourceEntry = [
    ...provisionalRows.entries,
    ...provisionalRows.projects,
    ...provisionalRows.notes,
    ...provisionalRows.memory,
  ].find(row => row.kind === 'entry')?.source || null;
  const selectedEntryForLinks = selectedId
    ? Object.values(provisionalRows).flat().find(row => row.id === selectedId && row.kind === 'entry')?.source
    : firstSourceEntry;
  const backlinks = selectedEntryForLinks ? getBacklinks(vaultIndex, selectedEntryForLinks.id) : [];
  const lists = useMemo(() => searchRowLists(results, backlinks), [results, backlinks]);
  const totalCount = Object.values(lists).reduce((total, rows) => total + rows.length, 0);
  const counts = searchCounts(lists, totalCount);
  const sections = searchSectionsForTab(activeTab, lists);
  const visibleRows = allVisibleSearchRows(sections);
  const selectedRow = explicitlyDeselected
    ? null
    : Object.values(lists).flat().find(row => row.id === selectedId) || visibleRows[0] || null;
  const selectedEntry = selectedRow?.kind === 'entry' ? selectedRow.source : null;
  const selectedBacklinks = selectedEntry ? getBacklinks(vaultIndex, selectedEntry.id) : [];
  const unresolved = Array.isArray(selectedEntry?.unresolvedTargets) ? selectedEntry.unresolvedTargets : [];

  useEffect(() => {
    setExplicitlyDeselected(false);
    if (!visibleRows.length) {
      setSelectedId('');
      return;
    }
    if (!visibleRows.some(row => row.id === selectedId)) setSelectedId(visibleRows[0].id);
  }, [activeTab, query, totalCount]);

  const selectByOffset = offset => {
    if (!visibleRows.length) return;
    const current = visibleRows.findIndex(row => row.id === (selectedRow?.id || selectedId));
    const nextIndex = Math.max(0, Math.min(visibleRows.length - 1, (current === -1 ? 0 : current) + offset));
    setSelectedId(visibleRows[nextIndex].id);
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden', background: 'var(--bg)' }}>
      <main style={{ flex: 1, minWidth: 0, minHeight: 0, overflowY: 'auto', padding: '28px 32px 22px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'start', marginBottom: 28 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ margin: 0, color: 'var(--tx)', fontSize: 24, fontWeight: 850, letterSpacing: 0 }}>Search / Quick Switcher</h1>
            <p style={{ margin: '8px 0 0', color: 'var(--t2)', fontSize: 14 }}>Search across your Vault. Use Quick Switcher (Ctrl+O) or Command Palette (Ctrl+P).</p>
          </div>
          <button type="button" onClick={onQuickSwitcher} style={modalishHeaderButtonStyle}>Quick Switcher <span style={{ color: 'var(--t3)', marginLeft: 10 }}>⌘O</span></button>
          <button type="button" onClick={onCommandPalette} style={modalishHeaderButtonStyle}>Command Palette <span style={{ color: 'var(--t3)', marginLeft: 10 }}>⌘P</span></button>
        </div>

        <div style={{ position: 'relative', marginBottom: 14 }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 17, top: 16, color: 'var(--t3)', fontSize: 18 }}>⌕</span>
          <input
            aria-label="Search all workstation data"
            value={query}
            onChange={event => setQuery?.(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Escape') setQuery?.('');
              if (event.key === 'ArrowDown') { event.preventDefault(); selectByOffset(1); }
              if (event.key === 'ArrowUp') { event.preventDefault(); selectByOffset(-1); }
              if (event.key === 'Enter') { event.preventDefault(); openSearchRow(selectedRow, { onOpenEntry, onNavigate }); }
            }}
            placeholder="Search notes, projects, people, tags..."
            style={{
              width: '100%',
              minHeight: 44,
              boxSizing: 'border-box',
              border: '1px solid rgba(58,129,224,.72)',
              borderRadius: 6,
              background: 'rgba(11,17,24,.68)',
              color: 'var(--tx)',
              fontFamily: 'var(--fn)',
              fontSize: 15,
              outline: 'none',
              padding: '0 44px 0 44px',
              boxShadow: '0 0 0 1px rgba(58,129,224,.18), inset 0 1px 0 rgba(255,255,255,.03)',
            }}
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery?.('')} style={{ position: 'absolute', right: 10, top: 7, width: 30, height: 30, border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 20 }}>×</button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
          {searchTabs.map(([id, label]) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  minHeight: 36,
                  border: '1px solid rgba(118,137,160,.12)',
                  borderRadius: 7,
                  background: active ? 'linear-gradient(180deg, rgba(63,135,238,.34), rgba(63,135,238,.18))' : 'rgba(25,33,43,.56)',
                  color: active ? '#fff' : 'var(--t2)',
                  borderBottomColor: active ? '#3b82f6' : 'rgba(118,137,160,.12)',
                  fontFamily: 'var(--fn)',
                  fontSize: 13,
                  fontWeight: 760,
                  cursor: 'pointer',
                  padding: '0 13px',
                }}
              >
                {label} <span style={{ marginLeft: 5, color: active ? '#dbeafe' : 'var(--t3)' }}>{counts[id] || 0}</span>
              </button>
            );
          })}
        </div>

        {sections.map(([title, rows, count, tabId]) => (
          <SearchResultSection
            key={tabId}
            title={title}
            rows={rows}
            count={count}
            tabId={tabId}
            activeId={selectedRow?.id}
            onSelect={row => { setExplicitlyDeselected(false); setSelectedId(row.id); }}
            onOpen={row => openSearchRow(row, { onOpenEntry, onNavigate })}
            onViewAll={setActiveTab}
          />
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, color: 'var(--t3)', fontSize: 13 }}>
          {/* No fabricated timer — show a real count or nothing. Removed misleading "Open in new tab" button (it opened the whole app, not the focused entry). */}
          <span>{totalCount} result{totalCount === 1 ? '' : 's'}</span>
        </div>
      </main>
      <SearchDetailRail
        row={selectedRow}
        backlinks={selectedBacklinks}
        unresolved={unresolved}
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onRevealEntry={onRevealEntry}
        onClearSelection={() => setExplicitlyDeselected(true)}
        onOpenInConstellation={onOpenInConstellation}
      />
    </div>
  );
}

const modalishHeaderButtonStyle = {
  minHeight: 36,
  border: '1px solid rgba(118,137,160,.18)',
  borderRadius: 7,
  background: 'rgba(25,33,43,.62)',
  color: 'var(--tx)',
  fontFamily: 'var(--fn)',
  fontSize: 13,
  fontWeight: 760,
  cursor: 'pointer',
  padding: '0 15px',
  whiteSpace: 'nowrap',
};

const inboxTabs = [
  { id: 'all', label: 'All' },
  { id: 'unreviewed', label: 'Unreviewed' },
  { id: 'flagged', label: 'Flagged' },
  { id: 'files', label: 'Files' },
  { id: 'links', label: 'Links' },
  { id: 'media', label: 'Media' },
];

function matchesInboxTab(entry, tab) {
  const status = String(entry?.status || '').toLowerCase();
  if (tab === 'unreviewed') return !['processed', 'archived', 'done', 'complete'].includes(status);
  if (tab === 'flagged') return !!entry?.starred || ['flagged', 'urgent', 'high'].includes(String(entry?.priority || '').toLowerCase());
  if (tab === 'files') return captureHasFile(entry);
  if (tab === 'links') return captureHasLink(entry);
  if (tab === 'media') return captureIsMedia(entry);
  return true;
}

function inboxCounts(entries) {
  return inboxTabs.reduce((counts, tab) => {
    counts[tab.id] = entries.filter(entry => matchesInboxTab(entry, tab.id)).length;
    return counts;
  }, {});
}

function sortInboxEntries(entries, sortMode) {
  return [...entries].sort((a, b) => {
    if (sortMode === 'oldest') return entryTimestamp(a) - entryTimestamp(b) || String(a.title || '').localeCompare(String(b.title || ''));
    if (sortMode === 'title') return String(a.title || '').localeCompare(String(b.title || ''));
    if (sortMode === 'source') return captureSource(a).source.localeCompare(captureSource(b).source) || String(a.title || '').localeCompare(String(b.title || ''));
    return entryTimestamp(b) - entryTimestamp(a) || String(a.title || '').localeCompare(String(b.title || ''));
  });
}

export function InboxView({ entries = [], onOpenEntry, onUpdateEntry, onCompileRaw, onBulkTrash, onAdd }) {
  const [tab, setTab] = useState('all');
  const [sortMode, setSortMode] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [tagFilter, setTagFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [tagEditorId, setTagEditorId] = useState('');
  const [tagDraft, setTagDraft] = useState('');

  const captures = useMemo(() => entries.filter(entry => entry.type === 'raw'), [entries]);
  const counts = useMemo(() => inboxCounts(captures), [captures]);
  const visibleCaptures = useMemo(() => {
    const filtered = captures.filter(entry => {
      if (!matchesInboxTab(entry, tab)) return false;
      const cleanTag = tagFilter.trim().replace(/^#/, '').toLowerCase();
      if (cleanTag && !(entry.tags || []).some(tag => String(tag).toLowerCase().includes(cleanTag))) return false;
      return true;
    });
    return sortInboxEntries(filtered, sortMode);
  }, [captures, tab, tagFilter, sortMode]);

  const selectedVisibleIds = visibleCaptures.filter(entry => selectedIds.has(entry.id)).map(entry => entry.id);
  const allVisibleSelected = visibleCaptures.length > 0 && selectedVisibleIds.length === visibleCaptures.length;
  const selectedCount = selectedIds.size;

  const toggleEntry = (id, on) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const selectVisible = on => setSelectedIds(prev => {
    const next = new Set(prev);
    visibleCaptures.forEach(entry => {
      if (on) next.add(entry.id);
      else next.delete(entry.id);
    });
    return next;
  });
  const updateMany = patch => {
    selectedIds.forEach(id => onUpdateEntry?.(id, typeof patch === 'function' ? patch(entries.find(entry => entry.id === id)) : patch));
  };
  const clearSelection = () => setSelectedIds(new Set());
  const openTagEditor = entry => {
    setTagEditorId(entry.id);
    setTagDraft((entry.tags || []).join(', '));
  };
  const saveTags = entry => {
    const tags = tagDraft.split(',').map(tag => tag.trim().replace(/^#/, '')).filter(Boolean);
    onUpdateEntry?.(entry.id, { tags: [...new Set(tags)] });
    setTagEditorId('');
  };

  return (
    <div style={{ ...pageStyle, padding: '24px 24px 28px', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
        <div>
          <h1 style={{ ...titleStyle, fontSize: 24, fontWeight: 760, marginBottom: 7 }}>Inbox</h1>
          <div style={{ ...subStyle, fontSize: 13 }}>New captures and imports. Review, tag, route, or compile.</div>
        </div>
        <SmallButton onClick={() => onAdd?.('raw')}>New Capture</SmallButton>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div role="tablist" aria-label="Inbox filters" style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {inboxTabs.map(item => {
            const selected = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(item.id)}
                style={{
                  border: 'none',
                  borderBottom: `1px solid ${selected ? '#4d8dff' : 'transparent'}`,
                  background: selected ? 'rgba(77,141,255,.10)' : 'transparent',
                  color: selected ? 'var(--tx)' : 'var(--t3)',
                  borderRadius: '6px 6px 0 0',
                  padding: '7px 10px',
                  fontFamily: 'var(--fn)',
                  fontSize: 12,
                  fontWeight: 650,
                  cursor: 'pointer',
                }}>
                {item.label} <span style={{ color: selected ? '#9fc0ff' : 'var(--t3)', marginLeft: 4 }}>{counts[item.id] || 0}</span>
              </button>
            );
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => setShowFilters(open => !open)} style={inboxToolbarButtonStyle(showFilters)}>▽ Filter</button>
          <label style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Sort inbox</span>
            <select value={sortMode} onChange={event => setSortMode(event.target.value)} style={{ ...inboxToolbarButtonStyle(false), paddingRight: 28 }}>
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
              <option value="title">Sort: Title</option>
              <option value="source">Sort: Source</option>
            </select>
          </label>
          <button type="button" onClick={() => setShowBulk(open => !open)} style={inboxToolbarButtonStyle(showBulk)} disabled={selectedCount === 0}>Bulk actions{selectedCount ? ` (${selectedCount})` : ''}</button>
        </div>
      </div>

      {(showFilters || showBulk) && (
        <div style={{ ...cardStyle, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12, padding: 10 }}>
          {showFilters && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)' }}>
                Tag
                <input
                  value={tagFilter}
                  onChange={event => setTagFilter(event.target.value)}
                  placeholder="#research"
                  style={{ width: 150, border: '1px solid var(--br)', borderRadius: 6, background: 'rgba(255,255,255,.035)', color: 'var(--tx)', padding: '7px 9px', fontFamily: 'var(--fn)', fontSize: 12 }}
                />
              </label>
              {tagFilter && <button type="button" onClick={() => setTagFilter('')} style={inboxToolbarButtonStyle(false)}>Clear filter</button>}
            </>
          )}
          {showBulk && (
            <>
              <button type="button" onClick={() => { updateMany({ status: 'processed' }); clearSelection(); }} style={inboxToolbarButtonStyle(false)}>Mark processed</button>
              <button type="button" onClick={() => updateMany({ starred: true })} style={inboxToolbarButtonStyle(false)}>Flag selected</button>
              <button type="button" onClick={() => { onBulkTrash?.([...selectedIds]); clearSelection(); }} style={inboxToolbarButtonStyle(false)}>Move to Trash</button>
              <button type="button" onClick={clearSelection} style={inboxToolbarButtonStyle(false)}>Clear selection</button>
            </>
          )}
        </div>
      )}

      <div style={{ border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.018))', overflow: 'hidden', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.025)' }}>
        <div style={inboxGridHeaderStyle()}>
          <input type="checkbox" checked={allVisibleSelected} onChange={event => selectVisible(event.target.checked)} aria-label="Select all visible inbox captures" style={{ accentColor: 'var(--ac)' }} />
          <span>Entry</span>
          <span>Captured</span>
          <span>Source</span>
          <span>Tags</span>
          <span style={{ textAlign: 'right' }}>Actions</span>
        </div>
        {visibleCaptures.length === 0 ? (
          <div style={{ padding: 26 }}>
            <EmptyStateCard
              title={captures.length ? 'No captures match this view' : 'Inbox is clear'}
              detail={captures.length ? 'Change the tab, sort, or tag filter to bring captures back into view.' : 'New captures land here first so you can review, tag, route, or compile them before they become durable notes or memory.'}
              action={<SmallButton onClick={() => onAdd?.('raw')}>New Capture</SmallButton>}
            />
          </div>
        ) : visibleCaptures.map(entry => (
          <InboxCaptureRow
            key={entry.id}
            entry={entry}
            selected={selectedIds.has(entry.id)}
            onSelected={on => toggleEntry(entry.id, on)}
            onOpen={() => onOpenEntry?.(entry.id)}
            onFlag={() => onUpdateEntry?.(entry.id, { starred: !entry.starred })}
            onTag={() => openTagEditor(entry)}
            onCompile={() => onCompileRaw?.(entry.id)}
            editingTags={tagEditorId === entry.id}
            tagDraft={tagDraft}
            onTagDraft={setTagDraft}
            onSaveTags={() => saveTags(entry)}
            onCancelTags={() => setTagEditorId('')}
          />
        ))}
      </div>
    </div>
  );
}

function InboxCaptureRow({ entry, selected, onSelected, onOpen, onFlag, onTag, onCompile, editingTags, tagDraft, onTagDraft, onSaveTags, onCancelTags }) {
  const source = captureSource(entry);
  const icon = captureIcon(entry);
  return (
    <div style={{ borderTop: '1px solid var(--br)' }}>
      <div style={inboxGridRowStyle()}>
        <input type="checkbox" checked={selected} onChange={event => onSelected?.(event.target.checked)} aria-label={`Select ${entry.title || 'capture'}`} style={{ accentColor: 'var(--ac)' }} />
        <button type="button" onClick={onOpen} aria-label={`Open ${entry.title || 'capture'}`} style={{ all: 'unset', display: 'grid', gridTemplateColumns: '44px minmax(0,1fr)', gap: 12, alignItems: 'center', minWidth: 0, cursor: 'pointer', color: 'var(--tx)', fontFamily: 'var(--fn)' }}>
          <span aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 7, background: icon.bg, color: icon.color, display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)', fontSize: 18, fontWeight: 850 }}>
            {icon.glyph}
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 720, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title || 'Untitled capture'}</span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 11, lineHeight: 1.35, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.notes || entry.summary || entry._path || 'Ready to review.'}</span>
            <span style={{ display: 'block', marginTop: 4, fontSize: 9, letterSpacing: .6, color: icon.color, fontWeight: 800 }}>{icon.label}</span>
          </span>
        </button>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: 'block', color: 'var(--tx)', fontSize: 12, fontWeight: 600 }}>{captureTimeLabel(entry)}</span>
          <span style={{ display: 'block', color: 'var(--t3)', fontSize: 11, marginTop: 4 }}>{captureDayLabel(entry)}</span>
        </span>
        <span style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span aria-hidden="true" style={{ width: 16, color: 'var(--t3)', flexShrink: 0 }}>{captureKind(entry) === 'audio' ? '≋' : captureKind(entry) === 'image' ? '▱' : '◎'}</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', color: 'var(--tx)', fontSize: 12, fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{source.source}</span>
            {source.meta && <span style={{ display: 'block', color: 'var(--t3)', fontSize: 11, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{source.meta}</span>}
          </span>
        </span>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', minWidth: 0 }}>
          {(entry.tags || []).slice(0, 4).map(tag => {
            const tone = tagTone(tag);
            return <span key={tag} style={{ ...pillStyle, color: tone.color, background: tone.bg, border: '1px solid rgba(255,255,255,.04)' }}>#{tag}</span>;
          })}
          {entry.status && <span style={pillStyle}>{displayStatus(entry.status)}</span>}
        </span>
        <span style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onFlag} aria-label={`${entry.starred ? 'Unflag' : 'Flag'} ${entry.title || 'capture'}`} style={inboxActionButtonStyle(entry.starred)}>{entry.starred ? '⚑' : '⚐'}</button>
          <button type="button" onClick={onTag} aria-label={`Edit tags for ${entry.title || 'capture'}`} style={inboxActionButtonStyle(false)}>◇</button>
          <button type="button" onClick={onCompile} aria-label={`Compile ${entry.title || 'capture'}`} style={inboxActionButtonStyle(false)}>⋮</button>
        </span>
      </div>
      {editingTags && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 14px 70px' }}>
          <input value={tagDraft} onChange={event => onTagDraft(event.target.value)} aria-label={`Tags for ${entry.title || 'capture'}`} placeholder="research, interview" style={{ flex: 1, minWidth: 160, border: '1px solid var(--br)', borderRadius: 6, background: 'rgba(255,255,255,.035)', color: 'var(--tx)', padding: '8px 10px', fontFamily: 'var(--fn)', fontSize: 12 }} />
          <button type="button" onClick={onSaveTags} style={inboxToolbarButtonStyle(false)}>Save tags</button>
          <button type="button" onClick={onCancelTags} style={inboxToolbarButtonStyle(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

function inboxGridHeaderStyle() {
  return {
    display: 'grid',
    gridTemplateColumns: '34px minmax(260px,1.45fr) 110px minmax(150px,.55fr) minmax(180px,.75fr) 112px',
    gap: 14,
    alignItems: 'center',
    minWidth: 900,
    padding: '10px 14px',
    color: 'var(--t3)',
    fontSize: 11,
    fontWeight: 650,
    borderBottom: '1px solid var(--br)',
  };
}

function inboxGridRowStyle() {
  return {
    display: 'grid',
    gridTemplateColumns: '34px minmax(260px,1.45fr) 110px minmax(150px,.55fr) minmax(180px,.75fr) 112px',
    gap: 14,
    alignItems: 'center',
    minWidth: 900,
    minHeight: 76,
    padding: '12px 14px',
  };
}

function inboxToolbarButtonStyle(active) {
  return {
    border: '1px solid ' + (active ? 'rgba(77,141,255,.42)' : 'var(--br)'),
    borderRadius: 7,
    background: active ? 'rgba(77,141,255,.12)' : 'rgba(255,255,255,.025)',
    color: active ? '#cfe0ff' : 'var(--t2)',
    minHeight: 32,
    padding: '0 10px',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };
}

function inboxActionButtonStyle(active) {
  return {
    width: 26,
    height: 26,
    border: '1px solid transparent',
    borderRadius: 6,
    background: 'transparent',
    color: active ? '#facc15' : 'var(--t2)',
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 17,
    lineHeight: 1,
  };
}

const PROJECT_NOTE_TYPES = new Set(['note', 'journal', 'article', 'link', 'wiki', 'review']);
const PROJECT_TONES = ['#4d8dff', '#22c55e', '#f59e0b', '#a855f7', '#94a3b8', '#ef4444'];

function projectRefs(entry = {}) {
  return new Set([entry.id, entry.title, entry._path, entry.path].filter(Boolean).map(String));
}

function parseProjectProgress(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/);
  return match ? Math.max(0, Math.min(100, Number(match[0]))) : 0;
}

function projectPath(entry = {}) {
  return entry._path || entry.path || `/Vault/Projects/${entry.title || 'Untitled Project'}.md`;
}

function projectActivity(row) {
  return Number(row.lastActivity) || entryTimestamp(row.entry) || 0;
}

function canvasLinksProject(canvas, project) {
  const refs = projectRefs(project);
  return (canvas?.nodes || []).some(node => node?.type === 'file' && refs.has(String(node.file || '')));
}

function withProjectMetrics(row, canvases = []) {
  const entry = row?.entry || row || {};
  const linkedEntries = Array.isArray(row?.linkedEntries) ? row.linkedEntries : [];
  const canvasCount = canvases.filter(canvas => canvasLinksProject(canvas, entry)).length || Number(row?.canvasCount || 0);
  const noteCount = Number(row?.noteCount ?? linkedEntries.filter(item => PROJECT_NOTE_TYPES.has(item.type)).length);
  const progress = parseProjectProgress(row?.progress ?? entry.progress);
  return {
    ...row,
    entry,
    linkedEntries,
    noteCount,
    canvasCount,
    entryCount: Number(row?.entryCount ?? linkedEntries.length),
    taskCount: Number(row?.taskCount ?? linkedEntries.filter(item => item.type === 'task').length),
    backlinkCount: Number(row?.backlinkCount ?? 0),
    progress,
    path: projectPath(entry),
    status: String(row?.status || entry.status || 'active'),
  };
}

function isArchivedProject(row) {
  return String(row?.entry?.status || row?.status || '').toLowerCase() === 'archived';
}

function sortProjectRows(rows, sort) {
  const sorted = rows.slice();
  sorted.sort((a, b) => {
    if (sort === 'name-desc') return String(b.entry.title || '').localeCompare(String(a.entry.title || ''));
    if (sort === 'updated-asc') return projectActivity(a) - projectActivity(b);
    if (sort === 'updated-desc') return projectActivity(b) - projectActivity(a);
    if (sort === 'entries-desc') return (b.entryCount || 0) - (a.entryCount || 0) || String(a.entry.title || '').localeCompare(String(b.entry.title || ''));
    return String(a.entry.title || '').localeCompare(String(b.entry.title || ''));
  });
  return sorted;
}

function projectContext(row) {
  return {
    id: row.entry.id,
    title: row.entry.title || 'Untitled Project',
    path: row.path,
    tags: row.entry.tags || [],
  };
}

function projectIcon(index, selected) {
  const color = PROJECT_TONES[index % PROJECT_TONES.length];
  return (
    <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 7, display: 'grid', placeItems: 'center', color, border: `1px solid ${color}`, background: selected ? `${color}22` : `${color}12`, fontWeight: 850 }}>
      {ICON.project}
    </span>
  );
}

function projectTabStyle(active) {
  return {
    minHeight: 36,
    padding: '0 15px',
    border: `1px solid ${active ? 'rgba(77,141,255,.52)' : 'transparent'}`,
    borderBottomColor: active ? '#4d8dff' : 'transparent',
    borderRadius: 7,
    background: active ? 'rgba(77,141,255,.15)' : 'transparent',
    color: active ? '#dbeafe' : 'var(--t2)',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    fontWeight: 750,
    cursor: 'pointer',
  };
}

function projectToolbarButtonStyle(active = false) {
  return {
    minHeight: 38,
    padding: '0 13px',
    border: `1px solid ${active ? 'rgba(77,141,255,.48)' : 'rgba(118,137,160,.18)'}`,
    borderRadius: 7,
    background: active ? 'rgba(77,141,255,.14)' : 'rgba(255,255,255,.025)',
    color: active ? '#dbeafe' : 'var(--t2)',
    fontFamily: 'var(--fn)',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
  };
}

function projectCardStyle(selected) {
  return {
    minHeight: 210,
    border: `1px solid ${selected ? 'rgba(77,141,255,.56)' : 'rgba(118,137,160,.18)'}`,
    borderRadius: 8,
    background: selected
      ? 'linear-gradient(180deg, rgba(77,141,255,.11), rgba(17,24,32,.64))'
      : 'linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.018))',
    color: 'var(--tx)',
    padding: 20,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
    boxShadow: selected ? '0 0 0 1px rgba(77,141,255,.12), inset 0 1px 0 rgba(255,255,255,.035)' : 'inset 0 1px 0 rgba(255,255,255,.025)',
  };
}

function ProjectMetricRow({ icon, label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '18px minmax(0,1fr) auto', alignItems: 'center', gap: 10, color: 'var(--t2)', fontSize: 12 }}>
      <span aria-hidden="true" style={{ color: 'var(--t3)' }}>{icon}</span>
      <span>{label}</span>
      <span style={{ color: 'var(--tx)', fontWeight: 650 }}>{value}</span>
    </div>
  );
}

function ProjectCard({ row, index, selected, onSelect, onOpenEntry, onToggleStar }) {
  const entry = row.entry;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select project ${entry.title || 'Untitled Project'}`}
      onClick={onSelect}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.();
        }
      }}
      style={projectCardStyle(selected)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
        {projectIcon(index, selected)}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ minWidth: 0, flex: 1, color: 'var(--tx)', fontSize: 16, fontWeight: 850, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title || 'Untitled Project'}</div>
            <button
              type="button"
              aria-label={`${entry.starred ? 'Unfavorite' : 'Favorite'} ${entry.title || 'project'}`}
              onClick={event => { event.stopPropagation(); onToggleStar?.(); }}
              style={{ border: 'none', background: 'transparent', color: entry.starred ? '#facc15' : 'var(--t3)', cursor: 'pointer', fontSize: 20, fontFamily: 'var(--fn)' }}
            >
              {entry.starred ? '★' : '☆'}
            </button>
          </div>
          <div style={{ marginTop: 8, color: 'var(--t2)', fontSize: 13, lineHeight: 1.45 }}>{entry.notes || entry.summary || 'Local knowledge project.'}</div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <ProjectMetricRow icon="□" label="Entries" value={row.entryCount} />
        <ProjectMetricRow icon="▤" label="Notes" value={row.noteCount} />
        <ProjectMetricRow icon="▢" label="Canvases" value={row.canvasCount} />
        <ProjectMetricRow icon="⌘" label="Backlinks" value={row.backlinkCount} />
      </div>
      <div style={{ marginTop: 14, color: 'var(--t3)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.path}</div>
      <Tags values={entry.tags || []} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 14 }}>
        <span style={{ color: 'var(--t3)', fontSize: 12 }}>{row.progress}%</span>
        <ProgressLine value={row.progress} compact color={PROJECT_TONES[index % PROJECT_TONES.length]} />
        <button
          type="button"
          onClick={event => { event.stopPropagation(); onOpenEntry?.(entry.id); }}
          style={{ border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 12 }}
        >
          Open
        </button>
      </div>
    </div>
  );
}

function ProjectListItem({ row, index, selected, onSelect, onToggleStar }) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Select project ${row.entry.title || 'Untitled Project'}`}
      onClick={onSelect}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect?.();
        }
      }}
      style={{ ...projectCardStyle(selected), minHeight: 72, display: 'grid', gridTemplateColumns: '32px minmax(0,1fr) 44px 86px 86px 140px', alignItems: 'center', gap: 14, padding: '14px 16px' }}
    >
      {projectIcon(index, selected)}
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--tx)', fontSize: 14, fontWeight: 820, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.entry.title}</span>
        <span style={{ display: 'block', color: 'var(--t3)', fontSize: 12, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.path}</span>
      </span>
      <button
        type="button"
        aria-label={`${row.entry.starred ? 'Unfavorite' : 'Favorite'} ${row.entry.title || 'project'}`}
        onClick={event => { event.stopPropagation(); onToggleStar?.(); }}
        style={{ border: 'none', background: 'transparent', color: row.entry.starred ? '#facc15' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 18 }}
      >
        {row.entry.starred ? '★' : '☆'}
      </button>
      <span style={{ color: 'var(--tx)', fontSize: 13 }}>{row.progress}%</span>
      <span style={{ color: 'var(--t2)', fontSize: 13 }}>{displayStatus(row.status)}</span>
      <span style={{ color: 'var(--t3)', fontSize: 12, textAlign: 'right' }}>{projectUpdatedLabel(row)}</span>
    </div>
  );
}

function projectUpdatedLabel(row) {
  const stamp = projectActivity(row);
  if (!stamp) return 'No activity';
  const delta = Date.now() - stamp;
  const hour = 60 * 60 * 1000;
  const day = 24 * hour;
  if (delta < hour) return 'Changed just now';
  if (delta < day) return `Changed ${Math.max(1, Math.round(delta / hour))}h ago`;
  return `Changed ${Math.max(1, Math.round(delta / day))}d ago`;
}

function ProjectTable({ rows, selectedId, onSelect, onOpenEntry, onToggleStar }) {
  return (
    <div data-testid="projects-table" style={{ border: '1px solid rgba(118,137,160,.16)', borderRadius: 8, overflow: 'hidden', background: 'rgba(255,255,255,.018)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.4fr) 80px 80px 90px 100px minmax(140px,.8fr) 96px 92px', gap: 12, padding: '11px 16px', color: 'var(--t3)', fontSize: 12, borderBottom: '1px solid rgba(118,137,160,.16)' }}>
        <span>Project</span>
        <span>Entries</span>
        <span>Notes</span>
        <span>Canvases</span>
        <span>Backlinks</span>
        <span>Tags</span>
        <span>Updated</span>
        <span style={{ textAlign: 'right' }}>Actions</span>
      </div>
      {rows.map((row, index) => {
        const selected = row.entry.id === selectedId;
        return (
          <div key={row.entry.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px,1.4fr) 80px 80px 90px 100px minmax(140px,.8fr) 96px 92px', gap: 12, alignItems: 'center', padding: '13px 16px', borderTop: index ? '1px solid rgba(118,137,160,.13)' : 'none', background: selected ? 'rgba(77,141,255,.09)' : 'transparent' }}>
            <button type="button" aria-label={`Open project row ${row.entry.title || 'Untitled Project'}`} onClick={() => onSelect?.(row.entry.id)} style={{ all: 'unset', minWidth: 0, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', color: 'var(--tx)', fontFamily: 'var(--fn)' }}>
              {projectIcon(index, selected)}
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 780, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.entry.title}</span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.entry.notes || row.entry.summary || row.path}</span>
              </span>
            </button>
            <span style={{ color: 'var(--tx)', fontSize: 13 }}>{row.entryCount}</span>
            <span style={{ color: 'var(--tx)', fontSize: 13 }}>{row.noteCount}</span>
            <span style={{ color: 'var(--tx)', fontSize: 13 }}>{row.canvasCount}</span>
            <span style={{ color: 'var(--tx)', fontSize: 13 }}>{row.backlinkCount}</span>
            <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{(row.entry.tags || []).slice(0, 2).map(tag => <span key={tag} style={pillStyle}>#{tag}</span>)}</span>
            <span style={{ color: 'var(--t3)', fontSize: 12 }}>{projectUpdatedLabel(row)}</span>
            <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" aria-label={`${row.entry.starred ? 'Unfavorite' : 'Favorite'} ${row.entry.title || 'project'} from table`} onClick={() => onToggleStar?.(row)} style={{ border: 'none', background: 'transparent', color: row.entry.starred ? '#facc15' : 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)', fontSize: 17 }}>{row.entry.starred ? '★' : '☆'}</button>
              <button type="button" aria-label={`Open ${row.entry.title || 'project'} entry`} onClick={() => onOpenEntry?.(row.entry.id)} style={{ border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontFamily: 'var(--fn)' }}>...</button>
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ProjectRailList({ title, count, children, action }) {
  return (
    <section style={{ borderTop: '1px solid rgba(118,137,160,.16)', paddingTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h3 style={{ margin: 0, color: 'var(--tx)', fontSize: 15, fontWeight: 820 }}>{title}</h3>
        {count != null && <span style={pillStyle}>{count}</span>}
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {children}
    </section>
  );
}

function ProjectDetailRail({ row, canvases, tab, open = true, onTab, onClose, onOpen, onOpenEntry, onAdd, onNewCanvas, onCreateSmartView, onNavigate, onRevealEntry, onUpdateEntry }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  useEffect(() => {
    setMenuOpen(false);
    setAddingTag(false);
    setTagDraft('');
  }, [row?.entry?.id]);
  if (!row) {
    return (
      <aside aria-label="Project details" style={{ borderLeft: '1px solid rgba(118,137,160,.18)', padding: 28, color: 'var(--t3)' }}>
        Select a project to see its workspace.
      </aside>
    );
  }
  const entry = row.entry;
  if (!open) {
    return (
      <aside aria-label="Project details" style={{ width: 430, minWidth: 360, borderLeft: '1px solid rgba(118,137,160,.18)', background: 'linear-gradient(180deg, rgba(5,11,17,.34), rgba(10,16,22,.58))', padding: '26px 28px', overflowY: 'auto', color: 'var(--t2)' }}>
        <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: 18, fontWeight: 820 }}>Project details</h2>
        <p style={{ margin: '10px 0 16px', color: 'var(--t3)', fontSize: 13, lineHeight: 1.5 }}>Project details are hidden.</p>
        <button type="button" onClick={onOpen} style={projectToolbarButtonStyle(true)}>Show project details</button>
      </aside>
    );
  }
  const projectCanvases = (canvases || []).filter(canvas => canvasLinksProject(canvas, entry));
  const recentEntries = (row.linkedEntries || []).filter(item => item.type !== 'task').slice(0, 5);
  const notes = (row.linkedEntries || []).filter(item => PROJECT_NOTE_TYPES.has(item.type)).slice(0, 5);
  const backlinks = (row.linkedEntries || []).filter(item => (item.links || []).some(ref => projectRefs(entry).has(String(ref)))).slice(0, 5);
  const showEntries =
    tab === 'Entries' ? recentEntries :
    tab === 'Notes' ? notes :
    tab === 'Canvases' ? projectCanvases :
    tab === 'Backlinks' ? backlinks :
    recentEntries;
  const copyText = async text => {
    try { await navigator.clipboard?.writeText(text); } catch { /* browser preview may not expose clipboard */ }
  };
  const newCanvas = () => onNewCanvas?.({
    name: `${entry.title || 'Project'} Canvas`,
    nodes: [
      { id: `file-${entry.id || Date.now()}`, type: 'file', file: entry.id, x: 80, y: 80, width: 280, height: 170 },
    ],
    edges: [],
  });
  const submitProjectTag = () => {
    const next = normalizeTags([...(entry.tags || []), tagDraft]);
    setTagDraft('');
    setAddingTag(false);
    if (next.join('\n') === (entry.tags || []).join('\n')) return;
    onUpdateEntry?.(entry.id, { tags: next });
  };

  return (
    <aside aria-label="Project details" style={{ width: 430, minWidth: 360, borderLeft: '1px solid rgba(118,137,160,.18)', background: 'linear-gradient(180deg, rgba(5,11,17,.34), rgba(10,16,22,.58))', padding: '26px 28px', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: 22, fontWeight: 850, flex: 1 }}>{entry.title || 'Untitled Project'}</h2>
        <button type="button" aria-label="Close project details" onClick={onClose} style={{ border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 22 }}>x</button>
      </div>
      <div role="tablist" aria-label="Project detail sections" style={{ display: 'flex', gap: 4, marginTop: 18, flexWrap: 'wrap' }}>
        {['Overview', 'Entries', 'Notes', 'Canvases', 'Backlinks'].map(label => (
          <button key={label} type="button" role="tab" aria-selected={tab === label} onClick={() => onTab(label)} style={{ ...projectTabStyle(tab === label), minHeight: 31, padding: '0 10px', fontSize: 12 }}>
            {label}{label === 'Entries' ? ` ${row.entryCount}` : label === 'Notes' ? ` ${row.noteCount}` : label === 'Canvases' ? ` ${row.canvasCount}` : label === 'Backlinks' ? ` ${row.backlinkCount}` : ''}
          </button>
        ))}
      </div>
      <p style={{ margin: '20px 0 18px', color: 'var(--t2)', fontSize: 13, lineHeight: 1.55 }}>{entry.notes || entry.summary || 'Core product development and local knowledge project.'}</p>
      <div style={{ display: 'grid', gap: 10, color: 'var(--t2)', fontSize: 13, marginBottom: 22 }}>
        <ProjectMetricRow icon="▱" label="Local path" value={row.path} />
        <ProjectMetricRow icon="□" label="Created" value={entryDate(entry) || 'Unknown'} />
        <ProjectMetricRow icon="▤" label="Last modified" value={projectUpdatedLabel(row)} />
        <div style={{ display: 'grid', gridTemplateColumns: '18px minmax(0,1fr)', gap: 10 }}>
          <span aria-hidden="true" style={{ color: 'var(--t3)' }}>#</span>
          <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(entry.tags || []).map(tag => <span key={tag} style={pillStyle}>#{tag}</span>)}
            {addingTag ? (
              <input
                aria-label="Add project tag"
                value={tagDraft}
                onChange={event => setTagDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitProjectTag();
                  }
                  if (event.key === 'Escape') {
                    setAddingTag(false);
                    setTagDraft('');
                  }
                }}
                autoFocus
                style={{ minHeight: 24, maxWidth: 150, border: '1px solid var(--br)', borderRadius: 999, background: 'rgba(255,255,255,.035)', color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 12, padding: '0 8px' }}
              />
            ) : (
              <button type="button" aria-label="Add project tag" onClick={() => setAddingTag(true)} style={{ ...pillStyle, cursor: 'pointer' }}>+ Add tag</button>
            )}
          </span>
        </div>
        <ProjectMetricRow icon="●" label="Status" value={displayStatus(entry.status || row.status)} />
      </div>

      <ProjectRailList title={tab === 'Overview' ? 'Recent Entries' : tab} count={showEntries.length} action={<TextActionButton ariaLabel="View all project entries" onClick={() => onTab?.('Entries')}>View all</TextActionButton>}>
        {showEntries.length ? showEntries.map(item => (
          item.nodes ? (
            <button key={item.id} type="button" onClick={() => onNavigate?.(`canvas:${item.id}`)} style={{ ...rowButtonStyle, border: 'none', borderTop: '1px solid rgba(118,137,160,.13)', borderRadius: 0, background: 'transparent', padding: '11px 0' }}>
              <span>{ICON.raw}</span><span>{item.name}</span>
            </button>
          ) : (
            <button key={item.id} type="button" onClick={() => onOpenEntry?.(item.id)} style={{ ...rowButtonStyle, border: 'none', borderTop: '1px solid rgba(118,137,160,.13)', borderRadius: 0, background: 'transparent', padding: '11px 0' }}>
              <span>{ICON[item.type] || '□'}</span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: 'block', fontSize: 13, fontWeight: 740, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                <span style={{ display: 'block', marginTop: 3, color: 'var(--t3)', fontSize: 11 }}>{entryDate(item) || item.status || item._path}</span>
              </span>
            </button>
          )
        )) : <div style={{ color: 'var(--t3)', fontSize: 12 }}>Nothing linked here yet.</div>}
      </ProjectRailList>

      <ProjectRailList title="Smart Views" count={3} action={<TextActionButton ariaLabel={`View all smart views for ${entry.title || 'project'}`} onClick={() => onCreateSmartView?.(entry)}>View all</TextActionButton>}>
        {['Active Development', 'Roadmap Items', 'Architecture Notes'].map(label => (
          <button key={label} type="button" onClick={() => onCreateSmartView?.(entry)} style={{ ...rowButtonStyle, border: 'none', borderTop: '1px solid rgba(118,137,160,.13)', borderRadius: 0, background: 'transparent', padding: '9px 0' }}>
            <span>▧</span><span>{label}</span>
          </button>
        ))}
      </ProjectRailList>

      <ProjectRailList title="Actions">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={() => onAdd?.({ type: 'note', folder: 'Projects', projectContext: projectContext(row) })} style={{ ...projectToolbarButtonStyle(true), color: '#dbeafe' }}>New Entry</button>
          <button type="button" onClick={newCanvas} style={{ ...projectToolbarButtonStyle(), color: '#86efac' }}>New Canvas</button>
          <button type="button" onClick={() => onCreateSmartView?.(entry)} style={{ ...projectToolbarButtonStyle(), color: '#d8b4fe' }}>Open Smart View</button>
          <button type="button" onClick={() => onNavigate?.('graph')} style={projectToolbarButtonStyle()}>View in Constellation</button>
          <div style={{ position: 'relative' }}>
            <button type="button" aria-label="More project actions" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)} style={projectToolbarButtonStyle()}>More</button>
            {menuOpen && (
              <div role="menu" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 10, width: 178, padding: 6, border: '1px solid rgba(118,137,160,.24)', borderRadius: 8, background: '#151c23', boxShadow: '0 18px 42px rgba(0,0,0,.36)' }}>
                <button type="button" role="menuitem" onClick={() => copyText(row.path)} style={{ ...projectToolbarButtonStyle(), width: '100%', justifyContent: 'flex-start', marginBottom: 5 }}>Copy project path</button>
                <button type="button" role="menuitem" onClick={() => copyText(entry.title || '')} style={{ ...projectToolbarButtonStyle(), width: '100%', justifyContent: 'flex-start', marginBottom: 5 }}>Copy project title</button>
                <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onRevealEntry?.(entry); }} style={{ ...projectToolbarButtonStyle(), width: '100%', justifyContent: 'flex-start' }}>Reveal in Vault</button>
              </div>
            )}
          </div>
          <button type="button" onClick={() => onOpenEntry?.(entry.id)} style={projectToolbarButtonStyle(true)}>Open Entry</button>
        </div>
      </ProjectRailList>
    </aside>
  );
}

export function ProjectsView({ rows = [], canvases = [], onOpenEntry, onAdd, onNavigate, onNewCanvas, onCreateSmartView, onRevealEntry, onUpdateEntry }) {
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('name-asc');
  const [layout, setLayout] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [railTab, setRailTab] = useState('Overview');
  const [railOpen, setRailOpen] = useState(true);
  const projectRows = useMemo(() => rows.map(row => withProjectMetrics(row, canvases)), [rows, canvases]);
  const counts = useMemo(() => ({
    all: projectRows.length,
    starred: projectRows.filter(row => row.entry.starred).length,
    archived: projectRows.filter(isArchivedProject).length,
  }), [projectRows]);
  const statusOptions = useMemo(() => [...new Set(projectRows.map(row => String(row.status || row.entry.status || '').toLowerCase()).filter(Boolean))].sort(), [projectRows]);
  const visibleRows = useMemo(() => {
    const filtered = projectRows.filter(row => {
      if (tab === 'starred') return !!row.entry.starred;
      if (tab === 'archived') return isArchivedProject(row);
      return true;
    }).filter(row => {
      const statusOk = !statusFilter || String(row.status || row.entry.status || '').toLowerCase() === statusFilter;
      const cleanTag = tagFilter.trim().replace(/^#/, '').toLowerCase();
      const tagOk = !cleanTag || (row.entry.tags || []).some(tag => String(tag).toLowerCase().includes(cleanTag));
      return statusOk && tagOk;
    });
    return sortProjectRows(filtered, sort);
  }, [projectRows, sort, statusFilter, tab, tagFilter]);

  useEffect(() => {
    if (visibleRows.some(row => row.entry.id === selectedId)) return;
    setSelectedId(visibleRows[0]?.entry.id || '');
    setRailTab('Overview');
  }, [selectedId, visibleRows]);

  const selectedRow = visibleRows.find(row => row.entry.id === selectedId) || visibleRows[0] || projectRows[0] || null;
  const selectProject = id => {
    setSelectedId(id);
    setRailTab('Overview');
    setRailOpen(true);
  };
  const toggleStar = row => {
    if (!row?.entry?.id) return;
    onUpdateEntry?.(row.entry.id, { starred: !row.entry.starred });
  };

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(360px,430px)', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(9,15,21,.96), rgba(12,18,24,.98))', color: 'var(--tx)' }}>
      <main style={{ minWidth: 0, overflowY: 'auto', padding: '28px 30px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18, marginBottom: 24 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 26, lineHeight: 1.1, fontWeight: 850, letterSpacing: 0 }}>Projects</h1>
            <p style={{ margin: '8px 0 0', color: 'var(--t2)', fontSize: 14 }}>Organize your work into local knowledge projects.</p>
          </div>
          <button type="button" onClick={() => onAdd?.('project')} style={projectToolbarButtonStyle(true)}>New Project</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderBottom: '1px solid rgba(118,137,160,.16)', paddingBottom: 14, marginBottom: 16 }}>
          <div role="tablist" aria-label="Project tabs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              ['all', 'All Projects', counts.all],
              ['starred', 'Starred', counts.starred],
              ['archived', 'Archived', counts.archived],
            ].map(([value, label, count]) => (
              <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} style={projectTabStyle(tab === value)}>
                {label} <span style={{ ...pillStyle, marginLeft: 6 }}>{count}</span>
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowFilters(open => !open)} aria-expanded={showFilters} style={projectToolbarButtonStyle(showFilters || !!statusFilter || !!tagFilter)}>Filter</button>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t2)', fontSize: 12 }}>
              <span>Sort:</span>
              <select aria-label="Sort projects" value={sort} onChange={event => setSort(event.target.value)} style={{ ...projectToolbarButtonStyle(), appearance: 'auto', paddingRight: 30 }}>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="updated-desc">Recently updated</option>
                <option value="updated-asc">Oldest updated</option>
                <option value="entries-desc">Most entries</option>
              </select>
            </label>
            <div role="group" aria-label="Project layout" style={{ display: 'flex', gap: 4 }}>
              <button type="button" aria-label="Grid view" aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')} style={projectToolbarButtonStyle(layout === 'grid')}>▦</button>
              <button type="button" aria-label="List view" aria-pressed={layout === 'list'} onClick={() => setLayout('list')} style={projectToolbarButtonStyle(layout === 'list')}>☰</button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div role="region" aria-label="Project filters" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', border: '1px solid rgba(118,137,160,.16)', borderRadius: 8, background: 'rgba(255,255,255,.022)', padding: 12, margin: '-2px 0 16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t2)', fontSize: 12 }}>
              <span>Status</span>
              <select aria-label="Filter project status" value={statusFilter} onChange={event => setStatusFilter(event.target.value)} style={{ ...projectToolbarButtonStyle(), appearance: 'auto', minWidth: 150 }}>
                <option value="">Any status</option>
                {statusOptions.map(status => <option key={status} value={status}>{displayStatus(status)}</option>)}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--t2)', fontSize: 12 }}>
              <span>Tag</span>
              <input
                aria-label="Filter project tag"
                value={tagFilter}
                onChange={event => setTagFilter(event.target.value)}
                placeholder="#product"
                style={{ minHeight: 38, width: 170, border: '1px solid rgba(118,137,160,.18)', borderRadius: 7, background: 'rgba(255,255,255,.025)', color: 'var(--tx)', padding: '0 11px', fontFamily: 'var(--fn)', fontSize: 13 }}
              />
            </label>
            <button type="button" aria-label="Clear project filters" onClick={() => { setStatusFilter(''); setTagFilter(''); }} style={projectToolbarButtonStyle()}>Clear</button>
          </div>
        )}

        {visibleRows.length === 0 ? (
          <EmptyStateCard
            title={projectRows.length ? 'No projects match this view' : 'No projects yet'}
            detail={projectRows.length ? 'Switch tabs or sorting to bring projects back into view.' : 'Projects are normal Markdown entries and will appear in search, backlinks, Trash, and Constellation.'}
            action={<SmallButton onClick={() => onAdd?.('project')}>New Project</SmallButton>}
          />
        ) : layout === 'grid' ? (
          <div data-testid="projects-card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
            {visibleRows.map((row, index) => (
              <ProjectCard key={row.entry.id} row={row} index={index} selected={selectedRow?.entry?.id === row.entry.id} onSelect={() => selectProject(row.entry.id)} onOpenEntry={onOpenEntry} onToggleStar={() => toggleStar(row)} />
            ))}
          </div>
        ) : (
          <div data-testid="projects-list-view" style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
            {visibleRows.map((row, index) => (
              <ProjectListItem key={row.entry.id} row={row} index={index} selected={selectedRow?.entry?.id === row.entry.id} onSelect={() => selectProject(row.entry.id)} onToggleStar={() => toggleStar(row)} />
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 12px' }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 830 }}>All Projects ({visibleRows.length})</h2>
        </div>
        <ProjectTable rows={visibleRows} selectedId={selectedRow?.entry?.id} onSelect={selectProject} onOpenEntry={onOpenEntry} onToggleStar={toggleStar} />
      </main>
      <ProjectDetailRail
        row={selectedRow}
        canvases={canvases}
        tab={railTab}
        open={railOpen}
        onTab={setRailTab}
        onClose={() => setRailOpen(false)}
        onOpen={() => setRailOpen(true)}
        onOpenEntry={onOpenEntry}
        onAdd={onAdd}
        onNewCanvas={onNewCanvas}
        onCreateSmartView={onCreateSmartView}
        onNavigate={onNavigate}
        onRevealEntry={onRevealEntry}
        onUpdateEntry={onUpdateEntry}
      />
    </div>
  );
}

export function TasksView({ rows = [], onOpenEntry, onAdd, onUpdateEntry }) {
  const [filter, setFilter] = useState('open');
  const filteredRows = useMemo(() => rows.filter(row => {
    if (filter === 'all') return true;
    if (filter === 'today') return taskState(row) === 'today';
    if (filter === 'overdue') return taskState(row) === 'overdue';
    if (filter === 'done') return taskState(row) === 'done' || row.isDone;
    return row.isOpen !== false && taskState(row) !== 'done';
  }), [rows, filter]);

  return (
    <PanelShell title="Tasks" count={filteredRows.length} action={<SmallButton onClick={() => onAdd?.('task')}>New Task</SmallButton>}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <SegmentedControl
          label="Task filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'today', label: 'Today' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'done', label: 'Done' },
            { value: 'all', label: 'All' },
          ]}
        />
        <span style={{ fontSize: 12, color: 'var(--t3)' }}>{rows.length} Markdown task entr{rows.length === 1 ? 'y' : 'ies'}</span>
      </div>
      {filteredRows.length === 0 ? (
        <EmptyStateCard
          title={rows.length ? 'No tasks match this filter' : 'No tasks yet'}
          detail="Tasks are Markdown entries with due dates, priorities, project links, backlinks, and normal vault recovery."
          action={<SmallButton onClick={() => onAdd?.('task')}>New Task</SmallButton>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filteredRows.map(row => (
            <TaskEntryRow
              key={row.entry.id}
              row={row}
              onOpenEntry={onOpenEntry}
              onUpdateEntry={onUpdateEntry}
            />
          ))}
        </div>
      )}
    </PanelShell>
  );
}

function TaskEntryRow({ row, onOpenEntry, onUpdateEntry }) {
  const entry = row.entry;
  if (!entry) return null;
  const done = entry.status === 'done' || row.isDone === true;
  const icon = ICON[entry.type] || '□';
  const metaParts = [row.statusLabel || entry.status, entry.priority, row.project?.title, row.sourceEntry?.title].filter(Boolean);
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${entry.title || 'entry'}`}
      onClick={() => onOpenEntry?.(entry.id)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenEntry?.(entry.id);
        }
      }}
      style={{ ...rowButtonStyle, marginBottom: 8, gap: 12 }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Mark ${entry.title || 'task'} ${done ? 'incomplete' : 'complete'}`}
        onClick={event => {
          event.stopPropagation();
          const nextDone = !done;
          onUpdateEntry?.(entry.id, { status: nextDone ? 'done' : 'todo', completed: nextDone });
        }}
        style={{ width: 16, height: 16, flexShrink: 0, padding: 0, borderRadius: 3, border: '1px solid var(--br)', background: done ? 'var(--ac)' : 'transparent', color: done ? 'var(--bg)' : 'var(--tx)', display: 'grid', placeItems: 'center', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--fn)' }}
      >{done ? '✓' : ''}</button>
      <span aria-hidden="true" style={{ width: 20, flexShrink: 0 }}>{icon}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', fontSize: 13, fontWeight: 750, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.65 : 1 }}>{entry.title || 'Untitled'}</span>
        {metaParts.length > 0 && (
          <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 6 }}>
            {metaParts.map(part => <span key={part} style={pillStyle}>{part}</span>)}
          </span>
        )}
      </span>
    </div>
  );
}

function parseCalendarDate(key) {
  const [year, month, day] = String(key || '').slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function calendarKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addCalendarDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addCalendarMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function startOfCalendarWeek(date) {
  const day = date.getDay();
  return addCalendarDays(date, day === 0 ? -6 : 1 - day);
}

function calendarMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function calendarDayLabel(key) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parseCalendarDate(key));
}

function calendarLongDayLabel(key) {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(parseCalendarDate(key));
}

function firstCalendarDate(days) {
  const keys = Object.keys(days || {}).sort();
  const today = calendarKey(new Date());
  if (keys.includes(today)) return today;
  return keys[0] || today;
}

function allCalendarItems(day = {}, filters, journalOnly = false) {
  if (journalOnly) {
    return (day.entries || [])
      .filter(entry => entry.type === 'journal')
      .map(entry => ({ entry, group: 'entry' }));
  }
  const entries = (day.entries || []).filter(entry => !journalOnly || entry.type === 'journal');
  return [
    ...(filters.entries ? entries.map(entry => ({ entry, group: 'entry' })) : []),
    ...(filters.tasks ? (day.tasks || []).map(entry => ({ entry, group: 'task' })) : []),
    ...(filters.projects ? (day.projects || []).map(entry => ({ entry, group: 'project' })) : []),
    ...(filters.reviews ? (day.reviews || []).map(entry => ({ entry, group: 'review' })) : []),
  ];
}

function calendarEventTone(group, entry) {
  if (entry?.type === 'journal') return { dot: '#a855f7', bg: 'rgba(139,92,246,.13)', border: 'rgba(139,92,246,.18)' };
  if (group === 'review') return { dot: '#22c55e', bg: 'rgba(34,197,94,.12)', border: 'rgba(34,197,94,.16)' };
  if (group === 'task') return { dot: '#60a5fa', bg: 'rgba(96,165,250,.12)', border: 'rgba(96,165,250,.16)' };
  if (group === 'project') return { dot: '#f59e0b', bg: 'rgba(245,158,11,.13)', border: 'rgba(245,158,11,.17)' };
  if (entry?.type === 'raw') return { dot: '#f97316', bg: 'rgba(249,115,22,.12)', border: 'rgba(249,115,22,.16)' };
  return { dot: '#8fb6ff', bg: 'rgba(77,141,255,.10)', border: 'rgba(77,141,255,.14)' };
}

function calendarEventTime(entry, group) {
  if (group === 'task' || group === 'project') return entry?.due ? 'Due today' : '';
  if (group === 'review') return 'Due today';
  const raw = entry?.date || entry?.modified || '';
  const parsed = raw ? new Date(raw) : null;
  if (parsed && !Number.isNaN(parsed.valueOf())) {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(parsed);
  }
  return '';
}

function eventTypeLabel(entry, group) {
  if (group === 'review') return 'Memory review';
  if (group === 'task') return 'Task';
  if (group === 'project') return 'Project deadline';
  if (entry?.type === 'raw') return 'Capture';
  return entry?.type === 'journal' ? 'Journal' : 'Entry';
}

function linkedCalendarProjects(day = {}, entries = []) {
  const refs = new Set();
  const directProjects = new Map();
  for (const project of day.projects || []) directProjects.set(project.id, project);
  for (const item of [...(day.entries || []), ...(day.tasks || []), ...(day.reviews || [])]) {
    [item.project, item.project_id, item.projectId, ...(item.projects || []), ...(item.links || [])]
      .filter(Boolean)
      .forEach(ref => refs.add(String(ref)));
  }
  for (const entry of entries) {
    if (entry.type === 'project' && (refs.has(entry.id) || refs.has(entry.title) || refs.has(entry._path))) {
      directProjects.set(entry.id, entry);
    }
  }
  return [...directProjects.values()].slice(0, 4);
}

function CalendarToolbarButton({ children, active, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={active}
      onClick={onClick}
      style={{
        minHeight: 30,
        padding: '0 12px',
        border: '1px solid ' + (active ? 'rgba(77,141,255,.44)' : 'var(--br)'),
        borderRadius: 7,
        background: active ? 'rgba(77,141,255,.14)' : 'rgba(255,255,255,.025)',
        color: active ? '#cfe0ff' : 'var(--t2)',
        fontFamily: 'var(--fn)',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}>
      {children}
    </button>
  );
}

export function CalendarView({ days = {}, entries = [], onOpenEntry, onNavigate, onAdd }) {
  const [selectedDate, setSelectedDate] = useState(() => firstCalendarDate(days));
  const [anchorDate, setAnchorDate] = useState(() => parseCalendarDate(firstCalendarDate(days)));
  const [viewMode, setViewMode] = useState('month');
  const [displayMode, setDisplayMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [journalOnly, setJournalOnly] = useState(false);
  const [detailOpen, setDetailOpen] = useState(true);
  const [filters, setFilters] = useState({ entries: true, tasks: true, projects: true, reviews: true });
  const sortedDays = useMemo(() => Object.values(days).sort((a, b) => a.date.localeCompare(b.date)), [days]);
  const selectedDay = days[selectedDate] || { date: selectedDate, entries: [], tasks: [], projects: [], reviews: [] };
  const currentMonth = anchorDate.getMonth();
  const calendarDates = useMemo(() => {
    if (viewMode === 'day') return [parseCalendarDate(selectedDate)];
    if (viewMode === 'week') {
      const start = startOfCalendarWeek(parseCalendarDate(selectedDate));
      return Array.from({ length: 7 }, (_, index) => addCalendarDays(start, index));
    }
    const monthStart = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
    const gridStart = startOfCalendarWeek(monthStart);
    return Array.from({ length: 42 }, (_, index) => addCalendarDays(gridStart, index));
  }, [anchorDate, selectedDate, viewMode]);
  const selectedItems = allCalendarItems(selectedDay, filters, journalOnly);
  const linkedProjects = linkedCalendarProjects(selectedDay, entries);
  const selectedTags = [...new Set([
    ...(selectedDay.entries || []),
    ...(selectedDay.tasks || []),
    ...(selectedDay.projects || []),
    ...(selectedDay.reviews || []),
  ].flatMap(entry => entry.tags || []))].slice(0, 6);
  const journalEntry = (selectedDay.entries || []).find(entry => entry.type === 'journal') || null;
  const primaryEntry = journalEntry || (selectedDay.entries || [])[0] || (selectedDay.tasks || [])[0] || (selectedDay.reviews || [])[0] || null;
  const localPath = primaryEntry?._path || `Journals/${selectedDate}.md`;
  const journalRows = sortedDays
    .flatMap(day => (day.entries || []).filter(entry => entry.type === 'journal').map(entry => ({ day, entry })))
    .slice(0, 6);

  const shift = amount => {
    const next = viewMode === 'month' ? addCalendarMonths(anchorDate, amount) : addCalendarDays(parseCalendarDate(selectedDate), amount * (viewMode === 'week' ? 7 : 1));
    setAnchorDate(next);
    if (viewMode !== 'month') setSelectedDate(calendarKey(next));
  };
  const jumpToday = () => {
    const today = calendarKey(new Date());
    setSelectedDate(today);
    setAnchorDate(parseCalendarDate(today));
  };
  const setCalendarViewMode = mode => {
    setViewMode(mode);
    if (mode === 'month') setAnchorDate(parseCalendarDate(selectedDate));
  };
  const setDay = key => {
    setSelectedDate(key);
    setAnchorDate(parseCalendarDate(key));
    setDetailOpen(true);
  };
  const toggleFilter = key => setFilters(current => ({ ...current, [key]: !current[key] }));

  return (
    <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', background: 'var(--bg)', overflow: 'hidden' }}>
      <div style={{ minWidth: 0, overflow: 'auto', padding: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--tx)', fontSize: 20, lineHeight: 1.2, fontWeight: 760 }}>Calendar</h1>
            <div style={{ marginTop: 6, color: 'var(--t3)', fontSize: 12 }}>Journal planning and knowledge work schedule.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <CalendarToolbarButton active={viewMode === 'month'} onClick={() => setCalendarViewMode('month')}>Month</CalendarToolbarButton>
            <CalendarToolbarButton active={viewMode === 'week'} onClick={() => setCalendarViewMode('week')}>Week</CalendarToolbarButton>
            <CalendarToolbarButton active={viewMode === 'day'} onClick={() => setCalendarViewMode('day')}>Day</CalendarToolbarButton>
            <button type="button" aria-label="Previous calendar period" onClick={() => shift(-1)} style={calendarIconButtonStyle()}>‹</button>
            <span style={{ minWidth: 112, textAlign: 'center', color: 'var(--tx)', fontSize: 13, fontWeight: 600 }}>{calendarMonthLabel(anchorDate)}</span>
            <button type="button" aria-label="Next calendar period" onClick={() => shift(1)} style={calendarIconButtonStyle()}>›</button>
            <CalendarToolbarButton onClick={jumpToday}>Today</CalendarToolbarButton>
            <CalendarToolbarButton active={showFilters} onClick={() => setShowFilters(open => !open)}>Filters</CalendarToolbarButton>
            <CalendarToolbarButton active={journalOnly} onClick={() => setJournalOnly(on => !on)}>Journal Entries</CalendarToolbarButton>
            <button type="button" aria-label="Calendar grid view" aria-pressed={displayMode === 'grid'} onClick={() => setDisplayMode('grid')} style={calendarIconButtonStyle(displayMode === 'grid')}>▦</button>
            <button type="button" aria-label="Calendar list view" aria-pressed={displayMode === 'list'} onClick={() => setDisplayMode('list')} style={calendarIconButtonStyle(displayMode === 'list')}>☰</button>
          </div>
        </div>

        {showFilters && (
          <div style={{ ...cardStyle, marginBottom: 12, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              ['entries', 'Entries'],
              ['tasks', 'Tasks'],
              ['projects', 'Projects'],
              ['reviews', 'Memory reviews'],
            ].map(([key, label]) => (
              <label key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: 'var(--t2)', fontSize: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={filters[key]} onChange={() => toggleFilter(key)} />
                {label}
              </label>
            ))}
          </div>
        )}

        {displayMode === 'grid' ? (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            {viewMode !== 'day' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid var(--br)' }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} style={{ padding: '9px 12px', color: 'var(--t3)', fontSize: 12, fontWeight: 600 }}>{day}</div>
                ))}
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'day' ? '1fr' : 'repeat(7,minmax(0,1fr))', minWidth: 0 }}>
              {calendarDates.map(date => {
                const key = calendarKey(date);
                const day = days[key] || { date: key, entries: [], tasks: [], projects: [], reviews: [] };
                const items = allCalendarItems(day, filters, journalOnly);
                const selected = key === selectedDate;
                const muted = viewMode === 'month' && date.getMonth() !== currentMonth;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-label={`Select ${key}`}
                    onClick={() => setDay(key)}
                    style={{
                      minHeight: viewMode === 'day' ? 360 : 90,
                      minWidth: 0,
                      boxSizing: 'border-box',
                      overflow: 'hidden',
                      padding: '8px 8px 6px',
                      border: 'none',
                      borderRight: viewMode === 'day' ? 'none' : '1px solid var(--br)',
                      borderBottom: '1px solid var(--br)',
                      background: selected ? 'rgba(77,141,255,.08)' : 'transparent',
                      color: muted ? 'var(--t3)' : 'var(--tx)',
                      fontFamily: 'var(--fn)',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}>
                    <span style={{ display: 'inline-flex', width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 99, background: selected ? '#4d8dff' : 'transparent', color: selected ? '#07111f' : muted ? 'var(--t3)' : 'var(--t2)', fontSize: 12, fontWeight: 700 }}>
                      {date.getDate()}
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 5 }}>
                      {items.slice(0, viewMode === 'day' ? 12 : 3).map(({ entry, group }) => (
                        <CalendarEventPill key={`${key}-${group}-${entry.id}`} entry={entry} group={group} onOpenEntry={onOpenEntry} />
                      ))}
                      {items.length > (viewMode === 'day' ? 12 : 3) && (
                        <span style={{ color: 'var(--t3)', fontSize: 11 }}>+{items.length - (viewMode === 'day' ? 12 : 3)} more</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
            {sortedDays.length === 0 ? <EmptyLine>No dated work yet.</EmptyLine> : sortedDays.map(day => (
              <div key={day.date} style={{ padding: '12px 14px', borderBottom: '1px solid var(--br)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <button type="button" onClick={() => setDay(day.date)} style={{ border: 'none', background: 'transparent', padding: 0, color: 'var(--tx)', fontFamily: 'var(--fn)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>{calendarLongDayLabel(day.date)}</button>
                  <span style={{ color: 'var(--t3)', fontSize: 12 }}>{allCalendarItems(day, filters, journalOnly).length} items</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {allCalendarItems(day, filters, journalOnly).map(({ entry, group }) => (
                    <CalendarEventPill key={`${day.date}-${group}-${entry.id}`} entry={entry} group={group} onOpenEntry={onOpenEntry} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <section style={{ ...cardStyle, marginTop: 14, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid var(--br)' }}>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>Journal Entries by Date</h2>
            <TextActionButton onClick={() => onNavigate?.('note')}>Open in Notes ↗</TextActionButton>
          </div>
          {journalRows.length > 0 ? journalRows.map(({ day, entry }) => (
            <button key={`${day.date}-${entry.id}`} type="button" onClick={() => onOpenEntry?.(entry.id)} style={{ ...plainListButton(), minHeight: 34 }}>
              <span style={{ width: 132, color: 'var(--t3)', fontSize: 12 }}>{calendarDayLabel(day.date)}</span>
              <span style={{ flex: 1, color: 'var(--t2)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</span>
            </button>
          )) : (
            <EmptyLine>No journal entries dated in this calendar yet.</EmptyLine>
          )}
        </section>
      </div>

      <CalendarDetailRail
        date={selectedDate}
        day={selectedDay}
        items={selectedItems}
        primaryEntry={primaryEntry}
        linkedProjects={linkedProjects}
        tags={selectedTags}
        localPath={localPath}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onOpen={() => setDetailOpen(true)}
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />
    </div>
  );
}

function CalendarEventPill({ entry, group, onOpenEntry }) {
  const tone = calendarEventTone(group, entry);
  return (
    <span
      role="button"
      tabIndex={0}
      onClick={event => {
        event.stopPropagation();
        onOpenEntry?.(entry.id);
      }}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          event.stopPropagation();
          onOpenEntry?.(entry.id);
        }
      }}
      style={{
        display: 'block',
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${tone.border}`,
        background: tone.bg,
        borderRadius: 4,
        padding: '4px 5px',
        color: 'var(--tx)',
        fontSize: 11,
        lineHeight: 1.25,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}>
      <span aria-hidden="true" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: 99, background: tone.dot, marginRight: 5 }} />
      {entry.title || 'Untitled'}
      {calendarEventTime(entry, group) && <span style={{ display: 'block', color: 'var(--t3)', paddingLeft: 11, marginTop: 1 }}>{calendarEventTime(entry, group)}</span>}
    </span>
  );
}

function CalendarDetailRail({ date, day, items, primaryEntry, linkedProjects, tags, localPath, open, onClose, onOpen, onOpenEntry, onNavigate, onAdd }) {
  const entries = day.entries || [];
  const reviews = day.reviews || [];
  if (!open) {
    return (
      <aside style={{ borderLeft: '1px solid var(--br)', background: 'rgba(8,13,19,.96)', padding: 18, minHeight: 0, overflowY: 'auto', boxSizing: 'border-box' }}>
        <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: 14, fontWeight: 700 }}>Day details</h2>
        <div style={{ marginTop: 10, color: 'var(--t3)', fontSize: 12, lineHeight: 1.45 }}>Details are hidden. Select a calendar day or reopen the current day.</div>
        <button type="button" onClick={onOpen} style={{ ...calendarActionStyle(), marginTop: 14 }}>Show {calendarDayLabel(date)}</button>
      </aside>
    );
  }
  return (
    <aside style={{ borderLeft: '1px solid var(--br)', background: 'rgba(8,13,19,.96)', padding: 18, minHeight: 0, overflowY: 'auto', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: 'var(--tx)', fontSize: 14, fontWeight: 700 }}>{calendarLongDayLabel(date)}</h2>
        <button type="button" aria-label="Close day details" onClick={onClose} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: 16 }}>×</button>
      </div>

      {primaryEntry ? (
        <button type="button" onClick={() => onOpenEntry?.(primaryEntry.id)} style={{ ...calendarDetailButtonStyle(), alignItems: 'start', marginBottom: 16 }}>
          <span style={{ width: 24, height: 24, display: 'grid', placeItems: 'center', borderRadius: 4, color: '#b794ff', background: 'rgba(139,92,246,.12)' }}>{ICON[primaryEntry.type] || '▤'}</span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', color: 'var(--tx)', fontSize: 13, fontWeight: 650 }}>{primaryEntry.title}</span>
            <span style={{ display: 'block', color: 'var(--t3)', fontSize: 12, marginTop: 4 }}>{primaryEntry._path || localPath}</span>
          </span>
        </button>
      ) : (
        <div style={{ color: 'var(--t3)', fontSize: 12, lineHeight: 1.45, marginBottom: 16 }}>No dated work is attached to this day yet.</div>
      )}

      <CalendarDetailSection title="Entries on this day" count={entries.length}>
        {entries.length > 0 ? entries.map(entry => (
          <CalendarDetailEntry key={entry.id} entry={entry} onOpenEntry={onOpenEntry} />
        )) : <CalendarRailEmpty>No entries dated here.</CalendarRailEmpty>}
      </CalendarDetailSection>

      <CalendarDetailSection title="Memory reviews due" count={reviews.length}>
        {reviews.length > 0 ? reviews.map(entry => (
          <CalendarDetailEntry key={entry.id} entry={entry} onOpenEntry={onOpenEntry} meta="Due today" />
        )) : <CalendarRailEmpty>No memory reviews due.</CalendarRailEmpty>}
      </CalendarDetailSection>

      <CalendarDetailSection title="Linked projects">
        {linkedProjects.length > 0 ? linkedProjects.map(project => (
          <CalendarDetailEntry key={project.id} entry={project} onOpenEntry={onOpenEntry} />
        )) : <CalendarRailEmpty>No linked projects.</CalendarRailEmpty>}
      </CalendarDetailSection>

      <CalendarDetailSection title="Tags on this day">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {tags.map(tag => <span key={tag} style={pillStyle}>#{tag}</span>)}
          <button type="button" onClick={() => onNavigate?.('tags')} style={{ ...pillStyle, cursor: 'pointer', fontFamily: 'var(--fn)' }}>Manage tags</button>
        </div>
      </CalendarDetailSection>

      <CalendarDetailSection title="Local path">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 6, background: 'rgba(255,255,255,.035)', color: 'var(--t2)', fontSize: 12 }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{localPath}</span>
          <button type="button" aria-label="Copy local path" onClick={() => navigator.clipboard?.writeText(localPath)} style={{ border: 'none', background: 'transparent', color: 'var(--t3)', cursor: 'pointer' }}>⧉</button>
        </div>
      </CalendarDetailSection>

      <CalendarDetailSection title="Actions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button type="button" onClick={() => onAdd?.('journal')} style={calendarActionStyle()}>New Journal Entry</button>
          <button type="button" onClick={() => onNavigate?.('search')} style={calendarActionStyle()}>Link Entry</button>
          <button type="button" onClick={() => reviews[0] ? onOpenEntry?.(reviews[0].id) : onNavigate?.('all')} style={calendarActionStyle()}>Review Memory</button>
          <button type="button" onClick={() => onNavigate?.('graph')} style={calendarActionStyle()}>Open in Constellation</button>
        </div>
      </CalendarDetailSection>
    </aside>
  );
}

function CalendarDetailSection({ title, count, children }) {
  return (
    <section style={{ borderTop: '1px solid var(--br)', paddingTop: 14, marginTop: 14 }}>
      <h3 style={{ margin: '0 0 10px', color: 'var(--tx)', fontSize: 13, fontWeight: 700 }}>{title} {count != null && <span style={{ color: 'var(--t3)', fontWeight: 600 }}>{count}</span>}</h3>
      {children}
    </section>
  );
}

function CalendarDetailEntry({ entry, onOpenEntry, meta }) {
  return (
    <button type="button" onClick={() => onOpenEntry?.(entry.id)} style={calendarDetailButtonStyle()}>
      <span style={{ width: 22, color: calendarEventTone(entry.type, entry).dot }}>{ICON[entry.type] || '▤'}</span>
      <span style={{ minWidth: 0, flex: 1 }}>
        <span style={{ display: 'block', color: 'var(--tx)', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title}</span>
        <span style={{ display: 'block', color: 'var(--t3)', fontSize: 11, marginTop: 3 }}>{meta || [eventTypeLabel(entry, entry.type), calendarEventTime(entry, entry.type)].filter(Boolean).join(' · ')}</span>
      </span>
    </button>
  );
}

function CalendarRailEmpty({ children }) {
  return <div style={{ color: 'var(--t3)', fontSize: 12 }}>{children}</div>;
}

function calendarIconButtonStyle(active = false) {
  return {
    width: 30,
    height: 30,
    border: '1px solid ' + (active ? 'rgba(77,141,255,.44)' : 'var(--br)'),
    borderRadius: 7,
    background: active ? 'rgba(77,141,255,.14)' : 'rgba(255,255,255,.025)',
    color: active ? '#cfe0ff' : 'var(--t2)',
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
    fontSize: 14,
  };
}

function calendarDetailButtonStyle() {
  return {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: 'var(--tx)',
    padding: '7px 0',
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: 'var(--fn)',
  };
}

function calendarActionStyle() {
  return {
    border: '1px solid var(--br)',
    borderRadius: 6,
    background: 'rgba(255,255,255,.035)',
    color: 'var(--t2)',
    minHeight: 32,
    padding: '0 9px',
    fontFamily: 'var(--fn)',
    fontSize: 12,
    cursor: 'pointer',
  };
}

export function SpacesView({ spaces = [], onSelectSpace }) {
  const [query, setQuery] = useState('');
  const enrichedSpaces = useMemo(() => spaces.map(space => {
    const entries = space.entries || [];
    const sortedEntries = [...entries].sort((a, b) => String(entryDate(b) || b.modified || '').localeCompare(String(entryDate(a) || a.modified || '')));
    return {
      ...space,
      entries,
      projectCount: space.projectCount ?? entries.filter(entry => entry.type === 'project').length,
      openTaskCount: space.openTaskCount ?? entries.filter(entry => entry.type === 'task' && entry.completed !== true && !['done', 'complete', 'archived'].includes(String(entry.status || '').toLowerCase())).length,
      tagCount: space.tagCount ?? new Set(entries.flatMap(entry => entry.tags || [])).size,
      recentEntry: space.recentEntry || sortedEntries[0] || null,
    };
  }), [spaces]);
  const visibleSpaces = useMemo(() => enrichedSpaces.filter(space => textMatch([
    space.name,
    space.description,
    space.recentEntry?.title,
    ...(space.entries || []).flatMap(entry => entry.tags || []),
  ].join(' '), query)), [enrichedSpaces, query]);

  return (
    <PanelShell title="Spaces" count={visibleSpaces.length}>
      <input
        aria-label="Filter spaces"
        value={query}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') setQuery('');
        }}
        placeholder="Filter spaces..."
        style={{ width: '100%', maxWidth: 420, boxSizing: 'border-box', marginBottom: 14, padding: '10px 12px', border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'var(--b1)', color: 'var(--tx)', fontFamily: 'var(--fn)' }}
      />
      {visibleSpaces.length === 0 ? (
        <EmptyStateCard
          title={spaces.length ? 'No spaces match this filter' : 'No spaces yet'}
          detail="Add a space field to Markdown entries to group projects, notes, tasks, and memory by workspace."
        />
      ) : (
        <div style={gridStyle}>
          {visibleSpaces.map(space => (
          <button key={space.id} type="button" onClick={() => onSelectSpace?.(space.id)} style={{ ...cardStyle, textAlign: 'left', cursor: 'pointer', color: 'var(--tx)', fontFamily: 'var(--fn)' }}>
            <div style={{ fontSize: 15, fontWeight: 800 }}>{space.name}</div>
            {space.description && <div style={{ marginTop: 6, color: 'var(--t3)', fontSize: 12, lineHeight: 1.45 }}>{space.description}</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span style={pillStyle}>{space.count} entries</span>
              {space.projectCount != null && <span style={pillStyle}>{space.projectCount} projects</span>}
              {space.openTaskCount != null && <span style={pillStyle}>{space.openTaskCount} open tasks</span>}
              {space.tagCount != null && <span style={pillStyle}>{space.tagCount} tags</span>}
            </div>
            {space.recentEntry && <div style={{ marginTop: 10, fontSize: 12, color: 'var(--t2)' }}>Recent: {space.recentEntry.title}</div>}
          </button>
          ))}
        </div>
      )}
    </PanelShell>
  );
}

export function TagManagerView({ tags = [], onSelectTag }) {
  const [query, setQuery] = useState('');
  const visibleTags = useMemo(() => tags.filter(tag => textMatch([
    tag.name,
    tag.description,
    ...(tag.aliases || []),
    ...(tag.relatedTags || []).map(related => related.name),
  ].join(' '), query)), [tags, query]);

  return (
    <PanelShell title="Tag Manager" count={visibleTags.length}>
      <input
        aria-label="Filter tags"
        value={query}
        onChange={event => setQuery(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Escape') setQuery('');
        }}
        placeholder="Filter tags..."
        style={{ width: '100%', maxWidth: 420, boxSizing: 'border-box', marginBottom: 14, padding: '10px 12px', border: '1px solid var(--br)', borderRadius: 'var(--rd)', background: 'var(--b1)', color: 'var(--tx)', fontFamily: 'var(--fn)' }}
      />
      {visibleTags.length === 0 ? (
        <EmptyStateCard
          title={tags.length ? 'No tags match this filter' : 'No tags yet'}
          detail="Tags appear here as soon as they are used in Markdown entry frontmatter."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleTags.map(tag => (
          <button key={tag.id || tag.name} type="button" onClick={() => onSelectTag?.(tag.name)} style={{ ...rowButtonStyle }}>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13, fontWeight: 800 }}>#{tag.name}</span>
              {tag.description && <span style={{ display: 'block', marginTop: 3, fontSize: 11, color: 'var(--t3)' }}>{tag.description}</span>}
              {tag.relatedTags?.length > 0 && (
                <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--t3)' }}>
                  Related: {tag.relatedTags.map(related => `#${related.name}`).join(', ')}
                </span>
              )}
            </span>
            {tag.aliases?.map(alias => <span key={alias} style={pillStyle}>{alias}</span>)}
            {tag.unresolvedCount > 0 && <span style={{ ...pillStyle, color: '#b45309' }}>{tag.unresolvedCount} unresolved</span>}
            <span style={pillStyle}>{tag.count}</span>
          </button>
          ))}
        </div>
      )}
    </PanelShell>
  );
}

export function VaultStatusBar({ vaultInfo, entryCount = 0, trashCount = 0, issueCount = 0 }) {
  const root = vaultInfo?.path || vaultInfo?.root || vaultInfo?.name || 'Browser preview vault';
  const issueLabel = issueCount === 1 ? '1 issue needs review' : `${issueCount} issues need review`;
  return (
    <footer style={{ flexShrink: 0, borderTop: '1px solid var(--br)', background: 'rgba(7,11,16,.98)', color: 'var(--t3)', fontSize: 12, padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 10, minHeight: 34, boxSizing: 'border-box', overflow: 'hidden' }}>
      <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 99, background: '#22c55e', boxShadow: '0 0 0 3px rgba(34,197,94,.10)' }} />
      <span style={{ color: 'var(--tx)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{root}</span>
      <span>{entryCount} entr{entryCount === 1 ? 'y' : 'ies'}</span>
      <span>{trashCount} trash</span>
      <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <span aria-hidden="true" style={{ width: 9, height: 9, borderRadius: 99, background: issueCount > 0 ? '#f59e0b' : '#22c55e', boxShadow: `0 0 0 3px ${issueCount > 0 ? 'rgba(245,158,11,.12)' : 'rgba(34,197,94,.10)'}` }} />
        <span>{issueCount > 0 ? issueLabel : 'All systems operational'}</span>
      </span>
    </footer>
  );
}

function rightRailTitlesForMode(modeKey) {
  // Headings only — actual rows are derived from live data in WorkspaceContextRail.
  if (modeKey === 'planning') return { primaryTitle: "Today's Plan", primaryAction: 'tasks', secondaryTitle: 'Planning Notes', secondarySource: 'note', showFinal: true };
  if (modeKey === 'capture') return { primaryTitle: 'Capture Queue', primaryAction: 'raw', capturePrimary: true, secondaryTitle: 'Recent Captures', secondarySource: 'raw', showFinal: false };
  if (modeKey === 'review') return { primaryTitle: "Today's Review", primaryAction: 'tasks', secondaryTitle: 'Notes to Revisit', secondarySource: 'note', showFinal: true };
  return { primaryTitle: "Today's Tasks", primaryAction: 'tasks', secondaryTitle: 'Recent Captures', secondarySource: 'raw', showFinal: false };
}

function taskContextLabel(row, projectsById) {
  const projectRef = row?.entry?.project;
  const project = projectRef && projectsById?.[projectRef];
  const title = project?.title || (typeof projectRef === 'string' ? projectRef : '');
  return title || 'Unscheduled';
}

function dueTimeLabel(row) {
  // Show overdue / today / due date for rail context.
  if (!row?.entry?.due) return '';
  const due = String(row.entry.due).slice(0, 10);
  const today = todayISO();
  if (due === today) return 'Today';
  if (due < today) return 'Overdue';
  // Format like "May 16"
  const parsed = new Date(due);
  if (Number.isNaN(parsed.valueOf())) return due;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(parsed);
}

export function WorkspaceContextRail({ selectedEntry, entries = [], model = {}, onOpenEntry, onNavigate, onUpdateEntry, onCreateFromMissing, onRevealEntry, showSelected = true, focusMode = 'deep-work' }) {
  const modeKey = resolveFocusMode(focusMode);
  const mode = focusModes[modeKey];
  const rail = rightRailTitlesForMode(modeKey);
  const showNoteDetails = showSelected !== false && selectedEntry?.type === 'note';
  const today = todayISO();

  // Today widget: count completed/total tasks dated today, notes created today, projects updated today.
  const taskRows = Array.isArray(model.taskRows) ? model.taskRows : [];
  const tasksToday = taskRows.filter(row => entryDate(row.entry) === today);
  const completedToday = tasksToday.filter(row => row.isDone || row.entry?.completed || row.dueState === 'done').length;
  const totalToday = tasksToday.length;
  const notesToday = entries.filter(entry => entry.type === 'note' && entryDate(entry) === today).length;
  const projectsToday = entries.filter(entry => entry.type === 'project' && entryDate(entry, 'modified') === today).length;
  const hasAnyTodayActivity = totalToday > 0 || notesToday > 0 || projectsToday > 0;
  const ringFillDeg = totalToday > 0 ? (completedToday / totalToday) * 360 : 0;
  const ringPercent = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Project lookup (for task context labels in the rail)
  const projectsById = Object.fromEntries(entries.filter(entry => entry.type === 'project').flatMap(entry => [
    [entry.id, entry],
    entry.title ? [entry.title, entry] : null,
    entry._path ? [entry._path, entry] : null,
  ].filter(Boolean)));

  // Primary list: open tasks due today or overdue (top 5)
  const primaryTaskRows = taskRows
    .filter(row => row.statusKey !== 'done' && !row.isDone && !row.entry?.completed)
    .filter(row => entryDate(row.entry) === today || isOverdue(row) || String(row.entry?.due || '').slice(0, 10) === today)
    .slice(0, 5);

  // Recent captures
  const recentCaptures = entries
    .filter(entry => entry.type === 'raw' || entry.type === 'capture')
    .sort((a, b) => entryTimestamp(b) - entryTimestamp(a))
    .slice(0, 4);

  // Secondary list: planning/review notes vs. recent captures
  const recentNotes = entries
    .filter(entry => entry.type === 'note')
    .sort((a, b) => entryTimestamp(b) - entryTimestamp(a))
    .slice(0, 4);
  const secondaryEntries = rail.secondarySource === 'raw' ? recentCaptures : recentNotes;

  const toggleTaskDone = (row, nextDone) => {
    if (!row?.entry?.id) return;
    onUpdateEntry?.(row.entry.id, { status: nextDone ? 'done' : 'todo' });
  };

  return (
    <aside style={{
      width: 392,
      flexShrink: 0,
      borderLeft: '1px solid var(--br)',
      background: 'rgba(8,13,19,.96)',
      minHeight: 0,
      overflowY: 'auto',
      padding: '22px 22px',
      boxSizing: 'border-box',
    }}>
      <RightRailWidget title="Today" variant="today">
        {hasAnyTodayActivity ? (
          <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: 18, alignItems: 'center' }}>
            <div style={{ width: 84, height: 84, borderRadius: 999, padding: 5, boxSizing: 'border-box', background: `conic-gradient(from -90deg, ${mode.accent} 0deg ${ringFillDeg}deg, rgba(92,106,126,.34) ${ringFillDeg}deg 360deg)`, display: 'grid', placeItems: 'center', boxShadow: '0 8px 18px rgba(0,0,0,.22)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 999, background: 'linear-gradient(145deg, rgba(26,34,45,.98), rgba(17,24,33,.98))', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, boxShadow: 'inset 0 10px 18px rgba(255,255,255,.025), inset 0 -12px 20px rgba(0,0,0,.22)' }}>
                <span style={{ display: 'block', fontSize: 19, lineHeight: 1.05, fontWeight: 760, color: 'var(--tx)' }}>{totalToday > 0 ? `${completedToday}/${totalToday}` : '0%'}</span>
                <span style={{ display: 'block', fontSize: 12, lineHeight: 1.1, color: 'var(--t3)', fontWeight: 500 }}>{totalToday > 0 ? 'Done' : 'No tasks'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, fontWeight: 500, color: 'var(--t2)' }}>
              <span>☑ {completedToday} Task{completedToday === 1 ? '' : 's'} completed</span>
              <span>▣ {notesToday} Note{notesToday === 1 ? '' : 's'} created</span>
              <span>□ {projectsToday} Project{projectsToday === 1 ? '' : 's'} updated</span>
              {totalToday > 0 && <span style={{ color: 'var(--t3)', fontSize: 12 }}>{ringPercent}% of today's tasks done</span>}
            </div>
          </div>
        ) : (
          <div style={{ padding: '6px 2px 2px', color: 'var(--t3)', fontSize: 13 }}>No activity yet today.</div>
        )}
      </RightRailWidget>

      <div style={{ height: 16 }} />

      {showNoteDetails && (
        <>
          <RightRailWidget title="Note Metadata" variant="plain">
            <NotesRail
              entry={selectedEntry}
              entries={entries}
              onOpenEntry={onOpenEntry}
              onNavigate={onNavigate}
              onUpdateEntry={onUpdateEntry}
              onCreateFromMissing={onCreateFromMissing}
              onRevealEntry={onRevealEntry}
            />
          </RightRailWidget>
          <div aria-hidden="true" style={{ height: 1, margin: '18px 0 22px', background: 'linear-gradient(90deg, transparent, rgba(161,174,194,.18) 10%, rgba(161,174,194,.18) 90%, transparent)' }} />
        </>
      )}

      <RightRailWidget
        title={rail.primaryTitle}
        action={onNavigate && <TextActionButton ariaLabel={`Open ${rail.primaryTitle}`} onClick={() => onNavigate(rail.primaryAction)}>View all</TextActionButton>}
        variant="plain"
        >
        {rail.capturePrimary ? (
          recentCaptures.length === 0 ? (
            <div style={{ padding: '6px 2px', color: 'var(--t3)', fontSize: 13 }}>Nothing captured yet.</div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0 12px', color: 'var(--tx)', fontSize: 13, fontWeight: 650 }}>
                <span style={{ flex: 1 }}>Unprocessed</span>
                <span style={{ width: 22, height: 22, borderRadius: 99, background: '#7c4bd4', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12 }}>{recentCaptures.length}</span>
              </div>
              {recentCaptures.map(entry => (
                <CaptureQueueRailRow
                  key={`queue-${entry.id}`}
                  entry={entry}
                  onClick={() => onOpenEntry?.(entry.id)}
                />
              ))}
              {/* Renamed from "Review All" to "Open Inbox" — the button just navigates to the inbox, no batch review. */}
              <button type="button" onClick={() => onNavigate?.('raw')} style={{ width: '100%', minHeight: 38, marginTop: 12, border: `1px solid ${mode.accent}88`, borderRadius: 7, background: 'transparent', color: '#e9d5ff', fontFamily: 'var(--fn)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Open Inbox</button>
            </>
          )
        ) : primaryTaskRows.length === 0 ? (
          <div style={{ padding: '6px 2px', color: 'var(--t3)', fontSize: 13 }}>No tasks due today.</div>
        ) : primaryTaskRows.map(row => (
          <TaskChecklistRow
            key={`task-${row.entry.id}`}
            checked={row.isDone || row.dueState === 'done'}
            title={row.entry.title || 'Untitled task'}
            context={taskContextLabel(row, projectsById)}
            time={dueTimeLabel(row)}
            accent={mode.accent}
            onToggle={next => toggleTaskDone(row, next)}
            onOpen={() => onOpenEntry?.(row.entry.id)}
          />
        ))}
      </RightRailWidget>

      <div aria-hidden="true" style={{ height: 1, margin: '18px 0 22px', background: 'linear-gradient(90deg, transparent, rgba(161,174,194,.18) 10%, rgba(161,174,194,.18) 90%, transparent)' }} />

      <RightRailWidget
        title={rail.secondaryTitle}
        action={onNavigate && <TextActionButton ariaLabel={`Open ${rail.secondaryTitle}`} onClick={() => onNavigate(rail.secondarySource === 'raw' ? 'raw' : 'note')}>View all</TextActionButton>}
        variant="plain"
        >
        {secondaryEntries.length === 0 ? (
          <div style={{ padding: '6px 2px', color: 'var(--t3)', fontSize: 13 }}>{rail.secondarySource === 'raw' ? 'Nothing captured yet.' : 'No notes yet.'}</div>
        ) : secondaryEntries.map(entry => (
          <CaptureFeedRow
            key={`secondary-${entry.id}`}
            entry={entry}
            onClick={() => onOpenEntry?.(entry.id)}
          />
        ))}
      </RightRailWidget>
      {rail.showFinal && recentCaptures.length > 0 && (
        <>
          <div aria-hidden="true" style={{ height: 1, margin: '18px 0 22px', background: 'linear-gradient(90deg, transparent, rgba(161,174,194,.18) 10%, rgba(161,174,194,.18) 90%, transparent)' }} />
          <RightRailWidget
            title="Recent Captures"
            action={onNavigate && <TextActionButton ariaLabel="Open recent captures" onClick={() => onNavigate('raw')}>View all</TextActionButton>}
            variant="plain">
            {recentCaptures.slice(0, 2).map(entry => (
              <CaptureFeedRow
                key={`final-${entry.id}`}
                entry={entry}
                onClick={() => onOpenEntry?.(entry.id)}
              />
            ))}
          </RightRailWidget>
        </>
      )}
    </aside>
  );
}

function RightRailWidget({ title, action, children, variant = 'card' }) {
  const isToday = variant === 'today';
  const sideFade = 'linear-gradient(to top, rgba(126,142,166,.30) 0%, rgba(126,142,166,.30) 50%, rgba(126,142,166,.13) 76%, rgba(126,142,166,.025) 100%)';
  const sectionStyle = isToday
    ? {
        ...cardStyle,
        border: 'none',
        padding: '18px 20px 22px',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, rgba(34,43,55,.70), rgba(19,26,35,.88) 58%, rgba(15,21,29,.98))',
        boxShadow: '0 22px 46px rgba(0,0,0,.28), 0 2px 10px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.055), inset 0 -28px 54px rgba(0,0,0,.18)',
      }
    : variant === 'plain'
      ? { padding: '0 6px', minHeight: 0 }
      : { ...cardStyle, padding: 14, minHeight: 0 };

  return (
    <section style={sectionStyle}>
      {isToday && (
        <>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 105%, rgba(94,138,202,.18), transparent 45%)', pointerEvents: 'none' }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 1, background: 'linear-gradient(90deg, rgba(126,142,166,.16), rgba(126,142,166,.34) 50%, rgba(126,142,166,.16))' }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, bottom: 0, width: 1, height: '100%', background: sideFade }} />
          <span aria-hidden="true" style={{ position: 'absolute', right: 0, bottom: 0, width: 1, height: '100%', background: sideFade }} />
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(126,142,166,.07) 50%, transparent)' }} />
        </>
      )}
      <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--tx)' }}>{title}</h3>
        {action && <div style={{ marginLeft: 'auto' }}>{action}</div>}
      </div>
      {children}
      </div>
    </section>
  );
}

function TaskChecklistRow({ checked, title, context, time, accent = '#3ddc84', onToggle, onOpen }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 10, alignItems: 'start', padding: '7px 0' }}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`Mark ${title} ${checked ? 'incomplete' : 'complete'}`}
        onClick={event => { event.stopPropagation(); onToggle?.(!checked); }}
        style={{ width: 14, height: 14, marginTop: 2, padding: 0, borderRadius: 3, border: '1px solid var(--t3)', background: checked ? accent : 'transparent', color: '#07111f', display: 'grid', placeItems: 'center', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--fn)' }}
      >{checked ? '✓' : ''}</button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${title}`}
        style={{ all: 'unset', minWidth: 0, cursor: onOpen ? 'pointer' : 'default' }}
      >
        <span style={{ display: 'block', color: 'var(--tx)', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: checked ? 'line-through' : 'none', opacity: checked ? 0.6 : 1 }}>{title}</span>
        <span style={{ display: 'block', color: 'var(--t3)', fontSize: 12, fontWeight: 400, marginTop: 3 }}>{context}</span>
      </button>
      <span style={{ color: 'var(--t3)', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>{time}</span>
    </div>
  );
}

function captureIconKindFromEntry(entry) {
  const kind = captureKind(entry);
  if (kind === 'image') return 'thumb';
  if (kind === 'audio') return 'wave';
  if (kind === 'article') return 'p';
  return 'note';
}

function CaptureFeedRow({ entry, onClick }) {
  const iconKind = captureIconKindFromEntry(entry);
  const icon = iconKind === 'thumb' ? '▤' : iconKind === 'wave' ? '≋' : iconKind === 'p' ? 'P' : '▤';
  const background = iconKind === 'p' || iconKind === 'note' ? '#f97316' : 'rgba(255,255,255,.08)';
  const color = iconKind === 'p' || iconKind === 'note' ? '#15100a' : 'var(--t2)';
  const meta = [
    entry.type === 'note' ? 'Note' : iconKind === 'wave' ? 'Audio' : iconKind === 'thumb' ? 'Image' : iconKind === 'p' ? 'Web Clipping' : 'Capture',
    captureTimeLabel(entry) || formatRelativeTime(entry?.modified || entry?.date),
  ].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${entry.title || 'capture'}`}
      style={{ all: 'unset', display: 'grid', gridTemplateColumns: '34px 1fr', gap: 10, alignItems: 'center', padding: '8px 0', cursor: onClick ? 'pointer' : 'default', width: '100%', boxSizing: 'border-box' }}
    >
      <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 4, background, color, display: 'grid', placeItems: 'center', fontWeight: 850, fontSize: 14, border: '1px solid rgba(255,255,255,.10)' }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--tx)', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title || 'Untitled'}</span>
        <span style={{ display: 'block', color: 'var(--t3)', fontSize: 12, fontWeight: 400, marginTop: 3 }}>{meta}</span>
      </span>
    </button>
  );
}

function CaptureQueueRailRow({ entry, onClick }) {
  const iconKind = captureIconKindFromEntry(entry);
  const label = iconKind === 'wave' ? 'Audio' : iconKind === 'thumb' ? 'Image' : iconKind === 'p' ? 'Web Clip' : 'Note';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${entry.title || 'capture'}`}
      style={{ all: 'unset', display: 'grid', gridTemplateColumns: '52px 1fr', gap: 10, alignItems: 'start', padding: '8px 0', cursor: onClick ? 'pointer' : 'default', width: '100%', boxSizing: 'border-box' }}
    >
      <span style={{ color: 'var(--t3)', fontSize: 13, whiteSpace: 'nowrap', paddingTop: 1 }}>{captureTimeLabel(entry) || formatRelativeTime(entry?.modified || entry?.date)}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', color: 'var(--tx)', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.title || 'Untitled capture'}</span>
        <span style={{ display: 'block', color: 'var(--t3)', fontSize: 12, fontWeight: 400, marginTop: 3 }}>{label}</span>
      </span>
    </button>
  );
}
