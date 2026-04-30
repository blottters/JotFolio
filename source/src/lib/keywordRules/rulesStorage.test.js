// Tests for rulesStorage — vault read/write for `_jotfolio/keyword-rules.yaml`.
//
// The adapter is mocked (we don't hit real disk). The mock implements just
// enough of VaultAdapter to exercise read/write/mkdir + a `not-found`
// VaultError. This mirrors how other lib modules consume the adapter.

import { describe, it, expect, beforeEach } from 'vitest';
import { loadRules, saveRules, RULES_PATH } from './rulesStorage.js';

// Minimal in-memory adapter. Methods throw an error with `code: 'not-found'`
// when a file/folder is missing, matching the VaultError shape used by the
// real LocalAdapter / NodeFsAdapter implementations.
function createMockAdapter(initialFiles = {}) {
  const files = new Map(Object.entries(initialFiles));
  const dirs = new Set();
  return {
    files,
    dirs,
    async read(path) {
      if (!files.has(path)) {
        const err = new Error(`not-found: ${path}`);
        err.code = 'not-found';
        err.name = 'VaultError';
        throw err;
      }
      return files.get(path);
    },
    async write(path, content) {
      files.set(path, content);
    },
    async mkdir(path) {
      dirs.add(path);
    },
  };
}

describe('rulesStorage', () => {
  describe('RULES_PATH', () => {
    it('locks the file path to _jotfolio/keyword-rules.yaml', () => {
      expect(RULES_PATH).toBe('_jotfolio/keyword-rules.yaml');
    });
  });

  describe('loadRules', () => {
    it('returns empty rules when the file is missing (no error)', async () => {
      const adapter = createMockAdapter();
      const result = await loadRules(adapter);
      expect(result).toEqual({ rules: [] });
    });

    it('parses a valid YAML file into the rules array shape', async () => {
      const yaml = [
        'ai:',
        '  triggers: [GPT, Claude, LLM]',
        '  links: [AI Index]',
        '',
        'frontend:',
        '  triggers: [React, JSX]',
        '  links: [Frontend Stack]',
        '',
      ].join('\n');
      const adapter = createMockAdapter({ [RULES_PATH]: yaml });
      const result = await loadRules(adapter);
      expect(result.error).toBeUndefined();
      expect(result.rules).toHaveLength(2);
      expect(result.rules[0]).toEqual({
        tag: 'ai',
        triggers: ['GPT', 'Claude', 'LLM'],
        links: ['AI Index'],
      });
    });

    it('returns { error } for corrupt YAML — does not throw', async () => {
      const adapter = createMockAdapter({
        [RULES_PATH]: 'ai:\n  triggers: [GPT, Claude\n  links: [AI Index]\n',
      });
      const result = await loadRules(adapter);
      expect(result.error).toBeTruthy();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('saveRules', () => {
    it('creates the _jotfolio/ directory before writing', async () => {
      const adapter = createMockAdapter();
      const result = await saveRules(adapter, {
        rules: [{ tag: 'ai', triggers: ['GPT'], links: [] }],
      });
      expect(result).toEqual({ ok: true });
      expect(adapter.dirs.has('_jotfolio')).toBe(true);
    });

    it('writes valid YAML for an empty rules array', async () => {
      const adapter = createMockAdapter();
      const result = await saveRules(adapter, { rules: [] });
      expect(result).toEqual({ ok: true });
      expect(adapter.files.has(RULES_PATH)).toBe(true);
      // Round-trips back to empty rules
      const reloaded = await loadRules(adapter);
      expect(reloaded).toEqual({ rules: [] });
    });

    it('round-trips: save then load returns an identical rules array', async () => {
      const adapter = createMockAdapter();
      const input = {
        rules: [
          { tag: 'ai', triggers: ['GPT', 'Claude', 'LLM'], links: ['AI Index'] },
          { tag: 'frontend', triggers: ['React', 'JSX'], links: ['Frontend Stack'] },
        ],
      };
      await saveRules(adapter, input);
      const reloaded = await loadRules(adapter);
      expect(reloaded.error).toBeUndefined();
      expect(reloaded.rules).toEqual(input.rules);
    });

    it('preserves trigger order from input on save', async () => {
      const adapter = createMockAdapter();
      const input = {
        rules: [
          { tag: 'order-test', triggers: ['zebra', 'apple', 'mango', 'banana'], links: [] },
        ],
      };
      await saveRules(adapter, input);
      const reloaded = await loadRules(adapter);
      expect(reloaded.rules[0].triggers).toEqual(['zebra', 'apple', 'mango', 'banana']);
    });
  });
});
