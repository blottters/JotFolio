import { describe, it, expect } from 'vitest';
import {
  parse,
  serialize,
  entryToFile,
  fileToEntry,
  slugify,
  FrontmatterError,
  FRONTMATTER_EXTRAS_FIELD,
  MANUAL_LINKS_FIELD,
} from './frontmatter.js';

describe('frontmatter.parse', () => {
  it('returns empty frontmatter when no --- block', () => {
    const { frontmatter, body } = parse('just body text');
    expect(frontmatter).toEqual({});
    expect(body).toBe('just body text');
  });

  it('parses a full block with scalars, arrays, and body', () => {
    const src = `---
title: My Note
type: note
tags: [ai, research]
starred: true
---
# Body here
Multiple lines.
`;
    const { frontmatter, body } = parse(src);
    expect(frontmatter.title).toBe('My Note');
    expect(frontmatter.type).toBe('note');
    expect(frontmatter.tags).toEqual(['ai', 'research']);
    expect(frontmatter.starred).toBe(true);
    expect(body).toContain('# Body here');
  });

  it('parses block-array tags', () => {
    const src = `---
tags:
  - ai
  - research
  - philosophy
---
body`;
    const { frontmatter } = parse(src);
    expect(frontmatter.tags).toEqual(['ai', 'research', 'philosophy']);
  });

  it('handles quoted strings with colons', () => {
    const src = `---
title: "Thoughts: An Inquiry"
---
body`;
    const { frontmatter } = parse(src);
    expect(frontmatter.title).toBe('Thoughts: An Inquiry');
  });

  it('throws on unclosed frontmatter block', () => {
    expect(() => parse('---\ntitle: Broken\nbody')).toThrow(FrontmatterError);
  });

  it('accepts a frontmatter block closed at EOF without trailing newline', () => {
    // Finding #10: `---` at end of file (no trailing `\n`) was rejected.
    const src = `---\ntitle: Tight\ntype: note\nid: n1\n---`;
    const { frontmatter, body } = parse(src);
    expect(frontmatter.title).toBe('Tight');
    expect(frontmatter.type).toBe('note');
    expect(body).toBe('');
  });

  it('accepts frontmatter closed at EOF with CRLF line endings', () => {
    const src = `---\r\ntitle: Tight\r\nid: n1\r\n---`;
    const { frontmatter } = parse(src);
    expect(frontmatter.title).toBe('Tight');
    expect(frontmatter.id).toBe('n1');
  });

  it('throws on invalid line inside frontmatter', () => {
    expect(() => parse('---\nno colon here\n---\nbody')).toThrow(FrontmatterError);
  });
});

describe('frontmatter.serialize', () => {
  it('emits --- delimited block with stable field order', () => {
    const out = serialize({
      frontmatter: { starred: true, tags: ['x'], title: 'T', type: 'note', id: 'abc' },
      body: 'hello',
    });
    const lines = out.split('\n');
    expect(lines[0]).toBe('---');
    // FIELD_ORDER dictates id, type, title come first
    expect(lines[1]).toBe('id: abc');
    expect(lines[2]).toBe('type: note');
    expect(lines[3]).toBe('title: T');
  });

  it('quotes strings containing reserved characters', () => {
    const out = serialize({ frontmatter: { title: 'Has: a colon' }, body: 'x' });
    expect(out).toMatch(/title: "Has: a colon"/);
  });

  it('trailing newline always present', () => {
    const out = serialize({ frontmatter: { id: '1' }, body: 'no newline' });
    expect(out.endsWith('\n')).toBe(true);
  });

  it('empty arrays serialize as []', () => {
    const out = serialize({ frontmatter: { tags: [] }, body: 'x' });
    expect(out).toMatch(/tags: \[\]/);
  });
});

describe('frontmatter quoted-scalar escape handling (finding #11)', () => {
  it('round-trips a string containing embedded double-quotes', () => {
    const original = {
      frontmatter: { id: 'n1', type: 'note', title: 'She said "hi"' },
      body: 'Body',
    };
    const out = serialize(original);
    const { frontmatter } = parse(out);
    expect(frontmatter.title).toBe('She said "hi"');
  });

  it('round-trips a string containing a backslash', () => {
    const original = {
      frontmatter: { id: 'n1', type: 'note', title: 'C:\\path\\to\\thing' },
      body: 'Body',
    };
    const out = serialize(original);
    const { frontmatter } = parse(out);
    expect(frontmatter.title).toBe('C:\\path\\to\\thing');
  });

  it('round-trips a string with both quotes and backslashes', () => {
    const original = {
      frontmatter: { id: 'n1', type: 'note', title: 'a\\"b' },
      body: 'Body',
    };
    const out = serialize(original);
    const { frontmatter } = parse(out);
    expect(frontmatter.title).toBe('a\\"b');
  });
});

describe('frontmatter round-trip', () => {
  it('parse → serialize preserves simple content', () => {
    const original = `---
id: 550e8400
type: note
title: Hello
tags: [a, b]
starred: false
---
Body content.
`;
    const { frontmatter, body } = parse(original);
    const out = serialize({ frontmatter, body });
    const { frontmatter: again, body: againBody } = parse(out);
    expect(again).toEqual(frontmatter);
    expect(againBody.trim()).toBe(body.trim());
  });
});

describe('entryToFile + fileToEntry', () => {
  it('round-trips a note entry', () => {
    const entry = {
      id: 'id-1', type: 'note', title: 'On Stoicism',
      tags: ['philosophy', 'reading'], status: 'active',
      starred: true, notes: '# On Stoicism\n\nBody.', links: [],
    };
    const { path, content } = entryToFile(entry);
    expect(path).toBe('notes/On Stoicism.md');
    const back = fileToEntry({ path, content });
    expect(back.id).toBe('id-1');
    expect(back.type).toBe('note');
    expect(back.title).toBe('On Stoicism');
    expect(back.tags).toEqual(['philosophy', 'reading']);
    expect(back.starred).toBe(true);
    expect(back.notes).toBe('# On Stoicism\n\nBody.');
  });

  it('round-trips a video entry with type-specific fields', () => {
    const entry = {
      id: 'v-1', type: 'video', title: 'GPT from scratch',
      tags: ['ai'], status: 'watched',
      url: 'https://youtube.com/xyz', channel: 'Karpathy', duration: '2h',
      notes: 'Solid primer.', starred: false, links: [],
    };
    const { content } = entryToFile(entry);
    expect(content).toMatch(/url: "?https:\/\/youtube\.com\/xyz"?/);
    expect(content).toMatch(/channel: Karpathy/);
    const back = fileToEntry({ path: 'videos/GPT from scratch.md', content });
    expect(back.url).toBe('https://youtube.com/xyz');
    expect(back.channel).toBe('Karpathy');
  });

  it('collision resolution suffixes filenames', () => {
    const e = { id: '1', type: 'note', title: 'Dup', tags: [], notes: '', links: [] };
    const used = new Set(['notes/Dup.md', 'notes/Dup-2.md']);
    const { path } = entryToFile(e, p => used.has(p));
    expect(path).toBe('notes/Dup-3.md');
  });

  it('slugify strips illegal chars + caps length', () => {
    expect(slugify('A/B*C?"<>|:')).toBe('ABC');
    expect(slugify('   padded   ')).toBe('padded');
    expect(slugify('')).toBe('untitled');
    const long = 'x'.repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });

  it('fileToEntry throws on missing id or type', () => {
    const noId = serialize({ frontmatter: { type: 'note', title: 'x' }, body: '' });
    expect(() => fileToEntry({ path: 'notes/x.md', content: noId })).toThrow(FrontmatterError);
    const noType = serialize({ frontmatter: { id: '1', title: 'x' }, body: '' });
    expect(() => fileToEntry({ path: 'notes/x.md', content: noType })).toThrow(FrontmatterError);
  });

  it('preserves unknown frontmatter extras through entry save', () => {
    const content = `---
id: id-1
type: note
title: Metadata
aliases: [Alpha, Beta]
source: "external: import"
---
Body
`;
    const entry = fileToEntry({ path: 'notes/Metadata.md', content });

    expect(entry[FRONTMATTER_EXTRAS_FIELD]).toEqual({
      aliases: ['Alpha', 'Beta'],
      source: 'external: import',
    });

    const { content: saved } = entryToFile({ ...entry, title: 'Metadata 2' });
    const { frontmatter } = parse(saved);
    expect(frontmatter.aliases).toEqual(['Alpha', 'Beta']);
    expect(frontmatter.source).toBe('external: import');
    expect(frontmatter.title).toBe('Metadata 2');
  });

  it('round-trips manual links only when links were present in frontmatter', () => {
    const withManualLinks = fileToEntry({
      path: 'notes/Linked.md',
      content: `---
id: id-1
type: note
title: Linked
links: [id-2, id-3]
---
Body`,
    });

    expect(withManualLinks.links).toEqual(['id-2', 'id-3']);
    expect(withManualLinks[MANUAL_LINKS_FIELD]).toBe(true);
    expect(entryToFile(withManualLinks).content).toMatch(/links: \[id-2, id-3\]/);

    const derivedOnly = {
      ...withManualLinks,
      links: ['derived-id'],
      [MANUAL_LINKS_FIELD]: false,
    };
    expect(entryToFile(derivedOnly).content).not.toMatch(/^links:/m);
  });
});
