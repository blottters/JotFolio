// Cosine similarity over L2-normalized vectors collapses to a dot product.
// All embeddings produced by `embed.js` are pre-normalized, so callers can
// rely on this shortcut without re-normalizing every time.

export function cosineSimilarity(a, b) {
  if (!a || !b) return 0;
  const len = Math.min(a.length, b.length);
  let dot = 0;
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  // Clamp tiny FP drift so callers can use a clean [0,1] (or [-1,1]) range.
  if (dot > 1) return 1;
  if (dot < -1) return -1;
  return dot;
}

// candidateMap: Map<id, Float32Array> | Record<id, Float32Array>
// Returns array sorted DESC by score, length <= k, excluding null/empty
// candidates. The target vector's own id (if present in the map) is NOT
// auto-filtered — caller passes a filtered map or an excludeId option.
export function findTopK(targetVec, candidateMap, k = 10, options = {}) {
  if (!targetVec || !candidateMap) return [];
  const excludeId = options.excludeId == null ? null : String(options.excludeId);
  const minScore = typeof options.minScore === 'number' ? options.minScore : -Infinity;
  const entries = candidateMap instanceof Map
    ? candidateMap.entries()
    : Object.entries(candidateMap);
  const scored = [];
  for (const [id, vec] of entries) {
    if (excludeId !== null && String(id) === excludeId) continue;
    if (!vec) continue;
    const score = cosineSimilarity(targetVec, vec);
    if (score < minScore) continue;
    scored.push({ id, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, Math.max(0, k));
}
