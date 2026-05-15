import { describe, expect, it } from 'vitest';
import {
  buildCalendarDays,
  buildCommandCenterModel,
  buildGlobalSearchResults,
  buildProjectRows,
  buildSpaceRows,
  buildTaskRows,
  buildTagRows,
} from './workstationData.js';

const entries = [
  {
    id: 'p-1',
    type: 'project',
    title: 'JotFolio 2.0',
    tags: ['product'],
    status: 'active',
    space: 'work',
    due: '2026-06-01',
    date: '2026-05-12T09:00:00.000Z',
    _path: 'projects/JotFolio 2.0.md',
    links: [],
  },
  {
    id: 'n-1',
    type: 'note',
    title: 'Local-first Roadmap',
    tags: ['product', 'planning'],
    status: 'active',
    project: 'p-1',
    date: '2026-05-13T10:00:00.000Z',
    entry_date: '2026-05-13',
    _path: 'notes/Local-first Roadmap.md',
    links: ['p-1'],
  },
  {
    id: 't-1',
    type: 'task',
    title: 'Review roadmap',
    tags: ['planning'],
    status: 'open',
    project: 'p-1',
    due: '2026-05-14',
    priority: 'high',
    completed: false,
    date: '2026-05-14T08:00:00.000Z',
    _path: 'tasks/Review roadmap.md',
    links: ['n-1'],
  },
  {
    id: 'raw-1',
    type: 'raw',
    title: 'Voice note',
    tags: ['capture'],
    status: 'captured',
    date: '2026-05-14T09:00:00.000Z',
    _path: 'inbox/Voice note.md',
    links: [],
  },
  {
    id: 'w-1',
    type: 'wiki',
    title: 'Wiki Memory: Local-first Principles',
    tags: ['product'],
    status: 'reviewed',
    review_after: '2026-05-14',
    date: '2026-05-11T09:00:00.000Z',
    _path: 'wiki/Local-first Principles.md',
    links: ['n-1'],
  },
];

describe('workstationData', () => {
  it('builds command center metrics from real vault objects', () => {
    const model = buildCommandCenterModel({
      entries,
      bases: [{ id: 'base-1', name: 'Active Research' }],
      canvases: [{ id: 'canvas-1', name: 'Roadmap Canvas' }],
      templates: [{ id: 'template-1', name: 'Daily Reflection' }],
      trashItems: [{ path: '.jotfolio-trash/x.md' }],
      today: '2026-05-14',
    });

    expect(model.metrics.entries).toBe(5);
    expect(model.metrics.projects).toBe(1);
    expect(model.metrics.openTasks).toBe(1);
    expect(model.metrics.memory).toBe(1);
    expect(model.metrics.spaces).toBe(1);
    expect(model.metrics.tags).toBe(3);
    expect(model.metrics.trash).toBe(1);
    expect(model.recentCaptures.map(e => e.id)).toEqual(['raw-1']);
    expect(model.tasksDueToday.map(e => e.id)).toEqual(['t-1']);
    expect(model.memoryReviewsDue.map(e => e.id)).toEqual(['w-1']);
    expect(model.focusQueue.map(e => e.id)).toEqual(['t-1', 'w-1', 'raw-1']);
  });

  it('builds project rows with linked entries and tasks', () => {
    const projects = buildProjectRows(entries);

    expect(projects).toHaveLength(1);
    expect(projects[0].entry.id).toBe('p-1');
    expect(projects[0].entryCount).toBe(2);
    expect(projects[0].taskCount).toBe(1);
    expect(projects[0].openTaskCount).toBe(1);
    expect(projects[0].backlinkCount).toBe(1);
  });

  it('builds task rows sorted by completion, due date, and priority', () => {
    const rows = buildTaskRows([
      ...entries,
      { id: 't-2', type: 'task', title: 'Done task', due: '2026-05-13', priority: 'low', completed: true, status: 'done', tags: [] },
      { id: 't-3', type: 'task', title: 'Urgent task', due: '2026-05-14', priority: 'high', completed: false, status: 'open', tags: [] },
    ]);

    expect(rows.map(row => row.entry.id)).toEqual(['t-1', 't-3', 't-2']);
    expect(rows[0].project?.title).toBe('JotFolio 2.0');
    expect(rows[0].sourceEntry?.title).toBe('Local-first Roadmap');
  });

  it('keeps closed task states out of command-center open counts and due-today work', () => {
    const model = buildCommandCenterModel({
      entries: [
        ...entries,
        { id: 't-2', type: 'task', title: 'Archived task', due: '2026-05-14', status: 'archived', tags: [] },
        { id: 't-3', type: 'task', title: 'Watched task', due: '2026-05-14', status: 'watched', tags: [] },
        { id: 't-4', type: 'task', title: 'Completed task', due: '2026-05-14', completed: true, status: 'open', tags: [] },
      ],
      today: '2026-05-14',
    });

    expect(model.metrics.openTasks).toBe(1);
    expect(model.tasksDueToday.map(task => task.id)).toEqual(['t-1']);
  });

  it('links projects by id, title, path, projects array, and wikilink refs', () => {
    const rows = buildProjectRows([
      entries[0],
      { id: 'n-by-title', type: 'note', title: 'Title ref', project: 'JotFolio 2.0', tags: [], links: [] },
      { id: 'n-by-path', type: 'note', title: 'Path ref', project: 'projects/JotFolio 2.0.md', tags: [], links: [] },
      { id: 'n-by-array', type: 'note', title: 'Array ref', projects: ['p-1'], tags: [], links: [] },
      { id: 'n-by-link', type: 'note', title: 'Link ref', tags: [], links: ['p-1'] },
      { id: 't-by-title', type: 'task', title: 'Task title ref', project: 'JotFolio 2.0', status: 'open', tags: [], links: [] },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].linkedEntries.map(entry => entry.id).sort()).toEqual([
      'n-by-array',
      'n-by-link',
      'n-by-path',
      'n-by-title',
      't-by-title',
    ]);
    expect(rows[0].taskCount).toBe(1);
  });

  it('derives calendar days from entry dates, task due dates, and memory review dates', () => {
    const days = buildCalendarDays(entries);

    expect(days['2026-05-13'].entries.map(e => e.id)).toEqual(['n-1']);
    expect(days['2026-05-14'].tasks.map(e => e.id)).toEqual(['t-1']);
    expect(days['2026-05-14'].reviews.map(e => e.id)).toEqual(['w-1']);
    expect(days['2026-06-01'].projects.map(e => e.id)).toEqual(['p-1']);
  });

  it('builds global search groups across entries, projects, tasks, tags, smart views, canvases, and templates', () => {
    const groups = buildGlobalSearchResults({
      entries,
      bases: [{ id: 'base-1', name: 'Product Smart View' }],
      canvases: [{ id: 'canvas-1', name: 'Product Roadmap Canvas' }],
      templates: [{ id: 'template-1', name: 'Product Brief' }],
      query: 'product',
    });

    expect(groups.entries.map(r => r.id)).toContain('n-1');
    expect(groups.projects.map(r => r.id)).toEqual(['p-1']);
    expect(groups.tasks).toEqual([]);
    expect(groups.memories.map(r => r.id)).toEqual(['w-1']);
    expect(groups.spaces.map(r => r.id)).toEqual(['work']);
    expect(groups.tags.map(r => r.id)).toContain('product');
    expect(groups.smartViews.map(r => r.id)).toEqual(['base-1']);
    expect(groups.canvases.map(r => r.id)).toEqual(['canvas-1']);
    expect(groups.templates.map(r => r.id)).toEqual(['template-1']);
  });

  it('searches memory text and tag metadata aliases without requiring exact tag names', () => {
    const groups = buildGlobalSearchResults({
      entries: [
        ...entries,
        {
          id: 'w-2',
          type: 'wiki',
          title: 'Retention Memory',
          notes: 'Source-grounded reminders for local recovery and restore flow.',
          tags: ['safety'],
          links: [],
        },
      ],
      tagMetadata: [
        { id: 'safety', name: 'safety', aliases: ['restore'], description: 'Recovery and deletion review' },
      ],
      query: 'restore',
    });

    expect(groups.entries.map(entry => entry.id)).toContain('w-2');
    expect(groups.tags.map(tag => tag.id)).toEqual(['safety']);
  });

  it('builds tag rows with usage, aliases, and unresolved counts', () => {
    const tags = buildTagRows(entries, [
      { id: 'product', name: 'product', aliases: ['prod'], description: 'Product work' },
    ]);

    const product = tags.find(tag => tag.name === 'product');
    expect(product.count).toBe(3);
    expect(product.aliases).toEqual(['prod']);
    expect(product.description).toBe('Product work');
  });

  it('builds spaces with project, task, tag, memory, and recent-entry context', () => {
    const spaces = buildSpaceRows(entries);

    expect(spaces).toHaveLength(1);
    expect(spaces[0].id).toBe('work');
    expect(spaces[0].projectCount).toBe(1);
    expect(spaces[0].openTaskCount).toBe(1);
    expect(spaces[0].tagCount).toBe(2);
    expect(spaces[0].recentEntry.id).toBe('t-1');
  });
});
