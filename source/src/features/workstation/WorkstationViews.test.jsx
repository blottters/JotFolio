import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    const starredNote = { ...note, id: 'n-starred', title: 'Pinned Note', starred: true, modified: '2026-05-14T10:00:00.000Z' };
    render(
      <CommandCenterView
        model={{
          metrics: { entries: 4, projects: 1, openTasks: 1, memory: 1, trash: 2 },
          recentCaptures: [],
          tasksDueToday: [task],
          memoryReviewsDue: [memory],
          overdueTasks: [{ ...task, id: 't-overdue', title: 'Overdue item', due: '2026-05-13' }],
          recentCaptures: [{ id: 'raw-one', type: 'raw', title: 'Inbox capture' }],
          recentEntries: [starredNote, note],
          projectRows: [{ entry: { ...project, starred: true }, entryCount: 3, taskCount: 2, openTaskCount: 1, backlinkCount: 4, progress: 50, lastActivity: Date.now() }],
        }}
        userName="Gavin"
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onAdd={onAdd}
      />,
    );

    expect(screen.getByRole('heading', { name: /Good (morning|afternoon|evening), Gavin/ })).toBeInTheDocument();
    expect(screen.getByText(todayLabel)).toBeInTheDocument();
    expect(screen.getAllByText('Pinned Note').length).toBeGreaterThan(0);
    expect(screen.getByText('Home Queue')).toBeInTheDocument();
    expect(screen.getByText('Resume last note')).toBeInTheDocument();
    expect(screen.getByText('Resume last note').closest('.jf-home-queue-grid')).not.toBeNull();
    expect(screen.getByText('Resume last note').closest('.jf-home-queue-card')).not.toBeNull();
    expect(screen.getByText('Process Inbox')).toBeInTheDocument();
    expect(screen.getByText('Open active project')).toBeInTheDocument();
    expect(screen.getByText("Continue today's task")).toBeInTheDocument();
    expect(screen.queryByText('Refine core principle statements')).not.toBeInTheDocument();
    expect(screen.queryByText('Create real tasks or review notes to define this session.')).not.toBeInTheDocument();
    // Most-recently-modified note appears as the current focus.
    expect(screen.getAllByText('Pinned Note').length).toBeGreaterThan(0);
    expect(screen.getByText('Recent Work')).toBeInTheDocument();
    expect(screen.queryByText('Needs Attention')).not.toBeInTheDocument();
    expect(screen.getByText(/Pick up real vault work/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Resume last note/ }));
    fireEvent.click(screen.getByRole('button', { name: /Process Inbox/ }));
    expect(onOpenEntry).toHaveBeenCalledWith('n-starred');
    expect(onNavigate).toHaveBeenCalledWith('raw');
  });

  it('scrubs old fake command-center defaults from saved browser state', () => {
    window.localStorage.setItem('jf-command-center-mode-state', JSON.stringify({
      deepWork: {
        sessionGoals: [
          { label: 'Refine core principle statements', done: true },
          { label: 'Map principles to user outcomes', done: true },
          { label: 'Draft practical applications', done: false },
          { label: 'Review with team', done: false },
        ],
      },
    }));

    render(<CommandCenterView model={{ recentEntries: [] }} userName="Gavin" />);

    expect(screen.queryByText('Refine core principle statements')).not.toBeInTheDocument();
    expect(screen.getByText('Home Queue')).toBeInTheDocument();
    expect(screen.getByText('Resume last note')).toBeInTheDocument();
    window.localStorage.removeItem('jf-command-center-mode-state');
  });

  it('does not warn when command-center rows share the same visible title', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.setItem('jf-command-center-mode-state', JSON.stringify({
      deepWork: { activeTab: 'Backlinks' },
    }));

    render(
      <CommandCenterView
        model={{
          recentEntries: [
            { id: 'focus', type: 'note', title: 'Focus Note', notes: 'Working note', modified: '2026-05-14T12:00:00.000Z' },
            { id: 'backlink-a', type: 'note', title: 'JotFolio Command Center', notes: 'Mentions [[Focus Note]]', modified: '2026-05-14T11:00:00.000Z' },
            { id: 'backlink-b', type: 'note', title: 'JotFolio Command Center', notes: 'Also mentions [[Focus Note]]', modified: '2026-05-14T10:00:00.000Z' },
          ],
        }}
        userName="Gavin"
      />,
    );

    expect(screen.getByText('Home Queue')).toBeInTheDocument();
    expect(screen.getAllByText('JotFolio Command Center').length).toBeGreaterThan(0);
    expect(consoleError.mock.calls.some(call => String(call[0]).includes('same key'))).toBe(false);

    consoleError.mockRestore();
    window.localStorage.removeItem('jf-command-center-mode-state');
  });

  it('does not render the old duplicate quick-capture composer in Command Center', async () => {
    const onQuickCapture = vi.fn(async payload => ({ ...payload, id: 'capture-new' }));

    render(
      <CommandCenterView
        model={{ recentCaptures: [] }}
        focusMode="capture"
        userName="Gavin"
        onQuickCapture={onQuickCapture}
        onOpenEntry={vi.fn()}
        onNavigate={vi.fn()}
      />,
    );

    expect(screen.queryByLabelText('Quick capture text')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Capture\s+⌘↵$/ })).not.toBeInTheDocument();
    expect(onQuickCapture).not.toHaveBeenCalled();
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

  it('toggles task completion via inline checkbox without opening the entry', () => {
    const onOpenEntry = vi.fn();
    const onUpdateEntry = vi.fn();
    render(<TasksView rows={[{ entry: task, project, sourceEntry: note }]} onOpenEntry={onOpenEntry} onAdd={vi.fn()} onUpdateEntry={onUpdateEntry} />);
    const checkbox = screen.getByRole('checkbox', { name: /Mark Review roadmap complete/ });
    expect(checkbox).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(checkbox);
    expect(onUpdateEntry).toHaveBeenCalledWith('t-1', { status: 'done', completed: true });
    expect(onOpenEntry).not.toHaveBeenCalled();
  });

  it('does not warn when task metadata repeats the same label', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <TasksView
        rows={[{
          entry: task,
          project: { ...project, title: 'JotFolio Command Center' },
          sourceEntry: { ...note, title: 'JotFolio Command Center' },
        }]}
        onOpenEntry={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByText('Review roadmap')).toBeInTheDocument();
    expect(consoleError.mock.calls.some(call => String(call[0]).includes('same key'))).toBe(false);

    consoleError.mockRestore();
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
        onBulkTrash={onBulkTrash}
        onAdd={vi.fn()}
      />,
    );

    expect(screen.getByText('Inbox')).toBeInTheDocument();
    expect(screen.getByText('New captures and imports. Make them notes, tasks, links, archived items, or trash.')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /All 2/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Unreviewed 1/ })).toBeInTheDocument();
    expect(screen.getByText('Voice Note — Interview Jamie Park')).toBeInTheDocument();
    expect(screen.getByText('Voice Memos')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Flag Voice Note — Interview Jamie Park' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit tags for Voice Note — Interview Jamie Park' })).toHaveTextContent('Tags');
    expect(screen.getByRole('button', { name: 'Make Note from Voice Note — Interview Jamie Park' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Make Task from Voice Note — Interview Jamie Park' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compile Memory from Voice Note — Interview Jamie Park' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Archive Voice Note — Interview Jamie Park' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Move Voice Note — Interview Jamie Park to Trash' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open Voice Note — Interview Jamie Park' }));
    expect(onOpenEntry).toHaveBeenCalledWith('raw-voice');

    fireEvent.click(screen.getByRole('button', { name: 'Edit tags for Voice Note — Interview Jamie Park' }));
    fireEvent.change(screen.getByLabelText('Tags for Voice Note — Interview Jamie Park'), { target: { value: 'research, urgent' } });
    fireEvent.click(screen.getByText('Save tags'));
    expect(onUpdateEntry).toHaveBeenCalledWith('raw-voice', { tags: ['research', 'urgent'] });

    fireEvent.click(screen.getByLabelText('Select Voice Note — Interview Jamie Park'));
    fireEvent.click(screen.getByText(/Bulk actions/));
    fireEvent.click(screen.getByText('Move to Trash'));
    expect(onBulkTrash).toHaveBeenCalledWith(['raw-voice']);
  });

  it('routes a raw inbox capture into Notes as a draft note', async () => {
    const onOpenEntry = vi.fn();
    const onUpdateEntry = vi.fn(async () => {});
    const onCompileRaw = vi.fn();

    render(
      <InboxView
        entries={[{
          id: 'raw-meeting',
          type: 'raw',
          title: 'Meeting capture',
          notes: 'Turn this into a durable note.',
          tags: ['research'],
          status: 'captured',
          source: 'Voice Memos',
          date: '2026-05-14T09:15:00.000Z',
        }]}
        onOpenEntry={onOpenEntry}
        onUpdateEntry={onUpdateEntry}
        onCompileRaw={onCompileRaw}
        onBulkTrash={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Make Note from Meeting capture' }));

    await waitFor(() => {
      expect(onUpdateEntry).toHaveBeenCalledWith('raw-meeting', {
        type: 'note',
        status: 'draft',
        tags: ['research', 'capture'],
        source_type: 'capture',
      });
    });
    expect(onOpenEntry).toHaveBeenCalledWith('raw-meeting');
    expect(onCompileRaw).not.toHaveBeenCalled();
  });

  it('converts raw inbox captures into tasks and links without fake data', async () => {
    const onOpenEntry = vi.fn();
    const onUpdateEntry = vi.fn(async () => {});
    const onBulkTrash = vi.fn();

    render(
      <InboxView
        entries={[{
          id: 'raw-link',
          type: 'raw',
          title: 'Read later capture',
          notes: 'Follow up on https://example.com/research before planning.',
          tags: ['research'],
          status: 'captured',
          source: 'Web Clipper',
          date: '2026-05-14T09:15:00.000Z',
        }]}
        onOpenEntry={onOpenEntry}
        onUpdateEntry={onUpdateEntry}
        onCompileRaw={vi.fn()}
        onBulkTrash={onBulkTrash}
        onAdd={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Make Task from Read later capture' }));
    await waitFor(() => {
      expect(onUpdateEntry).toHaveBeenCalledWith('raw-link', expect.objectContaining({
        type: 'task',
        status: 'open',
        priority: 'normal',
        tags: ['research', 'capture'],
      }));
    });
    expect(onOpenEntry).toHaveBeenCalledWith('raw-link');

    fireEvent.click(screen.getByRole('button', { name: 'Make Link from Read later capture' }));
    await waitFor(() => {
      expect(onUpdateEntry).toHaveBeenCalledWith('raw-link', expect.objectContaining({
        type: 'link',
        status: 'active',
        url: 'https://example.com/research',
        tags: ['research', 'capture'],
      }));
    });
    expect(onUpdateEntry.mock.calls.flatMap(call => Object.values(call[1] || {})).join(' ')).not.toContain('example.com/research-note');

    fireEvent.click(screen.getByRole('button', { name: 'Archive Read later capture' }));
    expect(onUpdateEntry).toHaveBeenCalledWith('raw-link', { status: 'archived' });

    fireEvent.click(screen.getByRole('button', { name: 'Move Read later capture to Trash' }));
    expect(onBulkTrash).toHaveBeenCalledWith(['raw-link']);
  });

  it('attaches a raw inbox capture to a real project and preserves the project on conversion', async () => {
    const onUpdateEntry = vi.fn(async () => {});
    const onOpenEntry = vi.fn();
    const projectEntry = { ...project, id: 'project-real', title: 'Real Project', _path: 'projects/Real Project.md' };

    render(
      <InboxView
        entries={[
          projectEntry,
          {
            id: 'raw-project',
            type: 'raw',
            title: 'Project capture',
            notes: 'Needs to land under a real project.',
            tags: ['planning'],
            status: 'captured',
            date: '2026-05-14T09:15:00.000Z',
          },
        ]}
        onOpenEntry={onOpenEntry}
        onUpdateEntry={onUpdateEntry}
        onCompileRaw={vi.fn()}
        onBulkTrash={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Attach Project to Project capture' }));
    const picker = await screen.findByRole('dialog', { name: 'Attach capture to project' });
    fireEvent.click(within(picker).getByRole('button', { name: 'Attach to Real Project' }));

    expect(onUpdateEntry).toHaveBeenCalledWith('raw-project', { project: 'project-real' });

    render(
      <InboxView
        entries={[
          projectEntry,
          {
            id: 'raw-attached',
            type: 'raw',
            title: 'Attached capture',
            notes: 'Make this a project task.',
            tags: ['planning'],
            status: 'captured',
            project: 'project-real',
            date: '2026-05-14T09:15:00.000Z',
          },
        ]}
        onOpenEntry={onOpenEntry}
        onUpdateEntry={onUpdateEntry}
        onCompileRaw={vi.fn()}
        onBulkTrash={vi.fn()}
        onAdd={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Make Task from Attached capture' }));
    await waitFor(() => {
      expect(onUpdateEntry).toHaveBeenCalledWith('raw-attached', expect.objectContaining({
        type: 'task',
        project: 'project-real',
      }));
    });
  });

  it('offers project creation from the attach picker when no projects exist', async () => {
    const onAdd = vi.fn();

    render(
      <InboxView
        entries={[{
          id: 'raw-no-projects',
          type: 'raw',
          title: 'No project capture',
          notes: 'Needs a project but none exist.',
          tags: [],
          status: 'captured',
          date: '2026-05-14T09:15:00.000Z',
        }]}
        onOpenEntry={vi.fn()}
        onUpdateEntry={vi.fn()}
        onCompileRaw={vi.fn()}
        onBulkTrash={vi.fn()}
        onAdd={onAdd}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Attach Project to No project capture' }));
    const picker = await screen.findByRole('dialog', { name: 'Attach capture to project' });
    expect(within(picker).getByText('No projects yet.')).toBeInTheDocument();

    fireEvent.click(within(picker).getByRole('button', { name: 'Create Project' }));
    expect(onAdd).toHaveBeenCalledWith('project');
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
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getAllByText('Local-first Roadmap').length).toBeGreaterThan(0);

    render(<SpacesView spaces={[{ id: 'work', name: 'Work', count: 3, entries: [project, task, note] }]} onSelectSpace={vi.fn()} />);
    expect(screen.getAllByText('Spaces').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Work').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Projects').length).toBeGreaterThan(0);
    expect(screen.getByText('Open Tasks')).toBeInTheDocument();

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

    fireEvent.click(screen.getByRole('button', { name: 'Review Memory' }));
    expect(onOpenEntry).toHaveBeenCalledWith('w-1');

    fireEvent.click(screen.getByRole('button', { name: 'Journal Entries' }));
    expect(screen.getByRole('button', { name: 'Journal Entries' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('Daily Journal').length).toBeGreaterThan(0);
    expect(screen.queryByText('Local-first Roadmap')).not.toBeInTheDocument();
    expect(screen.queryByText('Review roadmap')).not.toBeInTheDocument();
    expect(screen.queryByText('Local-first Principles')).not.toBeInTheDocument();
    expect(screen.queryByText('JotFolio 2.0')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'New Journal Entry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Link Entry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Open in Constellation' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close day details' }));
    fireEvent.click(screen.getByRole('button', { name: /Show May 14, 2026/ }));

    expect(onAdd).toHaveBeenCalledWith('journal');
    expect(onNavigate).toHaveBeenCalledWith('search');
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

  it('renders Spaces as a functional workspace and wires its actions', () => {
    const onAdd = vi.fn();
    const onOpenEntry = vi.fn();
    const onNavigate = vi.fn();
    const onSelectSpace = vi.fn();
    const onUpdateEntry = vi.fn();
    render(
      <SpacesView
        spaces={[{ id: 'work', name: 'Work', count: 3, entries: [project, task, note], tags: ['product'] }]}
        onAdd={onAdd}
        onOpenEntry={onOpenEntry}
        onNavigate={onNavigate}
        onSelectSpace={onSelectSpace}
        onUpdateEntry={onUpdateEntry}
      />,
    );

    expect(screen.getByRole('region', { name: 'Spaces workspace' })).toBeInTheDocument();
    expect(screen.getByText('Space Health')).toBeInTheDocument();
    expect(screen.getByText('Automation Rules')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Open filtered list/ }));
    expect(onSelectSpace).toHaveBeenCalledWith('work');

    fireEvent.click(screen.getByRole('button', { name: /Create note in Work/ }));
    expect(onAdd).toHaveBeenCalledWith({ type: 'note', initialSpace: 'Work' });

    fireEvent.click(screen.getByRole('button', { name: /Capture to Work/ }));
    expect(onAdd).toHaveBeenCalledWith({ type: 'raw', initialSpace: 'Work' });

    fireEvent.click(screen.getByRole('button', { name: /Open in Constellation/ }));
    expect(onNavigate).toHaveBeenCalledWith('graph');

    fireEvent.click(screen.getByLabelText(`Change Work color`));
    fireEvent.click(screen.getByRole('button', { name: /Local-first Roadmap/ }));
    expect(onOpenEntry).toHaveBeenCalledWith('n-1');
  });

  it('creates a new space through a real project seed capture', () => {
    const onAdd = vi.fn();
    render(<SpacesView spaces={[]} onAdd={onAdd} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create first space' }));
    fireEvent.change(screen.getByLabelText('Space name'), { target: { value: 'Studio' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create project seed' }));

    expect(onAdd).toHaveBeenCalledWith({
      type: 'project',
      initialSpace: 'Studio',
      initialTitle: 'Studio Space',
    });
  });

  it('renders a persistent context rail with today, task, capture, and selected entry details', () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const dueToday = { ...task, id: 't-today', title: 'Today task', due: todayKey, entry_date: todayKey, completed: false, status: 'open' };
    const doneToday = { ...task, id: 't-done', title: 'Done task', due: todayKey, entry_date: todayKey, completed: true, status: 'done' };
    const rawToday = { id: 'raw-1', type: 'raw', title: 'Voice note from meeting', date: `${todayKey}T09:00:00.000Z`, modified: `${todayKey}T09:00:00.000Z`, entry_date: todayKey };
    render(
      <WorkspaceContextRail
        selectedEntry={note}
        model={{
          metrics: { entries: 4, projects: 1, openTasks: 1, memory: 1 },
          taskRows: [
            { entry: dueToday, statusKey: 'todo', isDone: false, dueState: 'today' },
            { entry: doneToday, statusKey: 'done', isDone: true, dueState: 'done' },
          ],
          tasksDueToday: [dueToday],
          recentCaptures: [rawToday],
        }}
        entries={[project, note, dueToday, doneToday, rawToday, memory]}
        onOpenEntry={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.queryByText('Needs Attention')).not.toBeInTheDocument();
    expect(screen.queryByText('Next Up')).not.toBeInTheDocument();
    // Ring shows real completed/total — one done, two total.
    expect(screen.getByText('1/2')).toBeInTheDocument();
    expect(screen.getByText(/1 Task completed/)).toBeInTheDocument();
    // Open task row appears, completed one filtered out.
    expect(screen.getByText('Today task')).toBeInTheDocument();
    // Recent capture surfaces by title.
    expect(screen.getByText('Voice note from meeting')).toBeInTheDocument();
    expect(screen.queryByText('Selected Entry')).not.toBeInTheDocument();
  });

  it('can render the home context rail without selected-entry detail', () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const dueToday = { ...task, id: 't-today', title: 'Today task', due: todayKey, entry_date: todayKey, completed: false, status: 'open' };
    render(
      <WorkspaceContextRail
        showSelected={false}
        selectedEntry={note}
        model={{
          metrics: { entries: 4, projects: 1, openTasks: 1, memory: 1 },
          taskRows: [{ entry: dueToday, statusKey: 'todo', isDone: false, dueState: 'today' }],
          tasksDueToday: [dueToday],
          recentCaptures: [],
        }}
        entries={[project, note, dueToday, memory]}
        onOpenEntry={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    expect(screen.getByText('Today task')).toBeInTheDocument();
    expect(screen.queryByText('Selected Entry')).not.toBeInTheDocument();
  });
});
