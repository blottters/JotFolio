const DONE_STATUSES = new Set(['done', 'complete', 'archived', 'watched']);
const MEMORY_TYPES = new Set(['wiki', 'review']);
const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, normal: 3, low: 4 };
const BLOCKED_STATUSES = new Set(['blocked', 'stuck', 'waiting']);
const ACTIVE_PROJECT_STATUSES = new Set(['active', 'open', 'in-progress', 'planning', 'current']);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function cleanDate(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

function lower(value) {
  return String(value || '').toLowerCase();
}

function normalizeToken(value) {
  return lower(value).replace(/^#/, '').trim();
}

function dateValue(value) {
  const date = cleanDate(value);
  if (!date) return 0;
  const parsed = Date.parse(date);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateLabel(value) {
  return cleanDate(value) || '';
}

function parseProgress(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  if (typeof value === 'string') {
    const match = value.match(/\d+(?:\.\d+)?/);
    if (match) return Math.max(0, Math.min(100, Number(match[0])));
  }
  return null;
}

function entryText(entry) {
  return [
    entry?.title,
    entry?.notes,
    entry?.summary,
    entry?.content,
    entry?.body,
    entry?.status,
    entry?.type,
    entry?.space,
    entry?.project,
    entry?.url,
    entry?.source,
    entry?.source_url,
    entry?._path,
    ...asArray(entry?.tags),
    ...asArray(entry?.aliases),
    ...asArray(entry?.links),
    ...asArray(entry?.unresolvedTargets),
  ].filter(Boolean).join(' ');
}

function queryTokens(query) {
  const q = lower(query).trim();
  if (!q) return [];
  return q.split(/\s+/).filter(Boolean);
}

function matchesQuery(value, query) {
  const text = lower(value);
  const tokens = queryTokens(query);
  if (tokens.length === 0) return true;
  return tokens.every(token => {
    const clean = normalizeToken(token);
    if (!clean) return true;
    if (token.startsWith('type:')) return text.includes(`type:${token.slice(5)}`) || text.includes(token.slice(5));
    if (token.startsWith('space:')) return text.includes(token.slice(6));
    if (token.startsWith('tag:')) return text.includes(token.slice(4));
    return text.includes(clean);
  });
}

function isOpenTask(entry) {
  if (!entry || entry.type !== 'task') return false;
  if (entry.completed === true) return false;
  return !DONE_STATUSES.has(lower(entry.status));
}

function isDone(entry) {
  return entry?.completed === true || DONE_STATUSES.has(lower(entry?.status));
}

function taskDueState(entry, today = cleanDate(new Date())) {
  if (isDone(entry)) return 'done';
  const due = cleanDate(entry?.due);
  if (!due) return 'unscheduled';
  if (due < today) return 'overdue';
  if (due === today) return 'today';
  return 'upcoming';
}

function taskStatusLabel(entry, today) {
  const state = taskDueState(entry, today);
  if (state === 'today') return 'Due today';
  if (state === 'overdue') return 'Overdue';
  if (state === 'upcoming') return `Due ${cleanDate(entry.due)}`;
  if (state === 'done') return 'Done';
  return 'No due date';
}

function findEntry(entries, ref) {
  if (!ref) return undefined;
  return entries.find(entry => entry.id === ref || entry.title === ref || entry._path === ref);
}

function projectRefs(project) {
  return new Set([project.id, project.title, project._path].filter(Boolean));
}

function belongsToProject(entry, project) {
  if (!entry || !project || entry.id === project.id) return false;
  const refs = projectRefs(project);
  if (refs.has(entry.project)) return true;
  if (refs.has(entry.project_id)) return true;
  if (refs.has(entry.projectId)) return true;
  if (refs.has(entry.parent_project)) return true;
  if (refs.has(entry.parentProject)) return true;
  if (asArray(entry.projects).some(ref => refs.has(ref))) return true;
  return asArray(entry.links).some(ref => refs.has(ref));
}

function spaceForEntry(entry, entries) {
  const direct = String(entry?.space || '').trim();
  if (direct) return direct;
  const project =
    findEntry(entries, entry?.project)
    || findEntry(entries, entry?.project_id)
    || findEntry(entries, entry?.projectId)
    || asArray(entry?.projects).map(ref => findEntry(entries, ref)).find(Boolean)
    || asArray(entry?.links).map(ref => findEntry(entries, ref)).find(candidate => candidate?.type === 'project');
  return String(project?.space || '').trim();
}

function activityStamp(entry) {
  return Math.max(
    dateValue(entry?.modified),
    dateValue(entry?.updated),
    dateValue(entry?.date),
    dateValue(entry?.entry_date),
  );
}

function sortByRecentDate(a, b) {
  return activityStamp(b) - activityStamp(a) || String(b.title || '').localeCompare(String(a.title || ''));
}

function sortByTitle(a, b) {
  return String(a.title || '').localeCompare(String(b.title || ''));
}

function sortTasks(a, b) {
  const aDone = isOpenTask(a.entry) ? 0 : 1;
  const bDone = isOpenTask(b.entry) ? 0 : 1;
  if (aDone !== bDone) return aDone - bDone;

  const aDue = cleanDate(a.entry.due) || '9999-12-31';
  const bDue = cleanDate(b.entry.due) || '9999-12-31';
  if (aDue !== bDue) return aDue.localeCompare(bDue);

  const aPriority = PRIORITY_RANK[lower(a.entry.priority)] ?? 3;
  const bPriority = PRIORITY_RANK[lower(b.entry.priority)] ?? 3;
  if (aPriority !== bPriority) return aPriority - bPriority;

  return 0;
}

export function buildProjectRows(entries = []) {
  return entries
    .filter(entry => entry.type === 'project')
    .sort(sortByTitle)
    .map(project => {
      const linkedEntries = entries.filter(entry => belongsToProject(entry, project)).sort(sortByRecentDate);
      const tasks = linkedEntries.filter(entry => entry.type === 'task');
      const openTasks = tasks.filter(isOpenTask);
      const doneTasks = tasks.filter(isDone);
      const backlinks = entries.filter(entry => (
        entry.id !== project.id && asArray(entry.links).some(ref => projectRefs(project).has(ref))
      ));
      const parsedProgress = parseProgress(project.progress);
      const progress = parsedProgress ?? (tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0);
      const lastActivity = [project, ...linkedEntries].reduce((latest, entry) => Math.max(latest, activityStamp(entry)), 0);
      const blockedTaskCount = tasks.filter(task => BLOCKED_STATUSES.has(lower(task.status))).length;
      const overdueTaskCount = openTasks.filter(task => taskDueState(task) === 'overdue').length;

      return {
        entry: project,
        linkedEntries,
        tasks,
        openTasks,
        doneTasks,
        nextTask: buildTaskRows(linkedEntries.length ? [project, ...linkedEntries] : entries).find(row => row.entry.type === 'task' && belongsToProject(row.entry, project))?.entry,
        entryCount: linkedEntries.length,
        taskCount: tasks.length,
        openTaskCount: openTasks.length,
        doneTaskCount: doneTasks.length,
        backlinkCount: backlinks.length,
        blockedTaskCount,
        overdueTaskCount,
        progress,
        lastActivity,
        due: cleanDate(project.due),
        dueState: cleanDate(project.due) && cleanDate(project.due) < cleanDate(new Date()) && !isDone(project) ? 'overdue' : 'open',
        status: project.status || (ACTIVE_PROJECT_STATUSES.has(lower(project.status)) ? project.status : 'active'),
      };
    });
}

export function buildTaskRows(entries = [], { today = cleanDate(new Date()) } = {}) {
  const rows = entries
    .filter(entry => entry.type === 'task')
    .map(entry => ({
      entry,
      project: findEntry(entries, entry.project),
      sourceEntry:
        findEntry(entries, entry.source_entry)
        || findEntry(entries, entry.sourceEntry)
        || findEntry(entries, asArray(entry.links)[0]),
      due: cleanDate(entry.due),
      dueState: taskDueState(entry, today),
      statusLabel: taskStatusLabel(entry, today),
      priorityRank: PRIORITY_RANK[lower(entry.priority)] ?? 3,
      isOpen: isOpenTask(entry),
      isDone: isDone(entry),
      isBlocked: BLOCKED_STATUSES.has(lower(entry.status)),
    }));
  return rows.sort(sortTasks);
}

export function buildCalendarDays(entries = []) {
  const days = {};
  const getDay = key => {
    if (!key) return null;
    if (!days[key]) days[key] = { date: key, entries: [], tasks: [], reviews: [] };
    return days[key];
  };

  for (const entry of entries) {
    if (entry.type === 'task') {
      const day = getDay(cleanDate(entry.due));
      if (day) day.tasks.push(entry);
      continue;
    }

    if (entry.type === 'project') {
      const day = getDay(cleanDate(entry.due));
      if (day) day.projects = [...(day.projects || []), entry];
      continue;
    }

    const reviewDay = getDay(cleanDate(entry.review_after));
    if (reviewDay && MEMORY_TYPES.has(entry.type)) reviewDay.reviews.push(entry);

    const key = cleanDate(entry.entry_date || entry.date);
    const day = getDay(key);
    if (day && entry.type !== 'project' && !MEMORY_TYPES.has(entry.type)) {
      day.entries.push(entry);
    }
  }

  Object.values(days).forEach(day => {
    day.entries.sort(sortByRecentDate);
    day.tasks.sort((a, b) => sortTasks({ entry: a }, { entry: b }));
    if (day.projects) day.projects.sort(sortByRecentDate);
    day.reviews.sort(sortByRecentDate);
  });

  return days;
}

export function buildTagRows(entries = [], tagMetadata = []) {
  const byName = new Map();
  for (const meta of tagMetadata) {
    const name = meta.name || meta.id;
    if (!name) continue;
    byName.set(name, {
      id: meta.id || name,
      name,
      aliases: asArray(meta.aliases),
      description: meta.description || '',
      color: meta.color,
      count: 0,
      entries: [],
      unresolvedCount: 0,
      relatedTags: [],
      typeCounts: {},
      lastUsed: 0,
    });
  }

  for (const entry of entries) {
    for (const tag of asArray(entry.tags).map(String).filter(Boolean)) {
      if (!byName.has(tag)) {
        byName.set(tag, {
          id: tag,
          name: tag,
          aliases: [],
          description: '',
          count: 0,
          entries: [],
          unresolvedCount: 0,
          relatedTags: [],
          typeCounts: {},
          lastUsed: 0,
        });
      }
      const row = byName.get(tag);
      row.count += 1;
      row.entries.push(entry);
      row.unresolvedCount += asArray(entry.unresolvedTargets).filter(target => normalizeToken(target) === normalizeToken(tag)).length;
      row.typeCounts[entry.type || 'entry'] = (row.typeCounts[entry.type || 'entry'] || 0) + 1;
      row.lastUsed = Math.max(row.lastUsed, activityStamp(entry));
      for (const related of asArray(entry.tags).filter(other => other !== tag)) {
        row.relatedTags.push(related);
      }
    }
  }

  return [...byName.values()].map(row => {
    const relatedCounts = row.relatedTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    return {
      ...row,
      relatedTags: Object.entries(relatedCounts)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
    };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildSpaceRows(entries = [], spaceMetadata = []) {
  const byId = new Map();
  for (const meta of spaceMetadata) {
    const id = meta.id || meta.name;
    if (!id) continue;
    byId.set(String(id), {
      id: String(id),
      name: meta.name || String(id),
      description: meta.description || '',
      color: meta.color,
      count: 0,
      entries: [],
      projectCount: 0,
      openTaskCount: 0,
      memoryCount: 0,
      tagCount: 0,
      recentEntry: null,
      lastActivity: 0,
    });
  }

  for (const entry of entries) {
    const id = spaceForEntry(entry, entries);
    if (!id) continue;
    if (!byId.has(id)) {
      byId.set(id, {
        id,
        name: id,
        description: '',
        count: 0,
        entries: [],
        projectCount: 0,
        openTaskCount: 0,
        memoryCount: 0,
        tagCount: 0,
        recentEntry: null,
        lastActivity: 0,
      });
    }
    const row = byId.get(id);
    row.count += 1;
    row.entries.push(entry);
    if (entry.type === 'project') row.projectCount += 1;
    if (isOpenTask(entry)) row.openTaskCount += 1;
    if (MEMORY_TYPES.has(entry.type)) row.memoryCount += 1;
    row.lastActivity = Math.max(row.lastActivity, activityStamp(entry));
  }

  return [...byId.values()].map(row => {
    const sortedEntries = row.entries.sort(sortByRecentDate);
    const tags = new Set(sortedEntries.flatMap(entry => asArray(entry.tags)));
    return {
      ...row,
      entries: sortedEntries,
      tagCount: tags.size,
      recentEntry: sortedEntries[0] || null,
    };
  }).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function buildGlobalSearchResults({
  entries = [],
  bases = [],
  canvases = [],
  templates = [],
  tagMetadata = [],
  spaces = [],
  query = '',
} = {}) {
  const q = String(query || '').trim();
  const entryMatches = entries.filter(entry => matchesQuery(entryText(entry), q));
  const tags = buildTagRows(entries, tagMetadata).filter(tag => matchesQuery([
    tag.name,
    tag.description,
    ...tag.aliases,
    ...tag.relatedTags.map(related => related.name),
  ].join(' '), q));
  const spaceRows = (spaces.length ? spaces : buildSpaceRows(entries)).filter(space => matchesQuery([
    space.name,
    space.description,
    space.recentEntry?.title,
    ...space.entries.flatMap(entry => asArray(entry.tags)),
  ].join(' '), q));
  const smartViews = bases.filter(base => matchesQuery([base.name, base.description].join(' '), q));
  const canvasResults = canvases.filter(canvas => matchesQuery([canvas.name, canvas.description, canvas.path].join(' '), q));
  const templateResults = templates.filter(template => matchesQuery([template.name, template.description, template.body].join(' '), q));
  const normalEntries = entryMatches.filter(entry => entry.type !== 'project' && entry.type !== 'task');
  const memories = entryMatches.filter(entry => MEMORY_TYPES.has(entry.type));

  const result = {
    query: q,
    entries: normalEntries,
    projects: entryMatches.filter(entry => entry.type === 'project'),
    tasks: entryMatches.filter(entry => entry.type === 'task'),
    memories,
    tags,
    spaces: spaceRows,
    smartViews,
    canvases: canvasResults,
    templates: templateResults,
  };
  result.totalCount = Object.entries(result)
    .filter(([, value]) => Array.isArray(value))
    .reduce((total, [, value]) => total + value.length, 0);
  return result;
}

export function buildCommandCenterModel({
  entries = [],
  bases = [],
  canvases = [],
  templates = [],
  trashItems = [],
  today = cleanDate(new Date()),
} = {}) {
  const tasks = buildTaskRows(entries, { today });
  const calendarDays = buildCalendarDays(entries);
  const todayBucket = calendarDays[today] || { tasks: [], reviews: [] };
  const projectRows = buildProjectRows(entries);
  const tagRows = buildTagRows(entries);
  const spaceRows = buildSpaceRows(entries);
  const memoryReviewsDue = entries
    .filter(entry => MEMORY_TYPES.has(entry.type) && cleanDate(entry.review_after) && cleanDate(entry.review_after) <= today)
    .sort(sortByRecentDate);
  const openTaskRows = tasks.filter(row => row.isOpen);
  const overdueTaskRows = openTaskRows.filter(row => row.dueState === 'overdue');
  const dueTodayRows = openTaskRows.filter(row => row.dueState === 'today');
  const recentEntries = entries.filter(entry => entry.type !== 'raw').sort(sortByRecentDate).slice(0, 8);
  const recentCaptures = entries.filter(entry => entry.type === 'raw').sort(sortByRecentDate).slice(0, 8);
  const unresolvedLinks = entries.reduce((total, entry) => total + asArray(entry.unresolvedTargets).length, 0);
  const pinned = [
    ...entries.filter(entry => entry.starred),
    ...projectRows.filter(row => row.openTaskCount > 0).map(row => row.entry),
    ...recentEntries,
  ].filter(Boolean);
  const pinnedIds = new Set();

  return {
    metrics: {
      entries: entries.length,
      projects: entries.filter(entry => entry.type === 'project').length,
      activeProjects: projectRows.filter(row => ACTIVE_PROJECT_STATUSES.has(lower(row.entry.status || 'active'))).length,
      openTasks: openTaskRows.length,
      overdueTasks: overdueTaskRows.length,
      dueToday: dueTodayRows.length,
      memory: entries.filter(entry => MEMORY_TYPES.has(entry.type)).length,
      inbox: recentCaptures.length,
      spaces: spaceRows.length,
      tags: tagRows.length,
      unresolvedLinks,
      smartViews: bases.length,
      canvases: canvases.length,
      templates: templates.length,
      trash: trashItems.length,
    },
    recentEntries,
    recentCaptures,
    pinned: pinned.filter(entry => {
      if (pinnedIds.has(entry.id)) return false;
      pinnedIds.add(entry.id);
      return true;
    }).slice(0, 6),
    tasksDueToday: todayBucket.tasks.filter(isOpenTask),
    overdueTasks: overdueTaskRows.map(row => row.entry),
    nextTasks: openTaskRows.filter(row => row.dueState !== 'today' && row.dueState !== 'overdue').slice(0, 8).map(row => row.entry),
    focusQueue: [
      ...overdueTaskRows.map(row => row.entry),
      ...dueTodayRows.map(row => row.entry),
      ...memoryReviewsDue,
      ...recentCaptures,
    ].slice(0, 8),
    memoryReviewsDue,
    calendarDays,
    projectRows,
    taskRows: tasks,
    tagRows,
    spaceRows,
  };
}
