// Deterministic bench-data generator. Clustered wiki-link topology:
// 20 clusters, 60% of links target same-cluster, 40% random. Mirrors
// real vault structure closely enough that backlink and search
// measurements reflect worst-case fan-out.

import { performance } from 'node:perf_hooks';

// Simple deterministic PRNG (Mulberry32). Avoids seedrandom dep.
function makeRng(seed) {
  let a = seed | 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BENCH_SEED = 42;
const CLUSTER_COUNT = 20;
const WORDS = ['focus', 'flow', 'deep', 'signal', 'craft', 'build', 'ship', 'note',
  'idea', 'vault', 'rune', 'path', 'link', 'map', 'chart', 'star'];

function pickWord(rng, i) { return WORDS[(Math.floor(rng() * WORDS.length) + i) % WORDS.length]; }

export function seedEntry(i, total, rng) {
  const perCluster = Math.ceil(total / CLUSTER_COUNT);
  const cluster = Math.floor(i / perCluster);
  const clusterBase = cluster * perCluster;
  const linkCount = Math.floor(rng() * 4) + 1;
  const links = [];
  for (let k = 0; k < linkCount; k++) {
    const inCluster = rng() < 0.6;
    const target = inCluster
      ? clusterBase + Math.floor(rng() * perCluster)
      : Math.floor(rng() * total);
    const idx = Math.max(0, Math.min(total - 1, target));
    if (idx !== i) links.push(`entry-${idx}`);
  }
  const title = `Entry ${i} — ${pickWord(rng, i)} ${pickWord(rng, i + 1)}`;
  const tags = [`cluster-${cluster}`, 'bench', pickWord(rng, i + 7)];
  return {
    id: `entry-${i}`,
    path: `notes/entry-${i}.md`,
    title,
    tags,
    notes: `# ${title}\n\nBody ${i}. ${links.map(l => `[[${l}]]`).join(' ')}\n\n${'Lorem ipsum dolor sit amet. '.repeat(30)}`,
    type: 'note',
    status: 'active',
    starred: i % 11 === 0,
    date: new Date(2026, 0, 1 + (i % 365)).toISOString(),
    links: [...links],
  };
}

export function seed(total) {
  const start = performance.now();
  const rng = makeRng(BENCH_SEED);
  const out = new Array(total);
  for (let i = 0; i < total; i++) out[i] = seedEntry(i, total, rng);
  const ms = performance.now() - start;
  return { entries: out, seedMs: ms };
}

// In-memory LocalAdapter-shaped stub. Implements the subset the bench needs.
export function makeAdapterStub(entries) {
  const files = new Map();
  for (const e of entries) {
    const fm = [
      '---',
      `id: ${e.id}`,
      `type: ${e.type}`,
      `title: ${e.title}`,
      `tags: [${e.tags.join(', ')}]`,
      `status: ${e.status}`,
      `starred: ${e.starred}`,
      `created: ${e.date}`,
      `modified: ${e.date}`,
      '---',
      e.notes,
    ].join('\n');
    files.set(e.path, fm);
  }
  return {
    list: async () => Array.from(files.keys()).map(path => ({
      path,
      name: path.split('/').pop(),
      folder: path.slice(0, path.lastIndexOf('/')) || '',
      size: files.get(path).length,
      mtime: Date.now(),
    })),
    read: async (p) => {
      const c = files.get(p);
      if (c == null) throw new Error('not-found: ' + p);
      return c;
    },
    write: async (p, c) => { files.set(p, c); },
    remove: async (p) => { files.delete(p); },
  };
}
