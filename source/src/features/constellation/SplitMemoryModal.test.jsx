import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SplitMemoryModal } from './SplitMemoryModal.jsx';

function makeOriginal(over = {}) {
  return { id: 'm1', title: 'Big Memory', type: 'wiki', ...over };
}
function makeSources(n = 3) {
  return Array.from({ length: n }, (_, i) => ({
    id: `s${i+1}`,
    title: `Source ${i+1}`,
    type: i % 2 === 0 ? 'video' : 'note',
  }));
}

function renderModal(props = {}) {
  const onClose = vi.fn();
  const onSubmit = vi.fn();
  const utils = render(
    <SplitMemoryModal
      original={props.original ?? makeOriginal()}
      originalSources={props.originalSources ?? makeSources(3)}
      onClose={props.onClose ?? onClose}
      onSubmit={props.onSubmit ?? onSubmit}
    />
  );
  return { ...utils, onClose, onSubmit };
}

function advanceTo(count = 2) {
  // Step 1: click count button, click Continue
  fireEvent.click(screen.getByRole('radio', { name: String(count) }));
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
}

describe('SplitMemoryModal', () => {
  it('renders step 1 with split count buttons', () => {
    renderModal();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/how many smaller memories/i)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '2' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '4' })).toBeInTheDocument();
  });

  it('selecting "2" advances to step 2', () => {
    renderModal();
    advanceTo(2);
    expect(screen.getByText(/name each child memory/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply split/i })).toBeInTheDocument();
  });

  it('step 2 renders 2 split columns', () => {
    renderModal();
    advanceTo(2);
    expect(screen.getByText('Part 1')).toBeInTheDocument();
    expect(screen.getByText('Part 2')).toBeInTheDocument();
    expect(screen.queryByText('Part 3')).not.toBeInTheDocument();
  });

  it('each column has title input pre-filled with " - part N"', () => {
    renderModal();
    advanceTo(2);
    const inputs = screen.getAllByPlaceholderText(/child memory title/i);
    expect(inputs).toHaveLength(2);
    expect(inputs[0].value).toBe('Big Memory - part 1');
    expect(inputs[1].value).toBe('Big Memory - part 2');
  });

  it('each column lists all originalSources as checkboxes', () => {
    renderModal({ originalSources: makeSources(3) });
    advanceTo(2);
    // 3 sources × 2 columns = 6 checkbox labels
    const cb1 = screen.getAllByRole('checkbox', { name: /Assign Source 1 to part 1/i });
    const cb2 = screen.getAllByRole('checkbox', { name: /Assign Source 1 to part 2/i });
    expect(cb1).toHaveLength(1);
    expect(cb2).toHaveLength(1);
    // Total checkboxes = 6
    expect(screen.getAllByRole('checkbox')).toHaveLength(6);
  });

  it('cannot submit if any split has empty title', () => {
    const { onSubmit } = renderModal();
    advanceTo(2);
    // Clear title in part 1
    const inputs = screen.getAllByPlaceholderText(/child memory title/i);
    fireEvent.change(inputs[0], { target: { value: '   ' } });
    // Assign sources to both parts
    fireEvent.click(screen.getByRole('checkbox', { name: /Assign Source 1 to part 1/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Assign Source 2 to part 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply split/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/title is required/i)).toBeInTheDocument();
  });

  it('cannot submit if any split has no sources assigned', () => {
    const { onSubmit } = renderModal();
    advanceTo(2);
    // Only assign sources to part 1
    fireEvent.click(screen.getByRole('checkbox', { name: /Assign Source 1 to part 1/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply split/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getAllByText(/assign at least one source/i).length).toBeGreaterThan(0);
  });

  it('valid submit calls onSubmit with array of {title, sourceIds} and triggers onClose', () => {
    const { onSubmit, onClose } = renderModal();
    advanceTo(2);
    fireEvent.click(screen.getByRole('checkbox', { name: /Assign Source 1 to part 1/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Assign Source 2 to part 1/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Assign Source 3 to part 2/i }));
    fireEvent.click(screen.getByRole('button', { name: /apply split/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(Array.isArray(arg)).toBe(true);
    expect(arg).toHaveLength(2);
    expect(arg[0]).toEqual({ title: 'Big Memory - part 1', sourceIds: ['s1', 's2'] });
    expect(arg[1]).toEqual({ title: 'Big Memory - part 2', sourceIds: ['s3'] });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancel button calls onClose without onSubmit', () => {
    const { onClose, onSubmit } = renderModal();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('escape key calls onClose', () => {
    const { onClose } = renderModal();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('click outside modal calls onClose', () => {
    const { onClose } = renderModal();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalled();
  });
});
