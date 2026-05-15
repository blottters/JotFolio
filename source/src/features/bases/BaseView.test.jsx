import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseView } from './BaseView.jsx';

const entries = [
  { id: 'a', title: 'Alpha', type: 'note', status: 'open', tags: ['product'] },
  { id: 'b', title: 'Beta', type: 'task', status: 'done', tags: ['ops'] },
];

function base(overrides = {}) {
  return {
    id: 'base-1',
    name: 'Product Smart View',
    filters: [],
    sorts: [],
    columns: [],
    activeViewId: 'table',
    views: [
      { id: 'table', type: 'table', name: 'Table' },
      { id: 'cards', type: 'cards', name: 'Cards' },
      { id: 'list', type: 'list', name: 'List' },
    ],
    ...overrides,
  };
}

describe('BaseView controls', () => {
  it('shows default columns as selected and lets users remove one from the default set', () => {
    const onBaseChange = vi.fn();
    render(<BaseView entries={entries} base={base()} onBaseChange={onBaseChange} />);

    fireEvent.click(screen.getByText(/Configure/));

    const titleColumn = screen.getByRole('button', { name: 'title' });
    expect(titleColumn).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(titleColumn);

    expect(onBaseChange).toHaveBeenCalledWith(expect.objectContaining({
      columns: ['type', 'status', 'tags'],
    }));
  });

  it('exposes table column sorting as a keyboard-accessible button', () => {
    const onBaseChange = vi.fn();
    render(<BaseView entries={entries} base={base({ columns: ['title', 'status'] })} onBaseChange={onBaseChange} />);

    const sortTitle = screen.getByRole('button', { name: 'Sort by title' });
    fireEvent.keyDown(sortTitle, { key: 'Enter' });

    expect(onBaseChange).toHaveBeenCalledWith(expect.objectContaining({
      sorts: [{ key: 'title', dir: 'asc' }],
    }));
  });
});
