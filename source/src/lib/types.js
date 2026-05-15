export const TYPES = ['note','video','podcast','article','journal','link','project','task'];
export const KNOWLEDGE_TYPES = ['raw','wiki','review'];
export const ALL_ENTRY_TYPES = [...TYPES,...KNOWLEDGE_TYPES];
export const ICON = {note:'📝',video:'🎬',podcast:'🎙️',article:'📄',journal:'📓',link:'🔗',project:'🗂️',task:'✅',raw:'🧾',wiki:'🧠',review:'🧪'};
export const LABEL = {note:'Notes',video:'Videos',podcast:'Podcasts',article:'Articles',journal:'Journals',link:'Links',project:'Projects',task:'Tasks',raw:'Inbox',wiki:'Wiki',review:'Review'};
export const STATUSES = {
  note:['draft','active','archived'],
  video:['backlog','watching','watched'],podcast:['saved','listening','done'],
  article:['read later','reading','archived'],journal:['draft','complete'],link:['active','archived','broken'],
  project:['active','paused','archived'],task:['open','in progress','done','archived'],
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
  paused:'Paused',
  open:'Open',
  'in progress':'In progress',
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
export const NO_URL_TYPES = new Set(['note','project','task','wiki','review']);
export const COMMON_FIELDS = ['title','url','notes','tags','status','entry_date'];
export const TYPE_FIELDS = {
  note:[],
  video:['channel','duration'],
  podcast:['guest','episode','highlight'],
  article:[],
  journal:[],
  link:[],
  project:['space','due'],
  task:['project','space','source_entry','due','priority','completed','completed_at'],
  raw:[],
  wiki:[],
  review:[],
};
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
// Type tokens for Constellation and type accents.
// `signal` is the graph-first palette. The neutral themes (bone / sepia /
// cool / mono) stay available for quieter work modes.
//
//   signal — Clear graph colors for Constellation.
//   bone   — Bone & stone. Earth tones. Most differentiated neutral set.
//   sepia  — Sepia gradient. Single warm hue, stepped lightness.
//   cool   — Cool neutrals. Greys with bluish undertones.
//   mono   — Monochrome cream. Type-color signal nearly gone, relies on
//            icon + position.
//
// Knowledge types (raw/wiki/review) keep their own palette — see
// MEMORY_TOKENS below — because they ship behind feature flags and follow
// a different visual language (memory-graph nodes).
//
// Stepped lightness across types so color-blind viewers can tell them apart
// even at the smallest dot size.
export const TYPE_TOKENS = Object.freeze({
  note:    { name: 'Notes',    bone: '#D9CDB4', sepia: '#E8DEC8', cool: '#CFC9BD', mono: '#F1EADE', signal: '#8BD3FF' },
  article: { name: 'Articles', bone: '#A89A82', sepia: '#C9B79A', cool: '#9DA3A0', mono: '#D9D0BD', signal: '#B7E4A1' },
  podcast: { name: 'Podcasts', bone: '#B89478', sepia: '#A8916F', cool: '#A4978B', mono: '#C0B59E', signal: '#F6A873' },
  video:   { name: 'Videos',   bone: '#8C7A6B', sepia: '#85714F', cool: '#7C8284', mono: '#A89C82', signal: '#F4D35E' },
  journal: { name: 'Journals', bone: '#C2B187', sepia: '#D4BD92', cool: '#B8B0A0', mono: '#E0D6BF', signal: '#D9B4FF' },
  link:    { name: 'Links',    bone: '#766962', sepia: '#5C4D38', cool: '#5F6262', mono: '#8E8472', signal: '#9AA7B8' },
  project: { name: 'Projects', bone: '#91A18E', sepia: '#A89D74', cool: '#879797', mono: '#B9B09A', signal: '#7DDC9E' },
  task:    { name: 'Tasks',    bone: '#B8A06C', sepia: '#B28E65', cool: '#90948A', mono: '#D0C5AB', signal: '#FFB86B' },
});

export const MEMORY_TOKENS = Object.freeze({
  raw:    '#f97316', // inbox — warm orange (existing)
  wiki:   '#8b5cf6', // wiki — purple (existing)
  review: '#ec4899', // review — pink (existing)
});

export const TYPE_THEME_LEVELS = ['signal', 'bone', 'sepia', 'cool', 'mono'];

// Back-compat alias. Old name; some imports still reference it.
export const TYPE_SATURATION_LEVELS = TYPE_THEME_LEVELS;

// Map of legacy alpha.19 saturation values → new alpha.20 theme keys, for
// the prefs migration below.
const LEGACY_SATURATION_REMAP = { full: 'bone', muted: 'sepia', mono: 'mono' };

/**
 * Migrate a saved alpha.19 saturation value (full/muted/mono) to the new
 * alpha.20 theme value (bone/sepia/cool/mono). New theme keys pass through.
 */
export function migrateTypeSatToTheme(value) {
  if (TYPE_THEME_LEVELS.includes(value)) return value;
  if (value in LEGACY_SATURATION_REMAP) return LEGACY_SATURATION_REMAP[value];
  return 'bone';
}

/**
 * Resolve a type's color under a given palette theme.
 * @param {string} type - one of TYPES keys (note/article/etc.) or knowledge type
 * @param {'signal'|'bone'|'sepia'|'cool'|'mono'|'full'|'muted'} theme - default 'bone'
 *   (legacy 'full'/'muted' values auto-migrate)
 * @returns {string} hex color
 */
export function applyTypeSat(type, theme = 'bone') {
  const t = migrateTypeSatToTheme(theme);
  const token = TYPE_TOKENS[type];
  if (token) {
    return token[t] || token.bone;
  }
  // knowledge types pass through unchanged (theme tweak doesn't affect them)
  if (type in MEMORY_TOKENS) return MEMORY_TOKENS[type];
  return '#F1EADE'; // fallback to accent cream for unknown types
}
