import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QuickSwitcher } from './QuickSwitcher.jsx';

const entries = [
  { id: 'alpha', title: 'Alpha note', date: '2026-05-01T10:00:00Z' },
  { id: 'beta', title: 'Beta note', date: '2026-05-02T10:00:00Z' },
];

describe('QuickSwitcher accessibility', () => {
  it('connects the search input to the active option', () => {
    render(<QuickSwitcher open entries={entries} />);

    const input = screen.getByLabelText('Quick switcher entry search');
    const listbox = screen.getByRole('listbox', { name: 'Quick switcher results' });
    const beta = screen.getByRole('option', { name: /Beta note/ });
    const alpha = screen.getByRole('option', { name: /Alpha note/ });

    expect(input).toHaveAttribute('aria-controls', listbox.id);
    expect(input).toHaveAttribute('aria-activedescendant', beta.id);
    expect(beta).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(input).toHaveAttribute('aria-activedescendant', alpha.id);
    expect(alpha).toHaveAttribute('aria-selected', 'true');
  });

  it('assigns an active descendant to the create row', () => {
    render(<QuickSwitcher open entries={entries} />);

    const input = screen.getByLabelText('Quick switcher entry search');
    fireEvent.change(input, { target: { value: 'Brand new entry' } });

    const create = screen.getByRole('option', { name: /Create "Brand new entry"/ });
    expect(input).toHaveAttribute('aria-activedescendant', create.id);
    expect(create).toHaveAttribute('aria-selected', 'true');
  });

  it('keeps Tab focus inside the dialog', () => {
    render(
      <>
        <button type="button">Outside</button>
        <QuickSwitcher open entries={entries} onClose={vi.fn()} />
      </>
    );

    const input = screen.getByLabelText('Quick switcher entry search');
    input.focus();

    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(input);
  });
});
