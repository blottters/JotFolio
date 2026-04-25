// canvasOps — pure functions that produce a new canvas from an old one.
//
// Every op returns a fresh top-level object so React state setters see a
// reference change. Inner arrays/objects are shallow-copied as needed.
// No op mutates its input. No op throws on missing ids — operations on a
// missing target are no-ops, returning the input canvas reference
// unchanged so callers can avoid superfluous re-renders.

import { normalizeCanvas, nextNodeId, nextEdgeId } from './canvasTypes.js';

const DEFAULT_WIDTH = 220;
const DEFAULT_HEIGHT = 140;

/**
 * Add a node to the canvas. `partial` may omit id / x / y / width /
 * height — defaults will be filled in. Type defaults to "text".
 *
 * @param {object} canvas
 * @param {object} partial
 * @returns {object}
 */
export function addNode(canvas, partial = {}) {
  const c = normalizeCanvas(canvas);
  const id = partial.id || nextNodeId(c);
  const type = partial.type || 'text';
  const node = {
    id,
    type,
    x: typeof partial.x === 'number' ? partial.x : 0,
    y: typeof partial.y === 'number' ? partial.y : 0,
    width: typeof partial.width === 'number' ? partial.width : DEFAULT_WIDTH,
    height: typeof partial.height === 'number' ? partial.height : DEFAULT_HEIGHT,
  };
  if (type === 'text') {
    node.text = typeof partial.text === 'string' ? partial.text : '';
  } else if (type === 'file' || type === 'media') {
    node.file = typeof partial.file === 'string' ? partial.file : '';
  } else {
    // Pass-through for unknown types — preserves plugin-shaped extras.
    Object.assign(node, partial, { id, type, x: node.x, y: node.y, width: node.width, height: node.height });
  }
  return { ...c, nodes: [...c.nodes, node] };
}

/**
 * Remove a node by id. Also removes every edge that touches it — a
 * dangling edge would be invisible in the UI and confuse the JSON.
 *
 * @param {object} canvas
 * @param {string} nodeId
 * @returns {object}
 */
export function removeNode(canvas, nodeId) {
  const c = normalizeCanvas(canvas);
  if (!c.nodes.some(n => n.id === nodeId)) return c;
  return {
    ...c,
    nodes: c.nodes.filter(n => n.id !== nodeId),
    edges: c.edges.filter(e => e.fromNode !== nodeId && e.toNode !== nodeId),
  };
}

/**
 * Move a node to (x,y). No-op if the node doesn't exist.
 *
 * @param {object} canvas
 * @param {string} nodeId
 * @param {number} x
 * @param {number} y
 * @returns {object}
 */
export function moveNode(canvas, nodeId, x, y) {
  return updateNode(canvas, nodeId, { x, y });
}

/**
 * Resize a node. No-op if missing.
 *
 * @param {object} canvas
 * @param {string} nodeId
 * @param {number} width
 * @param {number} height
 * @returns {object}
 */
export function resizeNode(canvas, nodeId, width, height) {
  return updateNode(canvas, nodeId, { width, height });
}

/**
 * Patch a node with arbitrary fields (text edits, file rebinding, etc.).
 * Type changes are allowed but the new payload (text vs file) must be
 * supplied by the caller — this op doesn't normalize across types.
 *
 * @param {object} canvas
 * @param {string} nodeId
 * @param {object} patch
 * @returns {object}
 */
export function updateNode(canvas, nodeId, patch) {
  const c = normalizeCanvas(canvas);
  const idx = c.nodes.findIndex(n => n.id === nodeId);
  if (idx === -1) return c;
  const next = c.nodes.slice();
  next[idx] = { ...next[idx], ...patch, id: nodeId };
  return { ...c, nodes: next };
}

/**
 * Add an edge. Returns the canvas unchanged if either endpoint is
 * missing — we refuse to create dangling edges.
 *
 * @param {object} canvas
 * @param {string} fromNode
 * @param {string} toNode
 * @param {string} [label]
 * @returns {object}
 */
export function addEdge(canvas, fromNode, toNode, label) {
  const c = normalizeCanvas(canvas);
  const ids = new Set(c.nodes.map(n => n.id));
  if (!ids.has(fromNode) || !ids.has(toNode)) return c;
  const edge = { id: nextEdgeId(c), fromNode, toNode };
  if (typeof label === 'string' && label) edge.label = label;
  return { ...c, edges: [...c.edges, edge] };
}

/**
 * Remove an edge by id. No-op if missing.
 *
 * @param {object} canvas
 * @param {string} edgeId
 * @returns {object}
 */
export function removeEdge(canvas, edgeId) {
  const c = normalizeCanvas(canvas);
  if (!c.edges.some(e => e.id === edgeId)) return c;
  return { ...c, edges: c.edges.filter(e => e.id !== edgeId) };
}

/**
 * Patch an edge (mostly for label edits). No-op if missing.
 *
 * @param {object} canvas
 * @param {string} edgeId
 * @param {object} patch
 * @returns {object}
 */
export function updateEdge(canvas, edgeId, patch) {
  const c = normalizeCanvas(canvas);
  const idx = c.edges.findIndex(e => e.id === edgeId);
  if (idx === -1) return c;
  const next = c.edges.slice();
  const merged = { ...next[idx], ...patch, id: edgeId };
  // Drop empty label rather than persisting `label: ""` to disk.
  if (merged.label === '' || merged.label == null) delete merged.label;
  next[idx] = merged;
  return { ...c, edges: next };
}
