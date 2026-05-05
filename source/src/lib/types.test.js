import { describe, expect, it } from 'vitest';
import { TYPE_TOKENS, MEMORY_TOKENS, TYPE_SATURATION_LEVELS, applyTypeSat, TYPES } from './types.js';

describe('type tokens', () => {
  it('exports a token for every base TYPE', () => {
    TYPES.forEach(t => {
      expect(TYPE_TOKENS).toHaveProperty(t);
      expect(TYPE_TOKENS[t].full).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TYPE_TOKENS[t].muted).toMatch(/^#[0-9a-f]{6}$/i);
      expect(TYPE_TOKENS[t].mono).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  it('exposes 3 saturation levels', () => {
    expect(TYPE_SATURATION_LEVELS).toEqual(['full', 'muted', 'mono']);
  });
});

describe('applyTypeSat', () => {
  it('returns full saturation by default', () => {
    expect(applyTypeSat('note')).toBe(TYPE_TOKENS.note.full);
  });
  it('returns muted at muted saturation', () => {
    expect(applyTypeSat('note', 'muted')).toBe(TYPE_TOKENS.note.muted);
  });
  it('returns mono at mono saturation', () => {
    expect(applyTypeSat('note', 'mono')).toBe(TYPE_TOKENS.note.mono);
  });
  it('returns memory color for raw/wiki/review (saturation ignored)', () => {
    expect(applyTypeSat('raw', 'mono')).toBe(MEMORY_TOKENS.raw);
    expect(applyTypeSat('wiki', 'full')).toBe(MEMORY_TOKENS.wiki);
    expect(applyTypeSat('review', 'muted')).toBe(MEMORY_TOKENS.review);
  });
  it('returns fallback for unknown type', () => {
    expect(applyTypeSat('unknown')).toBe('#F1EADE');
  });
  it('treats null/undefined saturation as full', () => {
    expect(applyTypeSat('note', undefined)).toBe(TYPE_TOKENS.note.full);
    expect(applyTypeSat('note', null)).toBe(TYPE_TOKENS.note.full);
  });
});
