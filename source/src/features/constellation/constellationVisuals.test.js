import { describe, expect, it } from 'vitest';
import {
  getEdgeVisualState,
  getNodePalette,
  getNodeRole,
  getNodeVisualState,
  graphDegree,
  nodeRoleLabel,
  summarizeGraph,
} from './constellationVisuals.js';

describe('constellationVisuals', () => {
  it('classifies special graph node roles before generic entries', () => {
    expect(getNodeRole({ _unresolved: true, links: [] })).toBe('missing');
    expect(getNodeRole({ type: 'raw', links: [] })).toBe('capture');
    expect(getNodeRole({ type: 'wiki', links: [] })).toBe('memory');
    expect(getNodeRole({ type: 'review', links: [] })).toBe('memory');
    expect(getNodeRole({ type: 'project', links: [] })).toBe('project');
    expect(getNodeRole({ type: 'task', links: [] })).toBe('task');
    expect(getNodeRole({ type: 'note', links: ['a', 'b', 'c', 'd'] })).toBe('hub');
  });

  it('returns readable labels for roles and normal entry types', () => {
    expect(nodeRoleLabel({ type: 'task', links: [] })).toBe('Task');
    expect(nodeRoleLabel({ type: 'note', links: [] })).toBe('Notes');
  });

  it('uses signal colors for normal entries', () => {
    const palette = getNodePalette({ type: 'note', links: [] }, 'signal');
    expect(palette.fill).toBe('#8BD3FF');
    expect(palette.stroke).toBe('#8BD3FF');
  });

  it('makes missing and review nodes hollow', () => {
    expect(getNodeVisualState({ _unresolved: true, links: [] }).isHollow).toBe(true);
    expect(getNodeVisualState({ type: 'review', links: [] }).isHollow).toBe(true);
  });

  it('scales radius by graph degree within bounds', () => {
    const low = getNodeVisualState({ type: 'note', links: [] });
    const high = getNodeVisualState({ type: 'note', links: Array.from({ length: 20 }, (_, i) => String(i)) });
    expect(high.radius).toBeGreaterThan(low.radius);
    expect(high.radius).toBeLessThanOrEqual(22);
    expect(graphDegree({ links: ['a', 'b'] })).toBe(2);
  });

  it('styles unresolved edges differently from real edges', () => {
    const missing = getEdgeVisualState({ unresolved: true });
    const normal = getEdgeVisualState({ unresolved: false });
    expect(missing.strokeDasharray).toBe('5 5');
    expect(normal.strokeDasharray).toBeUndefined();
  });

  it('summarizes graph roles', () => {
    expect(summarizeGraph({
      nodes: [
        { type: 'wiki', links: [] },
        { type: 'raw', links: [] },
        { _unresolved: true, links: [] },
        { type: 'note', links: ['a', 'b', 'c', 'd'] },
      ],
      edges: [{}, {}],
    })).toEqual({
      nodes: 4,
      edges: 2,
      memory: 1,
      missing: 1,
      captures: 1,
      hubs: 1,
    });
  });
});
