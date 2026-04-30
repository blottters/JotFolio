// rulesStorage — read/write the keyword-rules YAML file in the user's vault.
//
// All vault I/O routes through the existing VaultAdapter contract
// (see `src/adapters/VaultAdapter.js`). The adapter is the single source
// of truth for plain-text vault files. No localStorage fallback. No
// "rules database" concept — the file IS the database.
//
// Path is locked to `_jotfolio/keyword-rules.yaml` per Phase 1 plan
// decision D1. The folder is created on first save.
//
// Errors never throw out of this module — load/save both return tagged
// objects (`{ rules } | { error }` and `{ ok: true } | { error }`) so
// the UI can route them without try/catch ladders.

import jsYaml from 'js-yaml';
import { parseRules } from './parseRules.js';

/** Vault-relative path to the rules file. */
export const RULES_PATH = '_jotfolio/keyword-rules.yaml';

/** Vault-relative path to the parent directory. */
export const RULES_DIR = '_jotfolio';

/**
 * Load and parse the rules file from the vault.
 *
 * Missing file → `{ rules: [] }`. Corrupt YAML → `{ error: string }`.
 *
 * @param {{ read: (path: string) => Promise<string> }} vaultAdapter
 * @returns {Promise<{ rules: Array<{ tag: string, triggers: string[], links: string[] }> } | { error: string }>}
 */
export async function loadRules(vaultAdapter) {
  let raw;
  try {
    raw = await vaultAdapter.read(RULES_PATH);
  } catch (err) {
    // Missing file is the expected first-run state — not an error.
    if (err && err.code === 'not-found') {
      return { rules: [] };
    }
    const message = err && err.message ? err.message : 'failed to read rules file';
    return { error: message };
  }

  return parseRules(raw);
}

/**
 * Serialize the rules object to YAML and write it to the vault.
 *
 * Creates `_jotfolio/` if it doesn't exist. Uses `js-yaml` with
 * `noRefs: true` and 2-space indent for plain-text durability.
 *
 * @param {{ write: (path: string, content: string) => Promise<void>, mkdir: (path: string) => Promise<void> }} vaultAdapter
 * @param {{ rules: Array<{ tag: string, triggers: string[], links: string[] }> }} rulesObject
 * @returns {Promise<{ ok: true } | { error: string }>}
 */
export async function saveRules(vaultAdapter, rulesObject) {
  const rules = (rulesObject && Array.isArray(rulesObject.rules)) ? rulesObject.rules : [];

  // Build the YAML root mapping in rule-firing order. Each rule becomes a
  // top-level key whose value is `{ triggers, links }`. Triggers and links
  // are emitted as flow-sequences via js-yaml defaults — order preserved.
  const root = {};
  for (const rule of rules) {
    if (!rule || typeof rule.tag !== 'string') continue;
    const triggers = Array.isArray(rule.triggers) ? [...rule.triggers] : [];
    const links = Array.isArray(rule.links) ? [...rule.links] : [];
    root[rule.tag] = { triggers, links };
  }

  let yamlString;
  try {
    yamlString = jsYaml.dump(root, { noRefs: true, indent: 2 });
  } catch (err) {
    const message = err && err.message ? err.message : 'failed to serialize rules';
    return { error: message };
  }

  try {
    await vaultAdapter.mkdir(RULES_DIR);
  } catch (err) {
    // mkdir on an existing dir shouldn't fail the save. Real adapters
    // are expected to be idempotent here, but if one isn't we still
    // attempt the write below.
    if (!(err && err.code === 'not-found')) {
      // anything else worth surfacing → fall through; write will fail
      // with a clearer error if the dir really is unwritable.
    }
  }

  try {
    await vaultAdapter.write(RULES_PATH, yamlString);
  } catch (err) {
    const message = err && err.message ? err.message : 'failed to write rules file';
    return { error: message };
  }

  return { ok: true };
}
