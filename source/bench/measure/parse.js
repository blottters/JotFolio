import { marked } from 'marked';

function buildTenKbNote() {
  const para = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
  const withLinks = `Reference to [[Entry 5]] and [[Entry 42]] and [[Nonexistent]]. `;
  const blocks = [];
  // Aim for ~10KB
  blocks.push('# Ten KB Note\n\n');
  for (let i = 0; i < 20; i++) {
    blocks.push(`## Section ${i}\n\n`);
    blocks.push(withLinks);
    blocks.push(para.repeat(5));
    blocks.push('\n\n- bullet one\n- bullet two\n- bullet three\n\n');
    blocks.push('```\ncode block example\n```\n\n');
  }
  return blocks.join('');
}

const TEXT = buildTenKbNote();

// Same logic as src/lib/markdown.js renderWikiLinks, inlined so bench
// doesn't touch the real DOM module.
function renderWikiLinks(text, titles) {
  return text.replace(/\[\[([^\[\]\n]{1,120})\]\]/g, (_, raw) => {
    const title = raw.trim();
    return titles.has(title.toLowerCase())
      ? `<a href="#">${title}</a>`
      : `<span class="broken">${title}</span>`;
  });
}

// 5k-entry title index for post-process match cost
const TITLE_INDEX = new Set();
for (let i = 0; i < 5000; i++) TITLE_INDEX.add(('Entry ' + i).toLowerCase());

export default [
  {
    id: 'md-parse-10kb',
    warmup: 3,
    iterations: 10,
    setup: () => ({}),
    fn: () => {
      const pre = renderWikiLinks(TEXT, TITLE_INDEX);
      marked.parse(pre, { breaks: true, gfm: true });
    },
  },
  {
    id: 'autocomplete-render',
    warmup: 3,
    iterations: 10,
    setup: () => {
      // Simulate 5k entries
      const entries = [];
      for (let i = 0; i < 5000; i++) {
        entries.push({ id: 'entry-' + i, title: 'Entry ' + i, tags: ['t' + (i % 20)] });
      }
      return { entries, query: 'ent' };
    },
    fn: ({ entries, query }) => {
      const q = query.toLowerCase();
      const out = [];
      for (const e of entries) {
        if (out.length >= 20) break;
        if (e.title.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))) {
          out.push(e);
        }
      }
    },
  },
];
