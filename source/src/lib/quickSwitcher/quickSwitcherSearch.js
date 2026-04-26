// SlateVault Quick Switcher search logic.
//
// Pure module backing the QuickSwitcher modal. Mirrors Obsidian's
// Cmd/Ctrl+O behavior: fuzzy-match vault entries by title or alias,
// with an empty query falling back to most-recently-modified first.
//
// Score weights (highest beats lower):
//   title  exact     -> 1000
//   alias  exact     ->  900
//   title  startsWith->  700
//   alias  startsWith->  600
//   title  substring ->  500
//   alias  substring ->  400
//   subsequence on title (each query char appears in order) -> 100
//
// No React. Importable in tests.

function safeString(value) {
  return typeof value === 'string' ? value : '';
}

function safeAliases(entry) {
  if (!entry || !Array.isArray(entry.aliases)) return [];
  return entry.aliases.filter(a => typeof a === 'string' && a.length > 0);
}

// Each query character must appear in target in order. Returns true on
// match, including the trivial empty-query case.
function isSubsequence(needle, haystack) {
  if (!needle) return true;
  if (!haystack) return false;
  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (haystack[j] === needle[i]) i++;
  }
  return i === needle.length;
}

// Compare ISO date strings descending (newest first). Entries without a
// date sort after dated entries so empty-query results are still stable.
function compareDateDesc(a, b) {
  const da = safeString(a?.date);
  const db = safeString(b?.date);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  if (da > db) return -1;
  if (da < db) return 1;
  return 0;
}

// Score a single entry against a normalized (lowercased) query. Returns
// 0 when nothing matched — caller filters those out.
function scoreEntry(entry, q) {
  const title = safeString(entry?.title).toLowerCase();
  const aliases = safeAliases(entry).map(a => a.toLowerCase());

  // Exact matches dominate.
  if (title && title === q) return 1000;
  if (aliases.some(a => a === q)) return 900;

  // Prefix matches.
  if (title && title.startsWith(q)) return 700;
  if (aliases.some(a => a.startsWith(q))) return 600;

  // Substring matches.
  if (title && title.includes(q)) return 500;
  if (aliases.some(a => a.includes(q))) return 400;

  // Subsequence fallback for typos like "cmplr" -> "Compiler Notes".
  if (title && isSubsequence(q, title)) return 100;

  return 0;
}

// Rank a list of entries against a query. Empty query returns all
// entries sorted newest-first by entry.date (ISO timestamp). Non-empty
// query returns only entries with score > 0, sorted by score desc, then
// title asc as a stable tiebreaker.
export function rankNotes(entries, query) {
  const list = Array.isArray(entries) ? entries : [];
  const q = safeString(query).trim().toLowerCase();

  if (!q) {
    return [...list].sort(compareDateDesc);
  }

  const scored = [];
  for (const entry of list) {
    const score = scoreEntry(entry, q);
    if (score > 0) scored.push({ entry, score });
  }
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ta = safeString(a.entry?.title).toLowerCase();
    const tb = safeString(b.entry?.title).toLowerCase();
    if (ta < tb) return -1;
    if (ta > tb) return 1;
    return 0;
  });
  return scored.map(s => s.entry);
}

// Return the first entry whose title or any alias matches the query
// case-insensitively, or null. Used to decide whether the QuickSwitcher
// should offer the "Create note titled '<query>'" row.
export function findExactMatch(entries, query) {
  const q = safeString(query).trim().toLowerCase();
  if (!q) return null;
  const list = Array.isArray(entries) ? entries : [];
  for (const entry of list) {
    const title = safeString(entry?.title).toLowerCase();
    if (title && title === q) return entry;
    const aliases = safeAliases(entry).map(a => a.toLowerCase());
    if (aliases.some(a => a === q)) return entry;
  }
  return null;
}
