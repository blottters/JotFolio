// Bundle envelope for SlateVault Phase 10 export/import.
//
// Two on-disk shapes are accepted by parseBundle:
//   1. Legacy: a bare JSON array of entries (`[{...entry}, ...]`)
//   2. Envelope: `{ version, kind, exportedAt, entries, bases, canvases }`
//
// buildBundle always emits the envelope form so future round-trips preserve
// every artifact in the vault, not just Markdown notes.

export const BUNDLE_VERSION = 2;
export const BUNDLE_KIND = 'jotfolio-bundle';

// Canvas constants are duplicated here (and not imported from canvasTypes.js)
// because the canvas module is being introduced in a parallel branch. When
// it lands, this file can re-export from there without changing the public
// API surface.
export const CANVAS_DIR = 'canvases';
export const CANVAS_FILE_EXT = '.canvas.json';

/**
 * Lightweight check that a parsed object looks like a Canvas file.
 * Required: numeric `version`, string `id`, arrays `nodes` and `edges`.
 */
export function validateCanvas(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (typeof parsed.version !== 'number') return false;
  if (typeof parsed.id !== 'string' || !parsed.id) return false;
  if (!Array.isArray(parsed.nodes)) return false;
  if (!Array.isArray(parsed.edges)) return false;
  return true;
}

/**
 * Lightweight check that a parsed object looks like a Base file.
 * Required: string `id` and array `views`.
 */
export function validateBase(parsed) {
  if (!parsed || typeof parsed !== 'object') return false;
  if (typeof parsed.id !== 'string' || !parsed.id) return false;
  if (!Array.isArray(parsed.views)) return false;
  return true;
}

/**
 * Build a serializable bundle envelope. Missing inputs default to empty
 * arrays, so callers can omit any combination of {entries, bases, canvases}.
 */
export function buildBundle({ entries, bases, canvases } = {}) {
  return {
    version: BUNDLE_VERSION,
    kind: BUNDLE_KIND,
    exportedAt: new Date().toISOString(),
    entries: Array.isArray(entries) ? entries : [],
    bases: Array.isArray(bases) ? bases : [],
    canvases: Array.isArray(canvases) ? canvases : [],
  };
}

/**
 * Parse either a legacy array or a bundle envelope into a uniform shape.
 * Never throws on missing/extra keys. Malformed bases/canvases entries
 * are filtered out via the lightweight validators above.
 *
 * @returns {{ entries: Array, bases: Array, canvases: Array }}
 */
export function parseBundle(parsed) {
  if (Array.isArray(parsed)) {
    return { entries: parsed, bases: [], canvases: [] };
  }
  if (!parsed || typeof parsed !== 'object' || parsed.kind !== BUNDLE_KIND) {
    return { entries: [], bases: [], canvases: [] };
  }
  const entries = Array.isArray(parsed.entries) ? parsed.entries : [];
  const bases = Array.isArray(parsed.bases) ? parsed.bases.filter(validateBase) : [];
  const canvases = Array.isArray(parsed.canvases) ? parsed.canvases.filter(validateCanvas) : [];
  return { entries, bases, canvases };
}
