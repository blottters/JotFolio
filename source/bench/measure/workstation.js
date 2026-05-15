import {
  buildCalendarDays,
  buildCommandCenterModel,
  buildGlobalSearchResults,
  buildProjectRows,
  buildTagRows,
  buildTaskRows,
} from '../../src/lib/workstation/workstationData.js';

function makeEntries(count) {
  const entries = [];
  const projectCount = Math.max(1, Math.floor(count / 50));

  for (let i = 0; i < projectCount; i += 1) {
    entries.push({
      id: `project-${i}`,
      type: 'project',
      title: `Project ${i}`,
      tags: ['project', `area-${i % 7}`],
      status: 'active',
      space: `space-${i % 4}`,
      date: `2026-05-${String((i % 27) + 1).padStart(2, '0')}T09:00:00.000Z`,
      _path: `projects/Project ${i}.md`,
      links: [],
    });
  }

  for (let i = entries.length; i < count; i += 1) {
    const projectId = `project-${i % projectCount}`;
    const isTask = i % 5 === 0;
    const isRaw = i % 17 === 0;
    const isMemory = i % 23 === 0;
    const type = isTask ? 'task' : isRaw ? 'raw' : isMemory ? 'wiki' : 'note';
    entries.push({
      id: `entry-${i}`,
      type,
      title: `${type} ${i}`,
      notes: `Workspace derivation fixture ${i} linked to ${projectId}`,
      tags: [`area-${i % 7}`, `topic-${i % 13}`],
      status: isTask && i % 10 === 0 ? 'done' : 'active',
      project: projectId,
      space: `space-${i % 4}`,
      due: isTask ? `2026-05-${String((i % 27) + 1).padStart(2, '0')}` : undefined,
      priority: isTask ? ['urgent', 'high', 'medium', 'low'][i % 4] : undefined,
      completed: isTask && i % 10 === 0,
      review_after: isMemory ? `2026-05-${String((i % 27) + 1).padStart(2, '0')}` : undefined,
      date: `2026-05-${String((i % 27) + 1).padStart(2, '0')}T10:00:00.000Z`,
      _path: `${type}s/${type} ${i}.md`,
      links: [projectId],
    });
  }

  return entries;
}

function deriveAll({ entries }) {
  const tagRows = buildTagRows(entries);
  buildProjectRows(entries);
  buildTaskRows(entries);
  buildCalendarDays(entries);
  buildCommandCenterModel({ entries, today: '2026-05-14' });
  buildGlobalSearchResults({
    entries,
    tagMetadata: tagRows,
    bases: [{ id: 'base-active', name: 'Active projects' }],
    canvases: [{ id: 'canvas-map', name: 'Workspace map' }],
    templates: [{ id: 'template-brief', name: 'Project brief' }],
    query: 'area-3',
  });
}

export default [
  {
    id: 'workstation-derive-1k',
    setup: () => ({ entries: makeEntries(1000) }),
    fn: deriveAll,
    warmup: 2,
    iterations: 8,
  },
  {
    id: 'workstation-derive-5k',
    setup: () => ({ entries: makeEntries(5000) }),
    fn: deriveAll,
    warmup: 1,
    iterations: 5,
  },
];
