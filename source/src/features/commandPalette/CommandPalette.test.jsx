import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CommandPalette } from './CommandPalette.jsx';

function registry(commands) {
  return {
    list: () => commands,
    subscribe: () => () => {},
  };
}

const commands = [
  { id: 'alpha', name: 'Alpha command', section: 'General', hint: 'First' },
  { id: 'beta', name: 'Beta command', section: 'General', hint: 'Second' },
];

describe('CommandPalette accessibility', () => {
  it('connects the search input to the active option', () => {
    render(<CommandPalette open registry={registry(commands)} />);

    const input = screen.getByLabelText('Command palette search');
    const listbox = screen.getByRole('listbox', { name: 'Commands' });
    const alpha = screen.getByRole('option', { name: /Alpha command/ });
    const beta = screen.getByRole('option', { name: /Beta command/ });

    expect(input).toHaveAttribute('aria-controls', listbox.id);
    expect(input).toHaveAttribute('aria-activedescendant', alpha.id);
    expect(alpha).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(input).toHaveAttribute('aria-activedescendant', beta.id);
    expect(beta).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps Tab focus inside the dialog', () => {
    render(
      <>
        <button type="button">Outside</button>
        <CommandPalette open registry={registry(commands)} onClose={vi.fn()} />
      </>
    );

    const input = screen.getByLabelText('Command palette search');
    input.focus();

    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(input);
  });
});
