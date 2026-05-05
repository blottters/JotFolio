import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FEATURE_FLAGS,
  filterEntriesForUI,
  normalizeFeatureFlags,
  shouldShowEntryType,
} from './featureFlags.js';

describe('featureFlags', () => {
  it('normalizes missing flags to alpha.18 defaults (knowledge types on)', () => {
    expect(normalizeFeatureFlags()).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags({ context_packs: true })).toEqual({
      ...DEFAULT_FEATURE_FLAGS,
      context_packs: true,
    });
  });

  it('respects explicit false for the alpha.18 knowledge flags', () => {
    const off = normalizeFeatureFlags({
      wiki_mode: false,
      raw_inbox: false,
      review_queue: false,
    });
    expect(off.wiki_mode).toBe(false);
    expect(off.raw_inbox).toBe(false);
    expect(off.review_queue).toBe(false);
  });

  it('shows raw/wiki/review entries by default', () => {
    const entries = [
      { id: 'a', type: 'note' },
      { id: 'b', type: 'raw' },
      { id: 'c', type: 'wiki' },
      { id: 'd', type: 'review' },
    ];
    expect(filterEntriesForUI(entries)).toEqual(entries);
  });

  it('hides gated entry kinds when their flag is explicitly false', () => {
    expect(shouldShowEntryType('raw', { raw_inbox: false })).toBe(false);
    expect(shouldShowEntryType('wiki', { wiki_mode: false })).toBe(false);
    expect(shouldShowEntryType('review', { review_queue: false })).toBe(false);
  });

  it('keeps still-dark phases (context_packs, memory_graph_nodes) strict opt-in', () => {
    const flags = normalizeFeatureFlags({});
    expect(flags.context_packs).toBe(false);
    expect(flags.memory_graph_nodes).toBe(false);
    expect(normalizeFeatureFlags({ context_packs: true }).context_packs).toBe(true);
  });
});
