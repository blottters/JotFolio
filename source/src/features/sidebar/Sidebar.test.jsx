import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Sidebar } from './Sidebar.jsx';

const baseProps = {
  open: true,
  width: 280,
  onToggle: vi.fn(),
  section: 'command',
  setSection: vi.fn(),
  counts: { raw: 12, project: 2, note: 7, task: 5, trash: 1 },
  allTags: ['product', 'design', 'research', 'planning', 'ideas'],
  tagCounts: { product: 4, design: 3, research: 2, planning: 1, ideas: 1 },
  filterTag: '',
  setFilterTag: vi.fn(),
  spaces: [
    { id: 'work', name: 'Work', count: 3 },
    { id: 'research', name: 'Research', count: 2 },
    { id: 'writing', name: 'Writing', count: 1 },
    { id: 'personal', name: 'Personal', count: 1 },
  ],
  theme: 'obsidian',
  setTheme: vi.fn(),
  darkMode: 'dark',
  setDarkMode: vi.fn(),
  isDark: true,
  onAdd: vi.fn(),
  onExportJSON: vi.fn(),
  onExportMD: vi.fn(),
  victoryColors: {},
  setVictoryColors: vi.fn(),
  onOpenSettings: vi.fn(),
  folders: [],
  folderFiles: [],
  flags: {},
};

describe('Sidebar', () => {
  it('matches the command-center navigation structure from the reference home screen', () => {
    const setSection = vi.fn();
    render(<Sidebar {...baseProps} setSection={setSection} />);

    [
      'Command Center',
      'Inbox',
      'Search',
      'Projects',
      'Notes',
      'Calendar',
      'Constellation',
      'Tasks',
      'Spaces',
      'Tags',
      'Settings',
      'Trash',
    ].forEach(label => expect(screen.getByText(label)).toBeInTheDocument());

    fireEvent.click(screen.getByText('Spaces'));
    expect(setSection).toHaveBeenCalledWith('spaces');
    expect(screen.getByText('Manage Tags')).toBeInTheDocument();
    expect(screen.queryByText('Library')).not.toBeInTheDocument();
    expect(screen.queryByText('Media')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Setup')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Trash'));
    expect(setSection).toHaveBeenCalledWith('trash');
  });

  it('keeps div-based navigation keyboard operable', () => {
    const setSection = vi.fn();
    render(<Sidebar {...baseProps} setSection={setSection} />);

    const search = screen.getByRole('button', { name: /Search/ });
    search.focus();
    expect(search).toHaveFocus();

    fireEvent.keyDown(search, { key: 'Enter' });
    expect(setSection).toHaveBeenCalledWith('search');

    fireEvent.keyDown(screen.getByRole('button', { name: /Tasks/ }), { key: ' ' });
    expect(setSection).toHaveBeenCalledWith('tasks');
  });

  it('keeps individual spaces out of the sidebar and keeps tags live', () => {
    const setSection = vi.fn();
    const setFilterTag = vi.fn();
    render(
      <Sidebar
        {...baseProps}
        spaces={[
          { id: 'client-work', name: 'Client Work', count: 5 },
          { id: 'archive', name: 'Archive', count: 1 },
        ]}
        allTags={['alpha', 'zeta']}
        tagCounts={{ alpha: 3, zeta: 1 }}
        setSection={setSection}
        setFilterTag={setFilterTag}
      />,
    );

    expect(screen.queryByText('Client Work')).not.toBeInTheDocument();
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
    expect(screen.getByText('alpha')).toBeInTheDocument();
    expect(screen.getByText('zeta')).toBeInTheDocument();
    expect(screen.queryByText('product')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('alpha'));
    expect(setFilterTag).toHaveBeenCalledWith('alpha');
    expect(setSection).toHaveBeenCalledWith('all');
  });

  it('highlights Spaces for mixed-case space routes', () => {
    render(
      <Sidebar
        {...baseProps}
        section="space:Client Work"
        spaces={[{ id: 'Client Work', name: 'Client Work', count: 5 }]}
      />,
    );

    expect(screen.getByRole('button', { name: /Spaces/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
