import { describe, expect, it } from 'vitest';
import { THEMES, getThemeContractIssues } from './themes.js';
import { assertThemeModePairs, resolveColorScheme, resolveThemeVars } from './resolve.js';

describe('theme resolution', () => {
  it('keeps every built-in theme paired with light and dark tokens', () => {
    expect(assertThemeModePairs()).toEqual([]);
  });

  it('keeps every built-in theme on the legacy variable contract', () => {
    expect(getThemeContractIssues()).toEqual([]);
  });

  it('resolves system mode from the current OS color scheme', () => {
    expect(resolveColorScheme('system', true)).toBe('dark');
    expect(resolveColorScheme('system', false)).toBe('light');
  });

  it('keeps explicit light and dark mode independent from system preference', () => {
    expect(resolveColorScheme('light', true)).toBe('light');
    expect(resolveColorScheme('dark', false)).toBe('dark');
  });

  it('uses the selected theme light and dark variants without changing theme', () => {
    const light = resolveThemeVars({ theme: 'minimal', darkMode: 'light', systemDark: true });
    const dark = resolveThemeVars({ theme: 'minimal', darkMode: 'dark', systemDark: false });

    expect(light.safeTheme).toBe('minimal');
    expect(dark.safeTheme).toBe('minimal');
    expect(light.vars['--bg']).toBe(THEMES.minimal.light['--bg']);
    expect(dark.vars['--bg']).toBe(THEMES.minimal.dark['--bg']);
  });

  it('falls back to minimal only for unknown theme keys', () => {
    const result = resolveThemeVars({ theme: 'missing-theme', darkMode: 'light' });

    expect(result.safeTheme).toBe('minimal');
    expect(result.vars['--bg']).toBe(THEMES.minimal.light['--bg']);
  });

  it('resolves the workstation foundation without adding a desktop backdrop', () => {
    const result = resolveThemeVars({ theme: 'workstation', darkMode: 'dark' });

    expect(result.safeTheme).toBe('workstation');
    expect(result.vars['--bg']).toBe('#090e13');
    expect(result.vars['--sb']).toBe('#070b10');
    expect(result.vars['--b1']).toBe('#121922');
    expect(result.vars['--fn']).toContain('Inter Variable');
    expect(result.vars['--br']).toBe('rgba(129,150,172,0.17)');
    expect(result.vars['--bg']).not.toMatch(/gradient|rgba/i);
    expect(result.vars['--bg']).not.toBe('#dbeafe');
  });

  it('keeps workstation dark even when an old light preference is stored', () => {
    const result = resolveThemeVars({ theme: 'workstation', darkMode: 'light' });

    expect(result.vars['--bg']).toBe('#090e13');
    expect(result.vars['--b1']).toBe('#121922');
    expect(result.vars['--sb']).toBe('#070b10');
    expect(result.vars['--tx']).toBe('#f2f5f9');
  });
});
