import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Select } from './Select.jsx';

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
  ];

  it('renders the label of the current value', () => {
    render(<Select value="a" onChange={() => {}} options={options} ariaLabel="Pick" />);
    expect(screen.getByRole('button', { name: 'Pick' })).toHaveTextContent('Alpha');
  });

  it('opens the listbox and picks an option', () => {
    const onChange = vi.fn();
    render(<Select value="a" onChange={onChange} options={options} ariaLabel="Pick" />);
    fireEvent.click(screen.getByRole('button', { name: 'Pick' }));
    const opt = screen.getByRole('option', { name: 'Beta' });
    fireEvent.click(opt);
    expect(onChange).toHaveBeenCalledWith('b');
  });
});
