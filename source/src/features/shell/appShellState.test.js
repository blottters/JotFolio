import { describe, expect, it } from 'vitest';
import { filterShellEntries, getShellSectionTitle } from './appShellState.js';

describe('appShellState', () => {
  it('filters spaces without caring about stored capitalization', () => {
    const entries = [
      { id: 'n-1', type: 'note', title: 'Research note', space: 'Research', date: '2026-05-14' },
      { id: 'n-2', type: 'note', title: 'Work note', space: 'Work', date: '2026-05-14' },
    ];

    const result = filterShellEntries({
      entries,
      section: 'space:research',
      query: '',
      parsedQuery: null,
      filterStatus: '',
      filterTag: '',
      sort: 'date',
    });

    expect(result).toEqual([entries[0]]);
    expect(getShellSectionTitle('space:research')).toBe('Space: research');
  });
});
