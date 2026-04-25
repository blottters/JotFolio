// canvasTypes — shape definitions + helpers for SlateVault Canvases.
//
// A "Canvas" is a 2D spatial workspace of nodes (text cards, file
// references, media embeds) and edges (relationships between nodes).
// It lives on disk as `canvases/<id>.canvas.json` so users can version
// and share them outside the app.
//
// JSON shape (CanvasFile):
//   {
//     version: 1,
//     id: "<stable id>",
//     name: "Display name",
//     nodes: [
//       { id:"n1", type:"text",  x,y,width,height, text }
//       { id:"n2", type:"file",  x,y,width,height, file:"<entryId>" }
//       { id:"n3", type:"media", x,y,width,height, file:"path/to/image.png" }
//     ],
//     edges: [
//       { id:"e1", fromNode:"n1", toNode:"n2", label?:"…" }
//     ]
//   }
//
// Design notes:
//  - File-typed nodes reference entries by id, NEVER by content. Titles
//    rename; ids are stable. Persisting the title in the canvas file
//    would create a stale-data problem the moment a user renames an
//    entry from the DetailPanel.
//  - Unknown node types are preserved on load (with a `_warning` field)
//    so a future plugin shipping a new node type doesn't lose data when
//    opened by an older client.
//  - Coordinates are clamped on load to defend against hand-edits or
//    corrupted exports.

export const CANVAS_FILE_VERSION = 1;
export const CANVAS_FILE_EXT = '.canvas.json';
export const CANVAS_DIR = 'canvases';

export const NODE_TYPES = ['text', 'file', 'media'];
export const KNOWN_NODE_TYPES = new Set(NODE_TYPES);

// Coordinate sanity bounds. Canvases are basically infinite to the user,
// but we clamp to a fixed range on load so a corrupted export with
// `x: 1e308` doesn't blow up the SVG.
const COORD_MIN = -100000;
const COORD_MAX = 100000;
const SIZE_MIN = 40;
const SIZE_MAX = 5000;

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 140;

function clampNum(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (n < min) return min;
  if (n > max) return max;
  return n;
}

/**
 * Make a stable canvas id from a name. Same algorithm as base ids:
 * slug + short timestamp shard so two same-named canvases don't collide.
 *
 * @param {string} name
 * @returns {string}
 */
export function makeCanvasId(name) {
  const slug = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'canvas';
  const shard = Math.floor(Date.now() % 1e6).toString(36);
  return `${slug}-${shard}`;
}

/**
 * Build a fresh canvas with sensible defaults (empty nodes/edges).
 *
 * @param {{name?: string, id?: string}} [opts]
 * @returns {object} canonical CanvasFile shape
 */
export function createEmptyCanvas(opts = {}) {
  const name = (opts.name || 'Untitled Canvas').trim() || 'Untitled Canvas';
  const id = opts.id || makeCanvasId(name);
  return {
    version: CANVAS_FILE_VERSION,
    id,
    name,
    nodes: [],
    edges: [],
  };
}

/**
 * Path within the vault where a canvas file lives.
 * @param {string} id
 * @returns {string}
 */
export function canvasPath(id) {
  return `${CANVAS_DIR}/${id}${CANVAS_FILE_EXT}`;
}

function normalizeNode(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  if (!id) return null;
  const x = clampNum(raw.x, COORD_MIN, COORD_MAX, 0);
  const y = clampNum(raw.y, COORD_MIN, COORD_MAX, 0);
  const width = clampNum(raw.width, SIZE_MIN, SIZE_MAX, DEFAULT_NODE_WIDTH);
  const height = clampNum(raw.height, SIZE_MIN, SIZE_MAX, DEFAULT_NODE_HEIGHT);
  const type = typeof raw.type === 'string' ? raw.type : 'text';
  const base = { id, type, x, y, width, height };
  if (type === 'text') {
    base.text = typeof raw.text === 'string' ? raw.text : '';
    return base;
  }
  if (type === 'file') {
    base.file = typeof raw.file === 'string' ? raw.file : '';
    return base;
  }
  if (type === 'media') {
    base.file = typeof raw.file === 'string' ? raw.file : '';
    return base;
  }
  // Unknown type: preserve everything we can, mark with a warning so
  // downstream UI can render a placeholder instead of crashing.
  return {
    ...raw,
    id,
    x,
    y,
    width,
    height,
    type,
    _warning: `Unknown node type "${type}"; preserved as-is.`,
  };
}

function normalizeEdge(raw, nodeIds) {
  if (!raw || typeof raw !== 'object') return null;
  const id = typeof raw.id === 'string' && raw.id ? raw.id : null;
  if (!id) return null;
  const fromNode = typeof raw.fromNode === 'string' ? raw.fromNode : null;
  const toNode = typeof raw.toNode === 'string' ? raw.toNode : null;
  if (!fromNode || !toNode) return null;
  // Drop edges that reference nodes that no longer exist. A canvas with
  // dangling edges is harder to render than one missing the edge entirely.
  if (!nodeIds.has(fromNode) || !nodeIds.has(toNode)) return null;
  const out = { id, fromNode, toNode };
  if (typeof raw.label === 'string' && raw.label) out.label = raw.label;
  return out;
}

/**
 * Defensive normalizer. Coerces any parsed JSON blob (or random object)
 * into a valid canonical CanvasFile. Never throws — even on garbage
 * input it returns an empty-but-valid canvas.
 *
 * @param {*} raw
 * @returns {object}
 */
export function normalizeCanvas(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyCanvas();
  }
  const id = typeof raw.id === 'string' && raw.id ? raw.id : makeCanvasId(raw.name || 'canvas');
  const name = typeof raw.name === 'string' && raw.name ? raw.name : 'Untitled Canvas';
  const version = typeof raw.version === 'number' ? raw.version : CANVAS_FILE_VERSION;
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const nodes = [];
  const seenNodeIds = new Set();
  for (const r of rawNodes) {
    const n = normalizeNode(r);
    if (!n) continue;
    if (seenNodeIds.has(n.id)) continue; // de-dup by id
    seenNodeIds.add(n.id);
    nodes.push(n);
  }
  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
  const edges = [];
  const seenEdgeIds = new Set();
  for (const r of rawEdges) {
    const e = normalizeEdge(r, seenNodeIds);
    if (!e) continue;
    if (seenEdgeIds.has(e.id)) continue;
    seenEdgeIds.add(e.id);
    edges.push(e);
  }
  return { version, id, name, nodes, edges };
}

/**
 * Strip runtime-only fields and produce the JSON-safe object that gets
 * written to disk. Currently no runtime-only fields exist; this is the
 * place to drop selection state, transient hover flags, etc. when they
 * arrive.
 *
 * @param {object} canvas
 * @returns {object}
 */
export function serializeCanvas(canvas) {
  const norm = normalizeCanvas(canvas);
  return {
    version: norm.version,
    id: norm.id,
    name: norm.name,
    nodes: norm.nodes.map(n => {
      // Preserve unknown-type nodes verbatim minus the runtime warning.
      if (!KNOWN_NODE_TYPES.has(n.type)) {
        const out = { ...n };
        delete out._warning;
        return out;
      }
      const base = { id: n.id, type: n.type, x: n.x, y: n.y, width: n.width, height: n.height };
      if (n.type === 'text') base.text = n.text || '';
      else base.file = n.file || '';
      return base;
    }),
    edges: norm.edges.map(e => {
      const out = { id: e.id, fromNode: e.fromNode, toNode: e.toNode };
      if (e.label) out.label = e.label;
      return out;
    }),
  };
}

/**
 * Allocate the next free node id like `n7`. Walks existing ids and picks
 * `n` + (max numeric suffix + 1). Falls back to a random id if the
 * existing pool already uses non-numeric custom ids.
 *
 * @param {object} canvas
 * @returns {string}
 */
export function nextNodeId(canvas) {
  return nextSequentialId(canvas?.nodes || [], 'n');
}

/**
 * Allocate the next free edge id like `e3`.
 *
 * @param {object} canvas
 * @returns {string}
 */
export function nextEdgeId(canvas) {
  return nextSequentialId(canvas?.edges || [], 'e');
}

function nextSequentialId(items, prefix) {
  let max = 0;
  for (const it of items) {
    const m = typeof it?.id === 'string' && it.id.match(new RegExp(`^${prefix}(\\d+)$`));
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return `${prefix}${max + 1}`;
}
