import { describe, expect, it } from 'vitest';
import {
  BUNDLE_VERSION,
  BUNDLE_KIND,
  CANVAS_DIR,
  CANVAS_FILE_EXT,
  buildBundle,
  parseBundle,
  validateCanvas,
  validateBase,
} from './bundle.js';

const sampleEntry = { id: 'e1', type: 'note', title: 'Hello', tags: [], notes: '' };
const sampleBase = {
  id: 'b1',
  name: 'Reading Queue',
  filters: [],
  sorts: [],
  columns: ['title'],
  activeViewId: 'table',
  views: [{ id: 'table', type: 'table', name: 'Table' }],
};
const sampleCanvas = {
  version: 1,
  id: 'c1',
  name: 'Architecture',
  nodes: [{ id: 'n1', type: 'text', x: 10, y: 20, width: 200, height: 120, text: 'hi' }],
  edges: [{ id: 'e1', fromNode: 'n1', toNode: 'n2' }],
};

describe('bundle constants', () => {
  it('exposes locked canvas paths', () => {
    expect(CANVAS_DIR).toBe('canvases');
    expect(CANVAS_FILE_EXT).toBe('.canvas.json');
    expect(BUNDLE_VERSION).toBe(2);
    expect(BUNDLE_KIND).toBe('jotfolio-bundle');
  });
});

describe('buildBundle', () => {
  it('includes the full envelope (version, kind, exportedAt, entries, bases, canvases)', () => {
    const out = buildBundle({ entries: [sampleEntry], bases: [sampleBase], canvases: [sampleCanvas] });
    expect(out.version).toBe(BUNDLE_VERSION);
    expect(out.kind).toBe(BUNDLE_KIND);
    expect(typeof out.exportedAt).toBe('string');
    expect(out.entries).toEqual([sampleEntry]);
    expect(out.bases).toEqual([sampleBase]);
    expect(out.canvases).toEqual([sampleCanvas]);
  });

  it('handles missing inputs by defaulting to empty arrays', () => {
    expect(buildBundle().entries).toEqual([]);
    expect(buildBundle().bases).toEqual([]);
    expect(buildBundle().canvases).toEqual([]);

    expect(buildBundle({ entries: [sampleEntry] }).bases).toEqual([]);
    expect(buildBundle({ entries: [sampleEntry] }).canvases).toEqual([]);

    expect(buildBundle({ bases: [sampleBase] }).entries).toEqual([]);
    expect(buildBundle({ bases: [sampleBase] }).canvases).toEqual([]);

    expect(buildBundle({ canvases: [sampleCanvas] }).entries).toEqual([]);
    expect(buildBundle({ canvases: [sampleCanvas] }).bases).toEqual([]);
  });
});

describe('parseBundle', () => {
  it('round-trips a buildBundle output identically', () => {
    const built = buildBundle({ entries: [sampleEntry], bases: [sampleBase], canvases: [sampleCanvas] });
    const parsed = parseBundle(JSON.parse(JSON.stringify(built)));
    expect(parsed.entries).toEqual([sampleEntry]);
    expect(parsed.bases).toEqual([sampleBase]);
    expect(parsed.canvases).toEqual([sampleCanvas]);
  });

  it('treats a legacy array input as entries-only with empty bases/canvases', () => {
    const parsed = parseBundle([sampleEntry, { ...sampleEntry, id: 'e2' }]);
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.bases).toEqual([]);
    expect(parsed.canvases).toEqual([]);
  });

  it('returns empty shape when kind marker is missing (not-a-bundle object)', () => {
    const parsed = parseBundle({ entries: [sampleEntry], bases: [sampleBase] });
    expect(parsed.entries).toEqual([]);
    expect(parsed.bases).toEqual([]);
    expect(parsed.canvases).toEqual([]);
  });

  it('filters out malformed bases (validateBase false → skipped)', () => {
    const built = buildBundle({
      bases: [
        sampleBase,
        { id: 'no-views' },                // missing views
        { name: 'no-id', views: [] },      // missing id
        null,
        'not-an-object',
      ],
    });
    const parsed = parseBundle(built);
    expect(parsed.bases).toEqual([sampleBase]);
  });

  it('filters out malformed canvases (validateCanvas false → skipped)', () => {
    const built = buildBundle({
      canvases: [
        sampleCanvas,
        { version: 1, id: 'bad', nodes: [] },          // no edges
        { version: 1, id: 'bad2', edges: [] },         // no nodes
        { id: 'no-version', nodes: [], edges: [] },
        null,
      ],
    });
    const parsed = parseBundle(built);
    expect(parsed.canvases).toEqual([sampleCanvas]);
  });

  it('preserves canvases byte-for-byte for valid canvas objects', () => {
    const built = buildBundle({ canvases: [sampleCanvas] });
    const wireForm = JSON.parse(JSON.stringify(built));
    const parsed = parseBundle(wireForm);
    expect(JSON.stringify(parsed.canvases[0])).toBe(JSON.stringify(sampleCanvas));
  });

  it('preserves bases byte-for-byte for valid base objects', () => {
    const built = buildBundle({ bases: [sampleBase] });
    const wireForm = JSON.parse(JSON.stringify(built));
    const parsed = parseBundle(wireForm);
    expect(JSON.stringify(parsed.bases[0])).toBe(JSON.stringify(sampleBase));
  });

  it('returns deterministic empty shape when input is null or non-object', () => {
    expect(parseBundle(null)).toEqual({ entries: [], bases: [], canvases: [] });
    expect(parseBundle(undefined)).toEqual({ entries: [], bases: [], canvases: [] });
    expect(parseBundle(42)).toEqual({ entries: [], bases: [], canvases: [] });
    expect(parseBundle('string')).toEqual({ entries: [], bases: [], canvases: [] });
  });
});

describe('validateCanvas', () => {
  it('accepts a well-formed canvas', () => {
    expect(validateCanvas(sampleCanvas)).toBe(true);
  });

  it('rejects canvas missing nodes array', () => {
    expect(validateCanvas({ version: 1, id: 'c', edges: [] })).toBe(false);
  });

  it('rejects canvas with nodes of wrong type (not array)', () => {
    expect(validateCanvas({ version: 1, id: 'c', nodes: 'no', edges: [] })).toBe(false);
    expect(validateCanvas({ version: 1, id: 'c', nodes: {}, edges: [] })).toBe(false);
  });
});

describe('validateBase', () => {
  it('accepts a well-formed base', () => {
    expect(validateBase(sampleBase)).toBe(true);
  });

  it('rejects base missing views array', () => {
    expect(validateBase({ id: 'b1', name: 'no views' })).toBe(false);
    expect(validateBase({ id: 'b1', name: 'wrong type', views: 'nope' })).toBe(false);
  });
});
