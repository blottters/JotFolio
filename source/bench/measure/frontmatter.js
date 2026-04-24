import { parse, serialize } from '../../src/lib/frontmatter.js';

const SAMPLE = {
  frontmatter: {
    id: 'abc-123',
    type: 'note',
    title: 'Benchmark Sample Note',
    tags: ['bench', 'cluster-0', 'focus', 'signal'],
    status: 'active',
    starred: false,
    created: '2026-01-01T00:00:00.000Z',
    modified: '2026-04-24T00:00:00.000Z',
  },
  body: 'Lorem ipsum dolor sit amet.\n\n## Section\n\nMore text here.',
};

const SAMPLE_TEXT = serialize(SAMPLE);

export default [
  {
    id: 'frontmatter-roundtrip',
    warmup: 3,
    iterations: 10,
    setup: () => ({}),
    fn: () => {
      // parse + serialize × 1000 → single measured iteration
      for (let i = 0; i < 1000; i++) {
        const { frontmatter, body } = parse(SAMPLE_TEXT);
        serialize({ frontmatter, body });
      }
    },
  },
];
