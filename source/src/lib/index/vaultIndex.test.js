import { describe, expect, it } from 'vitest';
import {
  buildVaultIndex,
  getAffinityMatches,
  getBacklinks,
  getCluster,
  getMemoryHealth,
  getNeighbors,
  searchRaw,
  searchWiki,
} from './vaultIndex.js';

const FIXTURE = [
  {
    id: 'wiki-1',
    type: 'wiki',
    title: 'Compiler Notes',
    aliases: ['Knowledge Compiler'],
    canonical_key: 'compiler-notes',
    retrieval_keywords: ['compiler', 'wiki'],
    tags: ['llm', 'compiler'],
    status: 'reviewed',
    notes: 'Links to [[Karpathy Transcript]] and [[Project Memory]].',
    links: [],
  },
  {
    id: 'raw-1',
    type: 'raw',
    title: 'Karpathy Transcript',
    tags: ['llm'],
    status: 'captured',
    notes: 'Raw capture from a talk.',
    links: [],
  },
  {
    id: 'wiki-2',
    type: 'wiki',
    title: 'Project Memory',
    aliases: ['Persistent Memory'],
    canonical_key: 'project-memory',
    retrieval_keywords: ['memory', 'project'],
    tags: ['llm', 'memory'],
    status: 'reviewed',
    notes: 'Compiled page referencing [[Knowledge Compiler]].',
    links: [],
  },
  {
    id: 'review-1',
    type: 'review',
    title: 'Compiler Merge Review',
    canonical_key: 'compiler-notes',
    tags: ['llm', 'compiler'],
    status: 'pending',
    notes: 'Review item for compiler note.',
    links: ['wiki-1'],
  },
];

describe('vaultIndex', () => {
  it('resolves wiki links by title, alias, and canonical key', () => {
    const index = buildVaultIndex(FIXTURE);
    expect(index.byId.get('wiki-1').links).toEqual(['raw-1', 'wiki-2']);
    expect(index.byId.get('wiki-2').links).toEqual(['wiki-1']);
  });

  it('builds backlinks, neighbors, and clusters deterministically', () => {
    const index = buildVaultIndex(FIXTURE);
    expect(getBacklinks(index, 'wiki-1').map(entry => entry.id)).toEqual(['wiki-2', 'review-1']);
    expect(getNeighbors(index, 'wiki-1', 2).map(entry => entry.id)).toEqual(['raw-1', 'wiki-2', 'review-1']);
    expect(getCluster(index, 'wiki-1').map(entry => entry.id)).toEqual(['wiki-1', 'raw-1', 'wiki-2', 'review-1']);
  });

  it('searches wiki and raw buckets separately', () => {
    const index = buildVaultIndex(FIXTURE);
    expect(searchWiki(index, 'knowledge compiler').map(entry => entry.id)).toEqual(['wiki-1', 'wiki-2']);
    expect(searchRaw(index, 'talk').map(entry => entry.id)).toEqual(['raw-1']);
  });

  it('returns affinity matches from the indexed corpus', () => {
    const index = buildVaultIndex(FIXTURE);
    expect(getAffinityMatches(index, 'wiki-1', { limit: 2 }).map(entry => entry.id)).toEqual(['review-1', 'wiki-2']);
  });

  it('reports duplicate canonical keys and hidden graph islands', () => {
    const index = buildVaultIndex([
      ...FIXTURE,
      { id: 'raw-2', type: 'raw', title: 'Orphan Raw', tags: [], status: 'captured', notes: '', links: [] },
    ]);
    const health = getMemoryHealth(index);
    expect(health.duplicateCanonicalKeys).toEqual([{ key: 'compiler-notes', ids: ['wiki-1', 'review-1'] }]);
    expect(health.orphanedRaw).toContain('raw-2');
    expect(health.hiddenGraphIslands).toContain('raw-2');
  });
});
