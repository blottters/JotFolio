import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FRONTMATTER_EXTRAS_FIELD } from '../../lib/frontmatter.js';
import { NotesRail } from './NotesRail.jsx';

const selectedNote = {
  id: 'note-roadmap',
  type: 'note',
  title: 'Local-first Roadmap',
  status: 'active',
  tags: ['product', 'planning'],
  notes: 'Follow up on [[Missing Idea]] for the next pass.',
  entry_date: '2026-05-14',
  aliases: ['Roadmap'],
  _path: 'notes/Local-first Roadmap.md',
  [FRONTMATTER_EXTRAS_FIELD]: {
    source: 'imported briefing',
    confidence: 'high',
  },
};

const backlinkNote = {
  id: 'note-backlink',
  type: 'note',
  title: 'Backlink Source',
  tags: ['research'],
  notes: 'This points back to [[Local-first Roadmap]].',
  _path: 'notes/Backlink Source.md',
};

describe('NotesRail', () => {
  it('computes info, backlinks, unresolved links, tags, and properties from the selected note', () => {
    const onOpenEntry = vi.fn();
    const onCreateFromMissing = vi.fn();
    const fileMetaByPath = {
      'notes/Local-first Roadmap.md': {
        size: 2137,
        mtime: Date.parse('2026-05-14T15:30:00.000Z'),
      },
    };

    render(
      <NotesRail
        entry={selectedNote}
        entries={[selectedNote, backlinkNote]}
        fileMetaByPath={fileMetaByPath}
        onOpenEntry={onOpenEntry}
        onCreateFromMissing={onCreateFromMissing}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Local-first Roadmap' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Info' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('notes/Local-first Roadmap.md').length).toBeGreaterThan(0);
    expect(screen.getByText('2.1 KB')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Backlinks 1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open backlink Backlink Source' }));
    expect(onOpenEntry).toHaveBeenCalledWith('note-backlink');

    fireEvent.click(screen.getByRole('tab', { name: 'Unresolved 1' }));
    expect(screen.getByText('Missing Idea')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create note for Missing Idea' }));
    expect(onCreateFromMissing).toHaveBeenCalledWith('Missing Idea');

    fireEvent.click(screen.getByRole('tab', { name: 'Tags 2' }));
    expect(screen.getByRole('button', { name: 'Open tag product' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open tag planning' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Properties' }));
    const props = screen.getByLabelText('Note properties');
    expect(within(props).getByText('aliases')).toBeInTheDocument();
    expect(within(props).getByText('Roadmap')).toBeInTheDocument();
    expect(within(props).getByText('source')).toBeInTheDocument();
    expect(within(props).getByText('imported briefing')).toBeInTheDocument();
  });

  it('adds a normalized tag through onUpdateEntry', () => {
    const onUpdateEntry = vi.fn();
    render(
      <NotesRail
        entry={selectedNote}
        entries={[selectedNote]}
        onUpdateEntry={onUpdateEntry}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Tags 2' }));
    fireEvent.change(screen.getByLabelText('New tag'), { target: { value: ' Research ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));

    expect(onUpdateEntry).toHaveBeenCalledWith('note-roadmap', {
      tags: ['product', 'planning', 'research'],
    });
  });
});
