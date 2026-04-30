// Parse the keyword-rules YAML file into a typed rules array.
//
// Pure function. No I/O. No side effects. No network calls.
//
// Input format (per Phase 1 plan, D8 lock):
//   ai:
//     triggers: [GPT, Claude, LLM]
//     links: [AI Index]
//
//   frontend:
//     triggers: [React, JSX]
//     links: [Frontend Stack]
//
// Output:
//   { rules: [{ tag, triggers: string[], links: string[] }, ...] }
// or
//   { error: string }   ← never throws; callers route gracefully

import jsYaml from 'js-yaml';

/**
 * Parse a YAML rules document into a KeywordRules object.
 *
 * @param {string} yamlString
 * @returns {{ rules: Array<{ tag: string, triggers: string[], links: string[] }> } | { error: string }}
 */
export function parseRules(yamlString) {
  if (typeof yamlString !== 'string') {
    return { error: 'parseRules expected a string input' };
  }

  // Empty / whitespace-only input → empty rules. No seeded defaults.
  if (yamlString.trim() === '') {
    return { rules: [] };
  }

  let doc;
  try {
    // json: true → duplicate mapping keys are allowed; last one wins.
    // Spec D8: "Duplicate tags in YAML → last one wins (no dedupe error)".
    doc = jsYaml.load(yamlString, { json: true });
  } catch (err) {
    const message = err && err.message ? err.message : 'Invalid YAML';
    return { error: message };
  }

  // null / undefined / non-object root → empty rules, not an error.
  // (e.g. a file containing only comments parses to null)
  if (doc == null) {
    return { rules: [] };
  }

  if (typeof doc !== 'object' || Array.isArray(doc)) {
    return { error: 'YAML root must be a mapping of tag -> rule' };
  }

  const rules = [];

  for (const tag of Object.keys(doc)) {
    const body = doc[tag];

    // Rule body must be a mapping. Skip otherwise — don't throw.
    if (body == null || typeof body !== 'object' || Array.isArray(body)) {
      continue;
    }

    // triggers field is required. Missing → drop the rule silently.
    if (!Object.prototype.hasOwnProperty.call(body, 'triggers')) {
      continue;
    }

    const triggers = coerceToStringArray(body.triggers);

    // Empty triggers after coercion → drop. A rule with no trigger
    // would never fire anyway and tends to be a user typo.
    if (triggers.length === 0) {
      continue;
    }

    const links = Object.prototype.hasOwnProperty.call(body, 'links')
      ? coerceToStringArray(body.links)
      : [];

    // Tag preserved verbatim — no lowercasing, no whitespace trim.
    rules.push({ tag, triggers, links });
  }

  return { rules };
}

/**
 * Coerce a YAML scalar / list into an array of strings.
 *   - string → [string]
 *   - number / boolean → [String(value)]
 *   - array → filtered list of stringified entries (skip null/undefined)
 *   - anything else → []
 */
function coerceToStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      if (item == null) continue;
      out.push(String(item));
    }
    return out;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  return [];
}
