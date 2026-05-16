import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEntryId, isStorageCorruptionError, storage } from './storage.js';

const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('entry ids', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates UUID v4 shaped entry ids', () => {
    expect(createEntryId()).toMatch(UUID_V4_RE);
  });

  it('creates UUID v4 shaped entry ids without crypto.randomUUID', () => {
    vi.stubGlobal('crypto', {
      getRandomValues(bytes) {
        for (let i = 0; i < bytes.length; i += 1) bytes[i] = i;
        return bytes;
      },
    });

    expect(createEntryId()).toMatch(UUID_V4_RE);
  });
});

describe('storage corruption handling', () => {
  it('quarantines corrupt values and blocks overwrite of the original key', async () => {
    localStorage.setItem('mgn-e', '{not json');

    await expect(storage.get('mgn-e')).rejects.toSatisfy(isStorageCorruptionError);

    const quarantineKey = Object.keys(localStorage).find(k => k.startsWith('mgn-e.corrupt.'));
    expect(quarantineKey).toBeTruthy();
    expect(localStorage.getItem(quarantineKey)).toBe('{not json');

    await expect(storage.set('mgn-e', [])).rejects.toSatisfy(isStorageCorruptionError);
    expect(localStorage.getItem('mgn-e')).toBe('{not json');
  });
});
