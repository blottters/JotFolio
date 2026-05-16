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
  it('renders the capture/new entry surface without demo defaults and saves a clean note', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd });

    expect(screen.getByRole('heading', { name: 'Capture / New Entry' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Note' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Project' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Task' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Canvas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Source URL')).toHaveValue('');
    expect(screen.getByDisplayValue('notes/Untitled Note.md')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove research tag' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save to Project' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'First clean note' } });
    fireEvent.change(screen.getByPlaceholderText('Start writing or paste your content...'), { target: { value: 'No generated capture metadata.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Note' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      title: 'First clean note',
      tags: [],
    }));
    expect(onAdd.mock.calls[0][0].url).toBe('');
    expect(onAdd.mock.calls[0][0].notes).toBe('No generated capture metadata.');
    expect(onAdd.mock.calls[0][0].notes).not.toContain('Template:');
    expect(onAdd.mock.calls[0][0].notes).not.toContain('Folder:');
    expect(onAdd.mock.calls[0][0].notes).not.toContain('Capture mode:');
  });

  it.each([
    ['note', 'Create Note'],
    ['journal', 'Create Journal'],
    ['article', 'Create Article'],
    ['podcast', 'Create Podcast'],
    ['video', 'Create Video'],
    ['link', 'Create Link'],
  ])('labels %s creation honestly instead of saying Save to Inbox', (initialType, label) => {
    renderModal({ initialType });

    expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save to Inbox' })).not.toBeInTheDocument();
  });

  it('keeps raw captures labeled as Save to Inbox and saves raw payloads', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd, initialType: 'raw' });

    expect(screen.getByRole('radio', { name: 'Raw' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Inbox capture' } });
    fireEvent.change(screen.getByPlaceholderText('Start writing or paste your content...'), { target: { value: 'Raw capture body.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save to Inbox' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'raw',
      title: 'Inbox capture',
      status: 'captured',
      notes: 'Raw capture body.',
    }));
  });

  it('creates a canvas when the canvas type is selected', async () => {
    const onCreateCanvas = vi.fn();
    const onClose = vi.fn();
    renderModal({ onCreateCanvas, onClose });

    fireEvent.click(screen.getByRole('radio', { name: 'Canvas' }));
    expect(screen.getByDisplayValue('canvases/New Canvas.canvas.json')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create Canvas' }));

    expect(onCreateCanvas).toHaveBeenCalledWith('New Canvas');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('prefills project context for project-owned new entries', () => {
    const onAdd = vi.fn();
    renderModal({
      onAdd,
      projectContext: { id: 'p-1', title: 'JotFolio 2.0', path: '/Vault/Projects/JotFolio 2.0.md' },
      initialFolder: 'Projects',
    });

    expect(screen.getByDisplayValue('notes/Untitled Note.md')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save to Project' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      project: 'p-1',
      project_title: 'JotFolio 2.0',
      tags: ['project'],
    }));
  });

  it('creates real project entries from the Project type', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd, initialType: 'project' });

    expect(screen.getByRole('radio', { name: 'Project' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByDisplayValue('projects/Untitled Project.md')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Launch Plan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'project',
      title: 'Launch Plan',
      status: 'active',
      tags: [],
      project: '',
    }));
  });

  it('creates real task entries from the Task type', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd, initialType: 'task' });

    expect(screen.getByRole('radio', { name: 'Task' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByDisplayValue('tasks/Untitled Task.md')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Review blank workflow' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Task' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'task',
      title: 'Review blank workflow',
      status: 'open',
      tags: [],
      project: '',
    }));
  });

  it('preserves initial space metadata from workspace actions', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd, initialType: 'note', initialSpace: 'Work', initialTitle: 'Work Seed' });

    fireEvent.click(screen.getByRole('button', { name: 'Create Note' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      title: 'Work Seed',
      space: 'Work',
    }));
  });

  it('uses the quick capture note surface without the type picker or source URL', () => {
    const onAdd = vi.fn();
    renderModal({ onAdd, quickCapture: true });

    expect(screen.queryByText('Choose entry type')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Source URL')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fast idea' } });
    fireEvent.change(screen.getByPlaceholderText('Start writing or paste your content...'), { target: { value: 'Capture this before it disappears.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Note' }));

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      title: 'Fast idea',
      notes: expect.stringContaining('Capture this before it disappears.'),
    }));
  });

  it('closes with Escape while the title field is focused', () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    const title = screen.getByLabelText('Title');
    expect(title).toHaveFocus();
    fireEvent.keyDown(title, { key: 'Escape' });

    expect(onClose).toHaveBeenCalled();
  });
});
