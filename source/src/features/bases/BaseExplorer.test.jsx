import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BaseExplorer } from './BaseExplorer.jsx';

describe('BaseExplorer', () => {
  it('shows the empty-state CTA when no base is selected', () => {
    render(
      <BaseExplorer
        entries={[]}
        base={null}
        onBaseChange={() => {}}
        onCreateBase={() => {}}
      />,
    );
    expect(screen.getByText('No base selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New Base' })).toBeInTheDocument();
  });

  it('creates a new base after the user types a name and clicks Create', () => {
    const onCreateBase = vi.fn();
    render(
      <BaseExplorer
        entries={[]}
        base={null}
        onBaseChange={() => {}}
        onCreateBase={onCreateBase}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '+ New Base' }));
    const input = screen.getByPlaceholderText('Base name');
    fireEvent.change(input, { target: { value: 'My Base' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    expect(onCreateBase).toHaveBeenCalledTimes(1);
    expect(onCreateBase.mock.calls[0][0]).toMatchObject({ name: 'My Base' });
  });

  it('delegates to BaseView when a base is provided', () => {
    const base = {
      id: 'b1', name: 'Things', filters: [], sorts: [],
      columns: [], activeViewId: 'table',
      views: [{ id: 'table', type: 'table', name: 'Table' }],
    };
    render(
      <BaseExplorer
        entries={[]}
        base={base}
        onBaseChange={() => {}}
        onCreateBase={() => {}}
      />,
    );
    expect(screen.queryByText('No base selected')).not.toBeInTheDocument();
  });
});
