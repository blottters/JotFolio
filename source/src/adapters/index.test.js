import { describe, it, expect } from 'vitest';
import * as mod from './index.js';
import { LocalAdapter } from './LocalAdapter.js';

describe('adapters/index barrel', () => {
  it('exposes vault singleton + named classes', () => {
    expect(mod.vault).toBeDefined();
    expect(mod.LocalAdapter).toBeDefined();
    expect(mod.NodeFsAdapter).toBeDefined();
    expect(mod.VaultAdapter).toBeDefined();
    expect(mod.VaultError).toBeDefined();
  });

  it('detect() picks LocalAdapter when window.electron is absent (jsdom default)', () => {
    // In jsdom test env, window.electron is undefined so the adapter picker
    // should hand us a LocalAdapter.
    expect(mod.vault).toBeInstanceOf(LocalAdapter);
  });
});
