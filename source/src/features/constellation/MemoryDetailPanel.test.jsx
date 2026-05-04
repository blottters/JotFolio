import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryDetailPanel } from './MemoryDetailPanel.jsx';

function makeEntry(overrides = {}) {
  return {
    id: 'mem-1',
    title: 'Project Charter',
    type: 'wiki',
    review_status: 'confirmed',
    confidence: 0.82,
    freshness: 'fresh',
    notes: '## Summary\n- Scope is locked\n- Timeline is Q3\n\n## Other\nText.',
    provenance: ['raw-1'],
    valid_from: '2026-04-01',
    ...overrides,
  };
}

function makeVaultIndex(entries = []) {
  const byId = new Map(entries.map((e) => [e.id, e]));
  return {
    byId,
    getBacklinks: vi.fn(() => []),
  };
}

function makeManifest(id, sources) {
  return { entries: { [id]: { sources } } };
}

const noop = () => {};

describe('MemoryDetailPanel', () => {
  it('renders title and confirmed status line for wiki', () => {
    const entry = makeEntry({ provenance: ['raw-1', 'raw-2'] });
    const vaultIndex = makeVaultIndex();
    render(
      <MemoryDetailPanel
        entry={entry}
        vaultIndex={vaultIndex}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByText(/Selected memory: Project Charter/)).toBeInTheDocument();
    expect(
      screen.getByText(/Status: confirmed - verified against 2 source notes/)
    ).toBeInTheDocument();
  });

  it('renders needs-review status line for review entry', () => {
    const entry = makeEntry({
      type: 'review',
      review_status: 'pending',
      valid_from: '2026-03-15',
    });
    render(
      <MemoryDetailPanel
        entry={entry}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(
      screen.getByText(/Status: needs review - last confirmed 2026-03-15/)
    ).toBeInTheDocument();
  });

  it('renders confidence percentage', () => {
    render(
      <MemoryDetailPanel
        entry={makeEntry({ confidence: 0.73 })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByTestId('confidence-chip')).toHaveTextContent('confidence 73%');
  });

  it('shows STALE chip when entry is stale', () => {
    render(
      <MemoryDetailPanel
        entry={makeEntry({ freshness: 'stale' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByTestId('stale-chip')).toHaveTextContent('STALE');
  });

  it('does not show STALE chip when fresh', () => {
    render(
      <MemoryDetailPanel
        entry={makeEntry({ freshness: 'fresh' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.queryByTestId('stale-chip')).not.toBeInTheDocument();
  });

  it('renders facts from parseFacts output', () => {
    render(
      <MemoryDetailPanel
        entry={makeEntry()}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByText('Scope is locked')).toBeInTheDocument();
    expect(screen.getByText('Timeline is Q3')).toBeInTheDocument();
  });

  it('renders fallback when body has no Summary section', () => {
    render(
      <MemoryDetailPanel
        entry={makeEntry({ notes: 'Just plain text, no headings.' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(
      screen.getByText('No facts extracted from compiled body.')
    ).toBeInTheDocument();
  });

  it('renders source evidence from manifest.entries[id].sources', () => {
    const source = { id: 'raw-9', title: 'Meeting Notes', type: 'raw' };
    const entry = makeEntry({ id: 'mem-9', provenance: [] });
    const manifest = makeManifest('mem-9', ['raw-9']);
    render(
      <MemoryDetailPanel
        entry={entry}
        manifest={manifest}
        vaultIndex={makeVaultIndex([source])}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByText('Meeting Notes')).toBeInTheDocument();
    expect(screen.getByText('raw')).toBeInTheDocument();
  });

  it('falls back to entry.provenance when manifest absent', () => {
    const source = { id: 'raw-1', title: 'Source A', type: 'raw' };
    render(
      <MemoryDetailPanel
        entry={makeEntry({ provenance: ['raw-1'] })}
        vaultIndex={makeVaultIndex([source])}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByText('Source A')).toBeInTheDocument();
  });

  it('shows fallback when source id missing from vaultIndex', () => {
    render(
      <MemoryDetailPanel
        entry={makeEntry({ provenance: ['ghost-id'] })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByText(/Source missing \(id: ghost-id\)/)).toBeInTheDocument();
  });

  it('Confirm button click fires onConfirm with entry.id', () => {
    const onConfirm = vi.fn();
    render(
      <MemoryDetailPanel
        entry={makeEntry({ id: 'mem-x' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={onConfirm}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    fireEvent.click(screen.getByLabelText('Confirm memory'));
    expect(onConfirm).toHaveBeenCalledWith('mem-x');
  });

  it('Split button click fires onSplit with entry.id', () => {
    const onSplit = vi.fn();
    render(
      <MemoryDetailPanel
        entry={makeEntry({ id: 'mem-x' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={onSplit}
        onTraceToSources={noop}
      />
    );
    fireEvent.click(screen.getByLabelText('Split into smaller memories'));
    expect(onSplit).toHaveBeenCalledWith('mem-x');
  });

  it('Trace button click fires onTraceToSources with entry.id', () => {
    const onTrace = vi.fn();
    render(
      <MemoryDetailPanel
        entry={makeEntry({ id: 'mem-x' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={onTrace}
      />
    );
    fireEvent.click(screen.getByLabelText('Trace claims to sources'));
    expect(onTrace).toHaveBeenCalledWith('mem-x');
  });

  it('middle-of-job copy switches per type + review_status', () => {
    const reviewEntry = makeEntry({ type: 'review', review_status: 'pending' });
    const { rerender } = render(
      <MemoryDetailPanel
        entry={reviewEntry}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(
      screen.getByText(/The user is reviewing whether this synthesized memory/)
    ).toBeInTheDocument();

    rerender(
      <MemoryDetailPanel
        entry={makeEntry({ type: 'wiki', review_status: 'confirmed' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(screen.getByText(/This memory is trusted/)).toBeInTheDocument();

    rerender(
      <MemoryDetailPanel
        entry={makeEntry({ type: 'wiki', review_status: 'pending' })}
        vaultIndex={makeVaultIndex()}
        onConfirm={noop}
        onSplit={noop}
        onTraceToSources={noop}
      />
    );
    expect(
      screen.getByText('Wiki memory awaiting first confirmation pass.')
    ).toBeInTheDocument();
  });
});
