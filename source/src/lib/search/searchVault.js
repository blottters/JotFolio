// SlateVault Phase 9 search.
//
// Query language (scoped tokens, AND-combined, case-insensitive):
//   plain text       -> substring against title + notes + tags
//   "quoted phrase"  -> exact substring (with spaces) against title + notes
//   tag:foo  / #foo  -> entry has tag "foo"
//   status:active    -> frontmatter status === 'active'
//   type:note        -> entry.type === 'note'
//   key:value        -> entry[key] string-matches value (substring)
//   key:"two words"  -> quoted scoped value
//   -tag:archived    -> negation; excludes matches
//
// Empty query matches everything.
//
// Pure module. No React, no DOM. Importable in tests.

// ---------- parsing ----------

// Scan a query string into raw tokens, honoring double-quoted runs.
// "tag:foo channel:\"The Daily\" -status:archived hello"
// -> ['tag:foo', 'channel:"The Daily"', '-status:archived', 'hello']
function tokenize(queryString) {
  const src = String(queryString || '');
  const tokens = [];
  let buf = '';
  let inQuote = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '"') {
      buf += ch;
      inQuote = !inQuote;
      continue;
    }
    if (!inQuote && /\s/.test(ch)) {
      if (buf) { tokens.push(buf); buf = ''; }
      continue;
    }
    buf += ch;
  }
  if (buf) tokens.push(buf);
  return tokens;
}

// Strip surrounding double-quotes from a value, if present.
function unquote(s) {
  if (s.length >= 2 && s.startsWith('"') && s.endsWith('"')) {
    return s.slice(1, -1);
  }
  return s;
}

// Detect if a token is a fully-quoted phrase (no scope prefix).
function isQuotedPhrase(token) {
  return token.length >= 2 && token.startsWith('"') && token.endsWith('"');
}

export function parseSearchQuery(queryString) {
  const out = { text: [], scoped: [], phrases: [] };
  const tokens = tokenize(queryString);
  for (const raw of tokens) {
    if (!raw) continue;

    // Negation prefix
    let negated = false;
    let token = raw;
    if (token.startsWith('-') && token.length > 1) {
      negated = true;
      token = token.slice(1);
    }

    // #tag shorthand -> tag:tag
    if (token.startsWith('#') && token.length > 1) {
      out.scoped.push({
        key: 'tag',
        value: token.slice(1).toLowerCase(),
        negated,
      });
      continue;
    }

    // Quoted bare phrase (no key:) — exact-substring against title+notes
    if (isQuotedPhrase(token)) {
      const phrase = unquote(token);
      if (phrase) {
        if (negated) {
          // -"phrase" — treat as a negated phrase by pushing scoped with key 'phrase'
          out.scoped.push({ key: '__phrase__', value: phrase.toLowerCase(), negated: true });
        } else {
          out.phrases.push(phrase.toLowerCase());
        }
      }
      continue;
    }

    // key:value scope. Find first colon NOT inside quotes — but since the
    // value side may itself be quoted, just split on the first ':'.
    const colonIdx = token.indexOf(':');
    if (colonIdx > 0 && colonIdx < token.length - 1) {
      const key = token.slice(0, colonIdx).toLowerCase();
      const value = unquote(token.slice(colonIdx + 1)).toLowerCase();
      if (key && value) {
        out.scoped.push({ key, value, negated });
        continue;
      }
    }

    // Plain text fragment
    if (negated) {
      // -plaintext — exclude entries containing this substring in title/notes/tags
      out.scoped.push({ key: '__text__', value: token.toLowerCase(), negated: true });
    } else {
      out.text.push(token.toLowerCase());
    }
  }
  return out;
}

// ---------- matching ----------

function entryHasTag(entry, tagValue) {
  const tags = entry.tags || [];
  return tags.some(t => String(t).toLowerCase() === tagValue);
}

function entryFieldString(entry, key) {
  // Direct property lookup. Returns undefined for missing keys (caller decides).
  const v = entry?.[key];
  if (v == null) return undefined;
  if (Array.isArray(v)) return v.map(String).join(' ').toLowerCase();
  if (typeof v === 'object') return undefined; // don't stringify nested objects
  return String(v).toLowerCase();
}

function plainTextHit(entry, needle) {
  const title = (entry.title || '').toLowerCase();
  const notes = (entry.notes || '').toLowerCase();
  if (title.includes(needle) || notes.includes(needle)) return true;
  const tags = entry.tags || [];
  return tags.some(t => String(t).toLowerCase().includes(needle));
}

function phraseHit(entry, phrase) {
  const title = (entry.title || '').toLowerCase();
  const notes = (entry.notes || '').toLowerCase();
  return title.includes(phrase) || notes.includes(phrase);
}

function scopedHit(entry, key, value) {
  if (key === 'tag' || key === 'tags') {
    return entryHasTag(entry, value);
  }
  if (key === '__phrase__') {
    return phraseHit(entry, value);
  }
  if (key === '__text__') {
    return plainTextHit(entry, value);
  }
  // Generic frontmatter / property lookup
  const field = entryFieldString(entry, key);
  if (field === undefined) return false;
  // For exact-feeling keys (status, type) this is still substring, which is
  // intentional — 'status:active' matches 'active' exactly, but 'status:act'
  // also matches. Keeps the casual-user mental model consistent.
  return field.includes(value);
}

export function matchesQuery(entry, parsed) {
  if (!entry) return false;
  if (!parsed) return true;

  // All plain text tokens must hit somewhere in title/notes/tags
  for (const t of parsed.text) {
    if (!plainTextHit(entry, t)) return false;
  }

  // All quoted phrases must hit in title/notes
  for (const p of parsed.phrases) {
    if (!phraseHit(entry, p)) return false;
  }

  // All scoped tokens must satisfy their assertion (with negation flip)
  for (const { key, value, negated } of parsed.scoped) {
    const hit = scopedHit(entry, key, value);
    if (negated && hit) return false;
    if (!negated && !hit) return false;
  }

  return true;
}

export function searchEntries(entries, queryString) {
  const list = Array.isArray(entries) ? entries : [];
  const parsed = parseSearchQuery(queryString);
  if (parsed.text.length === 0 && parsed.scoped.length === 0 && parsed.phrases.length === 0) {
    return list.slice();
  }
  return list.filter(e => matchesQuery(e, parsed));
}
