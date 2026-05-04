// Pure orchestrator for the compile pipeline (Karpathy Phase 4 Step 3).
// No I/O, no async. Caller persists results separately.

import { hashSourceEntry, hashCompiledArtifact, compositeSourceHash } from './hash.js';
import { compileDeterministic } from './compilers/deterministicStub.js';
import { getCluster } from '../index/vaultIndex.js';

const COMPILERS = {
  'deterministic-stub': compileDeterministic,
};

const DEFAULT_OPTS = {
  compiler: 'deterministic-stub',
  now: () => new Date().toISOString(),
  minSources: 1,
  wikiConfidenceThreshold: 0.7,
  includeTypes: ['raw'],
};

const BLOCKING_CODES = new Set(['canonical-collision-handauthored']);

function isBlockingCode(code) {
  return BLOCKING_CODES.has(code);
}

function normalizeKey(value) {
  return String(value || '').trim().toLowerCase();
}

function resolveSeed(seed, index) {
  if (seed && typeof seed === 'object' && seed.id != null) {
    return index.byId?.get(seed.id) || seed;
  }
  if (typeof seed === 'string') {
    if (index.byId?.has(seed)) return index.byId.get(seed);
    const key = normalizeKey(seed);
    const canonicalIds =
      index.canonicalToIds?.get(seed) || index.canonicalToIds?.get(key);
    if (canonicalIds && canonicalIds.length) {
      return index.byId.get(canonicalIds[0]) || null;
    }
    const lookupId = index.lookup?.get(key);
    if (lookupId) return index.byId.get(lookupId) || null;
  }
  return null;
}

function selectSources(seedEntry, index, options) {
  const ids = new Set();

  // getCluster returns array of entry objects.
  const clusterEntries = getCluster(index, seedEntry.id) || [];
  for (const e of clusterEntries) {
    if (e && e.id != null) ids.add(e.id);
  }

  // Add canonical_key siblings.
  if (seedEntry.canonical_key) {
    const key = normalizeKey(seedEntry.canonical_key);
    const siblings =
      index.canonicalToIds?.get(seedEntry.canonical_key) ||
      index.canonicalToIds?.get(key) ||
      [];
    for (const id of siblings) ids.add(id);
  }

  // Always include the seed itself for downstream filter.
  ids.add(seedEntry.id);

  const includeTypes = new Set(options.includeTypes || []);
  const entries = [];
  for (const id of ids) {
    const e = index.byId?.get(id) || (id === seedEntry.id ? seedEntry : null);
    if (!e) continue;
    if (!includeTypes.has(e.type)) continue;
    entries.push(e);
  }

  // Stable sort: created ASC, id ASC.
  entries.sort((a, b) => {
    const aCreated = a.created || a.valid_from || '';
    const bCreated = b.created || b.valid_from || '';
    if (aCreated !== bCreated) return aCreated < bCreated ? -1 : 1;
    const aId = String(a.id);
    const bId = String(b.id);
    if (aId === bId) return 0;
    return aId < bId ? -1 : 1;
  });

  return entries;
}

function checkHandAuthoredCollision(seedEntry, index) {
  if (!seedEntry.canonical_key) return null;
  const key = normalizeKey(seedEntry.canonical_key);
  const ids =
    index.canonicalToIds?.get(seedEntry.canonical_key) ||
    index.canonicalToIds?.get(key) ||
    [];
  for (const id of ids) {
    if (id === seedEntry.id) continue;
    const e = index.byId?.get(id);
    if (!e) continue;
    if (e.type === 'wiki') {
      return {
        code: 'canonical-collision-handauthored',
        message: `canonical_key "${seedEntry.canonical_key}" already owned by hand-authored wiki entry`,
        sourceIds: [e.id],
      };
    }
  }
  return null;
}

export function compile(seed, index, opts = {}) {
  const options = { ...DEFAULT_OPTS, ...opts };

  const seedEntry = resolveSeed(seed, index);
  if (!seedEntry) {
    throw new Error(`compile: cannot resolve seed: ${JSON.stringify(seed)}`);
  }

  const sources = selectSources(seedEntry, index, options);
  if (sources.length === 0) {
    throw new Error('compile: no sources selected (seed type may be excluded by includeTypes)');
  }

  const compilerFn = COMPILERS[options.compiler];
  if (!compilerFn) {
    throw new Error(`compile: unknown compiler ${options.compiler}`);
  }
  const stubOut = compilerFn(sources, options);

  const blockingFromStub = (stubOut.warnings || []).filter(w => isBlockingCode(w.code));
  let emitted =
    sources.length >= options.minSources &&
    stubOut.confidence >= options.wikiConfidenceThreshold &&
    blockingFromStub.length === 0
      ? 'wiki'
      : 'review';

  const collisionWarning = checkHandAuthoredCollision(seedEntry, index);
  const allWarnings = collisionWarning
    ? [...(stubOut.warnings || []), collisionWarning]
    : (stubOut.warnings || []);

  if (collisionWarning) emitted = 'review';

  const sourcesWithHash = sources.map(s => ({
    id: s.id,
    hash: hashSourceEntry(s),
    title: s.title,
    type: s.type,
  }));
  const sourceHash = compositeSourceHash(sourcesWithHash);

  const entryFrontmatter = {
    ...stubOut.frontmatter,
    type: emitted,
  };
  const compiledHash = hashCompiledArtifact({
    body: stubOut.body,
    frontmatter: entryFrontmatter,
  });

  return {
    entry: {
      ...entryFrontmatter,
      notes: stubOut.body,
    },
    sources: sourcesWithHash,
    sourceHash,
    compiledHash,
    confidence: stubOut.confidence,
    warnings: allWarnings,
    emitted,
    compiler: { name: options.compiler, version: '0.1' },
  };
}
