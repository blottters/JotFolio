import { describe, it, expect } from 'vitest';
import {
  loadOptOuts,
  saveOptOuts,
  addOptOut,
  removeOptOut,
  getOptOutsForEntry,
} from './optOutTracker.js';

const OPT_OUTS_PATH = '_jotfolio/keyword-opt-outs.yaml';

// A minimal in-memory mock that quacks like the VaultAdapter contract used by
// templateStore — read / write / mkdir, async, throws on missing read.
function makeVault(initialFiles = {}) {
  const files = { ...initialFiles };
  const dirs = new Set();
  return {
    files,
    dirs,
    async read(path) {
      if (!(path in files)) {
        const err = new Error(`Not found: ${path}`);
        err.code = 'not-found';
        throw err;
      }
      return files[path];
    },
    async write(path, content) {
      files[path] = content;
    },
    async mkdir(path) {
      dirs.add(path);
    },
  };
}

describe('optOutTracker', () => {
  describe('loadOptOuts', () => {
    it('returns {} when the file is missing', async () => {
      const vault = makeVault();
      const result = await loadOptOuts(vault);
      expect(result).toEqual({});
    });

    it('propagates non-not-found errors instead of swallowing as missing-file', async () => {
      const failingVault = {
        read: async () => { throw Object.assign(new Error('permission denied'), { code: 'access-denied' }); },
      };
      const result = await loadOptOuts(failingVault);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('permission denied');
    });

    it('still returns {} for genuine not-found errors', async () => {
      const missingVault = {
        read: async () => { throw Object.assign(new Error('no file'), { code: 'not-found' }); },
      };
      const result = await loadOptOuts(missingVault);
      expect(result).toEqual({});
      expect(result).not.toHaveProperty('error');
    });

    it('returns parsed map when the file exists', async () => {
      const yaml = [
        'entry-id-12345:',
        '  - ai',
        '  - frontend',
        'entry-id-67890:',
        '  - stoic',
        '',
      ].join('\n');
      const vault = makeVault({ [OPT_OUTS_PATH]: yaml });
      const result = await loadOptOuts(vault);
      expect(result).toEqual({
        'entry-id-12345': ['ai', 'frontend'],
        'entry-id-67890': ['stoic'],
      });
    });
  });

  describe('saveOptOuts', () => {
    it('round-trips: save then load returns the same data', async () => {
      const vault = makeVault();
      const data = {
        'entry-id-12345': ['ai', 'frontend'],
        'entry-id-67890': ['stoic'],
      };
      const writeResult = await saveOptOuts(vault, data);
      expect(writeResult).toEqual({ ok: true });
      const loaded = await loadOptOuts(vault);
      expect(loaded).toEqual(data);
    });

    it('creates the _jotfolio/ parent directory if missing', async () => {
      const vault = makeVault();
      await saveOptOuts(vault, { 'entry-id-1': ['ai'] });
      expect(vault.dirs.has('_jotfolio')).toBe(true);
    });
  });

  describe('addOptOut (pure)', () => {
    it('adds a tag to a fresh entry without mutating the input', () => {
      const input = {};
      const before = JSON.stringify(input);
      const result = addOptOut(input, 'id1', 'ai');
      expect(result).toEqual({ id1: ['ai'] });
      expect(JSON.stringify(input)).toBe(before);
    });

    it('does not double-add the same opt-out', () => {
      const input = { id1: ['ai'] };
      const before = JSON.stringify(input);
      const result = addOptOut(input, 'id1', 'ai');
      expect(result).toEqual({ id1: ['ai'] });
      expect(JSON.stringify(input)).toBe(before);
    });
  });

  describe('removeOptOut (pure)', () => {
    it('removes a tag and is idempotent on missing tag', () => {
      const input = { id1: ['ai', 'frontend'] };
      const before = JSON.stringify(input);
      const after = removeOptOut(input, 'id1', 'ai');
      expect(after).toEqual({ id1: ['frontend'] });
      // Idempotent: removing what isn't there is a no-op-shaped clone.
      const noop = removeOptOut(after, 'id1', 'ai');
      expect(noop).toEqual({ id1: ['frontend'] });
      // Removing from a missing entry is also a no-op.
      const missing = removeOptOut(after, 'id-nope', 'ai');
      expect(missing).toEqual({ id1: ['frontend'] });
      // Original input untouched.
      expect(JSON.stringify(input)).toBe(before);
    });
  });

  describe('getOptOutsForEntry (pure)', () => {
    it('returns the array for a known entry, [] for missing', () => {
      const input = { id1: ['ai', 'frontend'] };
      expect(getOptOutsForEntry(input, 'id1')).toEqual(['ai', 'frontend']);
      expect(getOptOutsForEntry(input, 'id-missing')).toEqual([]);
      expect(getOptOutsForEntry({}, 'whatever')).toEqual([]);
      expect(getOptOutsForEntry(null, 'x')).toEqual([]);
    });
  });
});
