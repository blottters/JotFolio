export const TYPES = ['note','video','podcast','article','journal','link'];
export const KNOWLEDGE_TYPES = ['raw','wiki','review'];
export const ALL_ENTRY_TYPES = [...TYPES,...KNOWLEDGE_TYPES];
export const ICON = {note:'📝',video:'🎬',podcast:'🎙️',article:'📄',journal:'📓',link:'🔗',raw:'🧾',wiki:'🧠',review:'🧪'};
export const LABEL = {note:'Notes',video:'Videos',podcast:'Podcasts',article:'Articles',journal:'Journals',link:'Links',raw:'Inbox',wiki:'Wiki',review:'Review'};
export const STATUSES = {
  note:['draft','active','archived'],
  video:['backlog','watching','watched'],podcast:['saved','listening','done'],
  article:['read later','reading','archived'],journal:['draft','complete'],link:['active','archived','broken'],
  raw:['captured','processed','archived'],wiki:['seed','draft','reviewed','stale'],review:['pending','accepted','rejected']
};
export const STATUS_LABELS = {
  draft:'Draft',
  active:'Active',
  archived:'Archived',
  backlog:'Queued',
  saved:'Queued',
  'read later':'Queued',
  watching:'In progress',
  listening:'In progress',
  reading:'In progress',
  watched:'Done',
  done:'Done',
  complete:'Done',
  broken:'Needs repair',
  captured:'Captured',
  processed:'Processed',
  seed:'Seed',
  reviewed:'Reviewed',
  stale:'Stale',
  pending:'Pending',
  accepted:'Accepted',
  rejected:'Rejected',
};
export function displayStatus(status){return STATUS_LABELS[status]||status||''}
// Types that do not require a URL. Note = pure text, no external reference.
export const NO_URL_TYPES = new Set(['note','wiki','review']);
export const COMMON_FIELDS = ['title','url','notes','tags','status','entry_date'];
export const TYPE_FIELDS = {note:[],video:['channel','duration'],podcast:['guest','episode','highlight'],article:[],journal:[],link:[],raw:[],wiki:[],review:[]};
// Status tone: muted for "done" states, red for "broken", accent for "in-progress/not-started".
// Keeps the card grid from looking like a stoplight.
export const STATUS_DONE=new Set(['watched','done','complete','archived']);
export const STATUS_BROKEN=new Set(['broken']);
export function statusTone(s){
  if(STATUS_BROKEN.has(s))return'#ef4444';
  if(STATUS_DONE.has(s))return'var(--t3)';
  return'var(--ac)';
}
export function statusBg(tone){return`color-mix(in srgb, ${tone} 14%, transparent)`}
export const ALL_STATUS_VALUES = [...new Set(Object.values(STATUSES).flat())];
export const today = () => new Date().toISOString().slice(0,10);

// ── Type-color tokens — Constellation redesign palette ────────────────────
//
// Six desaturated tokens harmonizing with Victory dark (#151415 bg, F1EADE
// cream). Each has full / muted / mono saturation levels so the user can
// tune how prominent type-color signal is. Replaces the old saturated
// rainbow that lived in ConstellationView.jsx as TYPE_HUE.
//
// Knowledge types (raw/wiki/review) keep their own palette — see
// MEMORY_TOKENS below — because they ship behind feature flags and
// follow a different visual language (memory-graph nodes).
//
// Stepped lightness across types so color-blind viewers can tell them apart
// even at the smallest dot size.
export const TYPE_TOKENS = Object.freeze({
  note:    { name: 'Notes',    full: '#d8c8a8', muted: '#a89a82', mono: '#F1EADE' }, // warm parchment
  article: { name: 'Articles', full: '#9ab4b0', muted: '#7d918e', mono: '#c8bfb0' }, // dusty teal
  podcast: { name: 'Podcasts', full: '#c89a7a', muted: '#a07d62', mono: '#a89a82' }, // burnished copper
  video:   { name: 'Videos',   full: '#a08e9c', muted: '#807083', mono: '#8a8275' }, // smoked plum
  journal: { name: 'Journals', full: '#b8a878', muted: '#8e8260', mono: '#d9c9a8' }, // ochre
  link:    { name: 'Links',    full: '#7c8e9a', muted: '#637380', mono: '#8a8275' }, // slate
});

export const MEMORY_TOKENS = Object.freeze({
  raw:    '#f97316', // inbox — warm orange (existing)
  wiki:   '#8b5cf6', // wiki — purple (existing)
  review: '#ec4899', // review — pink (existing)
});

export const TYPE_SATURATION_LEVELS = ['full', 'muted', 'mono'];

/**
 * Resolve a type's color at a given saturation level.
 * @param {string} type - one of TYPES keys (note/article/etc.) or knowledge type
 * @param {'full'|'muted'|'mono'} saturation - default 'full'
 * @returns {string} hex color
 */
export function applyTypeSat(type, saturation = 'full') {
  const token = TYPE_TOKENS[type];
  if (token) {
    if (saturation === 'mono') return token.mono;
    if (saturation === 'muted') return token.muted;
    return token.full;
  }
  // knowledge types pass through unchanged (saturation tweak doesn't affect them)
  if (type in MEMORY_TOKENS) return MEMORY_TOKENS[type];
  return '#F1EADE'; // fallback to accent cream for unknown types
}
