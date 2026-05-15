import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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
});
