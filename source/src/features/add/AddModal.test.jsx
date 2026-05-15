import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddModal } from './AddModal.jsx';

function renderModal(props = {}) {
  return render(
    <AddModal
      initialType="note"
      existingUrls={new Set()}
      allTags={['design']}
      onClose={vi.fn()}
      onAdd={vi.fn()}
      onCreateCanvas={vi.fn()}
      {...props}
    />,
  );
}

describe('AddModal', () => {
  it('renders the capture/new entry surface and saves a note to inbox', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd });

    expect(screen.getByRole('heading', { name: 'Capture / New Entry' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Note' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Canvas' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('/Vault/Inbox/New Research Entry.md')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Apply Template' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save to Inbox' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      title: 'New Research Entry',
      tags: ['research', 'local-first', 'productivity'],
    }));
    expect(onAdd.mock.calls[0][0].notes).toContain('Template: Research Note');
  });

  it('creates a canvas when the canvas type is selected', async () => {
    const onCreateCanvas = vi.fn();
    const onClose = vi.fn();
    renderModal({ onCreateCanvas, onClose });

    fireEvent.click(screen.getByRole('radio', { name: 'Canvas' }));
    expect(screen.getByDisplayValue('/Vault/Inbox/New Research Entry.canvas.json')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save to Inbox' }));

    expect(onCreateCanvas).toHaveBeenCalledWith('New Research Entry');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('prefills project context for project-owned new entries', () => {
    const onAdd = vi.fn();
    renderModal({
      onAdd,
      projectContext: { id: 'p-1', title: 'JotFolio 2.0', path: '/Vault/Projects/JotFolio 2.0.md' },
      initialFolder: 'Projects',
    });

    expect(screen.getByDisplayValue('/Vault/Projects/New Research Entry.md')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save to Project' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      project: 'p-1',
      project_title: 'JotFolio 2.0',
      tags: expect.arrayContaining(['project']),
    }));
  });

  it('uses the quick capture note surface without the type picker or source URL', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd, quickCapture: true });

    expect(screen.queryByText('Choose entry type')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Source URL')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fast idea' } });
    fireEvent.change(screen.getByPlaceholderText('Start writing or paste your content...'), { target: { value: 'Capture this before it disappears.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save to Inbox' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      title: 'Fast idea',
      notes: expect.stringContaining('Capture this before it disappears.'),
    }));
  });
});
