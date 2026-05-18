import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ThemeDropdown } from './ThemeDropdown.jsx';
import { THEMES } from '../../lib/theme/themes.js';

describe('ThemeDropdown', () => {
  const firstKey = Object.keys(THEMES)[0];

  it('renders a closed trigger by default', () => {
    render(<ThemeDropdown value={firstKey} onChange={() => {}} customColors={{}} isDark={false} />);
    expect(screen.getByRole('button', { expanded: false })).toBeInTheDocument();
  });

  it('opens the listbox and picks a theme', () => {
    const onChange = vi.fn();
    render(<ThemeDropdown value={firstKey} onChange={onChange} customColors={{}} isDark={false} />);
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const opts = screen.getAllByRole('option');
    expect(opts.length).toBe(Object.keys(THEMES).length);
    fireEvent.click(opts[opts.length - 1]);
    expect(onChange).toHaveBeenCalled();
  });
});
