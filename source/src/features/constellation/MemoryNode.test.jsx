import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryNode } from './MemoryNode.jsx';

function makeEntry(overrides = {}) {
  return {
    id: 'm1',
    title: 'Project Charter',
    notes: 'Defines the scope of the work. More details follow.',
    confidence: 0.82,
    type: 'wiki',
    freshness: 'fresh',
    ...overrides,
  };
}

function getNode() {
  return document.querySelector('[data-memory-node]');
}

describe('MemoryNode', () => {
  it('renders title and confidence percentage', () => {
    render(<MemoryNode entry={makeEntry({ confidence: 0.82 })} onSelect={() => {}} />);
    expect(screen.getByText('Project Charter')).toBeInTheDocument();
    expect(screen.getByText(/82%/)).toBeInTheDocument();
  });

  it('wiki entry has var(--cd) background', () => {
    render(<MemoryNode entry={makeEntry({ type: 'wiki' })} onSelect={() => {}} />);
    expect(getNode().style.background).toBe('var(--cd)');
  });

  it('review entry has var(--b2) background', () => {
    render(<MemoryNode entry={makeEntry({ type: 'review' })} onSelect={() => {}} />);
    expect(getNode().style.background).toBe('var(--b2)');
  });

  it('stale entry has opacity 0.7 and stale meta', () => {
    render(<MemoryNode entry={makeEntry({ freshness: 'stale' })} onSelect={() => {}} />);
    expect(getNode().style.opacity).toBe('0.7');
    expect(screen.getByText(/stale/)).toBeInTheDocument();
  });

  it('selected state has var(--ac) border', () => {
    render(<MemoryNode entry={makeEntry()} isSelected onSelect={() => {}} />);
    expect(getNode().style.border).toContain('var(--ac)');
  });

  it('unselected state has var(--br) border', () => {
    render(<MemoryNode entry={makeEntry()} onSelect={() => {}} />);
    expect(getNode().style.border).toContain('var(--br)');
  });

  it('click triggers onSelect with entry.id', () => {
    const onSelect = vi.fn();
    render(<MemoryNode entry={makeEntry({ id: 'abc' })} onSelect={onSelect} />);
    fireEvent.click(getNode());
    expect(onSelect).toHaveBeenCalledWith('abc');
  });

  it('Enter key triggers onSelect', () => {
    const onSelect = vi.fn();
    render(<MemoryNode entry={makeEntry({ id: 'k1' })} onSelect={onSelect} />);
    fireEvent.keyDown(getNode(), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith('k1');
  });

  it('Space key triggers onSelect', () => {
    const onSelect = vi.fn();
    render(<MemoryNode entry={makeEntry({ id: 'k2' })} onSelect={onSelect} />);
    fireEvent.keyDown(getNode(), { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith('k2');
  });

  it('aria-pressed reflects isSelected', () => {
    const { rerender } = render(<MemoryNode entry={makeEntry()} isSelected={false} onSelect={() => {}} />);
    expect(getNode().getAttribute('aria-pressed')).toBe('false');
    rerender(<MemoryNode entry={makeEntry()} isSelected onSelect={() => {}} />);
    expect(getNode().getAttribute('aria-pressed')).toBe('true');
  });

  it('aria-label includes title, confidence, and type', () => {
    render(<MemoryNode entry={makeEntry({ title: 'Foo', confidence: 0.5, type: 'review' })} onSelect={() => {}} />);
    const label = getNode().getAttribute('aria-label');
    expect(label).toContain('Foo');
    expect(label).toContain('50%');
    expect(label).toContain('review');
  });

  it('confidence rounds correctly (0.823 -> 82%)', () => {
    render(<MemoryNode entry={makeEntry({ confidence: 0.823 })} onSelect={() => {}} />);
    expect(screen.getByText(/82%/)).toBeInTheDocument();
  });
});
