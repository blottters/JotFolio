import { describe, expect, it } from 'vitest';
import { FRONTMATTER_EXTRAS_FIELD } from '../frontmatter.js';
import {
  TEMPLATE_REFS_FIELD,
  addTemplateUsageToEntry,
  getEntryTemplateRefs,
  getTemplateIncoming,
  getTemplateOutgoing,
  templateReferenceKeys,
} from './templateBacklinks.js';

const template = {
  id: 'templates/daily-note.md',
  name: 'daily-note',
  path: 'templates/daily-note.md',
  body: 'Start with [[Project Plan]] and [[Missing Target]].',
};

describe('templateBacklinks', () => {
  it('builds stable reference keys for a template', () => {
    expect([...templateReferenceKeys(template)]).toEqual([
      'templates/daily-note.md',
      'templates/daily-note',
      'daily-note',
      'daily-note.md',
    ]);
  });

  it('persists template usage in entry frontmatter extras', () => {
    const entry = { id: 'n1', title: 'Note', notes: '' };
    const updated = addTemplateUsageToEntry(entry, template);
    expect(updated[FRONTMATTER_EXTRAS_FIELD][TEMPLATE_REFS_FIELD]).toEqual(['templates/daily-note.md']);
    expect(getEntryTemplateRefs(updated)).toEqual(['templates/daily-note.md']);
  });

  it('finds incoming references from applied templates and explicit wiki links', () => {
    const entries = [
      addTemplateUsageToEntry({ id: 'a', title: 'Applied', notes: '' }, template),
      { id: 'b', title: 'Linked', notes: 'Use [[daily-note]] for today.' },
      { id: 'c', title: 'Other', notes: 'No match.' },
    ];
    const incoming = getTemplateIncoming(entries, template);
    expect(incoming.map(item => [item.entry.id, item.reasons])).toEqual([
      ['a', ['applied']],
      ['b', ['linked']],
    ]);
  });

  it('separates resolved and unresolved outgoing template links', () => {
    const entries = [
      { id: 'plan', title: 'Project Plan', aliases: [], canonical_key: '', notes: '', links: [] },
    ];
    const outgoing = getTemplateOutgoing(entries, template);
    expect(outgoing.resolved.map(item => item.entry.id)).toEqual(['plan']);
    expect(outgoing.unresolved.map(item => item.target)).toEqual(['Missing Target']);
  });
});
