import { seed, makeAdapterStub } from '../seed.js';
import { fileToEntry } from '../../src/lib/frontmatter.js';

async function scanAll(adapter) {
  const files = await adapter.list();
  const parsed = [];
  for (const f of files) {
    if (f.error) continue;
    const content = await adapter.read(f.path);
    parsed.push(fileToEntry({ path: f.path, content }));
  }
  return parsed;
}

function make(total) {
  return {
    id: `vault-scan-${total}${total === 1000 ? 'k' : total === 5000 ? 'k' : total === 10000 ? 'k' : ''}`.replace('1000k', '1k').replace('5000k', '5k').replace('10000k', '10k'),
    warmup: 1,
    iterations: 5,
    setup: () => {
      const { entries } = seed(total);
      const adapter = makeAdapterStub(entries);
      return { adapter };
    },
    fn: async ({ adapter }) => {
      await scanAll(adapter);
    },
  };
}

export default [make(1000), make(5000), make(10000)];
