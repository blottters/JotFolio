import { describe, it, expect } from 'vitest';
import { THEMES, THEME_VAR_CONTRACT, getThemeContractIssues, FONTS, DEFAULT_VICTORY_COLORS } from './themes.js';

describe('themes catalog', () => {
  it('THEMES contains workstation and victory among others', () => {
    expect(THEMES.workstation).toBeDefined();
    expect(THEMES.victory).toBeDefined();
    expect(Object.keys(THEMES).length).toBeGreaterThan(10);
  });

  it('THEME_VAR_CONTRACT lists the required CSS variables', () => {
    expect(THEME_VAR_CONTRACT).toContain('--bg');
    expect(THEME_VAR_CONTRACT).toContain('--ac');
    expect(THEME_VAR_CONTRACT).toContain('--fn');
  });

  it('getThemeContractIssues returns [] when every theme satisfies the contract', () => {
    // Note: this asserts the live catalog is healthy. If somebody breaks a theme
    // this will fail loudly and point at the missing token.
    expect(getThemeContractIssues()).toEqual([]);
  });

  it('FONTS list is non-empty with label/stack entries', () => {
    expect(Array.isArray(FONTS)).toBe(true);
    expect(FONTS.length).toBeGreaterThan(0);
    for (const f of FONTS) {
      expect(typeof f.label).toBe('string');
      expect(typeof f.stack).toBe('string');
    }
  });

  it('DEFAULT_VICTORY_COLORS exposes bg/fg/ac', () => {
    expect(DEFAULT_VICTORY_COLORS).toEqual({ bg: '#F3EFEA', fg: '#151415', ac: '#151415' });
  });
});
