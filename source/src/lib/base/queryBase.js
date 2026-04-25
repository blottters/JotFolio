// queryBase — apply Base filters + sorts to an entry list.
//
// Pure functions only. No React, no vault adapter. Deterministic output for
// the same (entries, base) pair so memoization upstream is safe.

const SYSTEM_KEYS = new Set([
  '_path', 'id', 'date', 'starred',
]);

/**
 * Pull the value for `key` from an entry. Frontmatter parser flattens
 * everything onto the top-level entry object, so this is a direct lookup —
 * but we treat `tags` as the canonical spelling and tolerate `tag` as an
 * alias since some users write it that way.
 *
 * @param {Object} entry
 * @param {string} key
 */
function getValue(entry, key) {
  if (!entry || !key) return undefined;
  if (key === 'tag' && entry.tags !== undefined) return entry.tags;
  return entry[key];
}

/**
 * Coerce a raw filter value (often a string from a text input) into a
 * comparable shape. Numeric ops auto-cast; everything else is left as-is.
 */
function coerce(value, op) {
  if (op === 'greater' || op === 'less') {
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }
  return value;
}

/**
 * Test a single entry against a single filter.
 *
 * @param {Object} entry
 * @param {{key:string,op:string,value:*}} filter
 * @returns {boolean}
 */
export function evalFilter(entry, filter) {
  if (!filter || !filter.key) return true;
  const raw = getValue(entry, filter.key);
  const present = raw !== undefined && raw !== null && !(typeof raw === 'string' && raw === '');

  switch (filter.op) {
    case 'exists':
      return present;
    case 'equals': {
      if (!present) return false;
      if (Array.isArray(raw)) return raw.includes(filter.value);
      return String(raw) === String(filter.value);
    }
    case 'contains': {
      if (!present) return false;
      const needle = String(filter.value ?? '').toLowerCase();
      if (Array.isArray(raw)) return raw.some(v => String(v).toLowerCase().includes(needle));
      return String(raw).toLowerCase().includes(needle);
    }
    case 'greater': {
      if (!present) return false;
      const a = Number(raw);
      const b = Number(coerce(filter.value, 'greater'));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return String(raw) > String(filter.value);
      return a > b;
    }
    case 'less': {
      if (!present) return false;
      const a = Number(raw);
      const b = Number(coerce(filter.value, 'less'));
      if (!Number.isFinite(a) || !Number.isFinite(b)) return String(raw) < String(filter.value);
      return a < b;
    }
    case 'in': {
      // value is a comma-separated string OR an array; raw can be scalar or array.
      const haystack = Array.isArray(filter.value)
        ? filter.value.map(v => String(v))
        : String(filter.value ?? '').split(',').map(s => s.trim()).filter(Boolean);
      if (haystack.length === 0) return false;
      if (Array.isArray(raw)) return raw.some(v => haystack.includes(String(v)));
      if (!present) return false;
      return haystack.includes(String(raw));
    }
    default:
      return true;
  }
}

/**
 * Compare two entries against a sort spec. Sort spec is processed in order;
 * first non-zero comparison wins.
 *
 * @param {Object} a
 * @param {Object} b
 * @param {Array<{key:string,dir:'asc'|'desc'}>} sortList
 * @returns {number}
 */
export function evalSort(a, b, sortList) {
  if (!Array.isArray(sortList) || sortList.length === 0) return 0;
  for (const s of sortList) {
    if (!s || !s.key) continue;
    const av = getValue(a, s.key);
    const bv = getValue(b, s.key);
    const cmp = compareValues(av, bv);
    if (cmp !== 0) return s.dir === 'desc' ? -cmp : cmp;
  }
  return 0;
}

function compareValues(a, b) {
  const aMissing = a === undefined || a === null || a === '';
  const bMissing = b === undefined || b === null || b === '';
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;   // missing values sort to end on asc
  if (bMissing) return -1;
  const an = Number(a);
  const bn = Number(b);
  if (Number.isFinite(an) && Number.isFinite(bn) && typeof a !== 'boolean' && typeof b !== 'boolean') {
    return an - bn;
  }
  return String(a).localeCompare(String(b));
}

/**
 * Apply a Base's filters + sorts to an entry list.
 *
 * @param {Object[]} entries
 * @param {{filters?:Array,sorts?:Array}} base
 * @returns {Object[]}
 */
export function applyBase(entries, base) {
  if (!Array.isArray(entries)) return [];
  const safeBase = base || {};
  const filters = Array.isArray(safeBase.filters) ? safeBase.filters : [];
  const sorts = Array.isArray(safeBase.sorts) ? safeBase.sorts : [];
  const filtered = filters.length === 0
    ? entries.slice()
    : entries.filter(e => filters.every(f => evalFilter(e, f)));
  if (sorts.length === 0) return filtered;
  return filtered.slice().sort((a, b) => evalSort(a, b, sorts));
}

/**
 * Union of all property keys present across entries, alphabetized. Skips
 * a small set of internal/system keys that shouldn't appear as filterable
 * columns. Empty/null values still count as "present" (the key was set).
 *
 * @param {Object[]} entries
 * @returns {string[]}
 */
export function getPropertyKeys(entries) {
  if (!Array.isArray(entries)) return [];
  const seen = new Set();
  for (const e of entries) {
    if (!e || typeof e !== 'object') continue;
    for (const k of Object.keys(e)) {
      if (SYSTEM_KEYS.has(k)) continue;
      if (k.startsWith('_')) continue;
      seen.add(k);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}
