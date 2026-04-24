import { seed } from '../seed.js';

// Representative query set — 50 queries mixing short prefixes, tag matches,
// 3-letter completions, longer phrases.
const QUERIES = [
  'entry', 'focus', 'signal', 'flow', 'deep', 'craft', 'build', 'note', 'idea',
  'vault', 'ent 5', 'bench', 'cluster', 'star', 'path', 'rune',
  'a', 'ab', 'abc', 'focus flow', 'deep work', 'cluster-3', 'cluster-10',
  'xyz', 'nothing', 'qz', 'shipbuild', 'chartmap', 'note idea',
  '0', '1', '42', 'entry 100', 'entry 999',
  ...Array.from({ length: 16 }, (_, i) => 'word' + i),
].slice(0, 50);

function make(total) {
  const size = total === 1000 ? '1k' : total === 5000 ? '5k' : '10k';
  return {
    id: `search-${size}`,
    warmup: 2,
    iterations: 10,
    setup: () => {
      const { entries } = seed(total);
      return { entries };
    },
    fn: ({ entries }) => {
      for (const query of QUERIES) {
        const q = query.toLowerCase();
        const out = [];
        for (const e of entries) {
          if (e.title.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q))) {
            out.push(e);
          }
        }
      }
    },
  };
}

export default [make(1000), make(5000), make(10000)];
