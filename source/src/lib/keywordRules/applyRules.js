// applyRules — pure function. No I/O, no mutation, no console.log.
// Given an entry, the user's keyword rules, and the per-entry opt-out list,
// returns which tags + wikilinks the rules want auto-applied.

// Escape regex metacharacters in a trigger so the engine matches it literally.
// Covers: . * + ? ^ $ { } ( ) | [ ] \ /
export function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

function getEntryHaystack(entry) {
  const title = typeof entry?.title === 'string' ? entry.title : '';
  const notes = typeof entry?.notes === 'string' ? entry.notes : '';
  const url = typeof entry?.url === 'string' ? entry.url : '';
  return `${title} ${notes} ${url}`;
}

// Word-boundary that works for ALL Unicode (ASCII, CJK, accented Latin, Cyrillic, Greek)
// AND for triggers ending in non-word chars (C++, .NET, node.js).
//
// JS's \b is ASCII-only — \w doesn't match 日, é, я, etc. — so naive \b would let
// trigger "日本" match "日本語" as substring. Fix: use Unicode property lookbehind +
// lookahead asserting the edges are NOT letter-or-number-or-underscore in any script.
//
// For triggers whose edge char is itself non-word (C++, .NET), we still need to allow
// match at the start/end of the haystack — the assertions ((?<![\p{L}\p{N}_]) /
// (?![\p{L}\p{N}_])) succeed at boundaries because there's no preceding/following
// letter+digit+underscore.
function wrapWithBoundaries(escapedTrigger) {
  return `(?<![\\p{L}\\p{N}_])(${escapedTrigger})(?![\\p{L}\\p{N}_])`;
}

function buildRuleRegex(triggers) {
  if (!Array.isArray(triggers) || triggers.length === 0) return null;
  const parts = triggers
    .filter((t) => typeof t === 'string' && t.length > 0)
    .map((t) => wrapWithBoundaries(escapeRegex(t)));
  if (parts.length === 0) return null;
  // Unicode flag (u) so \p{L}/\p{N} work. Case-insensitive (i). Global (g) for matchAll.
  return new RegExp(`(?:${parts.join('|')})`, 'giu');
}

export function applyRules(entry, rules, optOutsForEntry) {
  const optOuts = Array.isArray(optOutsForEntry) ? optOutsForEntry : [];
  const safeRules = Array.isArray(rules) ? rules : [];

  const tags = [];
  const links = [];
  const firedRules = [];
  const matchedTriggers = {};

  if (safeRules.length === 0) {
    return { tags, links, firedRules, matchedTriggers };
  }

  const haystack = getEntryHaystack(entry);

  for (const rule of safeRules) {
    if (!rule || typeof rule.tag !== 'string') continue;
    const triggerList = Array.isArray(rule.triggers) ? rule.triggers : [];
    if (triggerList.length === 0) continue;

    const regex = buildRuleRegex(triggerList);
    if (!regex) continue;

    // Find all matches; preserve which triggers actually fired (case-preserved from rule).
    const hits = new Set();
    const triggerLowerToOriginal = new Map();
    for (const t of triggerList) {
      triggerLowerToOriginal.set(String(t).toLowerCase(), t);
    }

    let match;
    while ((match = regex.exec(haystack)) !== null) {
      // Find whichever capture group fired (one per trigger alternative).
      let captured = null;
      for (let i = 1; i < match.length; i++) {
        if (match[i] !== undefined) {
          captured = match[i];
          break;
        }
      }
      if (captured == null) continue;
      const original = triggerLowerToOriginal.get(captured.toLowerCase());
      if (original !== undefined) hits.add(original);
    }

    if (hits.size === 0) continue;

    firedRules.push(rule.tag);
    matchedTriggers[rule.tag] = Array.from(hits);

    // Tag: include unless opted-out. Dedupe.
    if (!optOuts.includes(rule.tag) && !tags.includes(rule.tag)) {
      tags.push(rule.tag);
    }

    // Links: each one filtered through opt-outs + dedupe. Preserve order from rule.
    const ruleLinks = Array.isArray(rule.links) ? rule.links : [];
    for (const link of ruleLinks) {
      if (typeof link !== 'string') continue;
      if (optOuts.includes(link)) continue;
      if (!links.includes(link)) links.push(link);
    }
  }

  return { tags, links, firedRules, matchedTriggers };
}
