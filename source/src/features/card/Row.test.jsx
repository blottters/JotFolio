import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Row } from './Row.jsx';

const entry = {
  id: 'e1',
  type: 'note',
  title: 'Alpha',
  status: 'open',
  tags: ['a'],
  date: '2026-01-01T00:00:00.000Z',
  entry_date: '2026-01-01',
  starred: false,
};

describe('Row', () => {
  it('renders the entry title and fires onOpen on click', () => {
    const onOpen = vi.fn();
    render(<Row entry={entry} prefs={{}} onOpen={onOpen} onStar={() => {}} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open Alpha' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('toggles the star button label based on starred state', () => {
    const { rerender } = render(<Row entry={entry} prefs={{}} onOpen={() => {}} onStar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Star entry' })).toBeInTheDocument();
    rerender(<Row entry={{ ...entry, starred: true }} prefs={{}} onOpen={() => {}} onStar={() => {}} />);
    expect(screen.getByRole('button', { name: 'Unstar entry' })).toBeInTheDocument();
  });
});
