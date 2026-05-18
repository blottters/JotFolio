import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Card } from './Card.jsx';

const baseEntry = {
  id: 'e1',
  type: 'note',
  title: 'Alpha',
  status: 'open',
  notes: 'Some note body',
  tags: ['a', 'b'],
  date: '2026-01-01T00:00:00.000Z',
  entry_date: '2026-01-01',
  starred: false,
};

describe('Card', () => {
  it('renders the entry title', () => {
    render(<Card entry={baseEntry} prefs={{}} onOpen={() => {}} onStar={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('fires onStar when the star button is clicked', () => {
    const onStar = vi.fn();
    render(<Card entry={baseEntry} prefs={{}} onOpen={() => {}} onStar={onStar} />);
    fireEvent.click(screen.getByRole('button', { name: 'Star entry' }));
    expect(onStar).toHaveBeenCalledTimes(1);
  });

  it('shows a delete button only when onDelete is provided', () => {
    const onDelete = vi.fn();
    const { rerender } = render(
      <Card entry={baseEntry} prefs={{}} onOpen={() => {}} onStar={() => {}} />,
    );
    expect(screen.queryByRole('button', { name: /Delete/ })).not.toBeInTheDocument();

    rerender(<Card entry={baseEntry} prefs={{}} onOpen={() => {}} onStar={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /Delete Alpha/ }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
