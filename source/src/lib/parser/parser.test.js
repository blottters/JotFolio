import { describe, it, expect } from 'vitest';
import { findCodeRanges, isInside, lineAt } from './codeMask.js';
import { parseWikilinks } from './wikilinks.js';
import { parseHeadings, slugify } from './headings.js';
import { parseInlineTags, parseFrontmatterTags, mergeTags } from './tags.js';
import { parseEmbeds, isImageEmbed } from './embeds.js';
import { parseBlockRefs } from './blocks.js';

describe('codeMask.findCodeRanges', () => {
  it('returns empty for plain prose', () => {
    expect(findCodeRanges('hello world')).toEqual([]);
  });

  it('detects fenced blocks with backticks', () => {
    const md = 'before\n```js\nconst x = 1;\n```\nafter';
    const ranges = findCodeRanges(md);
    expect(ranges).toHaveLength(1);
    const slice = md.slice(ranges[0].start, ranges[0].end);
    expect(slice).toContain('```js');
    expect(slice).toContain('```');
  });

  it('detects fenced blocks with tildes', () => {
    const md = '~~~\nx\n~~~';
    expect(findCodeRanges(md)).toHaveLength(1);
  });

  it('detects inline code spans', () => {
    const md = 'use `console.log()` to debug';
    const ranges = findCodeRanges(md);
    expect(ranges).toHaveLength(1);
    expect(md.slice(ranges[0].start, ranges[0].end)).toBe('`console.log()`');
  });

  it('does not double-count inline inside fenced', () => {
    const md = '```\n`inline`\n```';
    const ranges = findCodeRanges(md);
    expect(ranges).toHaveLength(1);
  });

  it('lineAt counts newlines correctly', () => {
    const md = 'a\nb\nc';
    expect(lineAt(md, 0)).toBe(1);
    expect(lineAt(md, 2)).toBe(2);
    expect(lineAt(md, 4)).toBe(3);
  });

  it('isInside returns true only within range', () => {
    const ranges = [{ start: 5, end: 10 }];
    expect(isInside(4, ranges)).toBe(false);
    expect(isInside(5, ranges)).toBe(true);
    expect(isInside(9, ranges)).toBe(true);
    expect(isInside(10, ranges)).toBe(false);
  });
});

describe('parseWikilinks', () => {
  it('parses bare wikilink', () => {
    const links = parseWikilinks('See [[Note]] for details.');
    expect(links).toEqual([
      { raw: '[[Note]]', target: 'Note', alias: undefined, heading: undefined, block: undefined, line: 1 },
    ]);
  });

  it('parses alias', () => {
    const [link] = parseWikilinks('Read [[Note|the note]].');
    expect(link.target).toBe('Note');
    expect(link.alias).toBe('the note');
  });

  it('parses heading reference', () => {
    const [link] = parseWikilinks('See [[Note#Heading]].');
    expect(link.target).toBe('Note');
    expect(link.heading).toBe('Heading');
    expect(link.block).toBeUndefined();
  });

  it('parses block reference', () => {
    const [link] = parseWikilinks('See [[Note#^block-id]].');
    expect(link.target).toBe('Note');
    expect(link.block).toBe('block-id');
    expect(link.heading).toBeUndefined();
  });

  it('parses heading + alias', () => {
    const [link] = parseWikilinks('[[Note#Heading|alias]]');
    expect(link.target).toBe('Note');
    expect(link.heading).toBe('Heading');
    expect(link.alias).toBe('alias');
  });

  it('skips empty wikilink', () => {
    expect(parseWikilinks('Empty [[]] here.')).toEqual([]);
  });

  it('treats empty alias as undefined', () => {
    const [link] = parseWikilinks('[[Note|]]');
    expect(link.alias).toBeUndefined();
    expect(link.target).toBe('Note');
  });

  it('does not parse wikilinks inside fenced code', () => {
    const md = 'before\n```\n[[InCode]]\n```\n[[Real]]';
    const links = parseWikilinks(md);
    expect(links.map(l => l.target)).toEqual(['Real']);
  });

  it('does not parse wikilinks inside inline code', () => {
    const links = parseWikilinks('use `[[NotALink]]` and [[Real]]');
    expect(links.map(l => l.target)).toEqual(['Real']);
  });

  it('does not parse embeds (![[...]]) as wikilinks', () => {
    const links = parseWikilinks('Embed: ![[Image.png]] and link [[Note]]');
    expect(links.map(l => l.target)).toEqual(['Note']);
  });

  it('reports correct line numbers across multi-line input', () => {
    const md = 'one\ntwo [[Link]] three\nfour';
    const [link] = parseWikilinks(md);
    expect(link.line).toBe(2);
  });

  it('skips heading-only wikilink with no target', () => {
    expect(parseWikilinks('[[#Heading]]')).toEqual([]);
  });
});

describe('parseHeadings', () => {
  it('extracts level/text/slug/line', () => {
    const md = '# Top\n\n## Sub-section!\n\nbody';
    const out = parseHeadings(md);
    expect(out).toEqual([
      { level: 1, text: 'Top', slug: 'top', line: 1 },
      { level: 2, text: 'Sub-section!', slug: 'sub-section', line: 3 },
    ]);
  });

  it('strips trailing #s', () => {
    const [h] = parseHeadings('# Title ##');
    expect(h.text).toBe('Title');
  });

  it('disambiguates duplicate slugs', () => {
    const md = '# X\n# X\n# X';
    const slugs = parseHeadings(md).map(h => h.slug);
    expect(slugs).toEqual(['x', 'x-2', 'x-3']);
  });

  it('skips headings inside fenced code', () => {
    const md = '```\n# NotAHeading\n```\n# Real';
    const out = parseHeadings(md);
    expect(out.map(h => h.text)).toEqual(['Real']);
  });

  it('slugify handles edge cases', () => {
    expect(slugify('Hello World!')).toBe('hello-world');
    expect(slugify('  spaces  ')).toBe('spaces');
    expect(slugify('Über')).toBe('ber'); // strips non-ascii (basic slugify)
  });
});

describe('tag parsing', () => {
  it('extracts inline tags', () => {
    expect(parseInlineTags('I love #research and #ml.')).toEqual(['research', 'ml']);
  });

  it('supports nested tags as single tags', () => {
    expect(parseInlineTags('Tagged #project/active')).toEqual(['project/active']);
  });

  it('deduplicates case-insensitively', () => {
    expect(parseInlineTags('#Foo and #foo')).toEqual(['Foo']);
  });

  it('skips tags in code blocks', () => {
    const md = '```\n#notATag\n```\n#real';
    expect(parseInlineTags(md)).toEqual(['real']);
  });

  it('skips tags in inline code', () => {
    expect(parseInlineTags('use `#notATag` and #real')).toEqual(['real']);
  });

  it('ignores numeric-only (issue refs)', () => {
    expect(parseInlineTags('see #123 and #real')).toEqual(['real']);
  });

  it('ignores ATX headings', () => {
    // "# Heading" has space after — TAG_RE requires no space.
    expect(parseInlineTags('# Heading\nbody #real')).toEqual(['real']);
  });

  it('parses frontmatter tags array', () => {
    expect(parseFrontmatterTags({ tags: ['a', 'b'] })).toEqual(['a', 'b']);
  });

  it('parses frontmatter tags string', () => {
    expect(parseFrontmatterTags({ tags: 'a, b, c' })).toEqual(['a', 'b', 'c']);
  });

  it('strips leading # from frontmatter tag string', () => {
    expect(parseFrontmatterTags({ tags: '#a #b' })).toEqual(['a', 'b']);
  });

  it('mergeTags dedups across sources', () => {
    expect(mergeTags(['a', 'b'], ['B', 'c'])).toEqual(['a', 'b', 'c']);
  });
});

describe('parseEmbeds', () => {
  it('extracts embed', () => {
    const [e] = parseEmbeds('Look: ![[image.png]]');
    expect(e.target).toBe('image.png');
    expect(e.line).toBe(1);
  });

  it('extracts embed with alias', () => {
    const [e] = parseEmbeds('![[doc.pdf|caption]]');
    expect(e.target).toBe('doc.pdf');
    expect(e.alias).toBe('caption');
  });

  it('skips embeds in code blocks', () => {
    const md = '```\n![[code-only.png]]\n```\n![[real.png]]';
    expect(parseEmbeds(md).map(e => e.target)).toEqual(['real.png']);
  });

  it('isImageEmbed by extension', () => {
    expect(isImageEmbed({ target: 'a.png' })).toBe(true);
    expect(isImageEmbed({ target: 'a.svg' })).toBe(true);
    expect(isImageEmbed({ target: 'note' })).toBe(false);
    expect(isImageEmbed({ target: 'note.md' })).toBe(false);
  });
});

describe('parseBlockRefs', () => {
  it('extracts trailing ^id', () => {
    const out = parseBlockRefs('Some text. ^my-block');
    expect(out).toEqual([{ id: 'my-block', line: 1 }]);
  });

  it('reports correct line', () => {
    const md = 'one\ntwo ^b\nthree';
    expect(parseBlockRefs(md)).toEqual([{ id: 'b', line: 2 }]);
  });

  it('ignores inline ^foo not at end of line', () => {
    expect(parseBlockRefs('text ^inline more')).toEqual([]);
  });

  it('skips block refs inside fenced code', () => {
    const md = '```\nsome ^code-only\n```\nreal ^real';
    expect(parseBlockRefs(md)).toEqual([{ id: 'real', line: 4 }]);
  });
});
