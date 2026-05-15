import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkspaceContextRail } from './WorkstationViews.jsx';

const selectedNote = {
  id: 'note-roadmap',
  type: 'note',
  title: 'Local-first Roadmap',
  status: 'active',
  tags: ['product'],
  notes: 'References [[Missing Idea]].',
  _path: 'notes/Local-first Roadmap.md',
};

const backlinkNote = {
  id: 'note-backlink',
  type: 'note',
  title: 'Backlink Source',
  tags: [],
  notes: 'Links to [[Local-first Roadmap]].',
  _path: 'notes/Backlink Source.md',
};

describe('WorkspaceContextRail note metadata handoff', () => {
  it('renders NotesRail for a selected note and passes update actions through', () => {
    const onUpdateEntry = vi.fn();
    render(
      <WorkspaceContextRail
        selectedEntry={selectedNote}
        entries={[selectedNote, backlinkNote]}
        showSelected
        onUpdateEntry={onUpdateEntry}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Local-first Roadmap' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Backlinks 1' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Tags 1' }));
    fireEvent.change(screen.getByLabelText('New tag'), { target: { value: 'Research' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add tag' }));

    expect(onUpdateEntry).toHaveBeenCalledWith('note-roadmap', { tags: ['product', 'research'] });
  });
});
