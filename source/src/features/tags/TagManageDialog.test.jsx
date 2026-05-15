import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagManageDialog } from './TagManageDialog.jsx';

function makeEntries() {
  return [
    { id: 'a', tags: ['research', 'product'] },
    { id: 'b', tags: ['research', 'design'] },
    { id: 'c', tags: ['product'] },
    { id: 'd', tags: [] },
    { id: 'e' },
  ];
}

function tagRow(name) {
  return screen.getByLabelText(`Tag ${name}`);
}

describe('TagManageDialog', () => {
  it('renders unique tags from entries with counts and nothing when closed', () => {
    const { rerender } = render(
      <TagManageDialog open={false} entries={makeEntries()} onUpdateEntry={vi.fn()} onClose={vi.fn()} />,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(<TagManageDialog open entries={makeEntries()} onUpdateEntry={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('#research')).toBeInTheDocument();
    expect(screen.getByText('#product')).toBeInTheDocument();
    expect(screen.getByText('#design')).toBeInTheDocument();
    expect(screen.queryByText('#unknown')).not.toBeInTheDocument();
    expect(screen.getByText('3 tags')).toBeInTheDocument();
  });

  it('rename mutates every consuming entry and skips others', () => {
    const onUpdateEntry = vi.fn();
    render(
      <TagManageDialog open entries={makeEntries()} onUpdateEntry={onUpdateEntry} onClose={vi.fn()} />,
    );

    const row = tagRow('research');
    const renameInput = within(row).getByLabelText('Rename research');
    fireEvent.change(renameInput, { target: { value: 'science' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Apply rename' }));

    const calls = onUpdateEntry.mock.calls.filter(([id]) => id === 'a' || id === 'b');
    expect(calls).toHaveLength(2);
    const byId = Object.fromEntries(calls);
    expect(byId.a.tags).toEqual(['science', 'product']);
    expect(byId.b.tags).toEqual(['science', 'design']);
    expect(onUpdateEntry.mock.calls.find(([id]) => id === 'c' || id === 'd' || id === 'e')).toBeUndefined();
  });

  it('merge de-duplicates resulting tag arrays', () => {
    const onUpdateEntry = vi.fn();
    render(
      <TagManageDialog open entries={makeEntries()} onUpdateEntry={onUpdateEntry} onClose={vi.fn()} />,
    );

    const row = tagRow('research');
    const mergeSelect = within(row).getByLabelText('Merge research into');
    fireEvent.change(mergeSelect, { target: { value: 'product' } });
    fireEvent.click(within(row).getByRole('button', { name: 'Apply merge' }));

    const calls = onUpdateEntry.mock.calls;
    const byId = Object.fromEntries(calls);
    expect(byId.a.tags).toEqual(['product']);
    expect(byId.b.tags).toEqual(['product', 'design']);
    expect(byId.c).toBeUndefined();
  });

  it('delete confirms inline then removes the tag from every consuming entry', () => {
    const onUpdateEntry = vi.fn();
    render(
      <TagManageDialog open entries={makeEntries()} onUpdateEntry={onUpdateEntry} onClose={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete product' }));
    expect(screen.getByText(/Sure\? This removes the tag from 2 entries\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));

    const calls = onUpdateEntry.mock.calls;
    expect(calls).toHaveLength(2);
    const byId = Object.fromEntries(calls);
    expect(byId.a.tags).toEqual(['research']);
    expect(byId.c.tags).toEqual([]);
    expect(byId.b).toBeUndefined();
  });

  it('Done button invokes onClose', () => {
    const onClose = vi.fn();
    render(
      <TagManageDialog open entries={makeEntries()} onUpdateEntry={vi.fn()} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });
});
