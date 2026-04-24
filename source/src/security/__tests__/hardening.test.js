import { describe, it, expect } from 'vitest';
import { parse, FrontmatterError } from '../../lib/frontmatter.js';
import { createPluginAPI } from '../../plugins/PluginAPI.js';

describe('security hardening', () => {
  describe('frontmatter prototype-pollution block', () => {
    it('rejects __proto__ key', () => {
      const src = `---\n__proto__: pwned\n---\nbody`;
      expect(() => parse(src)).toThrow(FrontmatterError);
    });

    it('rejects constructor key', () => {
      const src = `---\nconstructor: evil\n---\nbody`;
      expect(() => parse(src)).toThrow(FrontmatterError);
    });

    it('rejects prototype key', () => {
      const src = `---\nprototype: x\n---\nbody`;
      expect(() => parse(src)).toThrow(FrontmatterError);
    });

    it('still accepts normal keys', () => {
      const src = `---\ntitle: Fine\ntype: note\n---\nbody`;
      expect(() => parse(src)).not.toThrow();
    });
  });

  describe('plugin API frozen', () => {
    const makeApi = () => {
      const manifest = {
        id: 'test', name: 'Test', version: '0', author: 'a', main: 'main.js',
        permissions: { vault_read: true, vault_write: true, http_domains: ['api.example.com'] },
      };
      const { api } = createPluginAPI(manifest);
      return { api, manifest };
    };

    it('api top-level is frozen', () => {
      const { api } = makeApi();
      expect(Object.isFrozen(api)).toBe(true);
    });

    it('api.vault is frozen', () => {
      const { api } = makeApi();
      expect(Object.isFrozen(api.vault)).toBe(true);
    });

    it('manifest is frozen', () => {
      const { api } = makeApi();
      expect(Object.isFrozen(api.manifest)).toBe(true);
      expect(Object.isFrozen(api.manifest.permissions)).toBe(true);
      expect(Object.isFrozen(api.manifest.permissions.http_domains)).toBe(true);
    });

    it('mutating api methods silently fails in non-strict or throws in strict', () => {
      const { api } = makeApi();
      // In strict module mode (test file), assignment throws.
      // In sloppy mode it fails silently. Either way, the bound function is unchanged.
      const originalRead = api.vault.read;
      try { api.vault.read = () => 'hijacked'; } catch { /* strict throw is fine */ }
      expect(api.vault.read).toBe(originalRead);
    });
  });

  describe('plugin http allowlist', () => {
    it('http.fetch rejects non-allowlisted domain', async () => {
      const { api } = createPluginAPI({
        id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
        permissions: { http_domains: ['api.example.com'] },
      });
      await expect(api.http.fetch('https://attacker.com/steal')).rejects.toThrow(/allowlist/);
    });

    it('http.fetch rejects malformed URL', async () => {
      const { api } = createPluginAPI({
        id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
        permissions: { http_domains: ['api.example.com'] },
      });
      await expect(api.http.fetch('not-a-url')).rejects.toThrow(/invalid URL/);
    });
  });

  describe('plugin permission gates', () => {
    it('vault_read denied when permission missing', () => {
      const { api } = createPluginAPI({
        id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
        permissions: {},
      });
      expect(() => api.vault.list()).toThrow(/vault_read/);
      expect(() => api.vault.read('foo')).toThrow(/vault_read/);
    });

    it('vault_write denied when permission missing', () => {
      const { api } = createPluginAPI({
        id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
        permissions: { vault_read: true }, // read only
      });
      expect(() => api.vault.write('foo.md', 'x')).toThrow(/vault_write/);
      expect(() => api.vault.remove('foo.md')).toThrow(/vault_write/);
      expect(() => api.vault.mkdir('sub')).toThrow(/vault_write/);
    });
  });
});
