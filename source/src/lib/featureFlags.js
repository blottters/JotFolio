export const DEFAULT_FEATURE_FLAGS = Object.freeze({
  // Karpathy LLM Wiki entry types — visible by default starting alpha.18.
  // Phase 4 compile pipeline + Phase 5 surfaces shipped in alpha.17 dark;
  // alpha.18 ships the compile button so flipping these on is honest.
  wiki_mode: true,
  raw_inbox: true,
  review_queue: true,
  // Future phases — keep dark until built.
  context_packs: false,
  memory_graph_nodes: false,
  // Phase 2 MiniLM: dashed semantic edges between similar notes in
  // Constellation. On by default — user explicitly asked for it on import.
  semanticEdges: true,
});

export function normalizeFeatureFlags(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    // alpha.18: on by default. Saved `false` is respected (user opt-out);
    // missing/null/true all resolve to true (matches DEFAULT_FEATURE_FLAGS).
    wiki_mode: source.wiki_mode !== false,
    raw_inbox: source.raw_inbox !== false,
    review_queue: source.review_queue !== false,
    // Still-dark phases — strict opt-in.
    context_packs: source.context_packs === true,
    memory_graph_nodes: source.memory_graph_nodes === true,
    // alpha.25: Phase 2 MiniLM semantic edges. Default on; user opt-out
    // respected the same way wiki/raw flags work.
    semanticEdges: source.semanticEdges !== false,
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
