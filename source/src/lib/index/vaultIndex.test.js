import { describe, expect, it } from 'vitest';
import {
  buildVaultIndex,
  getAffinityMatches,
  getBacklinks,
  getCluster,
  getMemoryHealth,
  getNeighbors,
  getUnresolvedTargets,
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

  it('tracks unresolved wiki-link targets across the vault', () => {
    const fixture = [
      { id: 'a', type: 'note', title: 'A', tags: [], status: 'draft',
        notes: 'Links to [[Missing Note]] and existing [[B]].', links: [] },
      { id: 'b', type: 'note', title: 'B', tags: [], status: 'draft',
        notes: 'Also links [[Missing Note]] and [[Other Missing]].', links: [] },
    ];
    const index = buildVaultIndex(fixture);
    const unresolved = getUnresolvedTargets(index);
    expect(unresolved).toHaveLength(2);
    const missing = unresolved.find(u => u.target === 'Missing Note');
    expect(missing.sourceIds.sort()).toEqual(['a', 'b']);
    const other = unresolved.find(u => u.target === 'Other Missing');
    expect(other.sourceIds).toEqual(['b']);
  });

  it('parses wikilink alias, heading, and block syntax for resolution', () => {
    const fixture = [
      { id: 'a', type: 'note', title: 'A', tags: [], status: 'draft',
        notes: 'See [[Target|alias text]] and [[Target#Heading]] and [[Target#^block-id]].',
        links: [] },
      { id: 'b', type: 'note', title: 'Target', tags: [], status: 'draft',
        notes: 'I am the target.', links: [] },
    ];
    const index = buildVaultIndex(fixture);
    expect(index.byId.get('a').links).toEqual(['b']);
    expect(getUnresolvedTargets(index)).toHaveLength(0);
  });

  it('does not resolve or track wikilinks inside fenced code', () => {
    const fixture = [
      { id: 'a', type: 'note', title: 'A', tags: [], status: 'draft',
        notes: 'real [[B]]\n```\n[[Ghost]]\n```\nmore [[Also Missing]]',
        links: [] },
      { id: 'b', type: 'note', title: 'B', tags: [], status: 'draft', notes: '', links: [] },
    ];
    const index = buildVaultIndex(fixture);
    expect(index.byId.get('a').links).toEqual(['b']);
    const unresolved = getUnresolvedTargets(index);
    expect(unresolved.map(u => u.target)).toEqual(['Also Missing']);
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
