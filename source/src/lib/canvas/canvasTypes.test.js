import { describe, it, expect } from 'vitest';
import {
  CANVAS_DIR,
  CANVAS_FILE_EXT,
  createEmptyCanvas,
  normalizeCanvas,
  serializeCanvas,
  canvasPath,
  nextNodeId,
  nextEdgeId,
  makeCanvasId,
} from './canvasTypes.js';

describe('canvasTypes', () => {
  it('createEmptyCanvas returns a well-formed canvas with empty nodes/edges', () => {
    const c = createEmptyCanvas({ name: 'Brainstorm' });
    expect(c.name).toBe('Brainstorm');
    expect(c.id).toMatch(/^brainstorm-/);
    expect(c.version).toBe(1);
    expect(c.nodes).toEqual([]);
    expect(c.edges).toEqual([]);
  });

  it('createEmptyCanvas falls back to "Untitled Canvas" when name is blank', () => {
    expect(createEmptyCanvas().name).toBe('Untitled Canvas');
    expect(createEmptyCanvas({ name: '   ' }).name).toBe('Untitled Canvas');
  });

  it('makeCanvasId slugifies + appends a timestamp shard', () => {
    expect(makeCanvasId('My Map!!')).toMatch(/^my-map-[a-z0-9]+$/);
  });

  it('canvasPath produces the canonical on-disk location', () => {
    expect(canvasPath('foo')).toBe(`${CANVAS_DIR}/foo${CANVAS_FILE_EXT}`);
  });

  it('normalizeCanvas tolerates totally garbage input without throwing', () => {
    expect(() => normalizeCanvas(null)).not.toThrow();
    expect(() => normalizeCanvas(undefined)).not.toThrow();
    expect(() => normalizeCanvas('not an object')).not.toThrow();
    expect(() => normalizeCanvas(42)).not.toThrow();
    const out = normalizeCanvas(null);
    expect(out.nodes).toEqual([]);
    expect(out.edges).toEqual([]);
    expect(out.id).toBeTruthy();
  });

  it('normalizeCanvas clamps absurd coordinates and falls back on NaN', () => {
    const out = normalizeCanvas({
      id: 'c1',
      name: 'C',
      nodes: [
        { id: 'n1', type: 'text', x: 1e308, y: -1e308, width: 999999, height: NaN, text: 'hi' },
      ],
      edges: [],
    });
    expect(out.nodes[0].x).toBeLessThanOrEqual(100000);
    expect(out.nodes[0].y).toBeGreaterThanOrEqual(-100000);
    expect(out.nodes[0].width).toBeLessThanOrEqual(5000);
    expect(out.nodes[0].height).toBeGreaterThan(0);
  });

  it('normalizeCanvas drops nodes missing an id and de-dupes by id', () => {
    const out = normalizeCanvas({
      id: 'c',
      name: 'C',
      nodes: [
        { type: 'text', x: 0, y: 0, text: 'no id' },
        { id: 'n1', type: 'text', x: 0, y: 0, text: 'first' },
        { id: 'n1', type: 'text', x: 10, y: 10, text: 'dup, dropped' },
      ],
      edges: [],
    });
    expect(out.nodes).toHaveLength(1);
    expect(out.nodes[0].text).toBe('first');
  });

  it('normalizeCanvas drops edges with missing endpoints', () => {
    const out = normalizeCanvas({
      id: 'c',
      name: 'C',
      nodes: [{ id: 'n1', type: 'text', x: 0, y: 0, text: '' }],
      edges: [
        { id: 'e1', fromNode: 'n1', toNode: 'gone' },           // dropped
        { id: 'e2', fromNode: 'gone', toNode: 'n1' },           // dropped
        { id: 'e3', fromNode: 'n1', toNode: 'n1' },             // self loop kept
      ],
    });
    expect(out.edges).toHaveLength(1);
    expect(out.edges[0].id).toBe('e3');
  });

  it('normalizeCanvas preserves unknown node types with a warning marker', () => {
    const out = normalizeCanvas({
      id: 'c',
      name: 'C',
      nodes: [
        { id: 'n1', type: 'mystery-plugin-shape', x: 5, y: 5, width: 100, height: 100, custom: 'data' },
      ],
      edges: [],
    });
    expect(out.nodes).toHaveLength(1);
    expect(out.nodes[0].type).toBe('mystery-plugin-shape');
    expect(out.nodes[0]._warning).toMatch(/Unknown node type/);
    expect(out.nodes[0].custom).toBe('data');
  });

  it('serialize → JSON → parse → normalize is byte-stable for known node types', () => {
    const original = {
      version: 1,
      id: 'roundtrip',
      name: 'Round-trip',
      nodes: [
        { id: 'n1', type: 'text',  x: 100, y: 200, width: 220, height: 140, text: 'Hello' },
        { id: 'n2', type: 'file',  x: 400, y: 200, width: 220, height: 140, file: 'entry-abc' },
        { id: 'n3', type: 'media', x: 700, y: 200, width: 240, height: 180, file: 'media/cat.png' },
      ],
      edges: [
        { id: 'e1', fromNode: 'n1', toNode: 'n2', label: 'relates to' },
      ],
    };
    const written = JSON.stringify(serializeCanvas(original));
    const re = normalizeCanvas(JSON.parse(written));
    expect(re).toEqual(original);
  });

  it('serializeCanvas strips runtime-only _warning from unknown-type nodes', () => {
    const out = serializeCanvas({
      version: 1,
      id: 'c',
      name: 'C',
      nodes: [{ id: 'n1', type: 'plugin-x', x: 0, y: 0, width: 100, height: 100, _warning: 'x', custom: 1 }],
      edges: [],
    });
    expect(out.nodes[0]._warning).toBeUndefined();
    expect(out.nodes[0].custom).toBe(1);
  });

  it('nextNodeId / nextEdgeId pick the next unused integer suffix', () => {
    const c = {
      version: 1, id: 'c', name: 'C',
      nodes: [{ id: 'n1' }, { id: 'n3' }, { id: 'n7' }, { id: 'custom' }],
      edges: [{ id: 'e2' }, { id: 'e5' }],
    };
    expect(nextNodeId(c)).toBe('n8');
    expect(nextEdgeId(c)).toBe('e6');
    expect(nextNodeId(createEmptyCanvas())).toBe('n1');
    expect(nextEdgeId(createEmptyCanvas())).toBe('e1');
  });
});
