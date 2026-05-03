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
