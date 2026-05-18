import { describe, it, expect, beforeEach } from 'vitest';
import { buildFullDemoVaultStore, maybeResetBrowserDevVaultFromUrl, maybeSeedFullDemoVaultFromUrl } from './fullDemoVault.js';

describe('buildFullDemoVaultStore', () => {
  it('returns files/mtimes/folders maps with content', () => {
    const store = buildFullDemoVaultStore();
    expect(store).toHaveProperty('files');
    expect(store).toHaveProperty('mtimes');
    expect(store).toHaveProperty('folders');
    expect(Object.keys(store.files).length).toBeGreaterThan(0);
    // Every file should have an mtime
    for (const path of Object.keys(store.files)) {
      expect(store.mtimes[path]).toBeGreaterThan(0);
    }
    // Folders should include the documented set
    for (const folder of ['projects', 'notes', 'tasks', 'templates']) {
      expect(store.folders[folder]).toBeGreaterThan(0);
    }
  });
});

describe('maybeSeedFullDemoVaultFromUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does nothing when ?demo / ?mock / ?seed param absent', () => {
    const orig = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...orig, search: '' },
    });
    maybeSeedFullDemoVaultFromUrl();
    expect(localStorage.getItem('jf-vault-local')).toBeNull();
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
  });

  it('seeds the demo vault when ?demo=full and vault empty', () => {
    const orig = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...orig, search: '?demo=full' },
    });
    maybeSeedFullDemoVaultFromUrl();
    const raw = localStorage.getItem('jf-vault-local');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(Object.keys(parsed.files).length).toBeGreaterThan(0);
    expect(localStorage.getItem('mgn-onboarded')).toBe('true');
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
  });

  it('skips seeding when a vault already exists and reset not requested', () => {
    localStorage.setItem('jf-vault-local', JSON.stringify({ files: { 'x.md': 'hi' }, mtimes: { 'x.md': 1 } }));
    const orig = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...orig, search: '?demo=full' },
    });
    maybeSeedFullDemoVaultFromUrl();
    const parsed = JSON.parse(localStorage.getItem('jf-vault-local'));
    // Original single file preserved
    expect(Object.keys(parsed.files)).toEqual(['x.md']);
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
  });
});

describe('maybeResetBrowserDevVaultFromUrl', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('blanks the browser fallback vault during normal dev opens', () => {
    localStorage.setItem('jf-vault-local', JSON.stringify({ files: { 'notes/old.md': 'body' }, mtimes: { 'notes/old.md': 1 } }));
    localStorage.setItem('mgn-e', JSON.stringify([{ id: 'legacy-1', title: 'Legacy' }]));
    const orig = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...orig, search: '' },
    });

    maybeResetBrowserDevVaultFromUrl({ isDev: true });

    expect(localStorage.getItem('jf-vault-local')).toBeNull();
    expect(localStorage.getItem('mgn-e')).toBeNull();
    expect(localStorage.getItem('mgn-vault-migrated')).toBe('true');
    const status = JSON.parse(localStorage.getItem('jf-dev-vault-reset-status'));
    expect(status.existingFileCount).toBe(1);
    expect(status.hadLegacyEntries).toBe(true);
    Object.defineProperty(window, 'location', { configurable: true, value: orig });
  });

  it('keeps seeded data when a test/demo/stress URL explicitly opts in', () => {
    for (const search of ['?test=1', '?demo=full', '?stress=1']) {
      localStorage.clear();
      localStorage.setItem('jf-vault-local', JSON.stringify({ files: { 'notes/keep.md': 'body' }, mtimes: { 'notes/keep.md': 1 } }));
      const orig = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: { ...orig, search },
      });

      maybeResetBrowserDevVaultFromUrl({ isDev: true });

      expect(JSON.parse(localStorage.getItem('jf-vault-local')).files).toHaveProperty('notes/keep.md');
      Object.defineProperty(window, 'location', { configurable: true, value: orig });
    }
  });

  it('does nothing outside dev mode', () => {
    localStorage.setItem('jf-vault-local', JSON.stringify({ files: { 'notes/prod.md': 'body' }, mtimes: { 'notes/prod.md': 1 } }));
    maybeResetBrowserDevVaultFromUrl({ isDev: false });
    expect(JSON.parse(localStorage.getItem('jf-vault-local')).files).toHaveProperty('notes/prod.md');
  });
});
