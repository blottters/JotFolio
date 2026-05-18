import { describe, it, expect, beforeEach } from 'vitest';
import { OFFICIAL_PLUGINS, installOfficial } from './officialPlugins.js';
import { vault } from '../adapters/index.js';

describe('officialPlugins catalog', () => {
  it('OFFICIAL_PLUGINS lists daily-notes with parsed manifest', () => {
    const dn = OFFICIAL_PLUGINS.find(p => p.id === 'daily-notes');
    expect(dn).toBeDefined();
    expect(dn.manifest).toBeDefined();
    expect(typeof dn.name).toBe('string');
    expect(Array.isArray(dn.files)).toBe(true);
    expect(dn.files.length).toBeGreaterThanOrEqual(2);
    // Manifest path must match the install convention
    expect(dn.files.some(f => f.path === '.jotfolio/plugins/daily-notes/manifest.json')).toBe(true);
  });
});

describe('installOfficial', () => {
  beforeEach(async () => {
    localStorage.removeItem('jf-vault-local');
    await vault.pickVault();
  });

  it('throws for an unknown plugin id', async () => {
    await expect(installOfficial('does-not-exist')).rejects.toThrow(/Unknown official plugin/);
  });

  it('writes plugin files into the vault and reports alreadyPresent=false on first install', async () => {
    const res = await installOfficial('daily-notes');
    expect(res.installed).toBe('daily-notes');
    expect(res.alreadyPresent).toBe(false);
    const files = await vault.list();
    expect(files.some(f => f.path === '.jotfolio/plugins/daily-notes/manifest.json')).toBe(true);
  });

  it('reports alreadyPresent=true on re-install', async () => {
    await installOfficial('daily-notes');
    const res = await installOfficial('daily-notes');
    expect(res.alreadyPresent).toBe(true);
  });
});
