import { describe, it, expect } from 'vitest';
import { VaultError } from './VaultError.js';

describe('VaultError', () => {
  it('constructs with code/detail/cause and prefixes the message', () => {
    const cause = new Error('underlying');
    const err = new VaultError('not-found', 'missing.md', cause);
    expect(err.name).toBe('VaultError');
    expect(err.code).toBe('not-found');
    expect(err.detail).toBe('missing.md');
    expect(err.cause).toBe(cause);
    expect(err.message).toBe('not-found: missing.md');
  });

  it('message degrades to just the code when detail absent', () => {
    expect(new VaultError('io-error').message).toBe('io-error');
  });

  it('toJSON / fromJSON round-trip preserves code and detail', () => {
    const orig = new VaultError('access-denied', 'no perms');
    const json = orig.toJSON();
    expect(json).toEqual({ code: 'access-denied', message: 'access-denied: no perms', detail: 'no perms' });
    const back = VaultError.fromJSON(json);
    expect(back).toBeInstanceOf(VaultError);
    expect(back.code).toBe('access-denied');
    expect(back.detail).toBe('no perms');
  });

  it('VaultError.is identifies instances and plain-object look-alikes', () => {
    expect(VaultError.is(new VaultError('x'))).toBe(true);
    expect(VaultError.is({ name: 'VaultError', code: 'io-error' })).toBe(true);
    expect(VaultError.is(new Error('regular'))).toBe(false);
    expect(VaultError.is(null)).toBe(false);
    expect(VaultError.is('string')).toBe(false);
  });
});
