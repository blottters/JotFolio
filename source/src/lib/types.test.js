import { describe, expect, it } from 'vitest';
import {
  TYPE_TOKENS,
  MEMORY_TOKENS,
  TYPE_THEME_LEVELS,
  TYPE_SATURATION_LEVELS,
  applyTypeSat,
  migrateTypeSatToTheme,
  TYPES,
} from './types.js';

describe('type tokens', () => {
  it('exports a token for every base TYPE under all 4 themes', () => {
    TYPES.forEach(t => {
      expect(TYPE_TOKENS).toHaveProperty(t);
      expect(TYPE_TOKENS[t].bone).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TYPE_TOKENS[t].sepia).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TYPE_TOKENS[t].cool).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TYPE_TOKENS[t].mono).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('exposes the 4 theme levels (bone/sepia/cool/mono)', () => {
    expect(TYPE_THEME_LEVELS).toEqual(['bone', 'sepia', 'cool', 'mono']);
  });

  it('keeps TYPE_SATURATION_LEVELS as a back-compat alias for TYPE_THEME_LEVELS', () => {
    expect(TYPE_SATURATION_LEVELS).toBe(TYPE_THEME_LEVELS);
  });
});

describe('applyTypeSat', () => {
  it('returns bone theme by default', () => {
    expect(applyTypeSat('note')).toBe(TYPE_TOKENS.note.bone);
  });
  it('returns sepia at sepia theme', () => {
    expect(applyTypeSat('note', 'sepia')).toBe(TYPE_TOKENS.note.sepia);
  });
  it('returns cool at cool theme', () => {
    expect(applyTypeSat('note', 'cool')).toBe(TYPE_TOKENS.note.cool);
  });
  it('returns mono at mono theme', () => {
    expect(applyTypeSat('note', 'mono')).toBe(TYPE_TOKENS.note.mono);
  });
  it('migrates legacy alpha.19 "full" to bone', () => {
    expect(applyTypeSat('note', 'full')).toBe(TYPE_TOKENS.note.bone);
  });
  it('migrates legacy alpha.19 "muted" to sepia', () => {
    expect(applyTypeSat('note', 'muted')).toBe(TYPE_TOKENS.note.sepia);
  });
  it('passes through legacy "mono" unchanged', () => {
    expect(applyTypeSat('note', 'mono')).toBe(TYPE_TOKENS.note.mono);
  });
  it('returns memory color for raw/wiki/review (theme ignored)', () => {
    expect(applyTypeSat('raw', 'mono')).toBe(MEMORY_TOKENS.raw);
    expect(applyTypeSat('wiki', 'bone')).toBe(MEMORY_TOKENS.wiki);
    expect(applyTypeSat('review', 'sepia')).toBe(MEMORY_TOKENS.review);
  });
  it('returns fallback for unknown type', () => {
    expect(applyTypeSat('unknown')).toBe('#F1EADE');
  });
  it('treats null/undefined theme as bone (default)', () => {
    expect(applyTypeSat('note', undefined)).toBe(TYPE_TOKENS.note.bone);
    expect(applyTypeSat('note', null)).toBe(TYPE_TOKENS.note.bone);
  });
});

describe('migrateTypeSatToTheme', () => {
  it('passes through new theme keys', () => {
    expect(migrateTypeSatToTheme('bone')).toBe('bone');
    expect(migrateTypeSatToTheme('sepia')).toBe('sepia');
    expect(migrateTypeSatToTheme('cool')).toBe('cool');
    expect(migrateTypeSatToTheme('mono')).toBe('mono');
  });
  it('maps legacy full → bone, muted → sepia', () => {
    expect(migrateTypeSatToTheme('full')).toBe('bone');
    expect(migrateTypeSatToTheme('muted')).toBe('sepia');
  });
  it('falls back to bone for unknown values', () => {
    expect(migrateTypeSatToTheme('garbage')).toBe('bone');
    expect(migrateTypeSatToTheme(null)).toBe('bone');
  });
});
