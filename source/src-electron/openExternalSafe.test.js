import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isSafeExternalUrl } = require('./openExternalSafe.js');

describe('isSafeExternalUrl', () => {
  it('allows https URLs', () => {
    expect(isSafeExternalUrl('https://jotfolio.app/help')).toBe(true);
  });

  it('allows mailto: URLs', () => {
    expect(isSafeExternalUrl('mailto:hello@jotfolio.app')).toBe(true);
  });

  it('rejects http (non-TLS)', () => {
    expect(isSafeExternalUrl('http://example.com')).toBe(false);
  });

  it('rejects file:// URLs', () => {
    expect(isSafeExternalUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects javascript: URLs', () => {
    expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
  });

  it('rejects empty / non-string / malformed', () => {
    expect(isSafeExternalUrl('')).toBe(false);
    expect(isSafeExternalUrl('   ')).toBe(false);
    expect(isSafeExternalUrl(null)).toBe(false);
    expect(isSafeExternalUrl(undefined)).toBe(false);
    expect(isSafeExternalUrl(42)).toBe(false);
    expect(isSafeExternalUrl('not a url')).toBe(false);
  });
});
