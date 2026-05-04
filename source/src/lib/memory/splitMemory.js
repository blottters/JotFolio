/**
 * splitMemory — pure orchestrator that splits one memory into multiple
 * children by re-running `compile()` over disjoint source subsets.
 *
 * Karpathy Phase 5 §Actions §Split into smaller memories.
 *
 * Each split is `{ title, sourceIds: string[] }`. For each, we call
 * `compile(sourceIds[0], index, compileOpts)`, then post-process the
 * result so that:
 *   - the child's title is overridden to `split.title`
 *   - the child's `supersedes` becomes `[original.id]`
 *   - the returned `sources` array is filtered to only the ids in
 *     `split.sourceIds` (the spec mentions a `sourceFilter` option;
 *     we apply post-filter here for simplicity).
 *
 * Returns:
 *   - `children`: an array of CompileResult-shaped objects (no ids — caller
 *     mints them when persisting).
 *   - `supersedingOriginal`: shallow clone of `original` with
 *     `superseded_by` populated. Note: `superseded_by` is a placeholder list
 *     populated with sentinel entries `{ index: i }` because final ids are
 *     assigned by the caller. The caller is expected to map the indexes to
 *     the ids it generated when persisting children. If `splits` is empty
 *     this falls through and `superseded_by` is `[]` (original unchanged).
 *
 * Pure: no I/O, no async, no id generation, no saving.
 *
 * @param {object} args
 * @param {object} args.original  The memory being split.
 * @param {Array<{title: string, sourceIds: string[]}>} args.splits
 * @param {object} args.index     Pre-built vault index (Phase 3).
 * @param {Function} args.compile The compile() function (injected for testability;
 *                                 defaults to the real Phase 4 compile if absent).
 * @param {object} [args.compileOpts]  Passed verbatim to compile().
 * @returns {{ children: object[], supersedingOriginal: object }}
 */
export function splitMemory({ original, splits, index, compile, compileOpts = {} }) {
  if (!original || typeof original !== 'object') {
    throw new Error('splitMemory: original entry required');
  }
  if (!Array.isArray(splits)) {
    throw new Error('splitMemory: splits must be an array');
  }
  if (typeof compile !== 'function') {
    throw new Error('splitMemory: compile function must be injected');
  }

  if (splits.length === 0) {
    return {
      children: [],
      supersedingOriginal: { ...original, superseded_by: [] },
    };
  }

  const children = [];
  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];
    if (!split || !Array.isArray(split.sourceIds) || split.sourceIds.length === 0) {
      throw new Error(`splitMemory: split[${i}] requires non-empty sourceIds`);
    }

    const result = compile(split.sourceIds[0], index, {
      ...compileOpts,
      includeTypes: compileOpts.includeTypes || ['raw'],
    });

    const allowed = new Set(split.sourceIds);
    const filteredSources = (result.sources || []).filter(s => allowed.has(s.id));

    const childEntry = {
      ...result.entry,
      title: split.title,
      supersedes: [original.id],
    };

    children.push({
      ...result,
      entry: childEntry,
      sources: filteredSources,
    });
  }

  // Caller resolves index -> real ids when persisting; we expose indexes as
  // sentinels so the linkage is unambiguous.
  const superseded_by = children.map((_, i) => ({ index: i }));

  return {
    children,
    supersedingOriginal: { ...original, superseded_by },
  };
}
