import { describe, it, expect } from 'vitest';
import { graduateTied } from './graduateTied.js';

describe('graduateTied', () => {
  it('confirming source X with 1 dependent review meeting threshold returns eligible: [reviewId]', () => {
    const confirmed = {
      id: 'src-1',
      type: 'wiki',
      review_status: 'confirmed',
      canonical_key: 'topic-a',
    };
    const review = {
      id: 'rev-1',
      type: 'review',
      confidence: 0.65,
      provenance: ['src-1'],
    };
    const vault = [confirmed, review];
    const { tied, eligible } = graduateTied(confirmed, vault, {});
    expect(tied).toHaveLength(1);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe('rev-1');
  });

  it('returns { tied: [], eligible: [] } when no tied entries exist', () => {
    const confirmed = { id: 'src-1', type: 'wiki', review_status: 'confirmed' };
    const unrelated = { id: 'rev-1', type: 'review', confidence: 0.8, provenance: ['other'] };
    const { tied, eligible } = graduateTied(confirmed, [confirmed, unrelated], {});
    expect(tied).toEqual([]);
    expect(eligible).toEqual([]);
  });

  it('tied review at confidence 0.6 + 1 confirmed source (bonus 0.05) -> not eligible (0.65 < 0.7)', () => {
    const confirmed = { id: 'src-1', type: 'wiki', review_status: 'confirmed' };
    const review = {
      id: 'rev-1',
      type: 'review',
      confidence: 0.6,
      provenance: ['src-1'],
    };
    const { tied, eligible } = graduateTied(confirmed, [confirmed, review], {});
    expect(tied).toHaveLength(1);
    expect(eligible).toEqual([]);
  });

  it('tied review at confidence 0.65 + 3 confirmed sources (bonus 0.15) -> eligible (0.80)', () => {
    const confirmed = { id: 'src-1', type: 'wiki', review_status: 'confirmed' };
    const s2 = { id: 'src-2', type: 'wiki' };
    const s3 = { id: 'src-3', type: 'review', review_status: 'confirmed' };
    const review = {
      id: 'rev-1',
      type: 'review',
      confidence: 0.65,
      provenance: ['src-1', 'src-2', 'src-3'],
    };
    const { eligible } = graduateTied(confirmed, [confirmed, s2, s3, review], {});
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe('rev-1');
  });

  it('confidence boost capped at +0.15 even with 5+ confirmed sources', () => {
    // base 0.5 + cap 0.15 = 0.65, still below threshold => not eligible.
    const confirmed = { id: 's1', type: 'wiki' };
    const sources = [
      confirmed,
      { id: 's2', type: 'wiki' },
      { id: 's3', type: 'wiki' },
      { id: 's4', type: 'wiki' },
      { id: 's5', type: 'wiki' },
      { id: 's6', type: 'wiki' },
    ];
    const review = {
      id: 'rev-1',
      type: 'review',
      confidence: 0.5,
      provenance: ['s1', 's2', 's3', 's4', 's5', 's6'],
    };
    const { tied, eligible } = graduateTied(confirmed, [...sources, review], {});
    expect(tied).toHaveLength(1);
    // 0.5 + 0.15 = 0.65 < 0.7 -> not eligible (proves the cap held).
    expect(eligible).toEqual([]);

    // And bump base just above the cap-adjusted line: 0.55 + 0.15 = 0.70 -> eligible.
    const review2 = { ...review, id: 'rev-2', confidence: 0.55 };
    const out2 = graduateTied(confirmed, [...sources, review2], {});
    expect(out2.eligible.map(e => e.id)).toEqual(['rev-2']);
  });

  it('detects ties via supersedes, canonical_key, AND provenance', () => {
    const confirmed = {
      id: 'src-1',
      type: 'wiki',
      review_status: 'confirmed',
      canonical_key: 'shared-key',
    };
    const tiedBySupersedes = {
      id: 'rev-a',
      type: 'review',
      confidence: 0.3,
      supersedes: ['src-1'],
    };
    const tiedByCanonical = {
      id: 'rev-b',
      type: 'review',
      confidence: 0.3,
      canonical_key: 'shared-key',
    };
    const tiedByProvenance = {
      id: 'rev-c',
      type: 'review',
      confidence: 0.3,
      provenance: ['src-1'],
    };
    const unrelated = { id: 'rev-d', type: 'review', confidence: 0.99 };
    const vault = [confirmed, tiedBySupersedes, tiedByCanonical, tiedByProvenance, unrelated];
    const { tied } = graduateTied(confirmed, vault, {});
    const ids = tied.map(t => t.id).sort();
    expect(ids).toEqual(['rev-a', 'rev-b', 'rev-c']);
  });

  it('blocking warning excludes an otherwise-eligible entry', () => {
    const confirmed = { id: 'src-1', type: 'wiki', review_status: 'confirmed' };
    const review = {
      id: 'rev-1',
      type: 'review',
      confidence: 0.7,
      provenance: ['src-1'],
      warnings: [{ code: 'canonical-collision-handauthored', message: 'x' }],
    };
    const { tied, eligible } = graduateTied(confirmed, [confirmed, review], {});
    expect(tied).toHaveLength(1);
    expect(eligible).toEqual([]);
  });

  it('accepts vault as { entries } shape', () => {
    const confirmed = { id: 'src-1', type: 'wiki', review_status: 'confirmed' };
    const review = { id: 'rev-1', type: 'review', confidence: 0.7, provenance: ['src-1'] };
    const out = graduateTied(confirmed, { entries: [confirmed, review] }, {});
    expect(out.eligible.map(e => e.id)).toEqual(['rev-1']);
  });

  it('skips non-review tied entries (only review eligible for graduation)', () => {
    const confirmed = { id: 'src-1', type: 'wiki', canonical_key: 'k' };
    const otherWiki = { id: 'wiki-2', type: 'wiki', canonical_key: 'k', confidence: 0.5 };
    const { tied, eligible } = graduateTied(confirmed, [confirmed, otherWiki], {});
    expect(tied).toEqual([]);
    expect(eligible).toEqual([]);
  });
});
