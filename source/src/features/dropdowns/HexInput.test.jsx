import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HexInput } from './HexInput.jsx';

describe('HexInput', () => {
  it('renders with the current value upper-cased', () => {
    render(<HexInput value="#abcdef" onCommit={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('#ABCDEF');
  });

  it('commits a valid 6-digit hex value on blur', () => {
    const onCommit = vi.fn();
    render(<HexInput value="#000000" onCommit={onCommit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '#ff8800' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith('#FF8800');
  });

  it('reverts to the previous value on an invalid commit', () => {
    const onCommit = vi.fn();
    render(<HexInput value="#112233" onCommit={onCommit} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'nope' } });
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('#112233');
  });
});
