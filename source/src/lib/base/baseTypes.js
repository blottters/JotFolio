// baseTypes — shape definitions + helpers for SlateVault Bases.
//
// A "Base" is a saved query + view configuration over the entry catalog.
// It lives on disk as `bases/<id>.base.json` so users can version, share,
// and hand-edit them outside the app.
//
// JSON shape (BaseFile):
//   {
//     id: "<stable id>",
//     name: "Reading Queue",
//     filters: [{ key, op, value }, ...],
//     sorts:   [{ key, dir }, ...],
//     columns: ["title","status","tags"],
//     activeViewId: "table",
//     views: [
//       { id:"table", type:"table", name:"Table" },
//       { id:"cards", type:"cards", name:"Cards" },
//       { id:"list",  type:"list",  name:"List"  },
//     ]
//   }
//
// All shapes are plain JS objects; we only sketch them in JSDoc since
// the rest of the codebase is JS-not-TS.
//
// @typedef {Object} BaseFilter
// @property {string} key                                          Frontmatter key to test
// @property {'equals'|'contains'|'exists'|'greater'|'less'|'in'} op   Operator
// @property {*}      value                                        Comparison value (ignored for 'exists')
//
// @typedef {Object} BaseSort
// @property {string}        key   Frontmatter key to sort by
// @property {'asc'|'desc'}  dir   Direction
//
// @typedef {Object} BaseView
// @property {string}                  id    Stable view id
// @property {'table'|'cards'|'list'}  type  Render style
// @property {string}                  name  Human label
//
// @typedef {Object} BaseFile
// @property {string}        id
// @property {string}        name
// @property {BaseFilter[]}  filters
// @property {BaseSort[]}    sorts
// @property {string[]}      columns
// @property {string}        activeViewId
// @property {BaseView[]}    views

export const BASE_FILE_VERSION = 1;
export const BASE_FILE_EXT = '.base.json';
export const BASE_DIR = 'bases';

export const FILTER_OPS = ['equals', 'contains', 'exists', 'greater', 'less', 'in'];
export const VIEW_TYPES = ['table', 'cards', 'list'];

// Default column set when nothing is configured. These are universal-enough
// fields that almost every entry has at least one of.
export const DEFAULT_COLUMNS = ['title', 'type', 'status', 'tags'];

/**
 * Build a fresh Base with sensible defaults. Caller picks the name; the id
 * derives from the name (slugified, time-suffixed) so two "Reading Queue"
 * bases don't collide on disk.
 *
 * @param {{name?: string, id?: string}} [opts]
 * @returns {BaseFile}
 */
export function createEmptyBase(opts = {}) {
  const name = (opts.name || 'Untitled Base').trim() || 'Untitled Base';
  const id = opts.id || makeBaseId(name);
  return {
    id,
    name,
    version: BASE_FILE_VERSION,
    filters: [],
    sorts: [],
    columns: [...DEFAULT_COLUMNS],
    activeViewId: 'table',
    views: [
      { id: 'table', type: 'table', name: 'Table' },
      { id: 'cards', type: 'cards', name: 'Cards' },
      { id: 'list',  type: 'list',  name: 'List' },
    ],
  };
}

/**
 * Slugify a name into a base id. Ascii-folded, hyphenated, suffixed with a
 * short timestamp shard so collisions are unlikely without inspecting other
 * existing bases.
 *
 * @param {string} name
 * @returns {string}
 */
export function makeBaseId(name) {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'base';
  const shard = Math.floor(Date.now() % 1e6).toString(36);
  return `${slug}-${shard}`;
}

/**
 * Path within the vault where a base file lives.
 * @param {string} id
 * @returns {string}
 */
export function basePath(id) {
  return `${BASE_DIR}/${id}${BASE_FILE_EXT}`;
}

/**
 * Validate a parsed JSON blob and coerce it into a well-formed BaseFile.
 * Missing fields fall back to defaults. Returns the normalized base.
 * Throws Error on hopelessly malformed input (non-object).
 *
 * @param {*} raw
 * @returns {BaseFile}
 */
export function normalizeBase(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('Base file must be an object');
  const filters = Array.isArray(raw.filters)
    ? raw.filters.filter(f => f && typeof f.key === 'string' && FILTER_OPS.includes(f.op))
    : [];
  const sorts = Array.isArray(raw.sorts)
    ? raw.sorts.filter(s => s && typeof s.key === 'string' && (s.dir === 'asc' || s.dir === 'desc'))
    : [];
  const columns = Array.isArray(raw.columns) && raw.columns.every(c => typeof c === 'string')
    ? raw.columns.slice()
    : [...DEFAULT_COLUMNS];
  const views = Array.isArray(raw.views) && raw.views.length > 0
    ? raw.views
        .filter(v => v && typeof v.id === 'string' && VIEW_TYPES.includes(v.type))
        .map(v => ({ id: v.id, type: v.type, name: typeof v.name === 'string' ? v.name : v.id }))
    : [
        { id: 'table', type: 'table', name: 'Table' },
        { id: 'cards', type: 'cards', name: 'Cards' },
        { id: 'list',  type: 'list',  name: 'List' },
      ];
  const activeViewId = views.find(v => v.id === raw.activeViewId) ? raw.activeViewId : views[0].id;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeBaseId(raw.name || 'base'),
    name: typeof raw.name === 'string' && raw.name ? raw.name : 'Untitled Base',
    version: typeof raw.version === 'number' ? raw.version : BASE_FILE_VERSION,
    filters,
    sorts,
    columns,
    activeViewId,
    views,
  };
}

/**
 * Serialize a base to the JSON string written to disk. Pretty-printed so
 * git diffs are readable when users commit their vault.
 *
 * @param {BaseFile} base
 * @returns {string}
 */
export function serializeBase(base) {
  return JSON.stringify(normalizeBase(base), null, 2);
}
