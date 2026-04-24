import { describe, it, expect, beforeEach } from 'vitest';
import { PluginHost } from '../PluginHost.js';
import { vault } from '../../adapters/index.js';
import { commands } from '../CommandRegistry.js';
import { appBus } from '../EventBus.js';

// LocalAdapter is used in test (jsdom). Tests seed the virtual vault with
// plugin folders to exercise discover/enable/disable.

describe('PluginHost', () => {
  beforeEach(async () => {
    localStorage.removeItem('jf-vault-local');
    commands.clearPlugin('test-plugin');
    commands.clearPlugin('bad-plugin');
    await vault.pickVault();
  });

  it('discovers a plugin from manifest + enables it', async () => {
    await vault.write('.jotfolio/plugins/test-plugin/manifest.json', JSON.stringify({
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '0.1.0',
      author: 'test',
      main: 'main.js',
      permissions: { vault_read: true, vault_write: true, http_domains: [] },
    }));
    await vault.write('.jotfolio/plugins/test-plugin/main.js',
      `api.commands.register('ping', () => 'pong');`
    );

    const host = new PluginHost();
    await host.discover();
    let list = host.list();
    expect(list).toHaveLength(1);
    expect(list[0].manifest.id).toBe('test-plugin');
    expect(list[0].status).toBe('disabled'); // default disabled

    await host.enable('test-plugin');
    list = host.list();
    expect(list[0].status).toBe('enabled');
    expect(commands.has('test-plugin.ping')).toBe(true);
    expect(commands.run('test-plugin.ping')).toBe('pong');
  });

  it('disable clears the plugin\'s commands + events', async () => {
    await vault.write('.jotfolio/plugins/test-plugin/manifest.json', JSON.stringify({
      id: 'test-plugin', name: 'T', version: '0', author: 'a', main: 'main.js',
      permissions: { vault_read: true, vault_write: true },
    }));
    await vault.write('.jotfolio/plugins/test-plugin/main.js',
      `api.commands.register('x', () => 1);`
    );
    const host = new PluginHost();
    await host.discover();
    await host.enable('test-plugin');
    expect(commands.has('test-plugin.x')).toBe(true);
    await host.disable('test-plugin');
    expect(commands.has('test-plugin.x')).toBe(false);
  });

  it('invalid manifest surfaces as failed status', async () => {
    await vault.write('.jotfolio/plugins/bad-plugin/manifest.json', '{ not json');
    const host = new PluginHost();
    await host.discover();
    const list = host.list();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe('failed');
    expect(list[0].error).toContain('Invalid manifest');
  });

  it('crashing plugin code marks status=failed', async () => {
    await vault.write('.jotfolio/plugins/test-plugin/manifest.json', JSON.stringify({
      id: 'test-plugin', name: 'T', version: '0', author: 'a', main: 'main.js',
      permissions: { vault_read: true, vault_write: true },
    }));
    await vault.write('.jotfolio/plugins/test-plugin/main.js',
      `throw new Error('boom');`
    );
    const host = new PluginHost();
    await host.discover();
    await host.enable('test-plugin');
    const list = host.list();
    expect(list[0].status).toBe('failed');
    expect(list[0].error).toContain('boom');
  });

  it('persists enabled state to .jotfolio/settings/plugins.json', async () => {
    await vault.write('.jotfolio/plugins/test-plugin/manifest.json', JSON.stringify({
      id: 'test-plugin', name: 'T', version: '0', author: 'a', main: 'main.js',
      permissions: { vault_read: true, vault_write: true },
    }));
    await vault.write('.jotfolio/plugins/test-plugin/main.js', ``);
    const host = new PluginHost();
    await host.discover();
    await host.enable('test-plugin');
    const settings = JSON.parse(await vault.read('.jotfolio/settings/plugins.json'));
    expect(settings.enabled['test-plugin']).toBe(true);
  });

  it('permissions gate vault access inside plugin code', async () => {
    await vault.write('.jotfolio/plugins/test-plugin/manifest.json', JSON.stringify({
      id: 'test-plugin', name: 'T', version: '0', author: 'a', main: 'main.js',
      permissions: {}, // no vault_read, no vault_write
    }));
    await vault.write('.jotfolio/plugins/test-plugin/main.js',
      `api.commands.register('try-write', async () => {
         try { await api.vault.write('foo.md', 'x'); return 'wrote'; }
         catch (e) { return e.message; }
       });`
    );
    const host = new PluginHost();
    await host.discover();
    await host.enable('test-plugin');
    const result = await commands.run('test-plugin.try-write');
    expect(result).toMatch(/vault_write/);
  });
});
