import { describe, expect, it, vi } from 'vitest';
import { exportEntriesMD, importEntriesJSON } from './exports.js';
import { fileToEntry } from './frontmatter.js';

describe('exportEntriesMD', () => {
  it('downloads frontmatter-compatible markdown files', async () => {
    const urls = [];
    const downloads = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = vi.fn(blob => {
      urls.push(blob);
      return `blob:${urls.length}`;
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.fn(function click() { downloads.push(this.download); });
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(tag => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = click.bind(el);
      return el;
    });

    try {
      exportEntriesMD([
        { id: 'n1', type: 'note', title: 'Note One', tags: ['x'], status: 'active', notes: 'Body', links: [] },
      ]);
      await new Promise(resolve => queueMicrotask(resolve));
    } finally {
      document.createElement.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }

    expect(downloads).toEqual(['Note One.md']);
    const content = await readBlob(urls[0]);
    const entry = fileToEntry({ path: 'notes/Note One.md', content });
    expect(entry.id).toBe('n1');
    expect(entry.type).toBe('note');
    expect(entry.notes).toBe('Body');
  });
});

describe('importEntriesJSON', () => {
  function fakeFile(arr) {
    return { text: async () => JSON.stringify(arr) };
  }

  it('deduplicates entries with the same id WITHIN the import file', async () => {
    // Finding #1: before fix, two entries with id "a" in the same import
    // both landed in `fresh`, corrupting downstream state.
    const file = fakeFile([
      { id: 'a', type: 'note', title: 'First', tags: [] },
      { id: 'a', type: 'note', title: 'Second (dup)', tags: [] },
      { id: 'b', type: 'note', title: 'Distinct', tags: [] },
    ]);
    const result = await importEntriesJSON(file, new Set());
    expect(result.fresh).toHaveLength(2);
    expect(result.fresh.map(e => e.id).sort()).toEqual(['a', 'b']);
    expect(result.fresh.find(e => e.id === 'a').title).toBe('First'); // first wins
    expect(result.withinFileDuplicates).toBe(1);
    expect(result.duplicates).toBe(0);
  });

  it('counts existing-id collisions separately from within-file dupes', async () => {
    const file = fakeFile([
      { id: 'existing', type: 'note', title: 'X', tags: [] },
      { id: 'new', type: 'note', title: 'Y', tags: [] },
      { id: 'new', type: 'note', title: 'Y-dup', tags: [] },
    ]);
    const result = await importEntriesJSON(file, new Set(['existing']));
    expect(result.fresh).toHaveLength(1);
    expect(result.fresh[0].id).toBe('new');
    expect(result.duplicates).toBe(1);          // `existing` vs. existingIds
    expect(result.withinFileDuplicates).toBe(1); // second `new` in file
  });
});

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}
