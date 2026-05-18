import { describe, it, expect } from 'vitest';
import { VaultAdapter } from './VaultAdapter.js';

describe('VaultAdapter abstract base', () => {
  it('every abstract method throws not-available by default', async () => {
    const v = new VaultAdapter();
    await expect(v.pickVault()).rejects.toMatchObject({ name: 'VaultError', code: 'not-available' });
    await expect(v.list()).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.read('x')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.write('x', 'y')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.mkdir('x')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.move('a', 'b')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.remove('x')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.rmdir('x')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.readBinary('x')).rejects.toMatchObject({ code: 'not-available' });
    await expect(v.writeBinary('x', new Uint8Array())).rejects.toMatchObject({ code: 'not-available' });
  });

  it('getVaultPath returns null and watch returns a no-op unsubscribe', () => {
    const v = new VaultAdapter();
    expect(v.getVaultPath()).toBeNull();
    const off = v.watch(() => {});
    expect(typeof off).toBe('function');
    expect(() => off()).not.toThrow();
  });
});
