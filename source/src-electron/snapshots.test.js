import { describe, expect, it, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';

const require = createRequire(import.meta.url);
const Module = require('module');

// snapshots.js does not require('electron') but be safe in case future versions do.
const origLoad = Module._load;
Module._load = function loadHook(request, parent, isMain) {
  if (request === 'electron') return { app: { getPath: () => os.tmpdir() } };
  return origLoad.call(this, request, parent, isMain);
};
afterAll(() => { Module._load = origLoad; });

const snapshots = require('./snapshots.js');

let vaultDir;

beforeEach(() => {
  vaultDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jotfolio-snap-'));
  snapshots.setVaultRoot(vaultDir);
});

describe('snapshots module shape', () => {
  it('exports the expected functions', () => {
    expect(typeof snapshots.setVaultRoot).toBe('function');
    expect(typeof snapshots.schedule).toBe('function');
    expect(typeof snapshots.list).toBe('function');
    expect(typeof snapshots.restore).toBe('function');
    expect(typeof snapshots.prune).toBe('function');
    expect(typeof snapshots.startPrune).toBe('function');
  });
});

describe('snapshots.list / restore', () => {
  it('list returns an empty array when there are no snapshots', async () => {
    const result = await snapshots.list('notes/a.md');
    expect(result).toEqual([]);
  });

  it('list returns snapshots newest-first', async () => {
    const rec = path.join(vaultDir, '.jotfolio', 'recovery');
    fs.mkdirSync(path.join(rec, '2024-01-01', 'notes'), { recursive: true });
    fs.mkdirSync(path.join(rec, '2024-02-01', 'notes'), { recursive: true });
    const janFile = path.join(rec, '2024-01-01', 'notes', 'a.md');
    const febFile = path.join(rec, '2024-02-01', 'notes', 'a.md');
    fs.writeFileSync(janFile, 'jan');
    fs.writeFileSync(febFile, 'feb');
    // Force explicit mtimes so the test is stable under parallel suite load
    // where back-to-back writeFileSync can land on the same millisecond.
    const janTime = new Date('2024-01-01T00:00:00Z');
    const febTime = new Date('2024-02-01T00:00:00Z');
    fs.utimesSync(janFile, janTime, janTime);
    fs.utimesSync(febFile, febTime, febTime);
    const result = await snapshots.list('notes/a.md');
    expect(result.map(r => r.date)).toEqual(['2024-02-01', '2024-01-01']);
  });

  it('restore writes the snapshot content back to the live path', async () => {
    const rec = path.join(vaultDir, '.jotfolio', 'recovery', '2024-03-01', 'notes');
    fs.mkdirSync(rec, { recursive: true });
    fs.writeFileSync(path.join(rec, 'a.md'), 'restored content');

    await snapshots.restore('notes/a.md', '2024-03-01');

    const live = fs.readFileSync(path.join(vaultDir, 'notes', 'a.md'), 'utf8');
    expect(live).toBe('restored content');
  });

  it('restore rejects malformed dates', async () => {
    await expect(snapshots.restore('notes/a.md', '2024-13-40')).rejects.toThrow(/Invalid snapshot date/);
    await expect(snapshots.restore('notes/a.md', 'not-a-date')).rejects.toThrow(/Invalid snapshot date/);
  });

  it('restore rejects path traversal in the relative path', async () => {
    await expect(snapshots.restore('../escape.md', '2024-03-01')).rejects.toThrow(/escape/);
  });

  it('list rejects path traversal in the relative path', async () => {
    await expect(snapshots.list('../escape.md')).rejects.toThrow(/escape/);
  });
});

describe('snapshots.schedule', () => {
  it('does not schedule snapshots for paths under .jotfolio/recovery', () => {
    // Should not throw and should not create any pending timer that breaks tests.
    expect(() => snapshots.schedule('.jotfolio/recovery/2024-01-01/x.md')).not.toThrow();
  });

  it('does not schedule snapshots for paths under .jotfolio/', () => {
    expect(() => snapshots.schedule('.jotfolio/settings.json')).not.toThrow();
  });
});
