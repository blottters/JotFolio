import { describe, it, expect } from 'vitest';
import { buildThemeCss } from './themeCss.js';

describe('buildThemeCss', () => {
  it('returns empty string for themes without overrides', () => {
    expect(buildThemeCss('workstation', false)).toBe('');
    expect(buildThemeCss('unknown', true)).toBe('');
  });

  it('returns a gradient background for glass theme (light + dark differ)', () => {
    const light = buildThemeCss('glass', false);
    const dark = buildThemeCss('glass', true);
    expect(light).toContain('.mgn-app');
    expect(dark).toContain('.mgn-app');
    expect(light).not.toBe(dark);
  });

  it('returns neo-brutal box-shadow rule for neo theme', () => {
    const css = buildThemeCss('neo', false);
    expect(css).toContain('box-shadow');
    expect(css).toContain('var(--br)');
  });

  it('handles dark-only branch for gameboy (light=empty, dark=glow rule)', () => {
    expect(buildThemeCss('gameboy', false)).toBe('');
    expect(buildThemeCss('gameboy', true)).toContain('box-shadow');
  });
});
