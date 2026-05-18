import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EmptyState } from './EmptyState.jsx';

describe('EmptyState', () => {
  it('renders a filtered no-match state with a clear button', () => {
    const onClear = vi.fn();
    render(
      <EmptyState
        section="all"
        onAdd={() => {}}
        hasFilters
        onClear={onClear}
        query="needle"
      />,
    );
    expect(screen.getByText('No matches')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Clear filters/ }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('passes the section type to onAdd when clicked from a typed section', () => {
    const onAdd = vi.fn();
    render(
      <EmptyState section="note" onAdd={onAdd} hasFilters={false} onClear={() => {}} query="" />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Add Note/ }));
    expect(onAdd).toHaveBeenCalledWith('note');
  });
});
