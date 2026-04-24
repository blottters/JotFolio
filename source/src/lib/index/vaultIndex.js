const WIKI_LINK_RE = /\[\[([^\[\]\n]{1,120})\]\]/g;

function normalizeLookupKey(value) {
  return String(value || '').trim().toLowerCase();
}

function uniqueStrings(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function entryText(entry) {
  return `${entry?.title || ''}\n${entry?.notes || ''}`.toLowerCase();
}

function scoreSearchResult(entry, query) {
  const normalized = normalizeLookupKey(query);
  if (!normalized) return 0;
  const title = normalizeLookupKey(entry?.title);
  const aliases = uniqueStrings(entry?.aliases).map(normalizeLookupKey);
  const keywords = uniqueStrings(entry?.retrieval_keywords).map(normalizeLookupKey);
  const canonical = normalizeLookupKey(entry?.canonical_key);
  const body = entryText(entry);
  if (title === normalized || aliases.includes(normalized) || canonical === normalized) return 1000;
  if (keywords.includes(normalized)) return 900;
  if (title.includes(normalized)) return 700;
  if (aliases.some(alias => alias.includes(normalized))) return 650;
  if (canonical.includes(normalized)) return 625;
  if (body.includes(normalized)) return 400;
  return 0;
}

function affinityScore(a, b, backlinkSet) {
  const aTags = new Set(a?.tags || []);
  const bTags = new Set(b?.tags || []);
  let tagOverlap = 0;
  for (const tag of aTags) {
    if (bTags.has(tag)) tagOverlap++;
  }
  const union = aTags.size + bTags.size - tagOverlap;
  const tagJaccard = union ? tagOverlap / union : 0;
  const linked = (a?.links || []).includes(b.id) || (b?.links || []).includes(a.id) ? 1 : 0;
  const sameType = a?.type === b?.type ? 1 : 0;
  const sameStatus = a?.status && b?.status && a.status === b.status ? 1 : 0;
  const sameCanonical = a?.canonical_key && b?.canonical_key && a.canonical_key === b.canonical_key ? 1 : 0;
  const backlinks = backlinkSet?.has(b.id) ? 1 : 0;
  return (tagJaccard * 0.38) + (linked * 0.2) + (sameType * 0.12) + (sameStatus * 0.08) + (sameCanonical * 0.14) + (backlinks * 0.08);
}

export function createLookupMaps(entries) {
  const byId = new Map();
  const lookup = new Map();
  const duplicates = { aliases: [], canonical: [] };
  const canonicalToIds = new Map();
  entries.forEach(entry => {
    byId.set(entry.id, entry);
    const titleKey = normalizeLookupKey(entry.title);
    if (titleKey && !lookup.has(titleKey)) lookup.set(titleKey, entry.id);
    uniqueStrings(entry.aliases).forEach(alias => {
      const key = normalizeLookupKey(alias);
      if (!key) return;
      if (!lookup.has(key)) lookup.set(key, entry.id);
      else if (lookup.get(key) !== entry.id) duplicates.aliases.push({ key, ids: [lookup.get(key), entry.id] });
    });
    const canonicalKey = normalizeLookupKey(entry.canonical_key);
    if (canonicalKey) {
      const ids = canonicalToIds.get(canonicalKey) || [];
      ids.push(entry.id);
      canonicalToIds.set(canonicalKey, ids);
      if (!lookup.has(canonicalKey)) lookup.set(canonicalKey, entry.id);
    }
  });
  canonicalToIds.forEach((ids, key) => {
    if (ids.length > 1) duplicates.canonical.push({ key, ids });
  });
  return { byId, lookup, duplicates, canonicalToIds };
}

export function resolveEntryLinks(entries, lookupMaps = createLookupMaps(entries)) {
  return entries.map(entry => {
    const manual = Array.isArray(entry?.links) ? [...entry.links] : [];
    const found = [];
    const seen = new Set(manual);
    String(entry?.notes || '').replace(WIKI_LINK_RE, (_, raw) => {
      const resolvedId = lookupMaps.lookup.get(normalizeLookupKey(raw));
      if (resolvedId && resolvedId !== entry.id && !seen.has(resolvedId)) {
        seen.add(resolvedId);
        found.push(resolvedId);
      }
      return '';
    });
    return { ...entry, links: [...manual, ...found] };
  });
}

export function buildVaultIndex(entries, { includeHidden = true } = {}) {
  const filtered = includeHidden ? [...(entries || [])] : (entries || []).filter(entry => !['raw', 'wiki', 'review'].includes(entry?.type));
  const lookupMaps = createLookupMaps(filtered);
  const resolvedEntries = resolveEntryLinks(filtered, lookupMaps);
  const resolvedById = new Map(resolvedEntries.map(entry => [entry.id, entry]));
  const backlinks = new Map();
  const adjacency = new Map();
  const typeBuckets = new Map();

  resolvedEntries.forEach(entry => {
    adjacency.set(entry.id, new Set());
    if (!typeBuckets.has(entry.type)) typeBuckets.set(entry.type, []);
    typeBuckets.get(entry.type).push(entry.id);
  });

  resolvedEntries.forEach(entry => {
    (entry.links || []).forEach(targetId => {
      if (!resolvedById.has(targetId)) return;
      adjacency.get(entry.id)?.add(targetId);
      adjacency.get(targetId)?.add(entry.id);
      if (!backlinks.has(targetId)) backlinks.set(targetId, new Set());
      backlinks.get(targetId).add(entry.id);
    });
  });

  const components = [];
  const componentById = new Map();
  const seen = new Set();
  resolvedEntries.forEach(entry => {
    if (seen.has(entry.id)) return;
    const queue = [entry.id];
    const component = [];
    while (queue.length) {
      const current = queue.shift();
      if (seen.has(current)) continue;
      seen.add(current);
      component.push(current);
      componentById.set(current, components.length);
      (adjacency.get(current) || new Set()).forEach(next => {
        if (!seen.has(next)) queue.push(next);
      });
    }
    components.push(component);
  });

  return {
    entries: resolvedEntries,
    byId: resolvedById,
    lookup: lookupMaps.lookup,
    backlinks,
    adjacency,
    components,
    componentById,
    canonicalToIds: lookupMaps.canonicalToIds,
    duplicates: lookupMaps.duplicates,
    typeBuckets,
  };
}

export function getBacklinks(index, id) {
  return [...(index?.backlinks?.get(id) || new Set())].map(linkId => index.byId.get(linkId)).filter(Boolean);
}

export function getNeighbors(index, id, depth = 1) {
  if (!index?.byId?.has(id)) return [];
  const maxDepth = Math.max(1, depth | 0);
  const seen = new Set([id]);
  const queue = [{ id, depth: 0 }];
  const results = [];
  while (queue.length) {
    const current = queue.shift();
    if (current.depth === maxDepth) continue;
    (index.adjacency.get(current.id) || new Set()).forEach(next => {
      if (seen.has(next)) return;
      seen.add(next);
      results.push(index.byId.get(next));
      queue.push({ id: next, depth: current.depth + 1 });
    });
  }
  return results.filter(Boolean);
}

export function getCluster(index, id) {
  const componentIdx = index?.componentById?.get(id);
  if (componentIdx == null) return [];
  return (index.components[componentIdx] || []).map(entryId => index.byId.get(entryId)).filter(Boolean);
}

export function searchWiki(index, query) {
  const ids = index?.typeBuckets?.get('wiki') || [];
  return ids
    .map(id => index.byId.get(id))
    .map(entry => ({ entry, score: scoreSearchResult(entry, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(result => result.entry);
}

export function searchRaw(index, query) {
  const ids = index?.typeBuckets?.get('raw') || [];
  return ids
    .map(id => index.byId.get(id))
    .map(entry => ({ entry, score: scoreSearchResult(entry, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .map(result => result.entry);
}

export function getAffinityMatches(index, input, { limit = 10 } = {}) {
  if (!index) return [];
  const seed = typeof input === 'string' ? (index.byId.get(input) || searchWiki(index, input)[0] || searchRaw(index, input)[0] || null) : input;
  if (!seed?.id || !index.byId.has(seed.id)) return [];
  const backlinkSet = new Set(getBacklinks(index, seed.id).map(entry => entry.id));
  return index.entries
    .filter(entry => entry.id !== seed.id)
    .map(entry => ({ entry, score: affinityScore(seed, entry, backlinkSet) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title))
    .slice(0, limit)
    .map(result => result.entry);
}

export function getMemoryHealth(index) {
  const entries = index?.entries || [];
  return {
    duplicateCanonicalKeys: index?.duplicates?.canonical || [],
    duplicateAliases: index?.duplicates?.aliases || [],
    orphanedRaw: entries.filter(entry => entry.type === 'raw' && (entry.links || []).length === 0).map(entry => entry.id),
    staleWiki: entries.filter(entry => entry.type === 'wiki' && ['stale', 'superseded'].includes(entry.status)).map(entry => entry.id),
    hiddenGraphIslands: (index?.components || []).filter(component => component.length === 1)
      .map(component => component[0])
      .filter(id => ['raw', 'wiki', 'review'].includes(index.byId.get(id)?.type)),
  };
}
