// useSemanticIndex — kicks off a background semantic embedding build for the
// loaded vault, exposes the index (Map<entryId, Float32Array>), and provides
// `getSimilar(id, k)` + `reembed(entry)` helpers for callers (Constellation
// edges, DetailPanel similar-notes, AddModal tag suggestions, etc.)
//
// Charter: the model runs locally via WASM. Nothing in here makes a network
// call.

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const DEFAULT_STATE = { ready: false, building: false, done: 0, total: 0, error: null };
let semanticModulePromise = null;

function loadSemanticModule() {
  if (!semanticModulePromise) {
    semanticModulePromise = import('../semantic/index.js');
    semanticModulePromise.catch(() => { semanticModulePromise = null; });
  }
  return semanticModulePromise;
}

export function useSemanticIndex(entries, vaultAdapter, options = {}) {
  const enabled = options.enabled !== false;
  const [progress, setProgress] = useState(DEFAULT_STATE);
  const indexRef = useRef(new Map());
  const semanticApiRef = useRef(null);
  const buildIdRef = useRef(0);
  const abortRef = useRef(null);
  // Bump this when the index is mutated so memoized consumers re-derive.
  const [tick, setTick] = useState(0);
  const bump = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort?.();
      abortRef.current = null;
      if (indexRef.current.size > 0) {
        indexRef.current = new Map();
        bump();
      }
      setProgress(DEFAULT_STATE);
      return undefined;
    }
    if (!Array.isArray(entries) || entries.length === 0) return undefined;

    const id = ++buildIdRef.current;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    abortRef.current = controller;
    setProgress({ ready: false, building: true, done: 0, total: entries.length, error: null });

    (async () => {
      try {
        const semanticApi = await loadSemanticModule();
        if (controller?.signal?.aborted || buildIdRef.current !== id) return;
        semanticApiRef.current = semanticApi;
        const next = await semanticApi.buildSemanticIndex(entries, {
          vaultAdapter,
          signal: controller?.signal,
          onProgress: ({ done, total }) => {
            if (buildIdRef.current !== id) return;
            setProgress(p => ({ ...p, done, total }));
          },
        });
        if (buildIdRef.current !== id) return;
        indexRef.current = next;
        bump();
        setProgress({ ready: true, building: false, done: next.size, total: entries.length, error: null });
      } catch (err) {
        if (buildIdRef.current !== id) return;
        // eslint-disable-next-line no-console
        console.error('[useSemanticIndex] build failed', err);
        setProgress({ ready: false, building: false, done: 0, total: entries.length, error: err });
      }
    })();

    return () => {
      if (controller) controller.abort();
    };
    // We intentionally depend on length + a stable identity sketch instead of
    // the entries array itself; otherwise every keystroke during edit would
    // re-trigger a 200-entry rebuild. Per-entry updates go through `reembed`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, entries?.length, vaultAdapter, bump]);

  const getSimilar = useCallback((entryId, k = 5, opts = {}) => {
    if (!enabled || !semanticApiRef.current?.getSimilarEntries) return [];
    return semanticApiRef.current.getSimilarEntries(indexRef.current, entryId, k, opts);
  }, [enabled, tick]);

  const reembed = useCallback(async (entry) => {
    if (!enabled || !entry?.id) return null;
    const semanticApi = semanticApiRef.current || await loadSemanticModule();
    semanticApiRef.current = semanticApi;
    const vec = await semanticApi.reembedEntry(indexRef.current, entry, { vaultAdapter });
    bump();
    return vec;
  }, [enabled, vaultAdapter, bump]);

  // Snapshot for memoized consumers that want a stable reference to "the
  // current index version." Recomputed only when `tick` changes (i.e. after
  // build completes or an entry is re-embedded), not on every render.
  const snapshot = useMemo(() => ({
    index: indexRef.current,
    size: indexRef.current.size,
    version: tick,
  }), [tick]);

  return { ...progress, getSimilar, reembed, snapshot };
}
