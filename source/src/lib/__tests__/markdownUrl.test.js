// Direct coverage of the `isSafeUrl` used by the HTML sanitizer in
// `src/lib/markdown.js`. Finding #15: protocol-relative URLs like
// `//attacker.example/...` were accepted because the early `startsWith('/')`
// check caught `//` as well as `/absolute`. Fix: reject `//` outright.

import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../markdown.js';

describe('sanitizer URL allowlist (finding #15)', () => {
  it('strips protocol-relative href', () => {
    const out = sanitizeHtml('<a href="//attacker.example/steal">click</a>');
    expect(out).toContain('<a>click</a>');
    expect(out).not.toContain('attacker.example');
  });

  it('strips protocol-relative img src', () => {
    const out = sanitizeHtml('<img src="//attacker.example/track.png" alt="x">');
    expect(out).not.toMatch(/src=/);
  });

  it('keeps valid absolute paths', () => {
    const out = sanitizeHtml('<a href="/docs/guide">see</a>');
    expect(out).toContain('href="/docs/guide"');
  });

  it('keeps http + https', () => {
    const out = sanitizeHtml('<a href="https://example.com">x</a><a href="http://example.com">y</a>');
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('href="http://example.com"');
  });

  it('strips javascript: and data: URLs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">bad</a>');
    expect(out).not.toMatch(/javascript:/);
  });

  it('keeps fragment-only anchors', () => {
    const out = sanitizeHtml('<a href="#section">link</a>');
    expect(out).toContain('href="#section"');
  });
});
