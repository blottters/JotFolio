import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConstellationStateOverlay } from './ConstellationStateOverlay.jsx';

describe('ConstellationStateOverlay', () => {
  it('renders nothing for unknown state', () => {
    const { container } = render(<ConstellationStateOverlay state="bogus" />);
    expect(container.firstChild).toBeNull();
  });

  it('locked: shows glyph, headline, and "You have N." with provided count', () => {
    render(<ConstellationStateOverlay state="locked" count={5} onAdd={() => {}} />);
    expect(screen.getByText('⌁')).toBeInTheDocument();
    expect(screen.getByText('Graph unlocks at 3 entries.')).toBeInTheDocument();
    expect(screen.getByText(/You have 5\./)).toBeInTheDocument();
  });

  it('locked: clicking primary button calls onAdd', () => {
    const onAdd = vi.fn();
    render(<ConstellationStateOverlay state="locked" count={2} onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: /add another/i }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('empty: shows headline and inline [[links]] sub copy', () => {
    render(<ConstellationStateOverlay state="empty" />);
    expect(screen.getByText("Nothing's connected yet.")).toBeInTheDocument();
    // [[links]] is rendered inside a <code> sandwiched in the sub copy paragraph.
    const code = screen.getByText('[[links]]');
    expect(code.tagName.toLowerCase()).toBe('code');
    expect(code.parentElement.textContent).toMatch(
      /Add \[\[links\]\], backlinks, or memory sources between entries/
    );
  });

  it('empty: renders no buttons', () => {
    render(<ConstellationStateOverlay state="empty" />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('no-matches: shows headline + Reset filters button', () => {
    render(<ConstellationStateOverlay state="no-matches" onReset={() => {}} />);
    expect(screen.getByText('No entries match this filter.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset filters/i })).toBeInTheDocument();
  });

  it('no-matches: clicking the reset button calls onReset', () => {
    const onReset = vi.fn();
    render(<ConstellationStateOverlay state="no-matches" onReset={onReset} />);
    fireEvent.click(screen.getByRole('button', { name: /reset filters/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('error: uses assertive alert semantics and recovery copy', () => {
    render(<ConstellationStateOverlay state="error" message="Index is still warming up." />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
    expect(screen.getByText('Constellation could not render.')).toBeInTheDocument();
    expect(screen.getByText('Index is still warming up.')).toBeInTheDocument();
  });

  it('outer container has role="status" and aria-live="polite"', () => {
    render(<ConstellationStateOverlay state="locked" count={1} onAdd={() => {}} />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('glyph rendered as text content (not an image)', () => {
    render(<ConstellationStateOverlay state="empty" />);
    const glyph = screen.getByText('⌁');
    expect(glyph.tagName.toLowerCase()).toBe('div');
    // No <img> in the overlay
    expect(document.querySelector('img')).toBeNull();
  });
});
