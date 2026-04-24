import { describe, expect, it } from 'vitest';
import { isStorageCorruptionError, storage } from './storage.js';

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
