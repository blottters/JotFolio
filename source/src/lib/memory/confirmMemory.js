/**
 * confirmMemory — pure orchestrator for confirming a wiki/review memory entry.
 *
 * Karpathy Phase 5 §Actions §Confirm memory.
 *
 * Returns the updated entry plus a flag describing whether a review entry
 * graduated to wiki. Does NOT save anywhere; the caller is responsible for
 * persistence + downstream side effects (e.g. invoking graduateTied).
 *
 * Behavior contract:
 *  - Throws `Error('not a memory')` if `entry.type` is not in {wiki, review}.
 *  - Sets `review_status = 'confirmed'`.
 *  - Sets `valid_from` to `opts.now()` if provided, otherwise `new Date().toISOString()`.
 *  - For review entries with confidence < 0.7, bumps confidence up to 0.7.
 *  - If after the bump a review entry has `confidence >= 0.7`, graduates it
 *    by setting `type = 'wiki'`. Returns `graduatedToWiki: true` in that case.
 *  - Wiki entries: never change type. Confidence is left untouched.
 *  - Idempotent: confirming the same entry twice with the same `now` yields
 *    structurally identical output.
 *
 * @param {object} entry  The memory entry being confirmed.
 * @param {object} [opts]
 * @param {() => string} [opts.now]  Custom clock returning an ISO timestamp.
 * @returns {{ updatedEntry: object, graduatedToWiki: boolean }}
 */
export function confirmMemory(entry, opts = {}) {
  if (!entry || (entry.type !== 'wiki' && entry.type !== 'review')) {
    throw new Error('not a memory');
  }

  const now = typeof opts.now === 'function'
    ? opts.now()
    : new Date().toISOString();

  const wasReview = entry.type === 'review';
  const baseConfidence = typeof entry.confidence === 'number' ? entry.confidence : 0;
  const bumpedConfidence = wasReview && baseConfidence < 0.7 ? 0.7 : baseConfidence;

  const updatedEntry = {
    ...entry,
    review_status: 'confirmed',
    valid_from: now,
    confidence: bumpedConfidence,
  };

  let graduatedToWiki = false;
  if (wasReview && bumpedConfidence >= 0.7) {
    updatedEntry.type = 'wiki';
    graduatedToWiki = true;
  }

  return { updatedEntry, graduatedToWiki };
}
