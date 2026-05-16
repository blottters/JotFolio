import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const layoutCalls = vi.hoisted(() => ({
  affinity: vi.fn(),
  clusters: vi.fn(),
  messy: vi.fn(),
}));

vi.mock('./layout.js', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    computeAffinityLayout: (...args) => {
      layoutCalls.affinity(...args);
      return actual.computeAffinityLayout(...args);
    },
    computeClusterLayout: (...args) => {
      layoutCalls.clusters(...args);
      return actual.computeClusterLayout(...args);
    },
    computeMessyLayout: (...args) => {
      layoutCalls.messy(...args);
      return actual.computeMessyLayout(...args);
    },
  };
});

import { ConstellationView } from './ConstellationView.jsx';

function entries(overrides = {}) {
  return [
    {
      id: 'a',
      title: 'Alpha',
      type: 'note',
      tags: ['systems'],
      links: ['b'],
      unresolvedTargets: [{ target: 'Missing Idea' }],
      ...overrides.a,
    },
    {
      id: 'b',
      title: 'Beta',
      type: 'note',
      tags: ['systems'],
      links: [],
      unresolvedTargets: [],
      ...overrides.b,
    },
    {
      id: 'c',
      title: 'Memory',
      type: 'wiki',
      tags: ['memory'],
      links: ['a'],
      confidence: 0.84,
      freshness: 'fresh',
      unresolvedTargets: [],
      ...overrides.c,
    },
  ];
}

function setReducedMotion(matches) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: vi.fn(() => ({
      matches,
      media: '(prefers-reduced-motion: reduce)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

function renderGraph(props = {}) {
  return render(
    <ConstellationView
      entries={entries()}
      onOpen={vi.fn()}
      onBack={vi.fn()}
      onAdd={vi.fn()}
      onCreateFromMissing={vi.fn()}
      flags={{ wiki_mode: true, review_queue: true, raw_inbox: true }}
      {...props}
    />
  );
}

describe('ConstellationView polish', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    layoutCalls.affinity.mockClear();
    layoutCalls.clusters.mockClear();
    layoutCalls.messy.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('respects reduced motion by disabling graph transitions and RAF bobbing', () => {
    setReducedMotion(true);
    const { container } = renderGraph();

    const layer = container.querySelector('[data-constellation-pan-layer]');
    expect(layer.style.transition).toBe('none');
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it('shows a visible focus ring when an SVG node receives keyboard focus', () => {
    setReducedMotion(true);
    const { container } = renderGraph();

    const node = screen.getByRole('button', { name: /Alpha, Notes, 1 link/i });
    fireEvent.focus(node);

    const alpha = container.querySelector('[data-constellation-node-id="a"]');
    expect(alpha.querySelector('[data-node-focus-ring]')).not.toBeNull();
  });

  it('keeps missing linked notes actionable from the graph', () => {
    setReducedMotion(true);
    const onCreateFromMissing = vi.fn();
    renderGraph({ onCreateFromMissing });

    const ghost = screen.getByRole('button', { name: /Ghost note Missing Idea/i });
    fireEvent.keyDown(ghost, { key: 'Enter' });

    expect(onCreateFromMissing).toHaveBeenCalledWith('Missing Idea');
  });

  it('shows a Graph Health panel with disconnected notes and unresolved links', () => {
    setReducedMotion(true);
    const onOpen = vi.fn();
    const onCreateFromMissing = vi.fn();
    renderGraph({
      onOpen,
      onCreateFromMissing,
      entries: [
        ...entries(),
        { id: 'd', title: 'Disconnected Draft', type: 'note', tags: [], links: [], unresolvedTargets: [], notes: '' },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Graph Health' }));

    const scan = screen.getByRole('region', { name: 'Graph Health' });
    expect(scan).toBeInTheDocument();
    expect(scan).toHaveTextContent('Disconnected Draft');
    expect(scan).toHaveTextContent('Missing Idea');

    fireEvent.click(screen.getByRole('button', { name: 'Open Disconnected Draft' }));
    expect(onOpen).toHaveBeenCalledWith('d');

    fireEvent.click(screen.getByRole('button', { name: 'Create Missing Idea' }));
    expect(onCreateFromMissing).toHaveBeenCalledWith('Missing Idea');
  });

  it('surfaces missing project references in the relationship scan', () => {
    setReducedMotion(true);
    const onOpen = vi.fn();
    renderGraph({
      onOpen,
      entries: [
        ...entries(),
        {
          id: 'projectless',
          title: 'Projectless Note',
          type: 'note',
          tags: ['planning'],
          links: [],
          unresolvedTargets: [],
          notes: '',
          project: 'Missing Project',
        },
      ],
    });

    fireEvent.click(screen.getByRole('button', { name: 'Graph Health' }));

    const scan = screen.getByRole('region', { name: 'Graph Health' });
    expect(scan).toHaveTextContent('Missing Project');

    fireEvent.click(screen.getByRole('button', { name: 'Open metadata issue for Projectless Note' }));
    expect(onOpen).toHaveBeenCalledWith('projectless');
  });

  it('remembers Graph Health accept, reject, and ignore decisions', () => {
    setReducedMotion(true);
    const graphEntries = [
      ...entries(),
      { id: 'd', title: 'Disconnected Draft', type: 'note', tags: [], links: [], unresolvedTargets: [], notes: '' },
    ];
    const { unmount } = renderGraph({ entries: graphEntries });

    fireEvent.click(screen.getByRole('button', { name: 'Graph Health' }));
    fireEvent.click(screen.getByRole('button', { name: 'Accept relationship decision for Disconnected Draft' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reject relationship decision for Missing Idea' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ignore relationship decision for Disconnected Draft' }));

    const stored = JSON.parse(localStorage.getItem('jf-relationship-decisions'));
    expect(Object.values(stored.decisions).map(item => item.status)).toEqual(expect.arrayContaining(['ignored', 'rejected']));
    expect(screen.getByText('Ignored')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    unmount();
    renderGraph({ entries: graphEntries });
    fireEvent.click(screen.getByRole('button', { name: 'Graph Health' }));

    expect(screen.getByText('Ignored')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear relationship decision for Disconnected Draft' }));
    expect(screen.queryByText('Ignored')).not.toBeInTheDocument();
  });

  it('accepts an initial focused entry from route actions', () => {
    setReducedMotion(true);
    renderGraph({ focusEntryId: 'b' });

    expect(screen.getByText('L1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-current', 'page');
  });

  it('shows the no-match overlay when memory-only filtering hides every node', () => {
    setReducedMotion(true);
    renderGraph({
      entries: entries({
        c: { type: 'note', title: 'Gamma', tags: ['systems'], links: [], confidence: undefined },
      }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Show only memory entries' }));

    expect(screen.getByText('No entries match this filter.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset filters' })).toBeInTheDocument();
  });

  it('keyboard layout shortcuts toggle from the latest selected layout', () => {
    setReducedMotion(true);
    const layoutChanges = [];

    function ControlledGraph() {
      const [layoutMode, setLayoutMode] = React.useState('messy');
      return (
        <ConstellationView
          entries={entries()}
          onOpen={vi.fn()}
          onBack={vi.fn()}
          onAdd={vi.fn()}
          onCreateFromMissing={vi.fn()}
          flags={{ wiki_mode: true, review_queue: true, raw_inbox: true }}
          layoutMode={layoutMode}
          onLayoutModeChange={next => {
            layoutChanges.push(next);
            setLayoutMode(next);
          }}
        />
      );
    }

    render(<ControlledGraph />);

    fireEvent.keyDown(document, { key: 'c' });
    fireEvent.keyDown(document, { key: 'c' });
    fireEvent.keyDown(document, { key: 'a' });
    fireEvent.keyDown(document, { key: 'a' });

    expect(layoutChanges).toEqual(['clusters', 'messy', 'affinity', 'messy']);
  });

  it('computes only the active layout mode', () => {
    setReducedMotion(true);
    const props = {
      entries: entries(),
      onOpen: vi.fn(),
      onBack: vi.fn(),
      onAdd: vi.fn(),
      onCreateFromMissing: vi.fn(),
      flags: { wiki_mode: true, review_queue: true, raw_inbox: true },
    };

    const { rerender } = render(<ConstellationView {...props} layoutMode="messy" />);
    expect(layoutCalls.messy).toHaveBeenCalled();
    expect(layoutCalls.clusters).not.toHaveBeenCalled();
    expect(layoutCalls.affinity).not.toHaveBeenCalled();

    layoutCalls.affinity.mockClear();
    layoutCalls.clusters.mockClear();
    layoutCalls.messy.mockClear();
    rerender(<ConstellationView {...props} layoutMode="clusters" />);
    expect(layoutCalls.clusters).toHaveBeenCalled();
    expect(layoutCalls.messy).not.toHaveBeenCalled();
    expect(layoutCalls.affinity).not.toHaveBeenCalled();

    layoutCalls.affinity.mockClear();
    layoutCalls.clusters.mockClear();
    layoutCalls.messy.mockClear();
    rerender(<ConstellationView {...props} layoutMode="affinity" />);
    expect(layoutCalls.affinity).toHaveBeenCalled();
    expect(layoutCalls.messy).not.toHaveBeenCalled();
    expect(layoutCalls.clusters).not.toHaveBeenCalled();
  });

  it('requires explicit semanticEdges true before drawing semantic edges', () => {
    setReducedMotion(true);
    const getSimilar = vi.fn(id => (id === 'b' ? [{ id: 'c', score: 0.82 }] : []));
    const props = {
      entries: entries(),
      onOpen: vi.fn(),
      onBack: vi.fn(),
      onAdd: vi.fn(),
      onCreateFromMissing: vi.fn(),
      semanticReady: true,
      getSimilar,
    };

    const { container, rerender } = render(
      <ConstellationView
        {...props}
        flags={{ wiki_mode: true, review_queue: true, raw_inbox: true }}
      />
    );
    expect(getSimilar).not.toHaveBeenCalled();
    expect(container.querySelector('[data-semantic-edge="true"]')).toBeNull();

    rerender(
      <ConstellationView
        {...props}
        flags={{ wiki_mode: true, review_queue: true, raw_inbox: true, semanticEdges: true }}
      />
    );

    expect(getSimilar).toHaveBeenCalled();
    expect(container.querySelector('[data-semantic-edge="true"]')).not.toBeNull();
  });
});
