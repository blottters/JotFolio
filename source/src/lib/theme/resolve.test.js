import { describe, expect, it } from 'vitest';
import { THEMES } from './themes.js';
import { assertThemeModePairs, resolveColorScheme, resolveThemeVars } from './resolve.js';

describe('theme resolution', () => {
  it('keeps every built-in theme paired with light and dark tokens', () => {
    expect(assertThemeModePairs()).toEqual([]);
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
});
