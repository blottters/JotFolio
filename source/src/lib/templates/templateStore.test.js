import { describe, it, expect } from 'vitest';
import {
  TEMPLATE_DIR,
  TEMPLATE_EXT,
  loadTemplates,
  resolveVariables,
  applyTemplateToNote,
  insertTemplateAtCursor,
} from './templateStore.js';

// Fixed reference date so date/time assertions are deterministic across
// timezones the test runner might pick up. April 26, 2026 was a Sunday.
const REF = new Date(2026, 3, 26, 14, 5, 9); // local-time ctor: month 3 = April

describe('resolveVariables', () => {
  it('replaces bare {{date}} with YYYY-MM-DD', () => {
    expect(resolveVariables('Today is {{date}}.', { date: REF }))
      .toBe('Today is 2026-04-26.');
  });

  it('replaces {{date:dddd, MMMM D, YYYY}} with the long form', () => {
    expect(resolveVariables('{{date:dddd, MMMM D, YYYY}}', { date: REF }))
      .toBe('Sunday, April 26, 2026');
  });

  it('replaces {{time}} with HH:mm:ss', () => {
    expect(resolveVariables('at {{time}}', { date: REF }))
      .toBe('at 14:05:09');
  });

  it('replaces {{title}} with ctx.title', () => {
    expect(resolveVariables('# {{title}}', { date: REF, title: 'Daily Note' }))
      .toBe('# Daily Note');
  });

  it('leaves unknown variables untouched', () => {
    expect(resolveVariables('hello {{foo}} world', { date: REF }))
      .toBe('hello {{foo}} world');
  });

  it('resolves multiple variables in one string', () => {
    const out = resolveVariables(
      '# {{title}}\nDate: {{date}}\nTime: {{time}}',
      { date: REF, title: 'Standup' },
    );
    expect(out).toBe('# Standup\nDate: 2026-04-26\nTime: 14:05:09');
  });

  it('falls back to current date when ctx.date is missing', () => {
    const out = resolveVariables('{{date:YYYY}}', {});
    expect(out).toMatch(/^\d{4}$/);
  });

  it('treats a non-string body as empty', () => {
    expect(resolveVariables(null, { date: REF })).toBe('');
  });
});

describe('applyTemplateToNote', () => {
  it('merges template frontmatter with resolved body', () => {
    const tpl = {
      id: 'templates/daily.md',
      name: 'daily',
      path: 'templates/daily.md',
      body: '# {{title}} ({{date}})\n\nFocus: ',
      frontmatter: { type: 'note', tags: ['daily'] },
    };
    const out = applyTemplateToNote(tpl, { date: REF, title: 'April 26' });
    expect(out.frontmatter).toEqual({ type: 'note', tags: ['daily'] });
    expect(out.body).toBe('# April 26 (2026-04-26)\n\nFocus: ');
  });

  it('returns an empty frontmatter object when template has none', () => {
    const tpl = { id: 't', name: 't', path: 't', body: 'plain', frontmatter: undefined };
    const out = applyTemplateToNote(tpl, { date: REF });
    expect(out.frontmatter).toEqual({});
    expect(out.body).toBe('plain');
  });

  it('clones frontmatter so callers cannot mutate the original', () => {
    const fm = { type: 'note' };
    const tpl = { id: 't', name: 't', path: 't', body: '', frontmatter: fm };
    const out = applyTemplateToNote(tpl, { date: REF });
    out.frontmatter.type = 'changed';
    expect(fm.type).toBe('note');
  });
});

describe('insertTemplateAtCursor', () => {
  it('splits text and inserts when cursor is in the middle', () => {
    const r = insertTemplateAtCursor('hello world', 6, 'BIG ');
    expect(r.text).toBe('hello BIG world');
    expect(r.cursorAfter).toBe(10);
  });

  it('prepends when cursor is at start', () => {
    const r = insertTemplateAtCursor('abc', 0, 'XYZ');
    expect(r.text).toBe('XYZabc');
    expect(r.cursorAfter).toBe(3);
  });

  it('appends when cursor is at end', () => {
    const r = insertTemplateAtCursor('abc', 3, 'XYZ');
    expect(r.text).toBe('abcXYZ');
    expect(r.cursorAfter).toBe(6);
  });

  it('returns cursorAfter = cursorPos + templateBody.length', () => {
    const original = 'lorem ipsum dolor';
    const insert = '[inserted block]';
    const pos = 6;
    const r = insertTemplateAtCursor(original, pos, insert);
    expect(r.cursorAfter).toBe(pos + insert.length);
    expect(r.text.slice(pos, r.cursorAfter)).toBe(insert);
  });

  it('clamps a negative cursor to 0 (prepend)', () => {
    const r = insertTemplateAtCursor('abc', -10, 'X');
    expect(r.text).toBe('Xabc');
    expect(r.cursorAfter).toBe(1);
  });

  it('clamps an overshoot cursor to text length (append)', () => {
    const r = insertTemplateAtCursor('abc', 999, 'X');
    expect(r.text).toBe('abcX');
    expect(r.cursorAfter).toBe(4);
  });
});

describe('loadTemplates', () => {
  function makeVault(files) {
    return {
      list: async () => files.map(f => ({
        path: f.path,
        name: f.path.split('/').pop(),
      })),
      read: async (p) => {
        const hit = files.find(f => f.path === p);
        if (!hit) throw new Error('not found: ' + p);
        return hit.content;
      },
    };
  }

  it('returns an empty array when templates/ folder is missing', async () => {
    const vault = makeVault([
      { path: 'notes/hello.md', content: '# hi' },
    ]);
    const out = await loadTemplates(vault);
    expect(out).toEqual([]);
  });

  it('returns an empty array when vault is null (no throw)', async () => {
    const out = await loadTemplates(null);
    expect(out).toEqual([]);
  });

  it('returns an empty array when vault.list rejects', async () => {
    const vault = {
      list: async () => { throw new Error('boom'); },
      read: async () => '',
    };
    const out = await loadTemplates(vault);
    expect(out).toEqual([]);
  });

  it('filters out non-.md files', async () => {
    const vault = makeVault([
      { path: 'templates/daily.md', content: '# daily' },
      { path: 'templates/readme.txt', content: 'ignore me' },
      { path: 'templates/cover.png', content: '' },
      { path: 'templates/weekly.md', content: '# weekly' },
    ]);
    const out = await loadTemplates(vault);
    expect(out.map(t => t.name)).toEqual(['daily', 'weekly']);
  });

  it('does not recurse into nested subfolders of templates/', async () => {
    const vault = makeVault([
      { path: 'templates/top.md', content: 'top' },
      { path: 'templates/archive/old.md', content: 'old' },
    ]);
    const out = await loadTemplates(vault);
    expect(out.map(t => t.path)).toEqual(['templates/top.md']);
  });

  it('parses frontmatter and exposes body separately', async () => {
    const vault = makeVault([
      {
        path: 'templates/daily.md',
        content: '---\ntype: note\ntags: [daily]\n---\n# {{title}}\n',
      },
    ]);
    const out = await loadTemplates(vault);
    expect(out).toHaveLength(1);
    expect(out[0].frontmatter.type).toBe('note');
    expect(out[0].frontmatter.tags).toEqual(['daily']);
    expect(out[0].body).toBe('# {{title}}\n');
    expect(out[0].name).toBe('daily');
    expect(out[0].id).toBe('templates/daily.md');
  });

  it('falls back to raw content when frontmatter parsing throws', async () => {
    const vault = makeVault([
      // Open --- with no close → frontmatter parser throws. We should
      // still surface the template, with the raw body intact.
      { path: 'templates/broken.md', content: '---\nbroken: true\n# no close' },
    ]);
    const out = await loadTemplates(vault);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('broken');
    expect(out[0].body).toContain('broken: true');
  });

  it('exposes the documented constants', () => {
    expect(TEMPLATE_DIR).toBe('templates');
    expect(TEMPLATE_EXT).toBe('.md');
  });

  it('sorts results alphabetically by name', async () => {
    const vault = makeVault([
      { path: 'templates/zeta.md', content: '' },
      { path: 'templates/alpha.md', content: '' },
      { path: 'templates/mike.md', content: '' },
    ]);
    const out = await loadTemplates(vault);
    expect(out.map(t => t.name)).toEqual(['alpha', 'mike', 'zeta']);
  });
});
