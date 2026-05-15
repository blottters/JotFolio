import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  CalendarView,
  CommandCenterView,
  GlobalSearchView,
  InboxView,
  ProjectsView,
  SpacesView,
  TagManagerView,
  TasksView,
  WorkspaceContextRail,
  VaultStatusBar,
} from './WorkstationViews.jsx';

const project = { id: 'p-1', type: 'project', title: 'JotFolio 2.0', status: 'active', due: '2026-06-01', space: 'work', tags: ['product'] };
const note = { id: 'n-1', type: 'note', title: 'Local-first Roadmap', tags: ['product'], _path: 'notes/Local-first Roadmap.md' };
const task = { id: 't-1', type: 'task', title: 'Review roadmap', status: 'open', due: '2026-05-14', priority: 'high', project: 'p-1' };
const memory = { id: 'w-1', type: 'wiki', title: 'Local-first Principles', review_after: '2026-05-14' };
const todayLabel = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());

describe('WorkstationViews', () => {
  it('renders the command center home screen and opens real entries', () => {
    const onOpenEntry = vi.fn();
    const onNavigate = vi.fn();
    const onAdd = vi.fn();
    render(
      <CommandCenterView
        model={{
          metrics: { entries: 4, projects: 1, openTasks: 1, memory: 1, trash: 2 },
          recentCaptures: [],
          tasksDueToday: [task],
          memoryReviewsDue: [memory],
          overdueTasks: [{ ...task, id: 't-overdue', title: 'Overdue item', due: '2026-05-13' }],
          recentEntries: [note],
          projectRows: [{ entry: project, entryCount: 3, taskCount: 2, openTaskCount: 1, backlinkCount: 4 }],
        }}
        userName="Gavin"
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByText('Good morning, Gavin')).toBeInTheDocument();
    expect(screen.getByText(todayLabel)).toBeInTheDocument();
    expect(screen.getByText('Pinned')).toBeInTheDocument();
    expect(screen.getAllByText('Design Principles').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marketing Site').length).toBeGreaterThan(0);
    expect(screen.getByText('Deep Work Hub')).toBeInTheDocument();
    expect(screen.getByText('Current Focus')).toBeInTheDocument();
    expect(screen.getByText('Session Goals')).toBeInTheDocument();
    expect(screen.getByText('Related Backlinks (8)')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    expect(screen.queryByText('Needs Attention')).not.toBeInTheDocument();
    expect(screen.getByText(/focus is active/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Note' }));
    fireEvent.click(screen.getByRole('button', { name: 'Templates' }));
    expect(onAdd).toHaveBeenCalledWith('note');
    expect(onNavigate).toHaveBeenCalledWith('templates');
  });

  it('renders project and task routes from derived rows', () => {
    render(<ProjectsView rows={[{ entry: project, entryCount: 3, noteCount: 1, canvasCount: 1, taskCount: 2, openTaskCount: 1, backlinkCount: 4 }]} onOpenEntry={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getAllByText('JotFolio 2.0').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'New Entry' })).toBeInTheDocument();
    expect(screen.getByText('Recent Entries')).toBeInTheDocument();

    render(<TasksView rows={[{ entry: task, project, sourceEntry: note }]} onOpenEntry={vi.fn()} onAdd={vi.fn()} />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Review roadmap')).toBeInTheDocument();
    expect(screen.getByText('Local-first Roadmap')).toBeInTheDocument();
  });

  it('filters, sorts, selects, and wires project workspace actions', () => {
    const onAdd = vi.fn();
    const onOpenEntry = vi.fn();
    const onNewCanvas = vi.fn();
    const onCreateSmartView = vi.fn();
    const onNavigate = vi.fn();
    const onRevealEntry = vi.fn();
    const onUpdateEntry = vi.fn();
    const archived = {
      id: 'p-archived',
      type: 'project',
      title: 'Archive Cleanup',
      status: 'archived',
      tags: ['archive'],
      _path: '/Vault/Projects/Archive Cleanup.md',
    };
    const research = {
      id: 'p-research',
      type: 'project',
      title: 'Local-First Research',
      status: 'planning',
      tags: ['research', 'local-first'],
      _path: '/Vault/Projects/Local-First Research.md',
    };
    const rows = [
      {
        entry: { ...project, starred: true, progress: 68, _path: '/Vault/Projects/JotFolio 2.0.md' },
        linkedEntries: [note],
        entryCount: 3,
        noteCount: 1,
        canvasCount: 1,
        taskCount: 2,
        openTaskCount: 1,
        backlinkCount: 4,
        progress: 68,
        lastActivity: Date.parse('2026-05-11T09:41:00.000Z'),
      },
      {
        entry: research,
        linkedEntries: [],
        entryCount: 2,
        noteCount: 2,
        canvasCount: 0,
        taskCount: 0,
        openTaskCount: 0,
        backlinkCount: 1,
        progress: 20,
        lastActivity: Date.parse('2026-05-10T09:41:00.000Z'),
      },
      {
        entry: archived,
        linkedEntries: [],
        entryCount: 1,
        noteCount: 1,
        canvasCount: 0,
        taskCount: 0,
        openTaskCount: 0,
        backlinkCount: 0,
        progress: 100,
        lastActivity: Date.parse('2026-05-09T09:41:00.000Z'),
      },
    ];

    render(
      <ProjectsView
        rows={rows}
        canvases={[{ id: 'canvas-1', name: 'JotFolio Map', nodes: [{ id: 'node-1', type: 'file', file: 'p-1', x: 0, y: 0, width: 220, height: 140 }], edges: [] }]}
        onOpenEntry={onOpenEntry}
        onAdd={onAdd}
        onNewCanvas={onNewCanvas}
        onCreateSmartView={onCreateSmartView}
        onNavigate={onNavigate}
        onRevealEntry={onRevealEntry}
        onUpdateEntry={onUpdateEntry}
      />,
    );

    expect(screen.getByRole('tab', { name: /All Projects 3/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByText('/Vault/Projects/JotFolio 2.0.md').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('tab', { name: /Starred 1/ }));
    expect(screen.getByRole('button', { name: /Select project JotFolio 2.0/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Select project Local-First Research/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Archived 1/ }));
    expect(screen.getByRole('button', { name: /Select project Archive Cleanup/ })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /All Projects 3/ }));
    fireEvent.change(screen.getByLabelText('Sort projects'), { target: { value: 'name-desc' } });
    const grid = screen.getByTestId('projects-card-grid');
    expect(within(grid).getAllByRole('button', { name: /Select project/ })[0]).toHaveAccessibleName(/Local-First Research/);

    fireEvent.click(screen.getByRole('button', { name: 'List view' }));
    expect(screen.getByTestId('projects-table')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Select project Archive Cleanup/ }));
    expect(within(screen.getByLabelText('Project details')).getByRole('heading', { name: 'Archive Cleanup' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Entry' }));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
      type: 'note',
      folder: 'Projects',
      projectContext: expect.objectContaining({ id: 'p-archived', title: 'Archive Cleanup' }),
    }));

    fireEvent.click(screen.getByRole('button', { name: 'New Canvas' }));
    expect(onNewCanvas).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Archive Cleanup Canvas',
      nodes: [expect.objectContaining({ type: 'file', file: 'p-archived' })],
    }));

    fireEvent.click(screen.getByRole('button', { name: 'Open Smart View' }));
    expect(onCreateSmartView).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-archived', title: 'Archive Cleanup' }));

    const smartViewsSection = screen.getByText('Smart Views').closest('section');
    fireEvent.click(within(smartViewsSection).getByRole('button', { name: 'View all smart views for Archive Cleanup' }));
    expect(onCreateSmartView).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-archived', title: 'Archive Cleanup' }));

    fireEvent.click(screen.getByRole('button', { name: 'View in Constellation' }));
    expect(onNavigate).toHaveBeenCalledWith('graph');

    fireEvent.click(screen.getByRole('button', { name: 'More project actions' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Reveal in Vault' }));
    expect(onRevealEntry).toHaveBeenCalledWith(expect.objectContaining({ id: 'p-archived' }));

    fireEvent.click(screen.getByRole('button', { name: 'Favorite Archive Cleanup' }));
    expect(onUpdateEntry).toHaveBeenCalledWith('p-archived', { starred: true });

    fireEvent.click(screen.getByRole('button', { name: 'Open Entry' }));
    expect(onOpenEntry).toHaveBeenCalledWith('p-archived');
  });

  it('opens real project filters for status and tag', () => {
    const rows = [
      {
        entry: { ...project, status: 'active', tags: ['product'], _path: '/Vault/Projects/JotFolio 2.0.md' },
        linkedEntries: [],
        entryCount: 1,
        noteCount: 0,
        canvasCount: 0,
        taskCount: 0,
        backlinkCount: 0,
      },
      {
        entry: { id: 'p-archive', type: 'project', title: 'Archive Cleanup', status: 'archived', tags: ['cleanup'], _path: '/Vault/Projects/Archive Cleanup.md' },
        linkedEntries: [],
        entryCount: 1,
        noteCount: 0,
        canvasCount: 0,
        taskCount: 0,
        backlinkCount: 0,
      },
    ];

    render(<ProjectsView rows={rows} onOpenEntry={vi.fn()} onAdd={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Filter' }));
    fireEvent.change(screen.getByLabelText('Filter project status'), { target: { value: 'archived' } });

    expect(screen.getByRole('button', { name: /Select project Archive Cleanup/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Select project JotFolio 2.0/ })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filter project tag'), { target: { value: 'product' } });
    expect(screen.queryByRole('button', { name: /Select project Archive Cleanup/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Clear project filters' }));
    expect(screen.getByRole('button', { name: /Select project JotFolio 2.0/ })).toBeInTheDocument();
  });

  it('makes project detail rail close, view-all, and add-tag controls functional', () => {
    const onUpdateEntry = vi.fn();
    render(
      <ProjectsView
        rows={[{
          entry: { ...project, tags: ['product'], _path: '/Vault/Projects/JotFolio 2.0.md' },
          linkedEntries: [note],
          entryCount: 1,
          noteCount: 1,
          canvasCount: 0,
          taskCount: 0,
          openTaskCount: 0,
          backlinkCount: 0,
        }]}
        onOpenEntry={vi.fn()}
        onAdd={vi.fn()}
        onUpdateEntry={onUpdateEntry}
      />,
    );

    const rail = screen.getByLabelText('Project details');
    fireEvent.click(within(rail).getByRole('button', { name: 'View all project entries' }));
    expect(within(rail).getByRole('tab', { name: /Entries 1/ })).toHaveAttribute('aria-selected', 'true');

    fireEvent.click(within(rail).getByRole('button', { name: 'Add project tag' }));
    fireEvent.change(within(rail).getByLabelText('Add project tag'), { target: { value: ' Roadmap ' } });
    fireEvent.keyDown(within(rail).getByLabelText('Add project tag'), { key: 'Enter' });
    expect(onUpdateEntry).toHaveBeenCalledWith('p-1', { tags: ['product', 'roadmap'] });

    fireEvent.click(within(rail).getByRole('button', { name: 'Close project details' }));
    expect(screen.getByText('Project details are hidden.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show project details' }));
    expect(screen.getByRole('heading', { name: 'JotFolio 2.0' })).toBeInTheDocument();
  });

  it('renders inbox triage controls for raw captures', () => {
    const onOpenEntry = vi.fn();
    const onUpdateEntry = vi.fn();
    const onCompileRaw = vi.fn();
    const onBulkTrash = vi.fn();
    const captures = [
      {
        id: 'raw-voice',
        type: 'raw',
        title: 'Voice Note — Interview Jamie Park',
        notes: 'Discussed local-first tools, user research, and future roadmap ideas.',
        tags: ['research', 'interview'],
        status: 'captured',
        source: 'Voice Memos',
        duration: '16:42',
        date: '2026-05-14T09:15:00.000Z',
      },
      {
        id: 'raw-shot',
        type: 'raw',
        title: 'Screenshot 2026-05-11',
        notes: 'UI update concepts for the dashboard layout.',
        tags: ['design', 'ui'],
        status: 'processed',
        mime: 'PNG',
        file_size: '2.1 MB',
        date: '2026-05-14T09:32:00.000Z',
      },
      note,
    ];

    render(
      <InboxView
        entries={captures}
        onOpenEntry={onOpenEntry}
        onUpdateEntry={onUpdateEntry}
        onCompileRaw={onCompileRaw}
        onBulkTrash={onBulkTrash}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('New captures and imports. Review, tag, route, or compile.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /All 2/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Unreviewed 1/ })).toBeInTheDocument();
    expect(screen.getByText('Voice Note — Interview Jamie Park')).toBeInTheDocument();
    expect(screen.getByText('Voice Memos')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Voice Note — Interview Jamie Park' }));
    expect(onOpenEntry).toHaveBeenCalledWith('raw-voice');

    fireEvent.click(screen.getByRole('button', { name: 'Edit tags for Voice Note — Interview Jamie Park' }));
    fireEvent.change(screen.getByLabelText('Tags for Voice Note — Interview Jamie Park'), { target: { value: 'research, urgent' } });
    fireEvent.click(screen.getByText('Save tags'));
    expect(onUpdateEntry).toHaveBeenCalledWith('raw-voice', { tags: ['research', 'urgent'] });

    fireEvent.click(screen.getByRole('button', { name: 'Compile Voice Note — Interview Jamie Park' }));
    expect(onCompileRaw).toHaveBeenCalledWith('raw-voice');

    fireEvent.click(screen.getByLabelText('Select Voice Note — Interview Jamie Park'));
    fireEvent.click(screen.getByText(/Bulk actions/));
    fireEvent.click(screen.getByText('Move to Trash'));
    expect(onBulkTrash).toHaveBeenCalledWith(['raw-voice']);
  });

  it('renders search, calendar, spaces, tags, and vault status from real data', () => {
    const onNavigate = vi.fn();
    const onOpenEntry = vi.fn();
    const onQuickSwitcher = vi.fn();
    const onCommandPalette = vi.fn();
    render(
      <GlobalSearchView
        query="product"
        setQuery={vi.fn()}
        results={{
          entries: [note],
          projects: [project],
          tasks: [],
          tags: [{ id: 'product', name: 'product', count: 2 }],
          smartViews: [{ id: 'base-1', name: 'Product Smart View' }],
          canvases: [{ id: 'canvas-1', name: 'Product Canvas' }],
          templates: [{ id: 'template-1', name: 'Product Brief' }],
        }}
        entries={[note, project]}
        onOpenEntry={onOpenEntry}
        onQuickSwitcher={onQuickSwitcher}
        onCommandPalette={onCommandPalette}
        onNavigate={onNavigate}
      />,
    );
    expect(screen.getByText('Search / Quick Switcher')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Quick Switcher/ }));
    fireEvent.click(screen.getByRole('button', { name: /Command Palette/ }));
    fireEvent.click(screen.getByRole('button', { name: /Entries 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Local-first Roadmap' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Entry/ }));
    fireEvent.click(screen.getByRole('button', { name: /Tags 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Select #product' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Tag/ }));
    fireEvent.click(screen.getByRole('button', { name: /Canvases 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Product Canvas' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Canvas/ }));
    expect(onQuickSwitcher).toHaveBeenCalled();
    expect(onCommandPalette).toHaveBeenCalled();
    expect(onOpenEntry).toHaveBeenCalledWith('n-1');
    expect(onNavigate).toHaveBeenCalledWith('tag:product');
    expect(onNavigate).toHaveBeenCalledWith('canvas:canvas-1');

    render(<CalendarView days={{ '2026-05-14': { date: '2026-05-14', entries: [note], tasks: [task], reviews: [memory] } }} onOpenEntry={vi.fn()} />);
    expect(screen.getByText('Calendar')).toBeInTheDocument();
    expect(screen.getByText('May 14, 2026')).toBeInTheDocument();
    expect(screen.getByText('Review roadmap')).toBeInTheDocument();
    expect(screen.getAllByText('Local-first Roadmap').length).toBeGreaterThan(0);

    render(<SpacesView spaces={[{ id: 'work', name: 'work', count: 3, entries: [project, task, note] }]} onSelectSpace={vi.fn()} />);
    expect(screen.getAllByText('Spaces').length).toBeGreaterThan(0);
    expect(screen.getByText('work')).toBeInTheDocument();
    expect(screen.getByText('1 projects')).toBeInTheDocument();
    expect(screen.getByText('1 open tasks')).toBeInTheDocument();

    render(<TagManagerView tags={[{ id: 'product', name: 'product', count: 2, aliases: ['prod'], description: 'Product work' }]} onSelectTag={vi.fn()} />);
    expect(screen.getByText('Tag Manager')).toBeInTheDocument();
    expect(screen.getByText('prod')).toBeInTheDocument();

    render(<VaultStatusBar vaultInfo={{ root: 'C:/Vault' }} entryCount={4} trashCount={2} issueCount={1} />);
    expect(screen.getByText('C:/Vault')).toBeInTheDocument();
    expect(screen.getByText('4 entries')).toBeInTheDocument();
    expect(screen.getByText('2 trash')).toBeInTheDocument();
    expect(screen.getByText('1 issue needs review')).toBeInTheDocument();
    expect(screen.queryByText('All systems operational')).not.toBeInTheDocument();
  });

  it('keeps calendar journal mode and detail rail actions wired to real callbacks', () => {
    const onOpenEntry = vi.fn();
    const onNavigate = vi.fn();
    const onAdd = vi.fn();
    const journal = {
      id: 'j-1',
      type: 'journal',
      title: 'Daily Journal',
      date: '2026-05-14T08:00:00.000Z',
      _path: '/Vault/Journals/2026-05-14.md',
    };

    render(
      <CalendarView
        days={{ '2026-05-14': { date: '2026-05-14', entries: [note, journal], tasks: [task], projects: [project], reviews: [memory] } }}
        entries={[note, journal, task, project, memory]}
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Journal Entries' }));
    expect(screen.getByRole('button', { name: 'Journal Entries' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Daily Journal').length).toBeGreaterThan(0);
    expect(screen.queryByText('Review roadmap')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Journal Entry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Link Entry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Review Memory' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open in Constellation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close day details' }));
    fireEvent.click(screen.getByRole('button', { name: /Show May 14, 2026/ }));

    expect(onAdd).toHaveBeenCalledWith('journal');
    expect(onNavigate).toHaveBeenCalledWith('search');
    expect(onOpenEntry).toHaveBeenCalledWith('w-1');
    expect(onNavigate).toHaveBeenCalledWith('graph');
    expect(screen.getByRole('button', { name: 'Close day details' })).toBeInTheDocument();
  });

  it('renders and opens every derived global search result group', () => {
    const onNavigate = vi.fn();
    render(
      <GlobalSearchView
        query="product"
        setQuery={vi.fn()}
        results={{
          entries: [],
          projects: [],
          tasks: [],
          tags: [],
          spaces: [{ id: 'work', name: 'work', count: 3, entries: [note], tags: ['product'] }],
          smartViews: [{ id: 'base-product', name: 'Product Smart View', description: 'Product planning' }],
          canvases: [],
          templates: [{ id: 'template-product', name: 'Product Brief', description: 'Product launch brief' }],
        }}
        entries={[note]}
        onOpenEntry={vi.fn()}
        onQuickSwitcher={vi.fn()}
        onCommandPalette={vi.fn()}
        onNavigate={onNavigate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Spaces 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Select work' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Space/ }));
    fireEvent.click(screen.getByRole('button', { name: /Smart Views 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Product Smart View' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Smart View/ }));
    fireEvent.click(screen.getByRole('button', { name: /Templates 1/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Select Product Brief' }));
    fireEvent.click(screen.getByRole('button', { name: /Open Template/ }));

    expect(onNavigate).toHaveBeenCalledWith('space:work');
    expect(onNavigate).toHaveBeenCalledWith('base:base-product');
    expect(onNavigate).toHaveBeenCalledWith('templates');
  });

  it('renders a persistent context rail with today, task, capture, and selected entry details', () => {
    const { container } = render(
      <WorkspaceContextRail
        selectedEntry={note}
        model={{
          metrics: { entries: 4, projects: 1, openTasks: 1, memory: 1 },
          tasksDueToday: [task],
          recentCaptures: [{ id: 'raw-1', type: 'raw', title: 'Voice note', date: '2026-05-14T09:00:00.000Z' }],
        }}
        entries={[project, note, task, memory]}
        onOpenEntry={vi.fn()}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.queryByText('Needs Attention')).not.toBeInTheDocument();
    expect(screen.queryByText('Next Up')).not.toBeInTheDocument();
    expect(screen.getByText('6/9')).toBeInTheDocument();
    expect(screen.getByText(/3 Tasks completed/)).toBeInTheDocument();
    expect(screen.getByText('Review PRD draft')).toBeInTheDocument();
    expect(screen.getByText('Update roadmap')).toBeInTheDocument();
    expect(screen.getByText('Voice Note – Interview Jamie Park')).toBeInTheDocument();
    expect(screen.getByText('Product Hunt – Launch Strategy')).toBeInTheDocument();
    expect(screen.queryByText('Selected Entry')).not.toBeInTheDocument();
  });

  it('can render the home context rail without selected-entry detail', () => {
    render(
      <WorkspaceContextRail
        showSelected={false}
        selectedEntry={note}
        model={{
          metrics: { entries: 4, projects: 1, openTasks: 1, memory: 1 },
          tasksDueToday: [task],
          recentCaptures: [],
        }}
        entries={[project, note, task, memory]}
        onOpenEntry={vi.fn()}
      />,
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText('Review PRD draft')).toBeInTheDocument();
    expect(screen.queryByText('Selected Entry')).not.toBeInTheDocument();
  });
});
