export const TYPES = ['note','video','podcast','article','journal','link'];
export const ICON = {note:'📝',video:'🎬',podcast:'🎙️',article:'📄',journal:'📓',link:'🔗'};
export const LABEL = {note:'Notes',video:'Videos',podcast:'Podcasts',article:'Articles',journal:'Journals',link:'Links'};
export const STATUSES = {
  note:['draft','active','archived'],
  video:['backlog','watching','watched'],podcast:['saved','listening','done'],
  article:['read later','reading','archived'],journal:['draft','complete'],link:['active','archived','broken']
};
// Types that do not require a URL. Note = pure text, no external reference.
export const NO_URL_TYPES = new Set(['note']);
export const COMMON_FIELDS = ['title','url','notes','tags','status','entry_date'];
export const TYPE_FIELDS = {note:[],video:['channel','duration'],podcast:['guest','episode','highlight'],article:[],journal:[],link:[]};
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
