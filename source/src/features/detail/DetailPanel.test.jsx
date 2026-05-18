import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DetailPanel } from './DetailPanel.jsx';

const entry = {
  id: 'e1',
  type: 'note',
  title: 'Alpha',
  status: 'open',
  tags: ['a'],
  notes: 'hello',
  date: '2026-01-01T00:00:00.000Z',
  entry_date: '2026-01-01',
  links: [],
};

function noopProps(overrides = {}) {
  return {
    entry,
    entries: [entry],
    allTags: ['a'],
    onClose: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onToast: vi.fn(),
    onNavigate: vi.fn(),
    onLink: vi.fn(),
    onUnlink: vi.fn(),
    onOpenEntry: vi.fn(),
    ...overrides,
  };
}

describe('DetailPanel', () => {
  it('renders the entry title in a dialog', () => {
    render(<DetailPanel {...noopProps()} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveStyle({ width: '430px', maxWidth: '100vw', top: '60px', bottom: '34px' });
    expect(screen.getByText('Alpha')).toBeInTheDocument();
  });

  it('switches into edit mode when Edit is clicked', () => {
    render(<DetailPanel {...noopProps()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit entry' }));
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
  });

  it('closes when the next click is outside the detail panel', () => {
    const onClose = vi.fn();
    render(
      <>
        <button type="button">Outside app surface</button>
        <DetailPanel {...noopProps({ onClose })} />
      </>,
    );

    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside app surface' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses the discard guard instead of closing on outside click with unsaved edits', () => {
    const onClose = vi.fn();
    render(
      <>
        <button type="button">Outside app surface</button>
        <DetailPanel {...noopProps({ onClose })} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit entry' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Changed title' } });
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside app surface' }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('Discard unsaved edits?')).toBeInTheDocument();
  });
});
