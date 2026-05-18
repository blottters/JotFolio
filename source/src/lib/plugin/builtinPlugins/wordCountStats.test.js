import { describe, it, expect } from 'vitest';
import { countWords, wordCountSummary } from './wordCountStats.js';

describe('countWords', () => {
  it('returns 0 for empty or whitespace input', () => {
    expect(countWords('')).toBe(0);
    expect(countWords(null)).toBe(0);
    expect(countWords('   ')).toBe(0);
  });

  it('strips markdown noise (heading hash) so it does not inflate count', () => {
    // The noise regex strips #, brackets, pipes etc. Result: "Hello world" → 2 words.
    expect(countWords('# Hello world')).toBe(2);
    // Bracketed wikilink content splits into separate tokens after noise strip,
    // which is fine — the goal is that the hash + brackets don't add fake words.
    expect(countWords('### Hello')).toBe(1);
  });
});

describe('wordCountSummary', () => {
  it('aggregates totals and per-type buckets', () => {
    const summary = wordCountSummary([
      { type: 'note', notes: 'one two three' },
      { type: 'note', notes: 'four' },
      { type: 'task', notes: 'a b' },
    ]);
    expect(summary.entryCount).toBe(3);
    expect(summary.totalWords).toBe(6);
    expect(summary.perType).toEqual({ note: 4, task: 2 });
  });

  it('handles non-array input gracefully', () => {
    expect(wordCountSummary(null)).toEqual({ entryCount: 0, totalWords: 0, perType: {} });
  });
});
