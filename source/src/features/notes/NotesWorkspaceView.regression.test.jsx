import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NotesWorkspaceView } from './NotesWorkspaceView.jsx';

const entries = [
  {
    id: 'note-main',
    type: 'note',
    title: 'Local-first Roadmap',
    notes: 'Capture flow',
    tags: ['product', 'planning'],
    status: 'active',
    date: '2026-05-13T12:00:00.000Z',
    modified: '2026-05-13T13:00:00.000Z',
    _path: 'notes/Local-first Roadmap.md',
    unresolvedTargets: [{ target: 'Missing Decision', line: 8 }],
  },
  {
    id: 'note-backlink',
    type: 'note',
    title: 'Meeting Notes',
    notes: 'See [[Local-first Roadmap]] before the sprint review.',
    tags: ['meetings'],
    status: 'active',
    date: '2026-05-12T12:00:00.000Z',
    modified: '2026-05-12T13:00:00.000Z',
    _path: 'notes/Meeting Notes.md',
    links: ['note-main'],
  },
];

function renderWorkspace(overrides = {}) {
  const props = {
    entries,
    activeEntryId: 'note-main',
    onAdd: vi.fn(),
    onOpenEntry: vi.fn(),
    onRevealEntry: vi.fn(),
    onOpenInConstellation: vi.fn(),
    onUpdateEntry: vi.fn(),
    ...overrides,
  };

  render(<NotesWorkspaceView {...props} />);

  return props;
}

afterEach(() => {
  vi.useRealTimers();
});

describe('NotesWorkspaceView regressions', () => {
  it('renders the screenshot-style notes editor surface with note tabs, mode controls, toolbar, and rail', () => {
    renderWorkspace();

    expect(screen.getByRole('region', { name: 'Notes Markdown Editor' })).toBeInTheDocument();
    expect(screen.getByRole('tablist', { name: 'Open notes' })).toBeInTheDocument();

    const modeGroup = screen.getByRole('group', { name: 'Editor mode' });
    expect(within(modeGroup).getByRole('button', { name: 'Edit' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(modeGroup).getByRole('button', { name: 'Preview' })).toBeInTheDocument();
    expect(within(modeGroup).getByRole('button', { name: 'Backlinks' })).toBeInTheDocument();

    const toolbar = screen.getByRole('toolbar', { name: 'Markdown tools' });
    ['H1', 'H2', 'B', 'I', 'Link', 'Code', 'List', 'Task', 'Quote', 'Image', 'Table'].forEach(label => {
      expect(within(toolbar).getByRole('button', { name: label })).toBeInTheDocument();
    });

    const rail = screen.getByRole('complementary', { name: 'Selected note context' });
    expect(within(rail).getByRole('tab', { name: /Backlinks 1/i })).toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: /Unresolved 1/i })).toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: /Tags/i })).toBeInTheDocument();
    expect(within(rail).getByRole('heading', { name: 'Actions' })).toBeInTheDocument();
    expect(within(rail).getByRole('button', { name: 'Reveal in Vault' })).toBeInTheDocument();
  });

  it('applies toolbar insertion to the editor and autosaves through onUpdateEntry', async () => {
    vi.useFakeTimers();
    const props = renderWorkspace();

    const editor = screen.getByRole('textbox', { name: /Markdown editor for Local-first Roadmap/i });
    editor.focus();
    editor.setSelectionRange(0, 7);

    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(editor).toHaveValue('**Capture** flow');

    await act(async () => {
      vi.advanceTimersByTime(750);
    });

    expect(props.onUpdateEntry).toHaveBeenCalledWith(
      'note-main',
      expect.objectContaining({
        notes: '**Capture** flow',
      }),
    );
  });

  it('keeps link and image toolbar inserts free of fake URLs', async () => {
    vi.useFakeTimers();
    const props = renderWorkspace();

    const editor = screen.getByRole('textbox', { name: /Markdown editor for Local-first Roadmap/i });
    fireEvent.change(editor, { target: { value: '' } });
    editor.setSelectionRange(0, 0);

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(editor).toHaveValue('[link text]()');
    expect(editor.value).not.toContain('example.com');

    fireEvent.change(editor, { target: { value: '' } });
    editor.setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Image' }));
    expect(editor).toHaveValue('![alt text]()');
    expect(editor.value).not.toContain('image-url');

    await act(async () => {
      vi.advanceTimersByTime(750);
    });

    expect(props.onUpdateEntry).toHaveBeenCalledWith(
      'note-main',
      expect.objectContaining({
        notes: '![alt text]()',
      }),
    );
  });

  it('opens backlinks and entry actions from the editor-local right rail', () => {
    const props = renderWorkspace();

    const rail = screen.getByRole('complementary', { name: 'Selected note context' });
    fireEvent.click(within(rail).getByRole('tab', { name: /Backlinks 1/i }));
    fireEvent.click(within(rail).getByRole('button', { name: /Meeting Notes/i }));
    expect(props.onOpenEntry).toHaveBeenCalledWith('note-backlink');

    fireEvent.click(within(rail).getByRole('button', { name: 'Open in Constellation' }));
    expect(props.onOpenInConstellation).toHaveBeenCalledWith(expect.objectContaining({ id: 'note-backlink' }));

    fireEvent.click(within(rail).getByRole('button', { name: 'Reveal in Vault' }));
    expect(props.onRevealEntry).toHaveBeenCalledWith(expect.objectContaining({ id: 'note-backlink' }));
  });

  it('uses real note rail tabs and editor utility controls', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(async () => undefined) },
    });
    renderWorkspace();

    const workspace = screen.getByRole('region', { name: 'Notes Markdown Editor' });
    const rail = screen.getByRole('complementary', { name: 'Selected note context' });

    expect(within(rail).getByRole('tab', { name: 'Info' })).toHaveAttribute('aria-selected', 'true');
    expect(within(rail).getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
    expect(within(rail).getByRole('heading', { name: 'Backlinks (1)' })).toBeInTheDocument();
    expect(within(rail).getByRole('heading', { name: 'Unresolved links (1)' })).toBeInTheDocument();
    expect(within(rail).getByRole('heading', { name: 'Properties' })).toBeInTheDocument();
    expect(within(rail).getByRole('heading', { name: 'File' })).toBeInTheDocument();
    expect(within(rail).getByText('Meeting Notes')).toBeInTheDocument();

    fireEvent.click(within(rail).getByRole('tab', { name: /Backlinks 1/i }));
    expect(within(rail).getByRole('tab', { name: /Backlinks 1/i })).toHaveAttribute('aria-selected', 'true');
    expect(within(rail).getByText('Meeting Notes')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Backlinks' }));
    expect(within(rail).getByRole('tab', { name: /Backlinks 1/i })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(within(rail).getByRole('tab', { name: /Unresolved 1/i }));
    expect(within(rail).getByText('Missing Decision')).toBeInTheDocument();

    const editor = screen.getByRole('textbox', { name: /Markdown editor for Local-first Roadmap/i });
    fireEvent.click(screen.getByRole('button', { name: 'Focus editor' }));
    expect(editor).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Fullscreen editor' }));
    expect(workspace).toHaveClass('is-fullscreen');
    expect(screen.getByRole('button', { name: 'Fullscreen editor' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'More editor actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy local path' }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('notes/Local-first Roadmap.md');
  });
});
