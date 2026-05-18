import { describe, it, expect } from 'vitest';
import { getThemeDefaults } from './defaults.js';

describe('getThemeDefaults', () => {
  it('returns bg/fg/ac/b2 strings for a known theme in light mode', () => {
    const d = getThemeDefaults('workstation', false);
    expect(typeof d.bg).toBe('string');
    expect(typeof d.fg).toBe('string');
    expect(typeof d.ac).toBe('string');
    expect(typeof d.b2).toBe('string');
    expect(d.bg.length).toBeGreaterThan(0);
  });

  it('returns different palette for dark mode vs light mode', () => {
    // Use 'minimal' (workstation is locked to dark mode by resolveThemeVars)
    const light = getThemeDefaults('minimal', false);
    const dark = getThemeDefaults('minimal', true);
    expect(light.bg).not.toBe(dark.bg);
  });

  it('falls back to white/black for an unknown theme key', () => {
    const d = getThemeDefaults('nonexistent-theme', false);
    expect(d.bg).toBeTruthy();
    expect(d.fg).toBeTruthy();
  });
});
