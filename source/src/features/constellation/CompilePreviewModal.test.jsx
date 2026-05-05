import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CompilePreviewModal } from './CompilePreviewModal.jsx';

function makeResult(over = {}) {
  return {
    entry: {
      type: 'wiki',
      title: 'Distributed systems',
      notes: '# Distributed systems\n\nSome compiled body content.',
      canonical_key: 'distributed-systems',
      confidence: 0.84,
    },
    sources: [
      { id: 's1', hash: 'h1', title: 'Source 1', type: 'note' },
      { id: 's2', hash: 'h2', title: 'Source 2', type: 'video' },
    ],
    sourceHash: 'src-hash-abc',
    compiledHash: 'compiled-hash-deadbeef1234',
    confidence: 0.84,
    warnings: [],
    emitted: 'wiki',
    compiler: { name: 'jotfolio-compiler', version: '0.1.0' },
    ...over,
  };
}

function makeSourceEntries(ids = ['s1', 's2']) {
  return ids.map((id, i) => ({
    id,
    title: `Full ${id} title`,
    type: i % 2 === 0 ? 'note' : 'video',
  }));
}

function renderModal(overrides = {}) {
  const onClose = vi.fn();
  const onAccept = vi.fn();
  const utils = render(
    <CompilePreviewModal
      result={overrides.result ?? makeResult()}
      sourceEntries={overrides.sourceEntries ?? makeSourceEntries()}
      onClose={overrides.onClose ?? onClose}
      onAccept={overrides.onAccept ?? onAccept}
    />
  );
  return { ...utils, onClose, onAccept };
}

describe('CompilePreviewModal', () => {
  it('renders title, type chip, confidence percentage', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Compile preview: Distributed systems/)).toBeInTheDocument();
    expect(screen.getByTestId('type-chip')).toHaveTextContent('wiki');
    expect(screen.getByTestId('confidence-badge')).toHaveTextContent('84%');
  });

  it('shows "Save as wiki entry" primary label when emitted=wiki', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /save as wiki entry/i })).toBeInTheDocument();
  });

  it('shows "Save as review entry" primary label when emitted=review', () => {
    renderModal({ result: makeResult({ emitted: 'review' }) });
    expect(screen.getByRole('button', { name: /save as review entry/i })).toBeInTheDocument();
  });

  it('disables primary button when canonical-collision-handauthored warning present', () => {
    const result = makeResult({
      warnings: [{ code: 'canonical-collision-handauthored', message: 'A hand-authored wiki page already owns this slug.' }],
    });
    renderModal({ result });
    const btn = screen.getByRole('button', { name: /save as wiki entry/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('title', expect.stringMatching(/cannot save/i));
  });

  it('renders non-blocking warnings without disabling primary', () => {
    const result = makeResult({
      warnings: [
        { code: 'single-source', message: 'Only one source available.' },
        { code: 'no-canonical-key', message: 'No canonical key resolved.' },
      ],
    });
    renderModal({ result });
    expect(screen.getByText(/Only one source available/)).toBeInTheDocument();
    expect(screen.getByText(/No canonical key resolved/)).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /save as wiki entry/i });
    expect(btn).not.toBeDisabled();
  });

  it('shows "No warnings — clean compile." when warnings array is empty', () => {
    renderModal();
    expect(screen.getByText(/No warnings — clean compile\./)).toBeInTheDocument();
  });

  it('lists provided sourceEntries with title + type chip', () => {
    renderModal();
    expect(screen.getByText('Full s1 title')).toBeInTheDocument();
    expect(screen.getByText('Full s2 title')).toBeInTheDocument();
    // Both types should render a chip with the LABEL text
    expect(screen.getAllByText(/Notes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Videos/i).length).toBeGreaterThan(0);
  });

  it('renders "Source missing: <id>" row for ids absent from sourceEntries', () => {
    // Result references s1+s2 but caller only resolved s1
    renderModal({ sourceEntries: makeSourceEntries(['s1']) });
    expect(screen.getByText(/Source missing: s2/)).toBeInTheDocument();
    expect(screen.getByText('Full s1 title')).toBeInTheDocument();
  });

  it('Cancel button calls onClose', () => {
    const { onClose } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('primary click calls onAccept(result.entry) then onClose', () => {
    const result = makeResult();
    const { onAccept, onClose } = renderModal({ result });
    fireEvent.click(screen.getByRole('button', { name: /save as wiki entry/i }));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onAccept).toHaveBeenCalledWith(result.entry);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape key calls onClose', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Backdrop click calls onClose', () => {
    const { onClose } = renderModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders compiled body inside a <pre> block (monospace)', () => {
    renderModal();
    const pre = screen.getByTestId('compiled-body');
    expect(pre.tagName).toBe('PRE');
    expect(pre).toHaveTextContent(/Some compiled body content/);
    expect(pre.style.fontFamily.toLowerCase()).toMatch(/mono/);
  });
});
