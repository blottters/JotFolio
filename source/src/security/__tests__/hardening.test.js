import { describe, it, expect, afterEach } from 'vitest';
import { marked } from 'marked';
import { parse, FrontmatterError } from '../../lib/frontmatter.js';
import { sanitizeHtml, renderWikiLinks } from '../../lib/markdown.js';
import { createPluginAPI } from '../../plugins/PluginAPI.js';
import { CommandRegistry, commands } from '../../plugins/CommandRegistry.js';

afterEach(() => {
  commands.clearPlugin('test');
  commands.clearPlugin('other');
});

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

  describe('markdown sanitizer', () => {
    it('removes executable tags with their content', () => {
      const html = sanitizeHtml('<p>safe</p><script>alert(1)</script><style>body{display:none}</style><iframe srcdoc="<p>x</p>"></iframe>');
      expect(html).toContain('<p>safe</p>');
      expect(html).not.toMatch(/script|style|iframe|alert|display:none|srcdoc/);
    });

    it('strips event handlers, style attrs, unknown tags, and unsafe links', () => {
      const html = sanitizeHtml('<p onclick="alert(1)" style="color:red"><custom>ok</custom><a href="javascript:alert(1)" onmouseover="x()">bad</a><a href="https://example.com">good</a></p>');
      expect(html).toContain('<p>ok<a>bad</a><a href="https://example.com">good</a></p>');
      expect(html).not.toMatch(/onclick|onmouseover|style|custom|javascript:/);
    });

    it('preserves safe markdown and wiki-link anchors after marked output', () => {
      const titleIndex = new Map([['target note', 'note-1']]);
      const pre = renderWikiLinks('**Bold** and [[Target Note]] plus [safe](/docs) ![alt](/img.png)', titleIndex);
      const html = sanitizeHtml(marked.parse(pre, { breaks: true, gfm: true }));
      expect(html).toContain('<strong>Bold</strong>');
      expect(html).toContain('<a class="mgn-wl" data-jfid="note-1" href="#">Target Note</a>');
      expect(html).toContain('<a href="/docs">safe</a>');
      expect(html).toContain('<img src="/img.png" alt="alt">');
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

  describe('plugin command registration', () => {
    it('prefixes bare plugin command ids with plugin id', () => {
      const { api } = createPluginAPI({
        id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
        permissions: {},
      });
      api.commands.register('ping', () => 'pong');
      expect(commands.has('test.ping')).toBe(true);
      expect(commands.run('test.ping')).toBe('pong');
    });

    it('rejects dotted ids outside the plugin namespace', () => {
      const { api } = createPluginAPI({
        id: 'test', name: 'T', version: '0', author: 'a', main: 'main.js',
        permissions: {},
      });
      expect(() => api.commands.register('core.open', () => {})).toThrow(/test\.\*/);
      expect(() => api.commands.register('other.open', () => {})).toThrow(/test\.\*/);
    });

    it('throws on duplicate command ids until the existing command is unregistered', () => {
      const registry = new CommandRegistry();
      const off = registry.register('test.ping', () => 1, { pluginId: 'test' });
      expect(() => registry.register('test.ping', () => 2, { pluginId: 'test' })).toThrow(/already registered/);
      off();
      registry.register('test.ping', () => 3, { pluginId: 'test' });
      expect(registry.run('test.ping')).toBe(3);
    });
  });
});
