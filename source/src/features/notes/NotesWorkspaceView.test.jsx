import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotesWorkspaceView } from './NotesWorkspaceView.jsx';

const note = {
  id: 'note-1',
  type: 'note',
  title: 'Building a Local-First Product.md',
  status: 'evergreen',
  project: 'JotFolio 2.0',
  tags: ['local-first', 'plain-files', 'vault', 'product'],
  unresolvedTargets: [{ target: 'Local-first manifesto' }, { target: 'Offline-first patterns' }],
  _path: '/Vault/Projects/JotFolio/Building a Local-First Product.md',
  size: 10400,
  date: '2026-05-11T09:12:00.000Z',
  modified: '2026-05-11T11:04:00.000Z',
  notes: `---
title: Building a Local-First Product
date: 2026-05-11
tags: [local-first, plain-files, vault, product]
status: evergreen
project: JotFolio 2.0
aliases: [local-first product, offline-first product]
---

# Building a Local-First Product

## Principles
- User owns their data
- Plain files over proprietary formats
- Works offline by default
- Security through transparency
- No servers required

## Why it matters
Users retain control, ensure longevity, and avoid vendor lock-in.
Local-first enables resilience, privacy, and portability.`,
};

const backlink = {
  id: 'backlink-1',
  type: 'note',
  title: 'Plain Files Philosophy.md',
  notes: 'This cites [[Building a Local-First Product.md]] for the vault model.',
};

const projectEntry = {
  id: 'project-1',
  type: 'project',
  title: 'Real Project',
  status: 'active',
  tags: ['product'],
};

describe('NotesWorkspaceView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn(async () => undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the screenshot-approved editor panes and rail classes', () => {
    const { container } = render(<NotesWorkspaceView entries={[note, backlink]} activeEntryId="note-1" />);

    expect(screen.getByRole('region', { name: /notes markdown editor/i })).toHaveClass('jf-notes-workspace');
    expect(container.querySelector('.jf-notes-tabbar')).toBeInTheDocument();
    expect(container.querySelector('.jf-notes-toolbar')).toBeInTheDocument();
    expect(container.querySelector('.jf-notes-editor-shell')).toBeInTheDocument();
    expect(container.querySelector('.jf-notes-editor-code')).toBeInTheDocument();
    expect(container.querySelector('.jf-notes-rail')).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /Building a Local-First Product.md/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('button', { name: 'Edit' })).toHaveClass('is-active');
    expect(screen.getByRole('button', { name: /new entry/i })).toBeInTheDocument();

    const toolbar = container.querySelector('.jf-notes-toolbar');
    ['H1', 'H2', 'B', 'I', 'Link', 'Code', 'List', 'Task', 'Quote', 'Image', 'Table'].forEach(label => {
      expect(within(toolbar).getByRole('button', { name: label })).toBeInTheDocument();
    });

    const rail = container.querySelector('.jf-notes-rail');
    expect(within(rail).getByRole('tab', { name: 'Info' })).toHaveAttribute('aria-selected', 'true');
    expect(within(rail).getByRole('tab', { name: 'Backlinks 1' })).toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: 'Unresolved 2' })).toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: 'Tags' })).toBeInTheDocument();
    expect(within(rail).getByRole('tab', { name: 'Properties' })).toBeInTheDocument();

    fireEvent.click(within(rail).getByRole('tab', { name: 'Tags' }));
    expect(within(rail).getByText('#local-first')).toBeInTheDocument();
    fireEvent.click(within(rail).getByRole('tab', { name: 'Backlinks 1' }));
    expect(within(rail).getByText('Plain Files Philosophy.md')).toBeInTheDocument();
    fireEvent.click(within(rail).getByRole('tab', { name: 'Unresolved 2' }));
    expect(within(rail).getByText('Local-first manifesto')).toBeInTheDocument();
  });

  it('edits markdown with toolbar actions, debounces saves, and renders preview', async () => {
    vi.useFakeTimers();
    const onUpdateEntry = vi.fn();
    render(<NotesWorkspaceView entries={[note, backlink]} activeEntryId="note-1" onUpdateEntry={onUpdateEntry} />);

    const editor = screen.getByLabelText('Markdown editor for Building a Local-First Product.md');
    expect(editor).toHaveValue(note.notes);

    editor.focus();
    editor.setSelectionRange(4, 9);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));

    expect(editor).toHaveValue(note.notes.replace('title', '**title**'));

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onUpdateEntry).toHaveBeenCalledWith('note-1', expect.objectContaining({
      notes: note.notes.replace('title', '**title**'),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.queryByLabelText('Markdown editor for Building a Local-First Product.md')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Building a Local-First Product' })).toBeInTheDocument();
  });

  it('uses blank markdown destinations instead of fake toolbar URLs', async () => {
    vi.useFakeTimers();
    const onUpdateEntry = vi.fn();
    render(<NotesWorkspaceView entries={[{ ...note, notes: '' }]} activeEntryId="note-1" onUpdateEntry={onUpdateEntry} />);

    const editor = screen.getByLabelText('Markdown editor for Building a Local-First Product.md');

    fireEvent.click(screen.getByRole('button', { name: 'Link' }));
    expect(editor).toHaveValue('[link text]()');
    expect(editor).not.toHaveValue(expect.stringContaining('example.com'));

    fireEvent.change(editor, { target: { value: '' } });
    editor.setSelectionRange(0, 0);
    fireEvent.click(screen.getByRole('button', { name: 'Image' }));
    expect(editor).toHaveValue('![alt text]()');
    expect(editor).not.toHaveValue(expect.stringContaining('image-url'));

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(onUpdateEntry).toHaveBeenCalledWith('note-1', expect.objectContaining({
      notes: '![alt text]()',
    }));
  });

  it('edits common note metadata from the Properties rail', () => {
    const onUpdateEntry = vi.fn();
    render(<NotesWorkspaceView entries={[note, backlink, projectEntry]} activeEntryId="note-1" onUpdateEntry={onUpdateEntry} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Properties' }));

    fireEvent.change(screen.getByLabelText('Note status'), { target: { value: 'review' } });
    fireEvent.blur(screen.getByLabelText('Note status'));
    expect(onUpdateEntry).toHaveBeenCalledWith('note-1', { status: 'review' });

    fireEvent.change(screen.getByLabelText('Note project'), { target: { value: 'project-1' } });
    expect(onUpdateEntry).toHaveBeenCalledWith('note-1', { project: 'project-1' });

    fireEvent.change(screen.getByLabelText('Note entry date'), { target: { value: '2026-05-15' } });
    expect(onUpdateEntry).toHaveBeenCalledWith('note-1', { entry_date: '2026-05-15' });
  });

  it('adds tags through the rail and resolves backlinks from wiki links', async () => {
    const onUpdateEntry = vi.fn();
    render(<NotesWorkspaceView entries={[note, backlink]} activeEntryId="note-1" onUpdateEntry={onUpdateEntry} />);

    fireEvent.click(screen.getByRole('tab', { name: 'Backlinks 1' }));
    expect(screen.getByText('Plain Files Philosophy.md')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Tags' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));
    const tagInput = screen.getByLabelText('Add note tag');
    fireEvent.change(tagInput, { target: { value: 'research' } });
    fireEvent.keyDown(tagInput, { key: 'Enter' });

    expect(onUpdateEntry).toHaveBeenCalledWith('note-1', expect.objectContaining({
      tags: ['local-first', 'plain-files', 'vault', 'product', 'research'],
    }));
  });

  it('keeps the editor code surface line-numbered and statused like the reference', () => {
    const { container } = render(<NotesWorkspaceView entries={[note]} activeEntryId="note-1" />);

    expect(container.querySelectorAll('.jf-notes-line-number').length).toBeGreaterThan(10);
    expect(screen.getByText(/Markdown/)).toBeInTheDocument();
    expect(screen.getByText(/Live/)).toBeInTheDocument();
    expect(screen.getByText(/words/)).toBeInTheDocument();
  });

  it('wires new entry, reveal, and constellation actions to the active note', () => {
    const onAdd = vi.fn();
    const onRevealEntry = vi.fn();
    const onOpenInConstellation = vi.fn();
    render(
      <NotesWorkspaceView
        entries={[note]}
        activeEntryId="note-1"
        onAdd={onAdd}
        onRevealEntry={onRevealEntry}
        onOpenInConstellation={onOpenInConstellation}
      />,
    );

    fireEvent.click(screen.getAllByRole('button', { name: /new entry/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Reveal in Vault' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open in Constellation' }));

    expect(onAdd).toHaveBeenCalledWith({ type: 'note', folder: 'Notes' });
    expect(onRevealEntry).toHaveBeenCalledWith(note);
    expect(onOpenInConstellation).toHaveBeenCalledWith(note);
  });

  it('copies title and path from the More menu', async () => {
    render(<NotesWorkspaceView entries={[note]} activeEntryId="note-1" />);

    fireEvent.click(screen.getByRole('button', { name: 'More' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy title' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Copy local path' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Building a Local-First Product.md');
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('/Vault/Projects/JotFolio/Building a Local-First Product.md');
    });
  });
});
