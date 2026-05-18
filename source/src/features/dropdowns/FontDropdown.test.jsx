import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FontDropdown } from './FontDropdown.jsx';

describe('FontDropdown', () => {
  it('renders the default-label trigger when no value is set', () => {
    render(<FontDropdown value="" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Theme default/ })).toBeInTheDocument();
  });

  it('opens a listbox of font choices on click', () => {
    const onChange = vi.fn();
    render(<FontDropdown value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    fireEvent.click(options[1]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
