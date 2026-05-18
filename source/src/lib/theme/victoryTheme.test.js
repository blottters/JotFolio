import { describe, it, expect } from 'vitest';
import { hexToRgb, mixHex, luminance, deriveVictoryTheme } from './victoryTheme.js';

describe('victoryTheme helpers', () => {
  it('hexToRgb parses 6-digit hex', () => {
    expect(hexToRgb('#ff0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('00ff00')).toEqual([0, 255, 0]);
  });

  it('hexToRgb expands 3-digit hex', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000')).toEqual([0, 0, 0]);
  });

  it('mixHex linearly interpolates two colors', () => {
    expect(mixHex('#000000', '#ffffff', 0).toLowerCase()).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1).toLowerCase()).toBe('#ffffff');
    const mid = mixHex('#000000', '#ffffff', 0.5);
    // 0.5 of 255 rounds to 128 (0x80)
    expect(mid.toLowerCase()).toBe('#808080');
  });

  it('luminance is high for white, low for black', () => {
    expect(luminance('#ffffff')).toBeGreaterThan(0.9);
    expect(luminance('#000000')).toBeLessThan(0.1);
  });

  it('deriveVictoryTheme returns full theme var bag for a light palette', () => {
    const t = deriveVictoryTheme('#ffffff', '#000000', '#0000ff', '#eeeeee');
    expect(t['--bg']).toBe('#ffffff');
    expect(t['--tx']).toBe('#000000');
    expect(t['--ac']).toBe('#0000ff');
    expect(t['--b2']).toBe('#eeeeee');
    // accent text against blue: blue luminance is low → white text
    expect(t['--act']).toBe('#ffffff');
    expect(t['--rd']).toBe('0px');
  });

  it('deriveVictoryTheme synthesizes surface when b2 absent', () => {
    const t = deriveVictoryTheme('#ffffff', '#000000', '#000000');
    expect(t['--b2']).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
