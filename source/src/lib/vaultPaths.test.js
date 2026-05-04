import { describe, expect, it } from 'vitest';
import {
  buildFolderTree,
  fileNameFromPath,
  folderContainsPath,
  folderFromPath,
  isInternalVaultPath,
  joinVaultPath,
  normalizeMarkdownFileName,
  normalizeVaultFolder,
} from './vaultPaths.js';

describe('vault path helpers', () => {
  it('normalizes vault-relative folders', () => {
    expect(normalizeVaultFolder(' notes\\daily/ ')).toBe('notes/daily');
    expect(normalizeVaultFolder('.')).toBe('');
    expect(() => normalizeVaultFolder('C:/Users/gavin')).toThrow(/vault-relative/);
    expect(() => normalizeVaultFolder('../outside')).toThrow(/parent/);
  });

  it('normalizes markdown filenames and joins paths', () => {
    expect(normalizeMarkdownFileName('Plan')).toBe('Plan.md');
    expect(normalizeMarkdownFileName('Plan.md')).toBe('Plan.md');
    expect(joinVaultPath('notes/daily', 'Plan')).toBe('notes/daily/Plan.md');
    expect(fileNameFromPath('notes/daily/Plan.md')).toBe('Plan.md');
    expect(folderFromPath('notes/daily/Plan.md')).toBe('notes/daily');
  });

  it('builds a counted folder tree from entry paths', () => {
    const tree = buildFolderTree([
      { _path: 'notes/a.md' },
      { _path: 'notes/daily/b.md' },
      { _path: 'articles/c.md' },
    ]);
    expect(tree).toEqual([
      { path: 'articles', name: 'articles', depth: 0, count: 1 },
      { path: 'notes', name: 'notes', depth: 0, count: 1 },
      { path: 'notes/daily', name: 'daily', depth: 1, count: 1 },
    ]);
  });

  it('includes explicit empty folders in the folder tree', () => {
    expect(buildFolderTree([], ['notes/projects'])).toEqual([
      { path: 'notes', name: 'notes', depth: 0, count: 0 },
      { path: 'notes/projects', name: 'projects', depth: 1, count: 0 },
    ]);
  });

  it('hides app-internal folders from the normal folder tree', () => {
    expect(isInternalVaultPath('.jotfolio/trash/2026/journals')).toBe(true);
    expect(isInternalVaultPath('_jotfolio/keyword-rules.yaml')).toBe(true);
    expect(isInternalVaultPath('journals')).toBe(false);
    expect(buildFolderTree([
      { _path: 'journals/day.md' },
      { _path: '.jotfolio/trash/2026/journals/deleted.md' },
    ], [
      '.jotfolio/trash/2026/journals',
      '_jotfolio',
      'notes/projects',
    ])).toEqual([
      { path: 'journals', name: 'journals', depth: 0, count: 1 },
      { path: 'notes', name: 'notes', depth: 0, count: 0 },
      { path: 'notes/projects', name: 'projects', depth: 1, count: 0 },
    ]);
  });

  it('matches folder selections against nested entry paths', () => {
    expect(folderContainsPath('notes', 'notes/Plan.md')).toBe(true);
    expect(folderContainsPath('notes', 'notes/projects/Plan.md')).toBe(true);
    expect(folderContainsPath('notes/projects', 'notes/Plan.md')).toBe(false);
    expect(folderContainsPath('notes', 'articles/Plan.md')).toBe(false);
  });
});
