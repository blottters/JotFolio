import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EntryFileDialog } from './EntryFileDialog.jsx';

describe('EntryFileDialog', () => {
  it('returns null when no request', () => {
    const { container } = render(
      <EntryFileDialog request={null} onChange={() => {}} onClose={() => {}} onSubmit={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows rename labels by default and submits the current value', () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();
    render(
      <EntryFileDialog
        request={{ kind: 'rename', value: 'Roadmap.md', path: 'notes/Roadmap.md' }}
        onChange={onChange}
        onClose={() => {}}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText('Rename entry file')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('File name'), { target: { value: 'New.md' } });
    expect(onChange).toHaveBeenCalledWith('New.md');

    fireEvent.click(screen.getByRole('button', { name: 'Rename file' }));
    expect(onSubmit).toHaveBeenCalledWith('Roadmap.md');
  });

  it('shows move-specific labels when kind is move', () => {
    render(
      <EntryFileDialog
        request={{ kind: 'move', value: 'notes/projects' }}
        onChange={() => {}}
        onClose={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByText('Move entry file')).toBeInTheDocument();
    expect(screen.getByLabelText('Vault folder')).toBeInTheDocument();
  });
});
