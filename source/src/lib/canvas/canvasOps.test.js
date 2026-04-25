import { describe, it, expect } from 'vitest';
import {
  addNode,
  removeNode,
  moveNode,
  resizeNode,
  updateNode,
  addEdge,
  removeEdge,
  updateEdge,
} from './canvasOps.js';
import { createEmptyCanvas } from './canvasTypes.js';

function seed() {
  let c = createEmptyCanvas({ name: 'Test' });
  c = addNode(c, { id: 'n1', type: 'text', x: 0,   y: 0,   text: 'A' });
  c = addNode(c, { id: 'n2', type: 'file', x: 200, y: 0,   file: 'entry-x' });
  c = addNode(c, { id: 'n3', type: 'text', x: 400, y: 0,   text: 'C' });
  c = addEdge(c, 'n1', 'n2', 'relates');
  c = addEdge(c, 'n2', 'n3');
  return c;
}

describe('canvasOps', () => {
  it('addNode appends a node and never mutates the input', () => {
    const before = createEmptyCanvas();
    const after = addNode(before, { type: 'text', text: 'Hi' });
    expect(before.nodes).toEqual([]);
    expect(after.nodes).toHaveLength(1);
    expect(after.nodes[0].text).toBe('Hi');
    expect(after.nodes[0].id).toMatch(/^n\d+$/);
  });

  it('addNode auto-allocates ids when none provided', () => {
    let c = createEmptyCanvas();
    c = addNode(c);
    c = addNode(c);
    c = addNode(c);
    expect(c.nodes.map(n => n.id)).toEqual(['n1', 'n2', 'n3']);
  });

  it('removeNode also removes any edges touching the removed node', () => {
    const c = seed();
    const after = removeNode(c, 'n2');
    expect(after.nodes.map(n => n.id)).toEqual(['n1', 'n3']);
    expect(after.edges).toEqual([]);
  });

  it('removeNode with an unknown id is a no-op (returns equivalent canvas)', () => {
    const c = seed();
    const after = removeNode(c, 'nonexistent');
    expect(after.nodes).toEqual(c.nodes);
    expect(after.edges).toEqual(c.edges);
  });

  it('moveNode updates only the targeted node', () => {
    const c = seed();
    const after = moveNode(c, 'n1', 999, 888);
    const moved = after.nodes.find(n => n.id === 'n1');
    expect(moved.x).toBe(999);
    expect(moved.y).toBe(888);
    expect(c.nodes.find(n => n.id === 'n1').x).toBe(0); // input untouched
  });

  it('resizeNode updates dimensions only', () => {
    const c = seed();
    const after = resizeNode(c, 'n3', 500, 300);
    const r = after.nodes.find(n => n.id === 'n3');
    expect(r.width).toBe(500);
    expect(r.height).toBe(300);
    expect(r.x).toBe(400);
  });

  it('updateNode patches arbitrary fields and preserves id', () => {
    const c = seed();
    const after = updateNode(c, 'n1', { text: 'updated', x: 50 });
    const n = after.nodes.find(x => x.id === 'n1');
    expect(n.text).toBe('updated');
    expect(n.x).toBe(50);
    expect(n.id).toBe('n1');
  });

  it('updateNode rebinds a file-type node to a different entry id', () => {
    const c = seed();
    const after = updateNode(c, 'n2', { file: 'entry-y' });
    expect(after.nodes.find(n => n.id === 'n2').file).toBe('entry-y');
  });

  it('updateNode is a no-op when the id does not exist', () => {
    const c = seed();
    const after = updateNode(c, 'ghost', { text: 'x' });
    expect(after.nodes).toEqual(c.nodes);
  });

  it('addEdge refuses to create dangling edges', () => {
    const c = seed();
    const after = addEdge(c, 'n1', 'ghost', 'bad');
    expect(after.edges.length).toBe(c.edges.length);
  });

  it('addEdge auto-allocates ids and supports an optional label', () => {
    let c = createEmptyCanvas();
    c = addNode(c, { id: 'n1' });
    c = addNode(c, { id: 'n2' });
    c = addEdge(c, 'n1', 'n2');
    c = addEdge(c, 'n2', 'n1', 'reverse');
    expect(c.edges.map(e => e.id)).toEqual(['e1', 'e2']);
    expect(c.edges[0].label).toBeUndefined();
    expect(c.edges[1].label).toBe('reverse');
  });

  it('removeEdge takes out the targeted edge only', () => {
    const c = seed();
    const target = c.edges[0].id;
    const after = removeEdge(c, target);
    expect(after.edges.map(e => e.id)).toEqual(c.edges.slice(1).map(e => e.id));
  });

  it('updateEdge patches a label and drops empty labels from the persisted shape', () => {
    const c = seed();
    const target = c.edges[0].id;
    const renamed = updateEdge(c, target, { label: 'depends on' });
    expect(renamed.edges.find(e => e.id === target).label).toBe('depends on');
    const cleared = updateEdge(renamed, target, { label: '' });
    expect(cleared.edges.find(e => e.id === target).label).toBeUndefined();
  });

  it('updateEdge is a no-op for missing ids', () => {
    const c = seed();
    expect(updateEdge(c, 'ghost', { label: 'x' }).edges).toEqual(c.edges);
  });

  it('ops never mutate the input canvas reference (immutability check)', () => {
    const c = seed();
    const snapshot = JSON.stringify(c);
    moveNode(c, 'n1', 1, 1);
    resizeNode(c, 'n2', 1, 1);
    updateNode(c, 'n3', { text: 'x' });
    addNode(c, { type: 'text' });
    removeNode(c, 'n1');
    addEdge(c, 'n1', 'n3');
    removeEdge(c, c.edges[0].id);
    updateEdge(c, c.edges[0].id, { label: 'q' });
    expect(JSON.stringify(c)).toBe(snapshot);
  });

  it('addNode pass-through preserves unknown-type extras for plugin nodes', () => {
    const c = createEmptyCanvas();
    const after = addNode(c, { id: 'n1', type: 'plugin-thing', x: 5, y: 5, custom: 'data' });
    expect(after.nodes[0].type).toBe('plugin-thing');
    expect(after.nodes[0].custom).toBe('data');
  });
});
