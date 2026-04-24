import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FEATURE_FLAGS,
  filterEntriesForUI,
  normalizeFeatureFlags,
  shouldShowEntryType,
} from './featureFlags.js';

describe('featureFlags', () => {
  it('normalizes missing flags to production-safe defaults', () => {
    expect(normalizeFeatureFlags()).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags({ wiki_mode: true })).toEqual({
      ...DEFAULT_FEATURE_FLAGS,
      wiki_mode: true,
    });
  });

  it('hides raw/wiki/review entries by default', () => {
    const entries = [
      { id: 'a', type: 'note' },
      { id: 'b', type: 'raw' },
      { id: 'c', type: 'wiki' },
      { id: 'd', type: 'review' },
    ];
    expect(filterEntriesForUI(entries)).toEqual([{ id: 'a', type: 'note' }]);
  });

  it('shows gated entry kinds only when their feature flag is enabled', () => {
    expect(shouldShowEntryType('raw', { raw_inbox: true })).toBe(true);
    expect(shouldShowEntryType('wiki', { wiki_mode: true })).toBe(true);
    expect(shouldShowEntryType('review', { review_queue: true })).toBe(true);
  });
});
