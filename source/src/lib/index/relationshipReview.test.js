import { describe, expect, it } from 'vitest';
import { MANUAL_LINKS_FIELD } from '../frontmatter.js';
import {
  RELATIONSHIP_REVIEW_STORAGE_KEY,
  applyRelationshipReview,
  createRelationshipReview,
  parseRelationshipReviewLedger,
  rejectRelationshipReview,
  relationshipReviewKey,
  saveRelationshipReviewLedger,
  serializeRelationshipReviewLedger,
  undoRelationshipReview,
} from './relationshipReview.js';

const entries = [
  {
    id: 'alpha',
    type: 'note',
    title: 'Alpha',
    tags: ['systems'],
    links: [],
    notes: 'Alpha body.',
  },
  {
    id: 'beta',
    type: 'note',
    title: 'Beta',
    tags: [],
    links: [],
    notes: 'Beta body.',
  },
];

describe('relationshipReview', () => {
  it('creates stable review records for future relationship suggestions', () => {
    const review = createRelationshipReview({
      kind: 'related-note',
      sourceEntryId: 'alpha',
      targetEntryId: 'beta',
      targetTitle: 'Beta',
      origin: 'minilm',
      reason: 'Both notes discuss systems.',
      confidence: 0.82,
      now: '2026-05-15T12:00:00.000Z',
    });

    expect(review).toEqual(expect.objectContaining({
      id: 'relationship-review:related-note:alpha:beta',
      status: 'pending',
      origin: 'minilm',
      reason: 'Both notes discuss systems.',
      confidence: 0.82,
      createdAt: '2026-05-15T12:00:00.000Z',
      updatedAt: '2026-05-15T12:00:00.000Z',
    }));
    expect(review.operations).toEqual([
      { type: 'add-link', entryId: 'alpha', targetEntryId: 'beta' },
      { type: 'add-link', entryId: 'beta', targetEntryId: 'alpha' },
    ]);
  });

  it('applies accepted relationship reviews and stores exact undo snapshots', () => {
    const review = createRelationshipReview({
      kind: 'related-note',
      sourceEntryId: 'alpha',
      targetEntryId: 'beta',
      targetTitle: 'Beta',
      now: '2026-05-15T12:00:00.000Z',
    });

    const result = applyRelationshipReview(entries, review, { now: '2026-05-15T12:10:00.000Z' });

    expect(result.review.status).toBe('applied');
    expect(result.review.appliedAt).toBe('2026-05-15T12:10:00.000Z');
    expect(result.review.undoRecord).toEqual(result.undoRecord);
    expect(result.entries.find(entry => entry.id === 'alpha')).toEqual(expect.objectContaining({
      links: ['beta'],
      [MANUAL_LINKS_FIELD]: true,
    }));
    expect(result.entries.find(entry => entry.id === 'beta')).toEqual(expect.objectContaining({
      links: ['alpha'],
      [MANUAL_LINKS_FIELD]: true,
    }));
    expect(result.undoRecord).toEqual(expect.objectContaining({
      reviewId: review.id,
      createdAt: '2026-05-15T12:10:00.000Z',
      snapshots: [
        { entryId: 'alpha', before: entries[0], after: expect.objectContaining({ links: ['beta'] }) },
        { entryId: 'beta', before: entries[1], after: expect.objectContaining({ links: ['alpha'] }) },
      ],
    }));
    expect(entries[0].links).toEqual([]);
  });

  it('undoes an applied review by restoring the before snapshots', () => {
    const review = createRelationshipReview({
      kind: 'tag',
      sourceEntryId: 'alpha',
      tag: 'constellation',
      now: '2026-05-15T12:00:00.000Z',
    });
    const applied = applyRelationshipReview(entries, review, { now: '2026-05-15T12:10:00.000Z' });

    expect(applied.entries.find(entry => entry.id === 'alpha').tags).toEqual(['systems', 'constellation']);

    const undone = undoRelationshipReview(applied.entries, applied.review, undefined, {
      now: '2026-05-15T12:15:00.000Z',
    });

    expect(undone.review.status).toBe('undone');
    expect(undone.review.undoneAt).toBe('2026-05-15T12:15:00.000Z');
    expect(undone.entries.find(entry => entry.id === 'alpha')).toEqual(entries[0]);
  });

  it('supports explicit wiki-link and project updates without applying them until requested', () => {
    const wikiReview = createRelationshipReview({
      kind: 'wiki-link',
      sourceEntryId: 'alpha',
      targetTitle: 'Beta',
      now: '2026-05-15T12:00:00.000Z',
    });
    const projectReview = createRelationshipReview({
      kind: 'project',
      sourceEntryId: 'alpha',
      project: 'JotFolio',
      now: '2026-05-15T12:00:00.000Z',
    });

    expect(wikiReview.operations).toEqual([
      { type: 'append-wikilink', entryId: 'alpha', targetTitle: 'Beta' },
    ]);
    expect(projectReview.operations).toEqual([
      { type: 'set-project', entryId: 'alpha', project: 'JotFolio' },
    ]);
    expect(entries[0].notes).toBe('Alpha body.');
    expect(entries[0].project).toBeUndefined();
  });

  it('rejects reviews without changing entries', () => {
    const review = createRelationshipReview({
      kind: 'tag',
      sourceEntryId: 'alpha',
      tag: 'constellation',
      now: '2026-05-15T12:00:00.000Z',
    });

    const rejected = rejectRelationshipReview(review, { now: '2026-05-15T12:05:00.000Z' });

    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectedAt).toBe('2026-05-15T12:05:00.000Z');
    expect(entries[0].tags).toEqual(['systems']);
    expect(() => applyRelationshipReview(entries, rejected)).toThrow(/Cannot apply rejected relationship review/);
  });

  it('round-trips the ledger and ignores broken stored data', () => {
    const review = createRelationshipReview({
      kind: 'tag',
      sourceEntryId: 'alpha',
      tag: 'constellation',
      now: '2026-05-15T12:00:00.000Z',
    });
    const key = relationshipReviewKey(review);
    const serialized = serializeRelationshipReviewLedger({ [key]: review });
    const storage = new Map();
    const fakeStorage = {
      getItem: name => storage.get(name),
      setItem: (name, value) => storage.set(name, value),
    };

    saveRelationshipReviewLedger({ [key]: review }, fakeStorage);

    expect(storage.get(RELATIONSHIP_REVIEW_STORAGE_KEY)).toBe(serialized);
    expect(parseRelationshipReviewLedger(serialized)).toEqual({ [key]: review });
    expect(parseRelationshipReviewLedger('{broken')).toEqual({});
    expect(parseRelationshipReviewLedger({ decisions: { bad: { status: 'pending' } } })).toEqual({});
  });
});
