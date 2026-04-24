export const DEFAULT_FEATURE_FLAGS = Object.freeze({
  wiki_mode: false,
  raw_inbox: false,
  review_queue: false,
  context_packs: false,
  memory_graph_nodes: false,
});

export function normalizeFeatureFlags(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    wiki_mode: source.wiki_mode === true,
    raw_inbox: source.raw_inbox === true,
    review_queue: source.review_queue === true,
    context_packs: source.context_packs === true,
    memory_graph_nodes: source.memory_graph_nodes === true,
  };
}

export function shouldShowEntryType(type, flags) {
  const resolved = normalizeFeatureFlags(flags);
  if (type === 'raw') return resolved.raw_inbox;
  if (type === 'wiki') return resolved.wiki_mode;
  if (type === 'review') return resolved.review_queue;
  return true;
}

export function filterEntriesForUI(entries, flags) {
  return (entries || []).filter(entry => shouldShowEntryType(entry?.type, flags));
}
