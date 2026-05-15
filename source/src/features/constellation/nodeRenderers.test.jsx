import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  StarNode,
  BoardNode,
  EditorialNode,
  NODE_VARIANTS,
} from './nodeRenderers.jsx';

function renderInSvg(component) {
  return render(<svg>{component}</svg>);
}

function makeNode(overrides = {}) {
  return {
    id: 'n1',
    x: 100,
    y: 200,
    type: 'note',
    links: 1,
    title: 'Test Node',
    starred: false,
    ghost: false,
    ...overrides,
  };
}

describe('StarNode', () => {
  it('renders a circle and shows label when hovered', () => {
    const { container } = renderInSvg(
      <StarNode n={makeNode()} hovered={true} />
    );
    expect(container.querySelectorAll('circle').length).toBeGreaterThan(0);
    expect(container.querySelector('text').textContent).toBe('Test Node');
  });

  it('hides label by default (hover policy, not hovered/focal/starred)', () => {
    const { container } = renderInSvg(
      <StarNode n={makeNode()} labelPolicy="hover" />
    );
    expect(container.querySelector('text')).toBeNull();
  });

  it('shows label when hovered (hover policy)', () => {
    const { container } = renderInSvg(
      <StarNode n={makeNode()} hovered={true} labelPolicy="hover" />
    );
    expect(container.querySelector('text').textContent).toBe('Test Node');
  });

  it('shows label when starred regardless of hover', () => {
    const { container } = renderInSvg(
      <StarNode n={makeNode({ starred: true })} labelPolicy="hover" />
    );
    expect(container.querySelector('text').textContent).toBe('Test Node');
  });

  it('ghost renders dashed circle and italic label', () => {
    const { container } = renderInSvg(
      <StarNode n={makeNode({ ghost: true })} hovered={true} />
    );
    const dashed = container.querySelector('circle[stroke-dasharray]');
    expect(dashed).not.toBeNull();
    expect(container.querySelector('text').getAttribute('font-style')).toBe(
      'italic'
    );
  });

  it('renders an accent focus ring when focused', () => {
    const { container } = renderInSvg(
      <StarNode n={makeNode()} focused={true} />
    );
    expect(container.querySelector('[data-node-focus-ring]')).not.toBeNull();
  });
});

describe('BoardNode', () => {
  it('renders rect, title, meta and a type-color strip', () => {
    const { container } = renderInSvg(
      <BoardNode n={makeNode({ type: 'note', links: 2 })} />
    );
    expect(container.querySelector('[data-node-card]')).not.toBeNull();
    expect(container.querySelector('[data-node-strip]')).not.toBeNull();
    expect(container.querySelector('[data-node-title]').textContent).toBe(
      'Test Node'
    );
    expect(container.querySelector('[data-node-meta]').textContent).toContain(
      'note'
    );
    expect(container.querySelector('[data-node-meta]').textContent).toContain(
      '2'
    );
  });

  it('truncates title >22 chars with ellipsis', () => {
    const longTitle = 'This title is definitely longer than twenty two characters';
    const { container } = renderInSvg(
      <BoardNode n={makeNode({ title: longTitle })} />
    );
    const text = container.querySelector('[data-node-title]').textContent;
    expect(text.length).toBe(22); // 21 chars + ellipsis
    expect(text.endsWith('…')).toBe(true);
  });

  it('hub (>=4 links) renders title with fontWeight 600', () => {
    const { container } = renderInSvg(
      <BoardNode n={makeNode({ links: 4 })} />
    );
    expect(
      container.querySelector('[data-node-title]').getAttribute('font-weight')
    ).toBe('600');
  });

  it('non-hub renders title with fontWeight 500', () => {
    const { container } = renderInSvg(
      <BoardNode n={makeNode({ links: 1 })} />
    );
    expect(
      container.querySelector('[data-node-title]').getAttribute('font-weight')
    ).toBe('500');
  });

  it('ghost renders transparent fill and dashed border', () => {
    const { container } = renderInSvg(
      <BoardNode n={makeNode({ ghost: true })} />
    );
    const card = container.querySelector('[data-node-card]');
    expect(card.getAttribute('fill')).toBe('transparent');
    expect(card.getAttribute('stroke-dasharray')).toBe('5 5');
    // ghost has no type strip
    expect(container.querySelector('[data-node-strip]')).toBeNull();
  });

  it('uses app surface variables instead of hard-coded board colors', () => {
    const { container } = renderInSvg(<BoardNode n={makeNode()} focused={true} />);
    expect(container.querySelector('[data-node-card]').getAttribute('fill')).toBe('var(--cd)');
    expect(container.querySelector('[data-node-title]').getAttribute('fill')).toBe('var(--tx)');
    expect(container.querySelector('[data-node-focus-ring]').getAttribute('stroke')).toBe('var(--ac)');
  });
});

describe('EditorialNode', () => {
  it('tier 0 (>=4 links) renders 22px label to the right with start anchor', () => {
    const { container } = renderInSvg(
      <EditorialNode n={makeNode({ links: 4 })} />
    );
    const label = container.querySelector('[data-node-label]');
    expect(label).not.toBeNull();
    expect(label.getAttribute('font-size')).toBe('22');
    expect(label.getAttribute('text-anchor')).toBe('start');
  });

  it('tier 1 (2-3 links) renders 14px label centered below', () => {
    const { container } = renderInSvg(
      <EditorialNode n={makeNode({ links: 2 })} hovered={true} />
    );
    const label = container.querySelector('[data-node-label]');
    expect(label).not.toBeNull();
    expect(label.getAttribute('font-size')).toBe('14');
    expect(label.getAttribute('text-anchor')).toBe('middle');
  });

  it('tier 2 (1 link) hides label by default with hover policy', () => {
    const { container } = renderInSvg(
      <EditorialNode n={makeNode({ links: 1 })} labelPolicy="hover" />
    );
    expect(container.querySelector('[data-node-label]')).toBeNull();
  });

  it('focused tier 2 shows label and focus ring', () => {
    const { container } = renderInSvg(
      <EditorialNode n={makeNode({ links: 1 })} focused={true} labelPolicy="hover" />
    );
    expect(container.querySelector('[data-node-focus-ring]')).not.toBeNull();
    expect(container.querySelector('[data-node-label]').textContent).toBe('Test Node');
  });
});

describe('shared interaction', () => {
  it('all three call onClick(n) when clicked', () => {
    const node = makeNode();
    const onClickStar = vi.fn();
    const onClickBoard = vi.fn();
    const onClickEd = vi.fn();

    const star = renderInSvg(
      <StarNode n={node} hovered={true} onClick={onClickStar} />
    );
    const board = renderInSvg(<BoardNode n={node} onClick={onClickBoard} />);
    const ed = renderInSvg(
      <EditorialNode n={node} hovered={true} onClick={onClickEd} />
    );

    fireEvent.click(star.container.querySelector('[data-node-variant="star"]'));
    fireEvent.click(
      board.container.querySelector('[data-node-variant="board"]')
    );
    fireEvent.click(
      ed.container.querySelector('[data-node-variant="editorial"]')
    );

    expect(onClickStar).toHaveBeenCalledWith(node);
    expect(onClickBoard).toHaveBeenCalledWith(node);
    expect(onClickEd).toHaveBeenCalledWith(node);
  });

  it('all three call onHover(id) on enter and onHover(null) on leave', () => {
    const node = makeNode({ id: 'hover-id' });
    const onHover = vi.fn();
    const variants = [
      <StarNode key="s" n={node} onHover={onHover} />,
      <BoardNode key="b" n={node} onHover={onHover} />,
      <EditorialNode key="e" n={node} onHover={onHover} />,
    ];

    for (const v of variants) {
      const { container } = renderInSvg(v);
      const g = container.querySelector('[data-node-id="hover-id"]');
      fireEvent.mouseEnter(g);
      fireEvent.mouseLeave(g);
    }

    // 3 enters with 'hover-id', 3 leaves with null
    expect(onHover).toHaveBeenCalledWith('hover-id');
    expect(onHover).toHaveBeenCalledWith(null);
    expect(onHover).toHaveBeenCalledTimes(6);
  });
});

describe('NODE_VARIANTS', () => {
  it('exports the three variant names in order', () => {
    expect(NODE_VARIANTS).toEqual(['star', 'board', 'editorial']);
  });
});
